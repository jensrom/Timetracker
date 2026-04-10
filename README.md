# Timetracker

Intern tidsregistreringsværktøj bygget med React/Electron.

## Features

- Registrer timer på kundesager med kategorier og on-site markering
- Dashboard med stacked bar chart og periodefilter (1 uge – 12 mdr)
- Normtid & Afspadsering — spor +/- saldo mod 37t/uge
- Kunder og Sager med CRUD og progress-bar
- Danske helligdage beregnet automatisk (Gauss påske-algoritme)
- CSV-eksport og JSON-backup
- Electron desktop app (.exe) til Windows

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS (dark mode)
- Zustand state management
- Recharts (dashboards)
- Electron + electron-builder

## Kør lokalt

```bash
npm install
npm run dev          # Web-version i browser
npm run electron:dev # Kør i Electron (kræver npm run dev kørende)
```

## Byg .exe

```bash
npm run electron:build
# Output i /release
```
