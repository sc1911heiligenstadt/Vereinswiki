// Baut die Upload-Datei fuer den Dokumente-Reiter des Vereinswikis.
//
// Ausfuehrliche Fassung: neben READMEs und Kacheltexten kommen jetzt auch
// - der Info-Absatz aus index.html ("Was das Werkzeug tut"),
// - saemtliche Funktionsgruppen aus dem 1.0-Eintrag des Info-Reiters,
// - die technischen Abschnitte (fuer Fragen wie "wo liegen die Daten"),
// - ein Stichwortregister ganz vorn
// mit hinein. Die Groessengrenze des Wikis liegt bei 10 MB, es ist also
// reichlich Platz -- lieber zu ausfuehrlich als eine Frage unbeantwortet.
const fs = require("fs");
const vm = require("vm");

// ---------------------------------------------------------------- Kacheln
const cfg = fs.readFileSync("E:/ToolsUebersicht/config.js", "utf8");
const cctx = {}; vm.createContext(cctx);
const TOOLS = vm.runInContext(cfg + ";TOOLS", cctx);

const GROSS = ["Materialliste","Personalkosten","TrainerCheckliste","Trainerdaten",
               "Vereinsaufgaben","Vereinswiki","ToolsUebersicht"];
function repoAusUrl(url) {
  const m = String(url || "").match(/github\.io\/([^/]+)\//);
  if (!m) return null;
  const roh = m[1];
  return GROSS.find((g) => g.toLowerCase() === roh.toLowerCase()) || roh;
}
const kachel = new Map();
for (const t of TOOLS) {
  const repo = repoAusUrl(t.url);
  if (repo && !kachel.has(repo)) kachel.set(repo, { name: t.name, url: t.url, text: t.description || "" });
}

// ------------------------------------------------------- erster ganzer Satz
const ABK = /(?:^|[\s(])(?:[A-Za-zÄÖÜäöü]{1,2}|[0-9]{1,2}|inkl|bzw|ggf|evtl|ca|etc|usw|Nr|Abs|Str|Tel|vgl|Mio|Mrd|Dr|Prof)$/;
function ersterSatz(text) {
  const s = String(text || "").trim();
  for (let i = 0; i < s.length; i++) {
    if (!".!?".includes(s[i])) continue;
    const danach = s[i + 1];
    if (danach && !/\s/.test(danach)) continue;
    if (s[i] === "." && ABK.test(s.slice(0, i))) continue;
    const rest = s.slice(i + 1).replace(/^\s+/, "");
    if (rest && !/^[A-ZÄÖÜ„»(]/.test(rest)) continue;
    return s.slice(0, i + 1);
  }
  return s;
}

// --------------------------------------------------------------- README
const TECHNIK = /^(technik|technisch|lokal starten|entwickl|deploy|installation|aufbau der dateien|dateien|mitwirken|lizenz|build)/i;

function readmeTeile(pfad) {
  if (!fs.existsSync(pfad)) return { fach: "", technik: "" };
  const roh = fs.readFileSync(pfad, "utf8").split(/\r?\n/);
  const fach = [], technik = [];
  let ziel = fach;
  for (const z of roh) {
    const h2 = z.match(/^##+\s+(.*)$/);
    if (h2) {
      const titel = h2[1].replace(/^[^\p{L}]+/u, "").replace(/[*_`]/g, "");
      ziel = TECHNIK.test(titel) ? technik : fach;
      ziel.push("", titel);
      continue;
    }
    if (/^#\s/.test(z) || /^!\[/.test(z)) continue;
    if (/^\s*$/.test(z)) { ziel.push(""); continue; }
    let t = z.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`]/g, "").replace(/^\s*[-*]\s+/, "- ");
    const tab = t.match(/^\s*\|(.+)\|\s*$/);
    if (tab) {
      const felder = tab[1].split("|").map((s) => s.trim());
      if (felder.every((f) => /^:?-+:?$/.test(f))) continue;
      t = felder.filter(Boolean).join(" — ");
      if (!t) continue;
      t = "- " + t;
    }
    ziel.push(t.replace(/\s+$/, ""));
  }
  const put = (a) => a.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return { fach: put(fach), technik: put(technik) };
}

// ------------------------------------------- Info-Absatz aus der index.html
function htmlSeiten(repo) {
  try {
    const alle = fs.readdirSync("E:/" + repo).filter((f) => /\.html$/i.test(f));
    // index.html zuerst, danach die uebrigen Seiten des Repos
    return alle.sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b)));
  } catch (_) { return []; }
}

function infoAbsatz(repo) {
  for (const datei of htmlSeiten(repo)) {
    const p = "E:/" + repo + "/" + datei;
    if (!fs.existsSync(p)) continue;
    const html = fs.readFileSync(p, "utf8");
    const treffer = html.indexOf('id="tab-info"');
    if (treffer < 0) continue;
    // Hinter das schliessende ">" des Tags springen, sonst landet der Rest
    // des Attributs als sichtbarer Text im Ergebnis.
    const tagEnde = html.indexOf(">", treffer);
    const start = tagEnde < 0 ? treffer : tagEnde + 1;
    const bis = html.indexOf("Änderungen", start);
    const stueck = html.slice(start, bis > 0 ? bis : start + 6000);
    const text = stueck
      .replace(/<h2[\s\S]*?<\/h2>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();
    if (text.length > 60) return text;
  }
  return "";
}

// ------------------------------- Funktionsgruppen aus dem Info-Reiter (1.0)
// Schneidet das Changelog-Array per Klammerzaehlung aus dem Quelltext und
// wertet NUR dieses aus. Die ganze Datei auszufuehren scheitert, sobald das
// Skript beim Laden ans DOM oder an Firebase geht -- genau das tun die
// Inline-Skripte von Spiele, Trainerversammlung und Vereinsbudget.
function arrayAusschneiden(txt, name) {
  // Ohne regulaeren Ausdruck: den Namen als ganzes Wort suchen, dann pruefen,
  // dass dahinter nur "=" und Leerraum bis zur oeffnenden Klammer steht. So
  // trifft "CHANGELOG" nicht das Innere von "APP_CHANGELOG".
  let start = -1;
  for (let i = 0; ; ) {
    const t = txt.indexOf(name, i);
    if (t < 0) break;
    const davor = t > 0 ? txt[t - 1] : " ";
    const gleich = txt.indexOf("=", t + name.length);
    const klammer = txt.indexOf("[", t + name.length);
    if (!/[A-Za-z0-9_$]/.test(davor) && gleich > 0 && klammer > gleich &&
        txt.slice(t + name.length, gleich).trim() === "" &&
        txt.slice(gleich + 1, klammer).trim() === "") {
      start = klammer;
      break;
    }
    i = t + name.length;
  }
  if (start < 0) return null;
  let tiefe = 0, imText = null;
  for (let i = start; i < txt.length; i++) {
    const c = txt[i];
    if (imText) {
      if (c === "\\") { i++; continue; }
      if (c === imText) imText = null;
      continue;
    }
    if (c === "'" || c === '"' || c === "`") { imText = c; continue; }
    if (c === "[") tiefe++;
    else if (c === "]") { tiefe--; if (tiefe === 0) return txt.slice(start, i + 1); }
  }
  return null;
}

function changelogGruppen(repo) {
  const kandidaten = [
    "E:/" + repo + "/config.js",
    "E:/" + repo + "/app.js",
    "E:/" + repo + "/js/render-info.js",
    ...htmlSeiten(repo).map((f) => "E:/" + repo + "/" + f),
  ];
  for (const p of kandidaten) {
    if (!fs.existsSync(p)) continue;
    const txt = fs.readFileSync(p, "utf8");
    const roh = arrayAusschneiden(txt, "APP_CHANGELOG") || arrayAusschneiden(txt, "CHANGELOG");
    if (!roh) continue;
    let cl;
    try {
      const ctx = {}; vm.createContext(ctx);
      cl = vm.runInContext("(" + roh + ")", ctx, { timeout: 5000 });
    } catch (e) { continue; }
    if (!Array.isArray(cl) || !cl.length) continue;

    if (typeof cl[0] === "string") {
      return cl.filter((x) => typeof x === "string")
               .map((x) => "- " + x.replace(/<[^>]+>/g, "")).join(String.fromCharCode(10));
    }
    const zeilen = [];
    for (const b of cl) {
      for (const g of (b.groups || [])) {
        if (!g.title) continue;
        zeilen.push("", g.title);
        for (const it of (g.items || [])) {
          if (typeof it === "string") zeilen.push("- " + it.replace(/<[^>]+>/g, ""));
        }
      }
      // Zweitformat: {version, punkte:[...]} ohne groups
      if (!b.groups && Array.isArray(b.punkte)) {
        if (b.version) zeilen.push("", String(b.version));
        for (const it of b.punkte) if (typeof it === "string") zeilen.push("- " + it);
      }
    }
    const erg = zeilen.join(String.fromCharCode(10)).trim();
    if (erg) return erg;
  }
  return "";
}

// ---------------------------------------------------------------- Register
// Von Hand kuratiert: das Wort, das jemand benutzt, zeigt auf das Werkzeug,
// das er sucht. Genau hier scheitert eine Suche sonst -- niemand fragt nach
// "Abwesenheitskalender", sondern nach "Urlaub eintragen".
const REGISTER = [
  ["Urlaub, Krankheit, krankmelden, abwesend, Fortbildung", "Abwesenheitskalender; bei Mannschaftsterminen auch Kadermanager"],
  ["Bus, Auswärtsfahrt, Fahrgemeinschaft, Transport", "Busplan"],
  ["Vereinsfahrzeug, Fahrt eintragen, Führerschein, Tankbeleg", "Fahrtenbuch"],
  ["Trikot, Trainingsanzug, Kleidung bestellen, Größe", "Kleiderbestellung; gebrauchte Sachen: Kleiderbörse"],
  ["Bälle, Hütchen, Leibchen, Material bestellen, Erste-Hilfe", "Materialbedarf (melden), Materialliste (Bestand je Mannschaft)"],
  ["Platz, Halle, Trainingszeit, Belegung", "Platzbelegung"],
  ["Raum mieten, Veranstaltung, Landkreis, Liegenschaftsamt", "Raumnutzung"],
  ["Testspiel, Freundschaftsspiel, Vorbereitungsspiel, DFBnet", "Testspielplaner"],
  ["Mitglied werden, Aufnahmeantrag, Beitrag, SEPA, Lastschrift", "Vereinsverwaltung; Nachwuchs: Mitgliedsantrag Nachwuchs"],
  ["Spielerlaubnis, Passstelle, Vereinswechsel, Spielerpass", "Mitgliedsantrag Nachwuchs"],
  ["Trainervertrag, Verhaltenskodex, Trainerlizenz, Führungszeugnis", "Trainerdaten"],
  ["Aufwandsentschädigung, Trainerhonorar, Personalkosten", "Personalkosten"],
  ["neuer Trainer, Trainer hört auf, Onboarding, Offboarding", "TrainerCheckliste; Gesamtsicht: Personalakte"],
  ["Termin, Zusage, Absage, Aufstellung, Mannschaftskasse", "Kadermanager"],
  ["Kinderschutz, Jugendschutz, Meldung, Vorfall, Grenzverletzung", "Kinder- und Jugendschutz"],
  ["Telefonnummer, E-Mail, wer betreut welche Mannschaft, erreichen", "Kontakte"],
  ["Termin im Verein, Kalender, Abo, Veranstaltung", "Vereinskalender"],
  ["Foto, Bilder, Social Media, Mannschaftsfoto", "Fotoaufträge"],
  ["Heimspiel, Kassenhäuschen, Ordnungsdienst, Grill, Posten", "Spieltagscrew"],
  ["Tore, Einsätze, Minuten, Karten, Statistik", "Spielstatistik"],
  ["Schul-AG, Hort, Schulsport", "Schulsport"],
  ["Feriencamp, Fußballcamp, Kind anmelden", "Fußballcamp"],
  ["Ablauf, Tagesplan, Medientag, Turniertag, Trainingslager", "Ablaufplan"],
  ["Sichtung, Scouting, Spieler bewerten, Förderung", "Spielersichtung, Spielertool"],
  ["Trainingsinhalt, Übung, Altersklasse, Trainingsphilosophie", "Ausbildungsplan"],
  ["Serienbrief, Word-Vorlage, Bescheinigung, Anschreiben", "Dokumentenvorlagen"],
  ["Stempel, PDF stempeln, Dokument stempeln", "Digitaler Stempel"],
  ["Beleg, Rechnung einreichen, Budget, Kasse", "Vereinsbudget und Geschäftsstelle"],
  ["Aufgabe, Ressort, Funktionär, Klubzertifizierung", "Vereinsaufgaben"],
  ["Besprechung, Videokonferenz, Trainerversammlung, Transkript", "Besprechung"],
  ["Frage an die Unterlagen, Satzung, Ordnung nachschlagen", "Toolbox Wiki (dieses Werkzeug)"],
  ["Passwort, anmelden, Konto, Rechte, Freigabe, Kachel fehlt", "Tools-Übersicht"],
];

// ------------------------------------------------------------------ Aufbau
const alleRepos = fs.readdirSync("E:/", { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync("E:/" + d.name + "/.git"))
  .map((d) => d.name);
const mitKachel = alleRepos.filter((r) => kachel.has(r))
  .sort((a, b) => kachel.get(a).name.localeCompare(kachel.get(b).name, "de"));
const ohneKachel = alleRepos.filter((r) => !kachel.has(r)).sort((a, b) => a.localeCompare(b, "de"));

const heute = "2026-09-02";
const teile = [];

teile.push(
`WERKZEUGE DES 1. SC 1911 HEILIGENSTADT — GESAMTUEBERSICHT

Stand: ${heute}

Diese Unterlage beschreibt alle Web-Werkzeuge des Vereins: wofuer jedes da ist,
welche Bereiche es hat, was es im Einzelnen kann, wer was darf und unter welcher
Adresse es zu finden ist. Sie ist die Antwortgrundlage fuer Fragen wie "Wo trage
ich meinen Urlaub ein?", "Wer darf einen Bus anfragen?" oder "Wie melde ich mein
Kind fuers Feriencamp an?".

Aufbau dieser Unterlage:
1. Stichwortregister — welches Wort fuehrt zu welchem Werkzeug
2. Schnelluebersicht — ein Satz je Werkzeug
3. Je Werkzeug ein ausfuehrlicher Abschnitt
4. Weitere Anwendungen ohne Kachel auf der Startseite

Anmelden: Alle Werkzeuge mit Konto laufen ueber die Tools-Uebersicht. Dort meldet
man sich einmal an, danach sind die freigegebenen Werkzeuge offen. Einige
Werkzeuge haben zusaetzlich Seiten, die ganz ohne Konto erreichbar sind — sie
sind beim jeweiligen Werkzeug genannt.

Die Rechte gelten flottenweit in drei Stufen:
- Sehen: Inhalte ansehen, nichts aendern.
- Bearbeiten: Eintraege anlegen, aendern und ausgeben.
- Administrieren: zusaetzlich die Grundeinstellungen des Werkzeugs.
Welche Stufe jemand hat, legt die Tools-Uebersicht fest. Der Bereich "Info" ist
in jedem Werkzeug fuer alle sichtbar. Fehlt jemandem eine Kachel oder ein Reiter,
ist die Rechtestufe die Ursache — nachsehen laesst sich das in der
Tools-Uebersicht.

Diese Unterlage enthaelt bewusst keine Namen, Anschriften, Bankdaten, Gehaelter
oder andere persoenlichen Angaben.

==========================================================================
1. STICHWORTREGISTER: WELCHES WORT FUEHRT ZU WELCHEM WERKZEUG
==========================================================================

Wer eines der folgenden Woerter benutzt, meint in aller Regel das dahinter
genannte Werkzeug.`);

teile.push(REGISTER.map(([w, z]) => `- ${w}: ${z}`).join("\n"));

teile.push(
`==========================================================================
2. SCHNELLUEBERSICHT: WELCHES WERKZEUG WOFUER
==========================================================================`);
teile.push(mitKachel.map((r) => `- ${kachel.get(r).name}: ${ersterSatz(kachel.get(r).text)}`).join("\n"));

teile.push(
`==========================================================================
3. DIE WERKZEUGE IM EINZELNEN
==========================================================================`);

let mitChangelog = 0, mitInfo = 0, mitTechnik = 0;
for (const r of mitKachel) {
  const k = kachel.get(r);
  const { fach, technik } = readmeTeile("E:/" + r + "/README.md");
  const info = infoAbsatz(r);
  const funk = changelogGruppen(r);
  if (funk) mitChangelog++;
  if (info) mitInfo++;
  if (technik) mitTechnik++;

  const abschnitt = [
`--------------------------------------------------------------------------
WERKZEUG: ${k.name.toUpperCase()}
--------------------------------------------------------------------------

Adresse: ${k.url}

Wofuer es da ist (Text der Kachel auf der Startseite):
${k.text}`];
  if (info) abschnitt.push(`Was im Werkzeug selbst unter "Info" steht:\n${info}`);
  if (fach) abschnitt.push(fach);
  if (funk) abschnitt.push(`Was ${k.name} im Einzelnen kann:\n${funk}`);
  if (technik) abschnitt.push(`Technischer Hintergrund (fuer Fragen dazu, wo die Daten liegen und wie es gebaut ist):\n${technik}`);
  teile.push(abschnitt.join("\n\n"));
}

const sonstige = [];
for (const r of ohneKachel) {
  const { fach, technik } = readmeTeile("E:/" + r + "/README.md");
  if (!fach && !technik) continue;
  const titel = (fs.readFileSync("E:/" + r + "/README.md", "utf8").split(/\r?\n/)
    .find((z) => /^#\s/.test(z)) || "# " + r).replace(/^#\s*/, "").replace(/^[^\p{L}]+/u, "").trim();
  const funk = changelogGruppen(r);
  const st = [
`--------------------------------------------------------------------------
WEITERES: ${titel.toUpperCase()}
--------------------------------------------------------------------------

${fach}`];
  if (funk) st.push(`Was es im Einzelnen kann:\n${funk}`);
  if (technik) st.push(`Technischer Hintergrund:\n${technik}`);
  sonstige.push(st.join("\n\n"));
}
if (sonstige.length) {
  teile.push(
`==========================================================================
4. WEITERE ANWENDUNGEN OHNE KACHEL AUF DER STARTSEITE
==========================================================================

Die folgenden Anwendungen stehen nicht als Kachel auf der Startseite. Sie sind
entweder ueber einen eigenen Link erreichbar, laufen nur oertlich oder gehoeren
zum Unterbau der uebrigen Werkzeuge.`);
  teile.push(...sonstige);
}

const text = teile.join("\n\n") + "\n";
const ziel = "E:/_Dateien/Vereinswiki_Werkzeuge_Gesamtuebersicht.txt";
fs.mkdirSync("E:/_Dateien", { recursive: true });
fs.writeFileSync(ziel, text, "utf8");

console.log("geschrieben:", ziel);
console.log("Werkzeuge mit Kachel:", mitKachel.length, "| weitere:", sonstige.length);
console.log("davon mit Funktionsliste:", mitChangelog, "| mit Info-Absatz:", mitInfo, "| mit Technik:", mitTechnik);
console.log("Registereintraege:", REGISTER.length);
console.log("Groesse:", (Buffer.byteLength(text, "utf8") / 1024).toFixed(0), "KB von 10240 KB");
