# 📚 Toolbox Wiki

Fragen zu den Vereinsunterlagen in ganz normaler Sprache stellen — und eine
Antwort bekommen, die auf den hinterlegten Dokumenten beruht und, soweit
möglich, die Quelle nennt. Steht etwas nicht in den Unterlagen, sagt der
Assistent das, statt zu raten.

**➡️ [Toolbox Wiki öffnen](https://sc1911heiligenstadt.github.io/Vereinswiki/)**

## Was drin ist

| Reiter | Wofür |
|---|---|
| **Fragen** | Die Frage stellen und die Antwort mit Quellenangabe lesen |
| **Dokumente** | Die Unterlagen, auf die geantwortet wird — hier werden neue hochgeladen |
| **Gestellte Fragen** | Was schon gefragt wurde; oft steht die Antwort dort bereits |
| **Einstellungen** | Verwaltung |

## Wie die Antwort entsteht

Gefragt wird nicht das offene Internet, sondern **ausschließlich die im Reiter
Dokumente hinterlegten Unterlagen**. Die Antwort wird daraus erzeugt (Google
Gemini über einen eigenen Worker) und nennt die Fundstelle. Fehlt die Information
in den Unterlagen, kommt kein erfundener Text, sondern der Hinweis, dass dazu
nichts hinterlegt ist.

Was neu ins Wiki soll, muss also erst als Dokument hochgeladen werden — dann
kann ab sofort danach gefragt werden.

## Zugang

Die Anmeldung läuft über die [Tools-Übersicht](https://sc1911heiligenstadt.github.io/ToolsUebersicht/) — dort einmal anmelden, danach ist dieses Werkzeug offen.

Die Rechte gelten in drei Stufen: **Sehen** (fragen und Antworten lesen),
**Bearbeiten** (Dokumente hochladen und pflegen) und **Administrieren** (Reiter
*Einstellungen*). Wer welche Stufe hat, legt die Tools-Übersicht fest.

## Lokal starten

Über den Eintrag `vereinswiki` in `E:\.claude\launch.json` — der Server läuft dann auf `http://localhost:8784/`.

## Technik

Vanilla JavaScript ohne Build-Schritt — die Dateien werden so ausgeliefert, wie sie im Repo liegen. Veröffentlicht über GitHub Pages. Die Daten liegen in der Vereins-Nextcloud; der Zugriff läuft ausschließlich über den Login-Worker der Tools-Übersicht, nie mit Zugangsdaten im Browser.

Dazu kommt ein eigener Worker (`wiki-worker.js`), der die Anfrage an das
Sprachmodell stellt. Der Schlüssel dafür liegt im Worker, nie im Browser.

---

Ein Werkzeug des 1. SC 1911 Heiligenstadt. Alle Werkzeuge auf einen Blick: [Tools-Übersicht](https://sc1911heiligenstadt.github.io/ToolsUebersicht/) · Erklärungen im [Toolbox Wiki](https://sc1911heiligenstadt.github.io/Vereinswiki/).
