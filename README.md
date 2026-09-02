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
| **Gestellte Fragen** | Wer wann was gefragt hat und ob eine Antwort gefunden wurde — Fragen ohne Antwort zeigen, welche Unterlage noch fehlt |
| **Einstellungen** | Der Speicherort und der Weg zur An- und Abmeldung |
| **Info** | Was die App tut, die Änderungen und der Datenschutz-Hinweis |

## Wie die Antwort entsteht

Gefragt wird nicht das offene Internet, sondern **ausschließlich die im Reiter
Dokumente hinterlegten Unterlagen**. Die Antwort wird daraus erzeugt (Google
Gemini über einen eigenen Worker) und nennt die Fundstelle. Fehlt die Information
in den Unterlagen, kommt kein erfundener Text, sondern der Hinweis, dass dazu
nichts hinterlegt ist.

Was neu ins Wiki soll, muss also erst als Dokument hochgeladen werden — dann
kann ab sofort danach gefragt werden.

## Was hier nicht hineingehört

Damit eine Frage beantwortet werden kann, **verlässt sie den Verein**: Sie geht
zusammen mit den hinterlegten Unterlagen an den KI-Dienst. Deshalb gehören hier
nur allgemeine Vereinsunterlagen hinein — Satzung, Ordnungen, Konzepte,
Leitfäden. Keine Mitgliederlisten, Geburtsdaten, Gehälter oder Kontodaten, und
auch keine Namen oder persönlichen Angaben in der Frage selbst.

Jede gestellte Frage wird mit Name und Zeitpunkt protokolliert; aufgehoben
werden die letzten 500. Einsehen und löschen kann das nur, wer Bearbeiten-Recht
hat.

## Zugang

Die Anmeldung läuft über die [Tools-Übersicht](https://sc1911heiligenstadt.github.io/ToolsUebersicht/) — dort einmal anmelden, danach ist dieses Werkzeug offen.

Die Rechte gelten in drei Stufen: **Sehen** (fragen und Antworten lesen),
**Bearbeiten** (Dokumente hochladen und pflegen, dazu der Reiter *Gestellte
Fragen*) und **Administrieren** (Reiter *Einstellungen*). Wer welche Stufe hat,
legt die Tools-Übersicht fest. Der Reiter *Info* ist für alle sichtbar.

## Lokal starten

Über den Eintrag `vereinswiki` in `E:\.claude\launch.json` — der Server läuft dann auf `http://localhost:8784/`.

## Technik

Vanilla JavaScript ohne Build-Schritt — die Dateien werden so ausgeliefert, wie sie im Repo liegen. Veröffentlicht über GitHub Pages. Die Daten liegen in der Vereins-Nextcloud; der Zugriff läuft ausschließlich über den Login-Worker der Tools-Übersicht, nie mit Zugangsdaten im Browser.

Dazu kommt ein eigener Worker (`wiki-worker.js`), der die Anfrage an das
Sprachmodell stellt. Der Schlüssel dafür liegt im Worker, nie im Browser.

---

Ein Werkzeug des 1. SC 1911 Heiligenstadt. Alle Werkzeuge auf einen Blick: [Tools-Übersicht](https://sc1911heiligenstadt.github.io/ToolsUebersicht/) · Erklärungen im [Toolbox Wiki](https://sc1911heiligenstadt.github.io/Vereinswiki/).
