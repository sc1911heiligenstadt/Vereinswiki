// Persistenz + KI-Anfragen für das Vereinswiki.
//
// Zwei Server-Gegenstellen:
//   1. GATEWAY_URL  – der zentrale Tools-Übersicht-Login-Worker (admin-worker.js).
//      Speichert die Dokumentenliste (dav-load/dav-save) und die eigentlichen
//      Dokument-Dateien (dav-file-put/get/delete) in Nextcloud. Prüft dabei
//      serverseitig, ob der angemeldete Nutzer das Tool sehen darf.
//   2. WIKI_WORKER_URL – der eigene Gemini-Worker (wiki-worker.js). Bekommt nur
//      die Frage + das Login-Token, holt die Dokumente selbst serverseitig übers
//      Gateway und schickt sie an Gemini. Der Gemini-Key liegt ausschließlich
//      dort als Secret, nie im Browser.
//
// Das Login-Token stammt aus der Tools-Übersicht (gleiche Origin
// sc1911heiligenstadt.github.io) und wird aus localStorage wiederverwendet.
const GATEWAY_URL = "https://landingpage.michel-brunner.workers.dev";
const WIKI_WORKER_URL = "https://vereinswiki.michel-brunner.workers.dev";
const TOKEN_STORAGE_KEY = "tu_session_token";
const GATEWAY_APP_ID = "vereinswiki";

class NotLoggedInError extends Error {
  constructor(message) {
    super(message || "Nicht angemeldet");
    this.name = "NotLoggedInError";
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message || "Daten wurden zwischenzeitlich von einem anderen Gerät geändert");
    this.name = "ConflictError";
  }
}

// ETag des zuletzt geladenen/geschriebenen Stands (Konflikterkennung, wie in den
// anderen Gateway-Apps). Alte Worker ohne rev-Unterstützung liefern kein rev.
let gatewayRev = null;

function getSessionToken() {
  try { return localStorage.getItem(TOKEN_STORAGE_KEY); } catch (_) { return null; }
}

// Ruft das Gateway (admin-worker) auf und gibt die JSON-Antwort zurück.
async function gatewayRequest(payload) {
  const token = getSessionToken();
  if (!token) throw new NotLoggedInError();
  const resp = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify(payload)
  });
  if (resp.status === 401) throw new NotLoggedInError("Sitzung abgelaufen");
  if (resp.status === 403) throw new Error("Kein Zugriff auf dieses Tool.");
  if (resp.status === 409) throw new ConflictError();
  if (!resp.ok) throw new Error(`Gateway-Fehler (HTTP ${resp.status})`);
  return resp.json();
}

// Das "me" aus der letzten dav-load-Antwort. Der Worker legt es bei, weil er
// nutzer.json und die Rechte-Datei fuer diesen Request ohnehin gelesen hat --
// der erste fetchMe() nach dem Laden kommt damit ohne eigenen Roundtrip aus.
let gatewayMe = null;

// Dokumentenliste (Metadaten) laden.
async function gatewayLoad() {
  const body = await gatewayRequest({ action: "dav-load", app: GATEWAY_APP_ID });
  gatewayRev = typeof body.rev === "string" ? body.rev : null;
  gatewayMe = (body.me && typeof body.me === "object") ? body.me : null;
  return body.data; // Objekt oder null (Datei noch nicht vorhanden)
}

// Nimmt das aus dav-load mitgelieferte "me" genau EINMAL entgegen; danach wieder
// null, damit ein spaeterer Aufruf den aktuellen Stand holt statt einer alten
// Kopie. Liefert null, wenn nichts vorliegt (aelterer Worker) -- der Aufrufer
// fragt dann regulaer nach.
function nimmGatewayMe() {
  const me = gatewayMe;
  gatewayMe = null;
  return me;
}

// Dokumentenliste (Metadaten) speichern, mit Konfliktschutz.
async function gatewaySave(dataObj) {
  const payload = { action: "dav-save", app: GATEWAY_APP_ID, data: dataObj };
  if (gatewayRev) payload.rev = gatewayRev;
  const body = await gatewayRequest(payload);
  gatewayRev = typeof body.rev === "string" ? body.rev : null;
}

// Eine Dokument-Datei (PDF/Text) als Binärdatei ablegen. id = UUID, Größe <= 10 MB.
async function gatewayFilePut(id, name, contentType, dataBase64) {
  await gatewayRequest({ action: "dav-file-put", app: GATEWAY_APP_ID, id, name, contentType, dataBase64 });
}

// Eine Dokument-Datei löschen.
async function gatewayFileDelete(id) {
  await gatewayRequest({ action: "dav-file-delete", app: GATEWAY_APP_ID, id });
}

// Eine Dokument-Datei als Blob holen (zum Ansehen/Herunterladen im Browser).
// dav-file-get liefert rohe Bytes (kein JSON), daher eigener fetch statt gatewayRequest.
async function gatewayFileBlob(id) {
  const token = getSessionToken();
  if (!token) throw new NotLoggedInError();
  const resp = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ action: "dav-file-get", app: GATEWAY_APP_ID, id })
  });
  if (resp.status === 401) throw new NotLoggedInError("Sitzung abgelaufen");
  if (resp.status === 403) throw new Error("Kein Zugriff auf dieses Tool.");
  if (!resp.ok) throw new Error("Datei konnte nicht geladen werden.");
  return resp.blob();
}

// Eine Frage an den Wissens-Worker (Gemini) stellen. Der Worker holt die
// Dokumente selbst übers Gateway (mit demselben Token) und antwortet auf Basis
// des Inhalts. Rückgabe: { answer, dokumentAnzahl }.
async function askWiki(question) {
  const token = getSessionToken();
  if (!token) throw new NotLoggedInError();
  let resp;
  try {
    resp = await fetch(WIKI_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ question })
    });
  } catch (_) {
    throw new Error("Keine Verbindung zum Wissens-Assistenten.");
  }
  if (resp.status === 401) throw new NotLoggedInError("Sitzung abgelaufen");
  if (resp.status === 403) throw new Error("Kein Zugriff auf dieses Tool.");
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(body.error || `Der Assistent hat einen Fehler gemeldet (HTTP ${resp.status}).`);
  return body;
}
