# HUEX Beauty Platform

HUEX ist eine interaktive Demo-Plattform für Beauty-Betriebe – unter anderem Friseur-, Nagel-, Kosmetik-, Barber- und Wellness-Studios.

## Enthaltene Bereiche

- Dashboard und Tagesübersicht
- Kalender, Termine und Verfügbarkeiten
- Kundenverwaltung
- Mitarbeiter, Standorte und Leistungen
- Wachstumsmodule und Kampagnen
- Social-Media-Studio
- Bonuspunkte und Kundenbindung
- KI-gestützte Demo-Funktionen
- Einstellungen und Demo-Arbeitsbereich

## Demo-Hinweis

KI, Social Media und Bonuspunkte sind für Kundenvorführungen interaktiv simuliert. Externe Veröffentlichungen, Nachrichten und Zahlungen werden dadurch nicht automatisch ausgelöst.

## Technik

- React und TypeScript
- Tailwind CSS
- Cloudflare Workers
- Cloudflare D1
- Drizzle ORM

## Lokal starten

Voraussetzung: Node.js 22.13 oder neuer.

```bash
npm ci
npm run dev
```

Produktions-Build prüfen:

```bash
npm run build
```

## Sicherheit

Lokale Umgebungsvariablen und Zugangsdaten werden durch `.gitignore` ausgeschlossen. Keine Secrets oder realen Kundendaten in dieses öffentliche Repository einchecken.
