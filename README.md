# DailyFlow

DailyFlow is a personal daily planner for organizing tasks, routines, check-ins, and journal notes. It runs in your browser and saves your data locally on the device.

## Features

- See today’s task progress, next task, current streak, check-ins, and recent journal entries on the dashboard.
- Add one-time tasks to a date, set priorities, and schedule recurring tasks daily, weekly, or monthly.
- Carry unfinished tasks forward into Pending Tasks and move them to today when you are ready.
- Create daily check-ins and review their completion history.
- Write daily journal entries with prompts for what worked, what did not, and what to improve.
- Mark journal entries private and require device verification or a six-digit PIN to open them in the app.
- Export recurring schedules to a calendar using `.ics` files.
- Export all planner data to a JSON backup and import it later.

## Getting started

You’ll need Node.js and npm installed.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To create and preview a production build:

```sh
npm run build
npm run preview
```

## Data and privacy

Planner data is stored in this browser’s `localStorage`; it is not synced to an account or server. Clearing browser storage or using a different browser/device will not carry your data over, so export a backup regularly if you want to keep it safe.

The journal lock controls access to marked entries within the app. Journal text is still stored in browser `localStorage` and in JSON backups without encryption. Keep exported backups private. Device verification availability depends on the browser and device; a six-digit PIN is also available.

## Project commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the app for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run Oxlint |

## Built with

React 19 and Vite 8, with Oxlint for linting.
