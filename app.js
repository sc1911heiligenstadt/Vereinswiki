let appData = { dokumente: [] };
let currentUser = null; // { username, displayName }
let verlaufFragen = null; // null = noch nicht geladen, sonst Array (neueste zuerst)

const MAX_FILE_BYTES = 10 * 1024 * 1024; // Gateway-Grenze (dav-file-put)

// ---------- Helfer ----------

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function formatBytes(n) {
  if (typeof n !== "number" || isNaN(n)) return "";
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + " KB";
  return (n / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("de-DE") + " " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function docIcon(d) {
  return (d.contentType || "").includes("pdf") ? "📄" : "📝";
}

function isAllowedFile(f) {
  const name = (f.name || "").toLowerCase();
  const type = f.type || "";
  return type === "application/pdf" || type === "text/plain" || name.endsWith(".pdf") || name.endsWith(".txt");
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });
}

// ---------- Datenmodell ----------

function normalizeData(data) {
  if (!data || !Array.isArray(data.dokumente)) return { dokumente: [] };
  return { dokumente: data.dokumente.filter((d) => d && d.id && d.name) };
}

// Ändert die Dokumentenliste und speichert. Bei einem Speicher-Konflikt (anderes
// Gerät hat zwischenzeitlich gespeichert) wird der Remote-Stand geladen und die
// Änderung erneut angewandt — der mutator MUSS daher idempotent sein.
async function mutateAndSave(mutator) {
  mutator();
  try {
    await gatewaySave(appData);
  } catch (e) {
    if (e instanceof ConflictError) {
      appData = normalizeData(await gatewayLoad());
      mutator();
      await gatewaySave(appData);
    } else {
      throw e;
    }
  }
}

// ---------- Start / Login ----------

async function init() {
  setupNav();
  setupFragen();
  setupDokumente();
  setupVerlauf();

  if (getSessionToken()) {
    try {
      appData = normalizeData(await gatewayLoad());
      currentUser = await fetchMe();
      startApp();
      return;
    } catch (e) {
      if (!(e instanceof NotLoggedInError)) {
        console.error("Nextcloud-Zugriff über Login fehlgeschlagen", e);
        showGatewayError("Zugriff auf Nextcloud fehlgeschlagen: " + e.message);
      }
    }
  }
  showConnectScreen();
}

// Eigenes Profil (für "hinzugefügt von" + Bearbeiten-Recht). Fehler werden
// geschluckt — der Name ist nur ein Komfort-Feature, kein Blocker für den Start;
// ohne Profil gilt canEdit() als false (sicherer Default: kein Upload/Löschen).
async function fetchMe() {
  try {
    // Das dav-load davor hat die Angaben schon mitgeliefert (kostet den Worker
    // dort keinen zusaetzlichen Nextcloud-Read) -- dann entfaellt dieser Request
    // ganz. Nur wenn nichts vorliegt, regulaer nachfragen.
    const r = nimmGatewayMe() || await gatewayRequest({ action: "me", app: GATEWAY_APP_ID });
    const displayName = (r.vorname && r.nachname) ? `${r.vorname} ${r.nachname}` : r.username;
    return { username: r.username, displayName, isAdmin: !!r.isAdmin, canEdit: !!r.canEdit };
  } catch (_) {
    return null;
  }
}

// Dokumente hochladen/löschen dürfen Admins sowie Nutzer, deren Gruppe in der
// Tools-Übersicht für Vereinswiki Bearbeiten-Rechte hat (server-seitig über
// den "me"-Aufruf aufgelöst) — alle anderen eingeloggten Nutzer dürfen nur
// fragen und bestehende Dokumente ansehen.
function canEdit() {
  return !!(currentUser && (currentUser.isAdmin || currentUser.canEdit));
}
// Administrieren-Ebene: der Einstellungen-Tab (Speicherort) ist Administratoren vorbehalten (2026-07-24).
function canAdmin() {
  return !!(currentUser && (currentUser.isAdmin || currentUser.canAdmin));
}

