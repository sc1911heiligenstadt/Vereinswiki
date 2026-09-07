const APP_VERSION = "1.0";

// Was das Toolbox Wiki kann -- steht im Info-Reiter als Karte "Funktionen".
// WICHTIG: Das ist NICHT der Changelog. Hier steht der ZUSTAND ("die Antwort
// nennt die Quelle"), dort die Aenderung ("nennt JETZT die Quelle"). Wer eine
// Funktion umbaut oder abschaltet, zieht diesen Text mit -- und ebenso
// E:\SC1911-Tools-Anleitung.txt, wo dasselbe ausfuehrlich steht.
const APP_FUNKTIONEN = [
  {
    title: "Fragen stellen",
    items: [
      "Fragen in ganz normaler Sprache stellen und eine Antwort auf Grundlage der hinterlegten Vereinsunterlagen bekommen — etwa „Was steht in der Platzordnung zu Hunden?“.",
      "Die Antwort nennt, soweit möglich, aus welchem Dokument die Auskunft stammt.",
      "Steht etwas nicht in den Unterlagen, sagt der Assistent das — statt zu raten.",
      "Gefragt wird nie das offene Internet, sondern ausschließlich das, was im Reiter „Dokumente“ liegt. Was neu ins Wiki soll, muss dort erst hochgeladen werden."
    ]
  },
  {
    title: "Wo man fragen kann",
    items: [
      "Am schnellsten geht es in der Tools-Übersicht selbst: im Reiter „Feedback & Hilfe“ steht das Frage-Feld gleich oben, ohne dass man diese App öffnen muss.",
      "In der eigenständigen App steht dasselbe Feld im Reiter „Fragen“. Dort werden auch die Dokumente verwaltet.",
      "Strg+Eingabe beziehungsweise Cmd+Eingabe schickt die Frage ab, ohne den Knopf zu treffen."
    ]
  },
  {
    title: "Dokumente",
    items: [
      "PDF- und Textdokumente hochladen, ansehen und wieder löschen. Sie bilden die Wissensbasis, aus der der Assistent antwortet.",
      "Die Übersicht zeigt alle hinterlegten Dokumente mit Größe, Datum und Ersteller.",
      "Je Datei höchstens 10 MB; mehrere Dateien lassen sich auf einmal hochladen.",
      "Andere Dateiarten als PDF und Text nimmt das Wiki nicht an."
    ]
  },
  {
    title: "Gestellte Fragen",
    items: [
      "Jede an das Wiki gestellte Frage steht in einem eigenen Reiter — mit Name, Zeitpunkt und der Angabe, ob eine Antwort gefunden wurde.",
      "Fragen ohne Antwort sind hervorgehoben: sie zeigen, welche Unterlage im Wiki noch fehlt.",
      "Mitgeschrieben werden auch die Fragen aus dem Reiter „Feedback & Hilfe“ der Tools-Übersicht.",
      "Ein Suchfeld durchsucht Fragen und Namen. Einzelne Einträge oder der ganze Verlauf lassen sich löschen. Aufgehoben werden die letzten 500 Fragen."
    ]
  },
  {
    title: "Was hierher gehört — und was nicht",
    items: [
      "Gedacht für allgemeine Vereinsunterlagen: Satzung, Ordnungen, Konzepte, Leitfäden.",
      "Ausdrücklich nicht für personenbezogene Daten — keine Mitgliederlisten, Geburtsdaten, Gehälter oder Kontodaten.",
      "Der Grund: damit eine Frage beantwortet werden kann, verlässt sie den Verein. Sie geht zusammen mit den hinterlegten Unterlagen an einen KI-Dienst von Google, der die kostenlose Stufe nutzt und mit den Eingaben trainiert.",
      "Deshalb bitte auch keine Namen und keine persönlichen Angaben in die Frage selbst schreiben."
    ]
  },
  {
    title: "Wer was darf",
    items: [
      "Sehen: fragen und die hinterlegten Dokumente lesen.",
      "Bearbeiten: zusätzlich Dokumente hochladen und löschen sowie der Reiter „Gestellte Fragen“ samt Löschen einzelner Einträge und des ganzen Verlaufs.",
      "Administrieren: der Reiter „Einstellungen“ mit dem Speicherort.",
      "Der Reiter „Info“ ist für alle sichtbar. Geprüft werden die Rechte auf dem Server, nicht nur durch Ausblenden."
    ]
  },
  {
    title: "Daten und Speicherung",
    items: [
      "Die Dokumente liegen in der Vereins-Nextcloud und sind nur für berechtigte, angemeldete Nutzer erreichbar.",
      "Der Zugang läuft über die zentrale Anmeldung der Tools-Übersicht — ein eigenes Passwort braucht es nicht.",
      "Der Schlüssel für den Sprachdienst liegt im Worker des Vereins, nie im Browser.",
      "Ein Hinweis unter dem Frage-Feld sagt jedem, dass seine Frage mit Namen festgehalten wird.",
      "Ändern zwei Geräte gleichzeitig denselben Stand, erkennt die App das, statt still zu überschreiben."
    ]
  },
  {
    title: "Am Handy",
    items: [
      "Die Reiterleiste bricht am Handy um, statt seitlich aus dem Bild zu laufen — auch die hinteren Reiter sind auf schmalen Bildschirmen erreichbar.",
      "Die Eingabefelder sind groß genug, dass der iPhone-Browser beim Antippen nicht ungefragt in die Seite hineinzoomt."
    ]
  }
];

