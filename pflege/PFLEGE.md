# Die Werkzeug-Übersicht fürs Wiki neu bauen

Das Toolbox Wiki antwortet **ausschließlich** aus den Dokumenten, die im Reiter
*Dokumente* liegen. Damit es Fragen wie „Wo trage ich meinen Urlaub ein?" oder
„Wer darf einen Bus anfragen?" beantworten kann, braucht es eine Unterlage, die
alle Werkzeuge des Vereins beschreibt.

`wiki-datei-bauen.js` erzeugt diese Unterlage aus den Quellen, die ohnehin
gepflegt werden — es gibt also **keine zweite Fassung, die veralten kann**.

## Ausführen

```bash
"/c/Program Files/nodejs/node.exe" E:/Vereinswiki/pflege/wiki-datei-bauen.js
```

Ergebnis: `E:\_Dateien\Vereinswiki_Werkzeuge_Gesamtuebersicht.txt`

Danach im Wiki unter *Dokumente* hochladen. Die alte Fassung vorher löschen,
sonst stehen zwei Stände nebeneinander und das Wiki zitiert womöglich den alten.

## Woraus die Datei gebaut wird

| Quelle | Was daraus wird |
|---|---|
| `ToolsUebersicht/config.js`, `TOOLS[]` | Name, Adresse und Kacheltext je Werkzeug |
| `<repo>/README.md` | die fachlichen Abschnitte (Reiter, Rechte, Abläufe) |
| `<repo>/README.md`, Technik-Abschnitte | eigener Block „Technischer Hintergrund" |
| `<repo>/index.html`, `#tab-info` | der Absatz, den ein Nutzer unter *Info* liest |
| `APP_FUNKTIONEN` (Namensvarianten je App) | die Funktionsliste je Werkzeug — was es heute kann |
| `APP_CHANGELOG` bzw. `CHANGELOG` | nur ersatzweise, wenn ein Werkzeug keine Funktionsliste führt |
| Register im Skript, von Hand gepflegt | Stichwort → Werkzeug |

## Das Stichwortregister ist der wichtigste Teil

Es steht als `const REGISTER` im Skript und wird **von Hand** gepflegt. Grund:
niemand fragt nach „Abwesenheitskalender", sondern nach *„wie melde ich mich
krank"*. Ohne diese Brücke findet das Wiki das richtige Werkzeug nicht.

Kommt ein neues Werkzeug dazu, gehört ein Registereintrag dazu — mit den Wörtern,
die ein Vereinsmitglied benutzen würde, nicht mit dem Produktnamen.

Bleibt eine Frage im Wiki unbeantwortet, ist der erste Blick ins Register: fehlt
dort das Wort, das gefragt wurde?

## Fallstricke, die schon zugeschlagen haben

**Der Satzsplit bricht bei Abkürzungen.** Die Schnellübersicht kürzt den
Kacheltext auf den ersten ganzen Satz. Ohne Ausnahmeliste endet die Zeile auf
„— z." oder „bei den Heimspielen der 1." — der Punkt in „z. B.", „inkl." und in
Ordnungszahlen ist kein Satzende. Die Liste steht als `ABK` im Skript.

**Drei Werkzeuge tragen ihren Info-Reiter inline in der HTML** (Spiele,
Trainerversammlung-Anmeldung, Vereinsbudget) und haben teils gar keine
`index.html`. Die ganze Seite als JavaScript auszuführen scheitert: das Skript
greift beim Laden ans DOM oder an Firebase. Deshalb wird die Liste per
**Klammerzählung aus dem Quelltext geschnitten** und nur sie ausgewertet.

