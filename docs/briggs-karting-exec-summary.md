# Briggs Karting — Executive Summary

**Date:** Sep 11, 2026 (trackside MyChron tuning + weekly KB refresh Sep 28, 2026 ET)  
**Audience:** User (MathG) + app-building bot  
**Full KB:** `/workspace/briggs-karting-knowledge-base.md`

**Product north star:** AI coach for **continuous improvement** after every practice/race — excellence loop for LO206 Junior (MIKA → BSC Ontario wins).

## What “Briggs Karting” resolved to

**Almost certainly:** Briggs & Stratton **LO206 / “206”** sealed 4-stroke club kart racing (related: Animal, Jr restrictor variants) — equal equipment, ~9 hp, **6,100 RPM** limiter, single-speed clutch. Wins are about **driver skill, line, consistency, and racecraft**, not engine tricks.

**Not found:** A major facility literally branded only “Briggs Karting.” Closest named venue: **Briggs & Stratton Motorplex** (Road America, WI). Toronto-area relevance: Goodwood/TRAK, Brechin/TKC, Mosport run Briggs LO206 classes.

**Home track:** Mosport Karting Centre. **Class:** LO206 Junior. **Near-term series:** MIKA club. **Ultimate goal:** win **BSC Ontario** (multi-day qual→pre-final→final; away rounds TMP + Hamilton).

## Why this matters for the video coach

LO206 cannot mask mistakes with power. Kart-cam coaching should prioritize: **late apex / full track width, firm-then-bleed braking, minimal steering scrub, early clean throttle, draft-based inside passes that keep exit speed, selective defense, tire-aware consistency.**

## Top 5 must-watch / must-read sources

1. **Lorandi — Overtaking in Karting** — https://purpl.app/blog/overtaking-in-karting/ — Inside owns the corner; plan passes; outside usually donates.  
2. **Lorandi — Racing Line (telemetry)** — https://purpl.app/blog/racing-line-karting/ — Width, late apex, sequence priority; mistakes visible on video.  
3. **Lorandi — Trail Braking** — https://purpl.app/blog/trail-braking-karting/ — Trail is a *release* skill; rear-brake-only kart caveats.  
4. **Swift Karting — LO206 gear ratio guide** — https://swiftkarting.com/pages/lo206-gear-ratio-tuning-guide — Power band 5800–6100; one-tooth race strategy (grid/tires).  
5. **Briggs — 16 Common Mistakes (Klaus PDF)** — https://www.briggsracing.com/sites/default/files/2022-08/16commonmistakes.pdf — Clutch, float, oil, gear-for-power-band, chassis-first diagnosis.

**Honorable:** Terence Dove Substack braking/steering masterclasses; Driver61 trail braking; Kart-Map line guide; Senndit YouTube `@senndit`; Briggs 206 official page.

## App-ready deliverable already in the KB

- Winning framework (qual / start / mid / finish)  
- Technique library with good/bad cues from onboard video  
- LO206-specific gearing/clutch/carb/tire notes (high level)  
- **20-dimension coaching rubric** (scorable + drills)  
- Common kart-cam mistakes list  
- General vs Briggs-specific cheat sheet  


## Trackside MyChron tuning (Sep 28, 2026)

Future tuning bot ingest: **`.xrk` / `.xrz`** → setup-tagged directions (one change).  
- KB section: **Trackside tuning from MyChron session data**  
- Machine pack: `/workspace/briggs-coach-api/trackside-tuning-from-xrk-v1.json`  
- Brief: `/workspace/briggs-coach-api/trackside-tuning-exec.md`  
- Rubric schema: **1.8** (source-authority refresh; `changelog_1_8`; prior trackside = 1.7)  
- Rule: RPM+speed (+delta/water) separates **gear vs clutch vs tire vs chassis vs driving**; Junior gears for restricted slide, not limiter ego.  
- Gap: confirm MIKA Junior tire brand/PSI and current min weight PDF — do not invent Mosport numbers.

## Weekly KB refresh (Sep 28, 2026 ET) — first run

- **Material doc/source upgrades (no coaching-dim changes):** Linked official **Briggs 206 Factory Ruleset v2026.1.1** (unified US/Canada; Maple Leaf embossed stamp no longer required). Confirmed Junior **yellow .570″ #555741** + carb lock **#555726** + Hilliard Inferno Flame on approved clutch list from that PDF.
- **Ontario parallel (not MIKA):** TRAK 2026 Class Structure — Briggs Junior **300 lbs**, **VEGA BLUE ONT 4.6/6.5** (TRAK “GOLD SLIDE” naming — do not assume for MIKA).
- **Re-checked, unchanged coaching content:** Swift gear-ratio + AiM Race Studio LO206 guides; Hilliard Inferno Flame Health pack (on-disk PDF); trackside MyChron pack.
- **Still open:** MIKA Junior min-weight + tire/PSI PDFs (Mosport rules hub **404 from box** this pass).
- Rubric schema remains **1.8** after source-authority metadata bump (see `changelog_1_8`). Weekly log: `/workspace/n10-review/weekly-kb-changelog.md`.

## Blockers / gaps

- Exact facility name ambiguous until user confirms.  
- Region-specific LO206 champion tip videos not fully catalogued.  
- Some elite analyses paywalled (Dove Substack).  
- Re-verify YouTube channel ownership before on-screen attribution.  
- Local rulebooks needed for tires, clutch list, weights, slides.
- **Mosport / MIKA Junior tire brand/PSI** and current MIKA min-weight PDF still unconfirmed (TRAK parallel 300 lb / Vega Blue ONT is **not** MIKA confirmation).

## One-line product thesis

**Coach LO206 Junior like a momentum sport aimed at BSC Ontario wins:** use MIKA for reps; stack clean lines, protect exit RPM, pass with planned inside ownership, manage tires over multi-day finals, and never confuse a gearing/tire problem for a “try harder” message.
