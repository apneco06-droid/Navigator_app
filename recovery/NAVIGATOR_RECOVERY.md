# Navigator Recovery Notes

This folder captures the useful parts of the deployed Replit prototype so the app can be rebuilt outside Replit.

## Recovered assets

- `/Users/oscarrico/Documents/New project/deployed-index.html`
- `/Users/oscarrico/Documents/New project/index-YIVjNu2E.js`
- `/Users/oscarrico/Documents/New project/index-ehRXiwbp.css`
- `/Users/oscarrico/Documents/New project/navigator-programs.json`

## What the deployed app is

The prototype is a compiled single-page React app, likely built with:

- Vite
- React
- Wouter-style routing
- TanStack Query
- Framer Motion
- Tailwind CSS

## Recovered screen structure

The app uses three top-level screen states:

- `welcome`
- `intro`
- `app shell`

Inside the app shell it uses three tabs:

- `chat`
- `programs`
- `apply`

## Recovered API endpoints

The compiled bundle references these endpoints:

- `/api/navigator/programs`
- `/api/navigator/generate-pdf`
- `/api/navigator/stt`
- `/api/navigator/tts`
- `/api/openai/conversations`

## Recovered behavior

### Chat

- User chats with an assistant.
- The app appears to support speech-to-text and text-to-speech.
- TTS is likely server-roundtrip-based, which explains the perceived delay after each assistant message.

### Programs

- The app fetches a list of benefits programs.
- It filters visible programs using a `matchedPrograms` set in client state.
- Program cards show:
  - category
  - English and Spanish names
  - English and Spanish descriptions
  - eligibility summary
  - external apply link

### Apply

- The app generates downloadable PDFs from the collected user info.
- It does not appear to directly submit forms on behalf of the user.
- The current client checks that at minimum `userInfo.name` and `userInfo.address` exist before exposing the application list.

## Recovered data model

The benefits catalog currently includes these fields per program:

- `id`
- `name`
- `nameEs`
- `category`
- `description`
- `descriptionEs`
- `eligibility`
- `eligibilityEs`
- `applyUrl`
- `fplPercent`

## Programs recovered from the prototype

The downloaded dataset includes:

- SNAP
- WIC
- Medicaid
- CHIP
- Medicare (disability-focused description)
- Texas STAR+PLUS
- SSI
- SSDI
- TANF
- LIHEAP
- Section 8
- Head Start
- Texas Vocational Rehabilitation

## Limits in the prototype

These are material product gaps, not just implementation bugs:

- The catalog is mostly Texas and federal only. It does not meaningfully cover New Mexico or Mexico benefits.
- "Apply" is really PDF generation plus a link-out, not full submission.
- The flow is too broad for a reliable 10-minute completion unless the question set is sharply reduced.
- The voice stack likely waits on a backend TTS request before playback, creating lag.
- The visual design is not Apple-like. The current deployed styling is a dark, teal-and-gold theme with `DM Sans` and `Playfair Display`.
- The current app seems to treat SSN as part of the application path, but your desired flow needs an explicit privacy-respecting skip path with printable partial packets.

## Rebuild recommendations

For the next version outside Replit:

- Keep the recovered benefits catalog as seed data only.
- Replace the TTS path with immediate local playback when possible.
- Reduce intake to a short triage flow:
  - location
  - age
  - household size
  - monthly income range
  - disability status
  - pregnancy/children
  - housing/utilities hardship
  - veteran/immigration/language needs only when relevant
- Add an explicit `skipSensitiveInfo` mode so SSN and similar questions are optional.
- Generate a printable packet with:
  - prefilled answers
  - blank fields highlighted for manual completion
  - checklist of where to submit
  - documents still needed
- Split jurisdiction coverage cleanly:
  - Texas
  - New Mexico
  - Federal U.S.
  - Mexico
- Treat submission as a separate capability from eligibility matching. Many programs cannot be safely auto-submitted.

## Practical extraction result

You now have:

- the deployed HTML shell
- the compiled JS/CSS bundles
- the recoverable benefits dataset
- the app structure and endpoint map

That is enough to rebuild the app outside Replit without continuing the Replit codebase.
