# N10 — The next tenth. This session.

MyChron-first LO206 Junior coach (Mosport / MIKA → BSC Ontario).

## Stack
Vite + React + TypeScript + Tailwind SPA → Netlify (`n10-kart`).

## Rubric
Asserts `schema_version === "1.5"` at startup from `src/data/rubric-v1.json` (baked from `/workspace/briggs-coach-api/rubric-v1.json`).

## Scripts
- `npm run dev` — local
- `npm run build` — production
- `npx netlify-cli@17 deploy --build --prod` — after `link --id 54297779-b78e-412d-a847-89a698940983`

## Routes
- `/` Home — Import session + Try sample sessions
- `/session/:id` Coach call / next-run focus
- `/drills` Drill library
- `/knowledge` Track/class/sources