function showGatewayError(text) {
  const el = document.getElementById("cloud-error");
  if (!el) return;
  el.textContent = text;
  el.style.display = text ? "block" : "none";
}

function showConnectScreen() {
  document.getElementById("connect-screen").style.display = "block";
  document.getElementById("app-shell").style.display = "none";
}

function startApp() {
  document.getElementById("connect-screen").style.display = "none";
  document.getElementById("app-shell").style.display = "block";
  const status = document.getElementById("file-status");
  status.classList.add("connected");
  status.querySelector(".label").textContent = "Verbunden: Nextcloud (über Anmeldung)";
  renderAll();
}

function renderAll() {
  renderVersionInfo();
  renderUploadPermission();
  applyAdminTabs();
  renderDokumente();
  renderFrageHint();
}

function applyAdminTabs() {
  // Einstellungen-Tab (Speicherort) = Administrieren-Ebene (2026-07-24): nur für Admins sichtbar.
  const el = document.querySelector('nav button[data-tab="einstellungen"]');
  if (el) el.style.display = canAdmin() ? "" : "none";
  // "Gestellte Fragen" zeigt, WER was gefragt hat — Bearbeiten-Ebene. Das
  // Ausblenden ist nur die Oberfläche; zurückgehalten wird serverseitig
  // (wiki-fragen-list prüft resolveEditPermission), ein Nur-Seher bekommt dort
  // 403 statt Daten.
  const v = document.querySelector('nav button[data-tab="verlauf"]');
  if (v) v.style.display = canEdit() ? "" : "none";
}

function renderUploadPermission() {
  const editable = canEdit();
  document.getElementById("upload-card").style.display = editable ? "block" : "none";
  document.getElementById("upload-noaccess-hint").style.display = editable ? "none" : "block";
}

// ---------- Navigation ----------

function setupNav() {
  document.querySelectorAll("nav button").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
}

function switchTab(tab) {
  document.querySelectorAll("nav button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".tab-section").forEach((s) => s.classList.toggle("active", s.id === "tab-" + tab));
  if (tab === "info") renderVersionInfo();
  // Erst beim Öffnen laden: das Protokoll interessiert nur wenige, jeder
  // Seitenaufruf soll es nicht mitschleppen.
  if (tab === "verlauf" && verlaufFragen === null) ladeVerlauf();
}

function renderVersionInfo() {
  document.querySelectorAll("#version-badge, #version-badge-2").forEach((el) => {
    if (el) el.textContent = "v" + APP_VERSION;
  });
  const list = document.getElementById("changelog-list");
  if (!list) return;
  list.innerHTML = APP_CHANGELOG.map((entry) => `
    <div class="changelog-entry">
      <div class="cv">Version ${escapeHtml(entry.version)}</div>
      ${entry.groups.map((g) => `
        <div class="changelog-group">
          <div class="cg-title">${escapeHtml(g.title)}</div>
          <ul class="cg-items">${g.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
        </div>
      `).join("")}
    </div>
  `).join("");
}

// ---------- Fragen ----------

function setupFragen() {
  document.getElementById("btn-fragen").addEventListener("click", handleFrage);
  document.getElementById("frage-input").addEventListener("keydown", (e) => {
    // Strg/Cmd+Enter = abschicken
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); handleFrage(); }
  });
}

function renderFrageHint() {
  const el = document.getElementById("frage-hint");
  if (!el) return;
  const n = appData.dokumente.length;
  el.textContent = n === 0
    ? "Noch keine Dokumente hinterlegt – lade zuerst im Tab „Dokumente“ Vereinsunterlagen hoch."
    : `Der Assistent antwortet auf Basis von ${n} hinterlegten Dokument${n === 1 ? "" : "en"}.`;
}