const APP_CHANGELOG = [
  {
    version: "1.1",
    groups: [
      {
        title: "Im Info-Reiter steht jetzt, was die App kann",
        items: [
          "Die Liste der Änderungen und die Versionsnummer sind aus dem Info-Reiter verschwunden.",
          "Stattdessen steht dort die Karte „Funktionen“: was die App kann, nach Themen geordnet.",
          "Was sich geändert hat, steht weiterhin in den Neuigkeiten auf der Startseite der Tools-Übersicht."
        ]
      }
    ]
  },
  {
    version: "1.0",
    groups: [
      {
        title: "Wissens-Assistent",
        items: [
          "Fragen in normaler Sprache stellen und eine Antwort auf Grundlage der hinterlegten Vereinsunterlagen bekommen — etwa „Was steht in der Platzordnung zu Hunden?“.",
          "Die Antwort nennt, soweit möglich, aus welchem Dokument die Auskunft stammt.",
          "Steht etwas nicht in den Unterlagen, sagt der Assistent das — statt zu raten."
        ]
      },
      {
        title: "Dokumente",
        items: [
          "PDF- und Textdokumente hochladen, ansehen und wieder löschen. Sie bilden die Wissensbasis, aus der der Assistent antwortet.",
          "Übersicht aller hinterlegten Dokumente mit Größe, Datum und Ersteller.",
          "Je Datei höchstens 10 MB; mehrere Dateien lassen sich auf einmal hochladen."
        ]
      },
      {
        title: "Gestellte Fragen",
        items: [
          "Alle an das Wiki gestellten Fragen stehen in einem eigenen Reiter — mit Name, Zeitpunkt und der Angabe, ob eine Antwort gefunden wurde.",
          "Fragen ohne Antwort sind besonders markiert: sie zeigen, welche Unterlage im Wiki noch fehlt.",
          "Mitgeschrieben werden auch die Fragen, die über den Reiter „Feedback & Hilfe“ der Tools-Übersicht gestellt werden.",
          "Ein Suchfeld durchsucht Fragen und Namen. Einzelne Einträge oder der ganze Verlauf lassen sich löschen.",
          "Aufgehoben werden die letzten 500 Fragen; ältere fallen automatisch heraus.",
          "Ein Hinweis unter dem Frage-Feld sagt jedem, dass seine Frage mit Namen festgehalten wird."
        ]
      },
      {
        title: "Wer darf was",
        items: [
          "Sehen: fragen und alle hinterlegten Dokumente lesen.",
          "Bearbeiten: zusätzlich Dokumente hochladen und löschen sowie der Reiter „Gestellte Fragen“ samt Löschen einzelner Einträge und des ganzen Verlaufs. Geprüft wird das auf dem Server, nicht nur durch Ausblenden.",
          "Administrieren: der Reiter „Einstellungen“ mit dem Speicherort.",
          "Der Reiter „Info“ ist für alle sichtbar."
        ]
      },
      {
        title: "Was hierher gehört — und was nicht",
        items: [
          "Gedacht für allgemeine Vereinsunterlagen: Satzung, Ordnungen, Konzepte, Leitfäden.",
          "Ausdrücklich nicht für personenbezogene Daten — keine Mitgliederlisten, Geburtsdaten, Gehälter oder Kontodaten.",
          "Der Grund: damit eine Frage beantwortet werden kann, verlässt sie den Verein. Sie geht zusammen mit den hinterlegten Unterlagen an einen KI-Dienst von Google. Was dort nicht hingehört, gehört auch nicht in dieses Werkzeug — deshalb bitte auch keine Namen und keine persönlichen Angaben in die Frage schreiben."
        ]
      },
      {
        title: "Bedienung am Handy",
        items: [
          "Die Reiterleiste bricht am Handy um, statt seitlich aus dem Bild zu laufen — auch die hinteren Reiter sind auf schmalen Bildschirmen erreichbar.",
          "Eingabefelder sind mindestens 16 Pixel groß, damit der iPhone-Browser beim Antippen nicht ungefragt in die Seite hineinzoomt und verschoben stehen bleibt."
        ]
      },
      {
        title: "Daten & Speicherung",
        items: [
          "Die Dokumente liegen in der Vereins-Nextcloud und sind nur für berechtigte, angemeldete Nutzer erreichbar. Geprüft wird das auf dem Server.",
          "Zugang über die zentrale Anmeldung der Tools-Übersicht — ein eigenes Passwort braucht es nicht.",
          "Der Schlüssel für den Sprachdienst liegt im Worker des Vereins, nie im Browser.",
          "Ändern zwei Geräte gleichzeitig denselben Stand, erkennt die App das, statt still zu überschreiben."
        ]
      }
    ]
  }
];
