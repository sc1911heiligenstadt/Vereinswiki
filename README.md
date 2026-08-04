# Vereinswiki

Wissens-Assistent für den 1. SC 1911 Heiligenstadt: allgemeine Vereinsunterlagen (Satzung, Ordnungen, Konzepte, Leitfäden) hinterlegen und in normaler Sprache Fragen dazu stellen – eine KI (Google Gemini) antwortet auf Basis der hinterlegten Dokumente und nennt die Quelle.

Vanilla-JS-Web-App (kein Build-Step), Teil des Tools-Übersicht-Verbunds. Login, Speicherung und Zugriffsrechte laufen über das zentrale Tools-Übersicht-Gateway (`admin-worker.js`); die KI-Anfragen über einen eigenen Cloudflare-Worker (`wiki-worker.js`). Dokumente hochladen und löschen dürfen nur Admins sowie Nutzer mit Bearbeiten-Recht für das Tool; Fragen stellen kann jeder mit Zugriff auf die Kachel.

## ⚠️ Nur nicht-personenbezogene Daten

Die App nutzt den **kostenlosen Gemini-Tier**. Im Gratis-Tier darf Google die Eingaben zum Modelltraining verwenden – deshalb ist das Vereinswiki **ausschließlich für allgemeine Vereinsunterlagen** gedacht. **Keine** Mitgliederlisten, Geburtsdaten, Gehälter, Kontodaten o. Ä. Der Hinweis steht auch sichtbar in der Upload-Oberfläche.

## Architektur

```
Browser (GitHub Pages, Vanilla JS, Login-Token aus Tools-Übersicht)
   │
   ├──► admin-worker.js (landingpage) ──► Nextcloud
   │       dav-load/dav-save  : Dokumentenliste (vereinswiki.json)
   │       dav-file-put/get/delete : die Dokument-Dateien (dateien/<uuid>)
   │       → prüft Login + Tool-Sichtbarkeit serverseitig
   │
   └──► wiki-worker.js (vereinswiki) ──► Google Gemini
           bekommt nur { question } + Login-Token,
           holt die Dokumente selbst übers Gateway (gleiches Token),
           schickt sie inline an Gemini, gibt die Antwort zurück.
           Hält NUR den GEMINI_API_KEY als Secret.
```

## Dateien

- `index.html` / `app.js` / `db.js` / `config.js` / `style.css` – Frontend
- `wiki-worker.js` – Cloudflare-Worker (Gemini). Separat deployen, nicht Teil der Pages-Site.
Das Vereinswappen liegt nicht mehr hier: `index.html` lädt es als Vektor vom
Wurzelverzeichnis (`https://sc1911heiligenstadt.github.io/logo.svg`), wie die
ganze Flotte.

## Deploy / Inbetriebnahme (einmalig)

1. **Gemini-Key holen:** [Google AI Studio](https://aistudio.google.com/) → API-Key erzeugen (kostenloser Tier, keine Kreditkarte nötig).
2. **Nextcloud-Ordner anlegen** (WebDAV `PUT` legt keine fehlenden Ordner an):
   `…/02_Förderung/Tools/Vereinswiki/` und darin den Unterordner `dateien/`.
3. **Wiki-Worker deployen:** dash.cloudflare.com → Workers & Pages → neuer Worker `vereinswiki` → Inhalt von `wiki-worker.js` einfügen → Deploy. URL sollte `https://vereinswiki.<subdomain>.workers.dev` sein (sonst `WIKI_WORKER_URL` in `db.js` anpassen). Danach Secret setzen: `GEMINI_API_KEY`.
4. **Admin-Worker neu deployen:** Der `admin-worker.js` (Worker „landingpage") wurde um `vereinswiki` in `DAV_APPS` und den Dev-Port erweitert → aktuellen Stand ins Cloudflare-Dashboard einfügen und deployen.
5. **Repos pushen:** dieses Repo (GitHub Pages) und `ToolsUebersicht` (Kachel + News in `config.js`).
6. **Sichtbarkeit setzen:** In der Tools-Übersicht als Admin unter „Sichtbarkeit der Tools" festlegen, wer die Vereinswiki-Kachel sehen darf.

## Lokaler Dev-Server

`E:\.claude\launch.json`, Eintrag `vereinswiki`, Port 8784. Ohne echtes Login-Token zeigt die App nur den Anmelde-Hinweis – Upload und Fragen brauchen die deployte Umgebung (Gateway + Wiki-Worker).

## Grenzen (v1.0)

- Alle Dokumente werden bei jeder Frage zusammen an Gemini geschickt („alles in den Prompt", kein RAG). Ausreichend für einige Dutzend Dokumente; die Gesamtgröße pro Anfrage ist auf ~18 MB begrenzt (Gemini-Inline-Limit). Für sehr große Dokumentenmengen wäre später echtes RAG (Embeddings/Vektorsuche) nötig.
- Unterstützte Formate: PDF und Text (.txt). Word bitte vorher als PDF exportieren.
