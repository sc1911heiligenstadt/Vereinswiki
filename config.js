const APP_VERSION = "1.0";

const APP_CHANGELOG = [
  {
    version: "1.1",
    groups: [
      {
        title: "Bedienung am Handy",
        items: [
          "Die Tab-Leiste bricht am Handy jetzt um, statt seitlich aus dem Bild zu laufen. Vorher waren die hinteren Tabs auf schmalen Bildschirmen nicht erreichbar.",
          "Eingabefelder sind am Handy mindestens 16 Pixel groß. Dadurch zoomt der iPhone-Browser beim Antippen eines Feldes nicht mehr ungefragt in die Seite hinein und bleibt danach verschoben stehen."
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
          "Fragen in normaler Sprache stellen und eine Antwort auf Basis der hinterlegten Vereinsdokumente erhalten (z. B. „Was steht in der Platzordnung zu Hunden?“).",
          "Die Antwort nennt – soweit möglich – aus welchem Dokument die Information stammt.",
          "Steht etwas nicht in den Dokumenten, sagt der Assistent das ehrlich, statt zu raten."
        ]
      },
      {
        title: "Dokumente",
        items: [
          "PDF- und Text-Dokumente hochladen, ansehen und wieder löschen – sie bilden die Wissensbasis, aus der der Assistent antwortet.",
          "Übersicht aller hinterlegten Dokumente mit Größe, Datum und Ersteller.",
          "Hochladen und Löschen dürfen nur Admins bzw. Nutzer mit Bearbeiten-Recht für dieses Tool; alle anderen können weiterhin fragen und bestehende Dokumente ansehen."
        ]
      },
      {
        title: "Daten & Datenschutz",
        items: [
          "Bewusst nur für allgemeine Vereinsunterlagen (Satzung, Ordnungen, Konzepte, Leitfäden) – keine personenbezogenen Daten (Mitgliederlisten, Geburtsdaten, Gehälter, Kontodaten).",
          "Dokumente liegen in der Vereins-Nextcloud und sind nur für berechtigte, angemeldete Nutzer zugänglich (Gruppen-Rechte werden serverseitig geprüft).",
          "Automatische Synchronisierung über die zentrale Anmeldung (Tools-Übersicht) – kein WebDAV-Passwort auf dem Gerät; bearbeiten zwei Geräte gleichzeitig, wird der Konflikt erkannt statt still überschrieben."
        ]
      }
    ]
  }
];
