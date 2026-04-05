# Navigator App

## Overview
A React + TypeScript + Vite web application bootstrapped from a fresh GitHub import.

## Architecture

- **Frontend**: React 18 with TypeScript, built with Vite
- **Routing**: React Router v6
- **Port**: 5000 (development)

## Project Structure

```
/
├── src/
│   ├── main.tsx       # App entry point
│   ├── App.tsx        # Root component with routing
│   ├── App.css        # App-level styles
│   └── index.css      # Global styles
├── index.html         # HTML template
├── vite.config.ts     # Vite configuration (host: 0.0.0.0, port: 5000)
├── tsconfig.json      # TypeScript config
└── package.json       # Dependencies and scripts
```

## Development

- **Run**: `npm run dev` (starts on 0.0.0.0:5000)
- **Build**: `npm run build`

## Deployment

- **Type**: Static site
- **Build command**: `npm run build`
- **Public directory**: `dist`
