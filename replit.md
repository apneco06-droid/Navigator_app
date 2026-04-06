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

Loads the official HHSC forms and **overlays applicant data at calibrated pixel coordinates** — text appears directly on the real form, perfectly aligned.

### Approach: coordinate overlay on the real form
- `generateTexasH1010PdfPair` loads `H1010_Apr2024_3.pdf`, fills pages 4, 5, and 19 (form pages 1, 2, 16)
- `generateTexasH1010MrPdfPair` loads `H1010-MR.pdf`, fills page 0
- `generateTexasH0011Pdf` loads `H0011.pdf`, overlays basic fields on page 0
- XFA is stripped by pdf-lib; the static visual background (form lines, labels) survives
- All drawn text is ASCII-only (no WinAnsi crashes)

### Forms in `public/forms/`
| File | Pages | Used on |
|---|---|---|
| `H1010_Apr2024_3.pdf` | 33 | Primary SNAP/Medicaid/TANF/CHIP packet |
| `H1010-MR.pdf` | 9 | Medical Records / tax addendum |
| `H0011.pdf` | 10 | TSAP simplified SNAP (elderly/disabled) |
| `H1010.pdf`, `H1113.pdf`, `H1200.pdf`, `H1200-MBI.pdf`, `H1205.pdf` | various | Reserved for future forms |

### WinAnsi rule
All strings passed to `page.drawText()` must be ASCII-only (0x00–0x7F). Never use `✓`, `—`, `–`, `·`, or any non-ASCII in drawn text. Use "X" for checkbox marks.

### External links (not downloaded)
SSI → SSA-8000-BK on ssa.gov | Section 8 → HUD-52517 on hud.gov | SSA-827 on ssa.gov

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
