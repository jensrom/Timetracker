# Timetracker

Intern tidsregistreringsværktøj bygget med React/Electron til daglig brug.

## Features

- **Registrer tid** — Kunde → Sag → Kategori → Timer, on-site toggle med undertype, helligdagsindikator
- **Dashboard** — Stacked bar chart (Recharts), periodefilter 1 uge–12 mdr, KPI-kort pr. kategori
- **Normtid & Afspadsering** — Spor +/- saldo mod 37t/uge, helligdage trækkes automatisk fra
- **Sager** — CRUD med progress-bar mod estimerede timer
- **Kunder** — CRUD med søgning og timeoversigt
- **Indstillinger** — Omdøb kategorier, juster normtid, CSV/JSON export

## Tech Stack

| | |
|---|---|
| React 18 + TypeScript + Vite | UI framework |
| Tailwind CSS | Styling (dark mode) |
| Zustand | State management |
| Recharts | Dashboards og grafer |
| date-fns | Datoberegning (dansk locale) |
| Electron + electron-builder | Desktop .exe wrapper |

## Kør lokalt

```bash
npm install
npm run dev          # Web-version i browser på localhost:5173
```

## Byg Windows .exe

```bash
npm run electron:build
# Output placeres i /release
```

## Danske helligdage

Beregnes dynamisk via Gauss påske-algoritme. Helligdage på hverdage trækkes automatisk fra normtiden i Normtid-dashboardet.
