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
│   │   ├── OfficialPdfDownloads.tsx  # H1010 data-sheet download + SSI/HUD form links
│   │   ├── ProgramDetailIntake.tsx   # Program-specific detail questions (detail stage)
│   │   └── ApplyNow.tsx              # Apply stage cards with submission info
│   ├── data/                    # programs.ts, eligibilityRules.ts, submissionInfo.ts
│   ├── hooks/                   # useInstantSpeech, useSpeechRecognition
│   └── lib/                     # matching.ts, officialTexasPdfs.ts (from-scratch PDF generator)
├── public/
│   └── forms/                   # H1010 source PDFs (kept for reference; not fetched at runtime)
├── server.mjs                   # Custom Node.js dev/preview server with TTS proxy
├── vite.config.ts               # Vite config (allowedHosts: true for Replit proxy)
├── navigator-programs.json      # Program data
└── package.json
```

## PDF Engine (`src/lib/officialTexasPdfs.ts`)

Generates application data-sheet PDFs entirely from scratch using pdf-lib — no XFA overlay:
- **Page 1**: Benefits requested checkboxes, applicant ID, address, household/income
- **Page 2**: Additional H1010 questions, H1010-MR tax/Medicaid addendum, signature block
- Programs returning SSI or SSDI also link to the live SSA-8000-BK PDF on ssa.gov
- Programs returning Section 8 link to the live HUD-52517 PDF on hud.gov

App stages: `guide` → `results` → `detail` (ProgramDetailIntake) → `apply` (OfficialPdfDownloads + ApplyNow)

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
