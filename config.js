const APP_VERSION = "1.0";

const APP_CHANGELOG = [
  {
    version: "1.2",
    groups: [
      {
        title: "Neuer Reiter „Gestellte Fragen“",
        items: [
          "Alle an das Wiki gestellten Fragen stehen jetzt in einem eigenen Reiter — mit Name, Zeitpunkt und der Angabe, ob eine Antwort gefunden wurde.",
          "Fragen ohne Antwort sind besonders markiert: sie zeigen, welche Unterlage im Wiki noch fehlt.",
          "Mitgeschrieben werden auch die Fragen, die über den Reiter „Feedback & Hilfe“ der Tools-Übersicht gestellt werden.",
          "Ein Suchfeld durchsucht Fragen und Namen. Einzelne Einträge oder der ganze Verlauf lassen sich löschen.",
          "Aufgehoben werden die letzten 500 Fragen; ältere fallen automatisch heraus."
        ]
      },
      {
        title: "Wer darf was",
        items: [
          "Den Reiter sehen und den Verlauf löschen darf nur, wer Bearbeiten-Recht für das Toolbox Wiki hat — geprüft wird das auf dem Server, nicht nur durch Ausblenden.",
          "Ein Hinweis unter dem Frage-Feld sagt jedem, dass seine Frage mit Namen festgehalten wird."
        ]
      }
    ]
  },
  {
    version: "1.1",
    groups: [
      {
        title: "Am Handy",
        items: [
          "Bisher brach die Reiterleiste selbst um, die rechte Reiter-Gruppe darin aber nicht: Sie rutschte als ein Stück in die zweite Zeile und lief dort weiter über den rechten Rand hinaus. Jetzt bricht auch sie um, sobald sie zu breit wird. Zu sehen ist das nur, wenn genug Reiter nebeneinanderstehen — bis dahin sieht alles aus wie bisher."
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
        title: "Wer darf was",
        items: [
          "Sehen: fragen und alle hinterlegten Dokumente lesen.",
          "Bearbeiten: zusätzlich Dokumente hochladen und löschen.",
          "Administrieren: der Reiter „Einstellungen“ mit dem Speicherort.",
          "Der Reiter „Info“ ist für alle sichtbar."
        ]
      },
      {
        title: "Was hierher gehört — und was nicht",
        items: [
          "Gedacht für allgemeine Vereinsunterlagen: Satzung, Ordnungen, Konzepte, Leitfäden.",
          "Ausdrücklich nicht für personenbezogene Daten — keine Mitgliederlisten, Geburtsdaten, Gehälter oder Kontodaten.",
          "Der Grund: die Unterlagen werden zur Beantwortung an einen externen Sprachdienst übergeben. Was dort nicht hingehört, gehört auch nicht in dieses Werkzeug."
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
          "Ändern zwei Geräte gleichzeitig denselben Stand, erkennt die App das, statt still zu überschreiben."
        ]
      }
    ]
  }
];
