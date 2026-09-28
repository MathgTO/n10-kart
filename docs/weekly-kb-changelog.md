# Weekly Briggs KB Changelog

**Date:** 2026-09-28 (America/Toronto, ET)  
**Routine:** Weekly Briggs KB refresh — **first run**  
**Agent:** Briggs (LO206 Junior @ Mosport / MIKA → BSC Ontario)  
**Baseline treated as “since last run”:** KB/rubric/clutch/trackside packs as of Sep 28 morning ET (research Sep 11 + same-day trackside/clutch packs).

---

## What changed

### Material (documentation / source authority) — YES

1. **Briggs 206 Factory Ruleset v2026.1.1** confirmed and linked  
   - URL: https://www.briggsracing.com/sites/default/files/2026-01/Briggs%202026%20206%20Rules_Final.pdf  
   - Local: `/workspace/briggs-coach-api/Briggs-2026-206-Rules_Final.pdf`  
   - News: https://www.briggsracing.com/support/news/briggs-stratton-motorsports-simplifies-racing  
   - Facts attributed: unified US/Canada engine rules; Canadian Maple Leaf embossed stamp **no longer required**; Junior **yellow .570″ slide #555741** + carb lock **#555726**; exhaust EXF5520/5507/5511; approved clutches include **Inferno by Hilliard Flame**.

2. **TRAK 2026 Class Structure** (Ontario parallel — **not MIKA**)  
   - URL: https://goodwoodkartways.com/wp-content/uploads/2026/04/2026-TRAK-Class-Structure.pdf  
   - Local: `/workspace/briggs-coach-api/2026-TRAK-Class-Structure.pdf`  
   - Briggs Junior: **300 lbs**, tires **VEGA BLUE ONT 4.6/6.5**; TRAK PDF labels Junior slide “GOLD SLIDE” — do not assume for MIKA yellow .570″.

3. **ASN Canada hub** re-checked — hosts same Briggs Factory PDF + Bulletin 2026-01 LO206 Camshaft (intake lobe centerline 105°–107.5°; tech only). Local bulletin: `/workspace/briggs-coach-api/2026-ASN-Kart-Bulletin-01-LO206-Camshaft.pdf`.

4. **Rubric `schema_version` 1.7 → 1.8** — source-authority metadata + `changelog_1_8` only. **No** coaching-dimension, drill, clutch RPM+speed, or trackside signal-map changes.

### Not material / re-checked unchanged

- Swift LO206 gear-ratio guide (May 28, 2026) — content matches existing KB cues.  
- Swift AiM Race Studio LO206 analysis — unchanged coaching process.  
- Hilliard Inferno Flame Health pack — on-disk PDF remains authority; public engagement chart fetch was image-only / no new text rules.  
- Trackside MyChron `.xrk` pack (`trackside-tuning-from-xrk-v1.json`) — not altered.  
- Clutch diagnostic JSON — not altered (RPM+speed pairing retained).  
- BSC Ontario calendar/context already in KB (CKN); bscontario.com noted as series site.

### Still open (do not invent)

- **MIKA 2026 Junior min weight** PDF (Mosport rules hub **404 from box** this pass).  
- **MIKA Junior tire brand/compound + cold/hot PSI**.  
- Yellow-slide dyno peak RPM for MathG’s build.

---

## Current schema_version

**1.8** (`/workspace/briggs-coach-api/rubric-v1.json`)

---

## Exact bake paths for Racing Coach Application

- `/workspace/briggs-coach-api/rubric-v1.json`
- `/workspace/briggs-coach-api/clutch-health-diagnostic-v1.json`
- `/workspace/briggs-coach-api/trackside-tuning-from-xrk-v1.json`
- `/workspace/briggs-coach-api/trackside-tuning-exec.md`
- `/workspace/briggs-coach-api/clutch-health-n10-ui.md`
- `/workspace/briggs-karting-knowledge-base.md`
- `/workspace/briggs-karting-exec-summary.md`
- `/workspace/n10-review/weekly-kb-changelog.md`

Companion (updated this run; was stale at 1.5): `/workspace/n10-review/bake-paths.md`

---

## Sources checked (this run)

| Query / target | Result |
| --- | --- |
| Briggs LO206 / 206 updates 2026 | Factory Ruleset v2026.1.1 + unification news — **added** |
| Swift gear ratio / AiM Race Studio | Re-fetched; no new coaching rules beyond KB |
| Hilliard Inferno Flame | On-disk PDF still primary; eccarburetors chart image-only |
| MIKA / Mosport 2026 rules / Junior weight / tires | Hub listed in search but **404 from box**; Class Structure PDF unconfirmed |
| BSC Ontario 2026 | CKN already in KB; bscontario.com noted |
| ASN Canada karting regs LO206 | Hub + camshaft bulletin + same Briggs PDF |
| Mosport layout / LO206 Junior coaching | No new attributable coaching article |
| AiM MyChron / Race Studio LO206 2026 tips | Swift pages only; Harris RPM guide general (not LO206-primary) |
| TRAK Goodwood 2026 supplements | Class Structure PDF fetched — **added as Ontario parallel** |

---

## Files touched this run

- `/workspace/briggs-karting-knowledge-base.md` (edited)
- `/workspace/briggs-karting-exec-summary.md` (edited)
- `/workspace/briggs-coach-api/rubric-v1.json` (edited → 1.8)
- `/workspace/n10-review/bake-paths.md` (rewritten; was stale 1.5)
- `/workspace/n10-review/weekly-kb-changelog.md` (created)
- `/workspace/briggs-coach-api/Briggs-2026-206-Rules_Final.pdf` (added local copy)
- `/workspace/briggs-coach-api/2026-TRAK-Class-Structure.pdf` (added local copy)
- `/workspace/briggs-coach-api/2026-ASN-Kart-Bulletin-01-LO206-Camshaft.pdf` (added local copy)

**Not touched:** clutch-health-diagnostic-v1.json, trackside-tuning-from-xrk-v1.json, trackside-tuning-exec.md, clutch-health-n10-ui.md (still current).