async function handleFrage() {
  const input = document.getElementById("frage-input");
  const q = input.value.trim();
  if (!q) { input.focus(); return; }
  if (appData.dokumente.length === 0) {
    showAntwort(q, "Es sind noch keine Dokumente hinterlegt. Lade zuerst im Tab „Dokumente“ Vereinsunterlagen hoch.", "");
    return;
  }
  const btn = document.getElementById("btn-fragen");
  btn.disabled = true;
  showAntwortLoading(q);
  try {
    const res = await askWiki(q);
    const anzahl = (typeof res.dokumentAnzahl === "number") ? res.dokumentAnzahl : appData.dokumente.length;
    showAntwort(q, res.answer || "(keine Antwort erhalten)", `Auf Basis von ${anzahl} Dokument${anzahl === 1 ? "" : "en"} · KI-generiert, bitte im Zweifel im Originaldokument prüfen.`);
  } catch (e) {
    if (e instanceof NotLoggedInError) {
      showAntwort(q, "Sitzung abgelaufen – bitte in der Tools-Übersicht neu anmelden.", "");
    } else {
      showAntwort(q, "Es ist ein Fehler aufgetreten: " + e.message, "");
    }
  } finally {
    btn.disabled = false;
    // Der Worker hat diese Frage gerade protokolliert — der zwischengespeicherte
    // Verlauf ist damit veraltet und wird beim nächsten Öffnen neu geholt.
    verlaufFragen = null;
  }
}

function showAntwortLoading(frage) {
  const card = document.getElementById("antwort-card");
  card.style.display = "block";
  document.getElementById("antwort-frage").textContent = frage;
  document.getElementById("antwort-text").innerHTML = '<span class="muted">Der Assistent liest die Dokumente und formuliert eine Antwort …</span>';
  document.getElementById("antwort-meta").textContent = "";
}

