// Cloudflare Worker: Wissens-Assistent fürs Vereinswiki.
//
// Ablauf: Der Browser schickt { question } + Authorization: Bearer <Tools-Übersicht-Token>.
// Der Worker holt die hinterlegten Dokumente SERVERSEITIG über das zentrale
// Tools-Übersicht-Gateway (admin-worker: dav-load + dav-file-get) mit DEMSELBEN
// Token — dadurch prüft das Gateway automatisch Anmeldung + Tool-Sichtbarkeit —
// und schickt Dokumente + Frage an Google Gemini. Der Gemini-Key liegt NUR hier
// als Secret, nie im Browser. Nextcloud-Zugangsdaten braucht dieser Worker nicht.
//
// Deploy: dash.cloudflare.com -> Workers & Pages -> Worker "vereinswiki" ->
// diesen Code einfügen -> Deploy. Die Worker-URL sollte
// https://vereinswiki.<subdomain>.workers.dev lauten (in db.js als
// WIKI_WORKER_URL eingetragen — bei abweichender Subdomain dort anpassen).
//
// Secret (Settings -> Variables and Secrets -> Add):
//   GEMINI_API_KEY = <Key aus Google AI Studio, kostenloser Tier genügt>
//
// WICHTIG - Service Binding (Settings -> Bindings -> Add -> Service binding):
//   Variablenname: GATEWAY, Service: landingpage, Environment: production.
//   Noetig, weil Cloudflare einem Worker einen direkten fetch() auf die
//   *.workers.dev-Adresse eines ANDEREN Workers verweigert (Error 1042,
//   Loop-Schutz) - ein Service Binding umgeht den oeffentlichen Netzwerkpfad
//   und funktioniert deshalb trotzdem.

const GATEWAY_URL = "https://landingpage.michel-brunner.workers.dev";
const APP_ID = "vereinswiki";
// Modell im kostenlosen Gemini-Tier; bei Bedarf auf ein neueres Flash-Modell umstellbar.
const GEMINI_MODEL = "gemini-2.5-flash";
// Gemini erlaubt pro Inline-Request ~20 MB; mit Puffer begrenzen.
const MAX_TOTAL_BYTES = 18 * 1024 * 1024;

const ALLOWED_ORIGINS = [
  "http://localhost:8784",      // Vereinswiki (Dev-Server)
  "https://tecko1985.github.io"
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[ALLOWED_ORIGINS.length - 1];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

// Ruft das Tools-Übersicht-Gateway (admin-worker) über das Service Binding auf
// (kein direkter fetch() auf die workers.dev-Adresse, siehe Deploy-Hinweis oben).
function gateway(env, action, payload, token) {
  return env.GATEWAY.fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ action, app: APP_ID, ...payload })
  });
}

function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function askGemini(env, docs, question) {
  const systemPrompt =
    "Du bist der Wissens-Assistent des Vereins 1. SC 1911 Heiligenstadt. " +
    "Beantworte die Frage des Nutzers AUSSCHLIESSLICH auf Basis der beigefügten Vereinsdokumente. " +
    "Wenn die Antwort nicht aus den Dokumenten hervorgeht, sage das ehrlich und rate nicht. " +
    "Nenne, wenn möglich, aus welchem Dokument (Dateiname) die Information stammt. " +
    "Antworte auf Deutsch, klar und in einfachem Fließtext ohne Markdown-Formatierung.";

  const parts = [];
  for (const d of docs) {
    parts.push({ text: `\n=== Dokument: ${d.name} ===` });
    if (d.base64) {
      parts.push({ inline_data: { mime_type: "application/pdf", data: d.base64 } });
    } else {
      parts.push({ text: d.text || "" });
    }
  }
  parts.push({ text: `\n\nFrage: ${question}` });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts }]
    })
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini-Aufruf fehlgeschlagen (${res.status}): ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  const answer = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text).filter(Boolean).join("");
  if (!answer) throw new Error("Der Assistent hat keine Antwort geliefert (evtl. wegen einer Inhaltssperre oder eines leeren Dokuments).");
  return answer;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ error: "Method Not Allowed" }, 405, cors);
    if (!env.GEMINI_API_KEY) return json({ error: "GEMINI_API_KEY ist im Worker nicht konfiguriert." }, 500, cors);

    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return json({ error: "Nicht angemeldet." }, 401, cors);

    let body;
    try { body = await request.json(); } catch { return json({ error: "Ungültiges JSON" }, 400, cors); }
    const question = String(body.question || "").trim();
    if (!question) return json({ error: "Keine Frage übergeben." }, 400, cors);

    try {
      // 1. Dokumentenliste laden — zugleich der Auth-/Sichtbarkeits-Check über das Gateway.
      const listResp = await gateway(env, "dav-load", {}, token);
      if (listResp.status === 401) return json({ error: "Sitzung abgelaufen." }, 401, cors);
      if (listResp.status === 403) return json({ error: "Kein Zugriff auf dieses Tool." }, 403, cors);
      if (!listResp.ok) {
        const detail = await listResp.text().catch(() => "");
        return json({ error: `Dokumente konnten nicht geladen werden (HTTP ${listResp.status}): ${detail.slice(0, 300)}` }, 502, cors);
      }

      const listBody = await listResp.json();
      const dokumente = (listBody.data && Array.isArray(listBody.data.dokumente)) ? listBody.data.dokumente : [];
      if (dokumente.length === 0) {
        return json({ answer: "Es sind noch keine Dokumente hinterlegt, auf deren Basis ich antworten könnte.", dokumentAnzahl: 0 }, 200, cors);
      }

      // 2. Datei-Inhalte serverseitig über das Gateway holen.
      let total = 0;
      const docs = [];
      for (const d of dokumente) {
        if (!d || !d.id) continue;
        const fileResp = await gateway(env, "dav-file-get", { id: d.id }, token);
        if (!fileResp.ok) continue; // einzelne fehlende Datei überspringen statt komplett scheitern
        const buf = await fileResp.arrayBuffer();
        total += buf.byteLength;
        if (total > MAX_TOTAL_BYTES) {
          return json({ error: "Die hinterlegten Dokumente sind zusammen zu groß für eine Anfrage. Bitte weniger oder kleinere Dokumente hinterlegen." }, 413, cors);
        }
        if ((d.contentType || "").includes("pdf")) {
          docs.push({ name: d.name, base64: arrayBufferToBase64(buf) });
        } else {
          docs.push({ name: d.name, text: new TextDecoder("utf-8").decode(buf) });
        }
      }
      if (docs.length === 0) {
        return json({ error: "Die hinterlegten Dokumente konnten nicht gelesen werden." }, 502, cors);
      }

      // 3. Gemini fragen.
      const answer = await askGemini(env, docs, question);
      return json({ answer, dokumentAnzahl: docs.length }, 200, cors);
    } catch (e) {
      return json({ error: e.message || "Interner Fehler." }, 500, cors);
    }
  }
};
