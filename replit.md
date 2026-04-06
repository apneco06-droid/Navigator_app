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

Generates combined application packets using pdf-lib. All drawn text is strictly ASCII (no WinAnsi crashes).

### Combined packet structure
1. **2-page pre-filled data sheet** — generated from scratch; all intake answers laid out in a clean grid
2. **Separator / instruction page** — blue header, 5-step submission guide, HHSC contact box
3. **Official blank form pages** — loaded from `public/forms/` (XFA stripped, static visual background preserved)

### Forms supported
| Function | Packet | Programs |
|---|---|---|
| `generateTexasH1010PdfPair` | H1010 (July 2025, 34 pp) | SNAP, Medicaid, TANF, CHIP |
| `generateTexasH0011Pdf` | H0011 / TSAP (July 2025, 10 pp) | SNAP (elderly/disabled only) |

### WinAnsi rule
All strings passed to `page.drawText()` must be ASCII-only (0x00–0x7F). Never use `✓`, `—`, `–`, `·`, or any non-ASCII character in drawn text. Checkboxes are drawn as filled blue rectangles, not Unicode characters.

### Official forms in `public/forms/`
H0011, H1010, H1113, H1200, H1200-MBI, H1205 (all July–Oct 2025 HHSC versions).  
All are XFA-hybrid; pdf-lib strips XFA but the static page background (form labels, lines) survives for printing.

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
