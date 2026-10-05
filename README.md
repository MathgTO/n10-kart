# N10 — The next tenth. This session.

MyChron-first LO206 Junior coach (Mosport / MIKA → BSC Ontario).

## Stack
Vite + React + TypeScript + Tailwind SPA → Netlify (`n10-kart`).

## Rubric
Asserts `schema_version === "1.10"` at startup from `src/data/rubric-v1.json` (baked from `/workspace/briggs-coach-api/rubric-v1.json`).

## Scripts
- `npm run dev` — local
- `npm run build` — production
- `npx netlify-cli@17 deploy --build --prod` — after `link --id 54297779-b78e-412d-a847-89a698940983`

## Routes
- `/` Home — Import session + Try sample sessions
- `/session/:id` Coach call / next-run focus
- `/drills` Drill library
- `/knowledge` Track/class/sources

## Staging (GitHub Pages)

Live preview: **https://mathgto.github.io/n10-kart/**

- Host: `gh-pages` branch (built `dist/`)
- Rebuild & publish: `./scripts/deploy-gh-pages.sh`
- Vite `base` is `/n10-kart/` for project Pages
- Optional: push `.github/workflows/deploy-pages.yml` after `gh auth` has `workflow` scope to auto-deploy from `main`

Netlify config (`netlify.toml`) remains for when credits are available; Pages is the current staging host.