**Funktionsliste vor Changelog.** Seit dem 07.09.2026 beschreibt `APP_FUNKTIONEN`
den ZUSTAND („die Kacheln lassen sich anordnen") und ist das, was der Info-Reiter
der App zeigt. `APP_CHANGELOG` beschreibt weiter die HISTORIE („lassen sich JETZT
anordnen"), wird gepflegt, aber nirgends mehr angezeigt. Das Skript liest deshalb
zuerst die Funktionsliste und fällt nur ersatzweise auf den Changelog zurück —
sonst steht im Wiki etwas anderes als in der App.

**Die Namen weichen ab.** `APP_FUNKTIONEN_EXTERN` (Fahrtenbuch, Seite ohne Konto),
`BUCHHALTUNG_FUNKTIONEN` und `ANTRAG_`/`NACHWUCHS_`/`KODEX_FUNKTIONEN`
(Vereinsverwaltung, teils in `db-antrag.js`), `REG_FUNKTIONEN` (Kadermanager,
inline in `registrieren.html`), nur `FUNKTIONEN` (AgeLan). Alle stehen als
`FUNK_NAMEN` bzw. `CL_NAMEN` im Skript; eine neue Variante gehört dort ergänzt.
Gesucht wird in `config.js`, `app.js`, `js/render-info.js`, danach in den
HTML-Seiten und zuletzt in den übrigen `.js` des Wurzelverzeichnisses.

**Formatunterschied:** `APP_FUNKTIONEN` ist flach — `[{title, items:[...]}, ...]`.
`APP_CHANGELOG` ist je Version geschachtelt — `[{version, groups:[{title, items}]}, ...]`.

**Zwei Werkzeuge führen eine flache Liste von Sätzen** statt Versionsblöcken
(Vereinsbudget, Trainerversammlung). Das betrifft ihren Changelog; beide Formen
werden unterstützt.

**`const` landet nicht auf dem `vm`-Kontextobjekt.** Wer `APP_CHANGELOG` nach
`runInContext` vom Kontext lesen will, bekommt `undefined` — der Wert muss als
Ausdruck zurückgegeben werden.

**Kein `\s` in `grep`** beim Gegenprüfen: Git-Bash liest das als den Buchstaben
`s`, eingerückte Zeilen fallen durch und das Ergebnis sieht nach Entwarnung aus.
`[[:space:]]` benutzen.

## Vor dem Hochladen prüfen

Die Datei geht an einen KI-Dienst außerhalb des Vereins. Sie darf **keine
Personendaten** enthalten. Gegenprobe:

```bash
cd /e && F=_Dateien/Vereinswiki_Werkzeuge_Gesamtuebersicht.txt; for m in '[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' '\b0[0-9]{3,5}[ /-]?[0-9]{5,}\b' '\bDE[0-9]{20}\b' 'AIza[A-Za-z0-9_-]{20,}'; do echo "$m -> $(grep -coE "$m" $F)"; done
```

Alle Zeilen müssen `0` zeigen. **Und die Suche selbst gegenprüfen** — ein
kaputter Ausdruck liefert auch 0. Dafür denselben Befehl auf einen Testtext mit
erfundener Adresse, Nummer und IBAN loslassen; dort müssen Treffer kommen.

Das Skript meldet am Ende außerdem, wie viele Werkzeuge eine Funktionsliste, einen
Info-Absatz und einen Technik-Block bekommen haben, und nennt die Rückfaller
namentlich — die Werkzeuge, die mangels `APP_FUNKTIONEN` nur den Changelog
bekommen haben, und die ganz ohne Liste. **Stehen diese Zahlen unter der
Zahl der Werkzeuge, fehlt irgendwo etwas** — dann nachsehen, welches Werkzeug
leer ausgegangen ist, statt die Datei so hochzuladen. Ein Rückfaller ist ein
Auftrag: entweder die App bekommt eine `APP_FUNKTIONEN`, oder ihr Name fehlt in
`FUNK_NAMEN`.

## Wenn ein neues Werkzeug dazukommt

Nichts am Skript ändern — es liest die Repos unter `E:\` selbst ein. Nur zwei
Dinge von Hand:

1. Einen Eintrag in `REGISTER` (siehe oben).
2. Steht der Repo-Name mit Großbuchstaben (`Trainerdaten`, `Vereinswiki`), gehört
   er in die Liste `GROSS` — sonst wird er aus der Adresse kleingeschrieben
   abgeleitet und der Ordner nicht gefunden.
