# Navigator Benefits

## Overview
A bilingual (English/Spanish) Texas benefits intake and printable application assistant for border communities. Helps users identify eligible programs and prepare application packets.

## Architecture

- **Frontend**: React 18 + TypeScript, built with Vite
- **Server**: Custom Node.js server (`server.mjs`) running Vite in middleware mode for dev, static file serving for production preview
- **TTS**: `/api/tts` endpoint supports ElevenLabs or OpenAI for voice narration
- **Port**: 5000 (Replit), 5173 (original default)

## Project Structure

```
/
├── src/
│   ├── App.tsx                  # Root component (intake state, stage routing)
│   ├── main.tsx                 # Entry point
│   ├── styles.css               # Global styles
│   ├── components/              # UI components (ConversationGuide, ProgramMatches, etc.)
│   ├── data/                    # programs.ts, eligibilityRules.ts
│   ├── hooks/                   # useInstantSpeech, useSpeechRecognition
│   └── lib/                     # matching.ts, officialTexasPdfs.ts, applicationDrafts.ts, packetTemplates.ts
├── public/
│   └── forms/                   # H1010 PDF forms
├── server.mjs                   # Custom Node.js dev/preview server with TTS proxy
├── vite.config.ts               # Vite config (allowedHosts: true for Replit proxy)
├── navigator-programs.json      # Program data
└── package.json
```

## Environment Variables

See `.env.example`. TTS features require either:
- `ELEVENLABS_API_KEY` (preferred)
- `OPENAI_API_KEY`

## Benefit Programs

Core programs are in `navigator-programs.json`. Additional programs are defined in `src/data/programs.ts` (`additionalPrograms`):

- **NM SNAP, NM Medicaid, NM LIHEAP** — New Mexico equivalents
- **MX Consular Support, MX Health Window** — Mexico/border consular services
- **Healthy Texas Women (htw)** — Family planning & preventive care, women 15–44, TX
- **CSHCN Services Program (cshcn)** — Children with special health needs, TX
- **New Mexico WIC (nm-wic)** — Nutrition support, pregnant women & children under 5, NM
- **NM Works (nm-works)** — Cash assistance, very low income families with children, NM
- **Project Vida El Paso (ep-project-vida)** — Sliding-fee community health center, El Paso

Eligibility rules for all programs live in `src/data/eligibilityRules.ts`.

## Development

- **Run**: `PORT=5000 HOST=0.0.0.0 node server.mjs`
- **Build**: `npm run build`

## Deployment

- **Type**: Static site
- **Build command**: `npm run build`
- **Public directory**: `dist`