function showAntwort(frage, text, meta) {
  const card = document.getElementById("antwort-card");
  card.style.display = "block";
  document.getElementById("antwort-frage").textContent = frage;
  document.getElementById("antwort-text").innerHTML = escapeHtml(text).replace(/\n/g, "<br>");
  document.getElementById("antwort-meta").textContent = meta || "";
  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ---------- Dokumente ----------

function setupDokumente() {
  document.getElementById("btn-upload").addEventListener("click", handleUpload);
}

function setUploadStatus(text) {
  const el = document.getElementById("upload-status");
  el.textContent = text || "";
  el.style.display = text ? "block" : "none";
}

function setUploadEnabled(on) {
  document.getElementById("btn-upload").disabled = !on;
  document.getElementById("upload-input").disabled = !on;
}

async function handleUpload() {
  if (!canEdit()) return;
  const input = document.getElementById("upload-input");
  const files = Array.from(input.files || []);
  if (files.length === 0) { setUploadStatus("Bitte zuerst eine Datei auswählen."); return; }

  for (const f of files) {
    if (!isAllowedFile(f)) { setUploadStatus(`„${f.name}“ ist kein PDF oder Textdokument.`); return; }
    if (f.size > MAX_FILE_BYTES) { setUploadStatus(`„${f.name}“ ist größer als 10 MB und kann nicht hochgeladen werden.`); return; }
  }

  setUploadEnabled(false);
  let done = 0;
  for (const f of files) {
    setUploadStatus(`Lade hoch … (${done + 1}/${files.length}) ${f.name}`);
    try {
      const id = uuid();
      const base64 = await fileToBase64(f);
      const contentType = f.type || ((f.name || "").toLowerCase().endsWith(".pdf") ? "application/pdf" : "text/plain");
      await gatewayFilePut(id, f.name, contentType, base64);
      const meta = {
        id, name: f.name, groesse: f.size, contentType,
        uploadedAt: new Date().toISOString(),
        uploadedBy: (currentUser && currentUser.displayName) || ""
      };
      await mutateAndSave(() => {
        if (!appData.dokumente.some((d) => d.id === id)) appData.dokumente.push(meta);
      });
      done++;
    } catch (e) {
      setUploadEnabled(true);
      renderDokumente();
      renderFrageHint();
      if (e instanceof NotLoggedInError) { setUploadStatus("Sitzung abgelaufen – bitte in der Tools-Übersicht neu anmelden."); return; }
      setUploadStatus(`Fehler bei „${f.name}“: ${e.message}`);
      return;
    }
  }

  input.value = "";
  setUploadEnabled(true);
  setUploadStatus(`${done} Dokument${done === 1 ? "" : "e"} hinzugefügt.`);
  renderDokumente();
  renderFrageHint();
}

// Safari (v.a. iOS) blockiert window.open() nach einem await als Popup, auch wenn der
// Aufruf aus einem Klick-Handler stammt — der "echte Nutzerklick"-Kontext gilt dort nur
// bis zum ersten await, danach silently blockiert (kein Fehler, kein Alert). Fix: leeres
// Fenster SYNCHRON im Klick-Callstack öffnen, danach nur noch die URL nachreichen
// (location.href auf einer bereits offenen Fenster-Referenz ist auch später erlaubt).
function _openBlobTab() {
  const win = window.open("", "_blank");
  return {
    show(blob) {
      const url = URL.createObjectURL(blob);
      if (win) win.location.href = url; else window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    },
    abort() { if (win) win.close(); }
  };
}

async function handleView(id) {
  const doc = appData.dokumente.find((d) => d.id === id);
  const tab = _openBlobTab();
  try {
    const blob = await gatewayFileBlob(id);
    tab.show(blob);
  } catch (e) {
    tab.abort();
    alert(`„${doc ? doc.name : "Dokument"}“ konnte nicht geöffnet werden: ${e.message}`);
  }
}

async function handleDelete(id) {
  if (!canEdit()) return;
  const doc = appData.dokumente.find((d) => d.id === id);
  if (!doc) return;
  if (!confirm(`„${doc.name}“ wirklich aus dem Toolbox Wiki löschen?`)) return;
  try {
    await gatewayFileDelete(id);
    await mutateAndSave(() => { appData.dokumente = appData.dokumente.filter((d) => d.id !== id); });
  } catch (e) {
    alert("Löschen fehlgeschlagen: " + e.message);
  }
  renderDokumente();
  renderFrageHint();
}

function renderDokumente() {
  const rows = appData.dokumente.slice().sort((a, b) => (b.uploadedAt || "").localeCompare(a.uploadedAt || ""));
  document.getElementById("dok-empty").style.display = rows.length ? "none" : "block";
  document.getElementById("dok-header").style.display = rows.length ? "grid" : "none";
  document.getElementById("dok-rows").innerHTML = rows.map((d) => `
    <div class="dok-row">
      <span class="dok-name">${docIcon(d)} ${escapeHtml(d.name)}</span>
      <span class="muted">${escapeHtml(formatBytes(d.groesse))}</span>
      <span class="muted">${escapeHtml(formatDateTime(d.uploadedAt))}${d.uploadedBy ? " · " + escapeHtml(d.uploadedBy) : ""}</span>
      <span class="dok-actions">
        <button class="btn secondary small" type="button" data-view-id="${escapeHtml(d.id)}">Ansehen</button>
        ${canEdit() ? `<button class="btn danger small" type="button" data-delete-id="${escapeHtml(d.id)}">Löschen</button>` : ""}
      </span>
    </div>
  `).join("");

  document.querySelectorAll("[data-view-id]").forEach((b) => b.addEventListener("click", () => handleView(b.dataset.viewId)));
  document.querySelectorAll("[data-delete-id]").forEach((b) => b.addEventListener("click", () => handleDelete(b.dataset.deleteId)));
}

// ---------- Gestellte Fragen (Protokoll) ----------

function setupVerlauf() {
  document.getElementById("btn-verlauf-neu").addEventListener("click", () => ladeVerlauf());
  document.getElementById("btn-verlauf-leeren").addEventListener("click", handleVerlaufLeeren);
  document.getElementById("verlauf-suche").addEventListener("input", renderVerlauf);
}

function setVerlaufStatus(text) {
  document.getElementById("verlauf-status").textContent = text || "";
}

async function ladeVerlauf() {
  if (!canEdit()) return;
  setVerlaufStatus("Lade …");
  try {
    const res = await gatewayFragenLoad();
    verlaufFragen = res.fragen;
    const n = verlaufFragen.length;
    setVerlaufStatus(n === 0
      ? "Noch keine Frage protokolliert."
      : `${n} Frage${n === 1 ? "" : "n"} protokolliert${res.max ? ` (die letzten ${res.max} werden aufgehoben)` : ""}.`);
  } catch (e) {
    verlaufFragen = [];
    setVerlaufStatus(e instanceof NotLoggedInError
      ? "Sitzung abgelaufen – bitte in der Tools-Übersicht neu anmelden."
      : "Der Verlauf konnte nicht geladen werden: " + e.message);
  }
  renderVerlauf();
}

async function handleVerlaufLeeren() {
  if (!canEdit()) return;
  const n = (verlaufFragen || []).length;
  if (!n) { setVerlaufStatus("Es ist nichts zu löschen."); return; }
  if (!confirm(`Wirklich alle ${n} protokollierten Fragen löschen? Das lässt sich nicht rückgängig machen.`)) return;
  try {
    await gatewayFragenLeeren();
    verlaufFragen = [];
    setVerlaufStatus("Verlauf gelöscht.");
  } catch (e) {
    setVerlaufStatus("Löschen fehlgeschlagen: " + e.message);
  }
  renderVerlauf();
}

async function handleFrageLoeschen(id) {
  if (!canEdit()) return;
  if (!confirm("Diese Frage aus dem Verlauf löschen?")) return;
  try {
    await gatewayFrageLoeschen(id);
    verlaufFragen = (verlaufFragen || []).filter((f) => f.id !== id);
    setVerlaufStatus("Frage gelöscht.");
  } catch (e) {
    setVerlaufStatus("Löschen fehlgeschlagen: " + e.message);
  }
  renderVerlauf();
}

function renderVerlauf() {
  const rowsEl = document.getElementById("verlauf-rows");
  const emptyEl = document.getElementById("verlauf-empty");
  const alle = verlaufFragen || [];
  const suche = (document.getElementById("verlauf-suche").value || "").trim().toLowerCase();
  // Gesucht wird über Frage UND Name — "wer hat eigentlich nach der Satzung
  // gefragt" ist genauso ein Anlass wie "was wurde zur Satzung gefragt".
  const rows = suche
    ? alle.filter((f) => `${f.frage || ""} ${f.wer || ""}`.toLowerCase().includes(suche))
    : alle;

  emptyEl.style.display = rows.length ? "none" : "block";
  emptyEl.textContent = alle.length && !rows.length
    ? "Keine Frage passt zur Suche."
    : "Noch keine Fragen protokolliert.";

  rowsEl.innerHTML = rows.map((f) => {
    const fehler = f.status === "fehler";
    const detail = fehler
      ? `Keine Antwort${f.fehler ? ": " + escapeHtml(f.fehler) : ""}`
      : (typeof f.dokumentAnzahl === "number"
        ? `Beantwortet aus ${f.dokumentAnzahl} Dokument${f.dokumentAnzahl === 1 ? "" : "en"}`
        : "Beantwortet");
    return `
    <div class="frage-row${fehler ? " fehler" : ""}">
      <div class="frage-kopf">
        <span class="frage-wer">${escapeHtml(f.wer || f.username || "Unbekannt")}</span>
        <span class="muted">${escapeHtml(formatDateTime(f.wann))}</span>
      </div>
      <div class="frage-text">${escapeHtml(f.frage || "")}</div>
      <div class="frage-fuss">
        <span class="muted">${detail}</span>
        <button class="btn secondary small" type="button" data-frage-id="${escapeHtml(f.id)}">Löschen</button>
      </div>
    </div>`;
  }).join("");

  rowsEl.querySelectorAll("[data-frage-id]").forEach((b) => {
    b.addEventListener("click", () => handleFrageLoeschen(b.dataset.frageId));
  });
}

// ---------- Start ----------

window.addEventListener("DOMContentLoaded", init);
