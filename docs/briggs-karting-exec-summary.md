# Briggs Karting — Executive Summary

**Date:** Sep 11, 2026 (trackside MyChron + weekly refreshes Sep 28 / Oct 5; **class switch to Junior Light Oct 5, 2026 ET**)  
**Audience:** User (MathG) + app-building bot  
**Full KB:** `/workspace/briggs-karting-knowledge-base.md`

**Product north star:** AI coach for **continuous improvement** after every practice/race — excellence loop for LO206 **Junior Light** (MIKA → BSC Ontario wins).

## What “Briggs Karting” resolved to

**Almost certainly:** Briggs & Stratton **LO206 / “206”** sealed 4-stroke club kart racing (related: Animal, Jr restrictor variants) — equal equipment, ~9 hp, **6,100 RPM** limiter, single-speed clutch. Wins are about **driver skill, line, consistency, and racecraft**, not engine tricks.

**Not found:** A major facility literally branded only “Briggs Karting.” Closest named venue: **Briggs & Stratton Motorplex** (Road America, WI). Toronto-area relevance: Goodwood/TRAK, Brechin/TKC, Mosport run Briggs LO206 classes.

**Home track:** Mosport Karting Centre. **Class:** LO206 **Junior Light** (blue .520 #555734). **Near-term series:** MIKA club. **Ultimate goal:** win **BSC Ontario** (multi-day qual→pre-final→final; away rounds TMP + Hamilton). Driver: Gabriel, age 11.

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
- Rubric schema: **1.10** (class switch to Junior Light; `changelog_1_10`; 1.9 = MIKA docs for Junior yellow retained as reference; 1.8 = Factory Ruleset)  
- Rule: RPM+speed (+delta/water) separates **gear vs clutch vs tire vs chassis vs driving**; Junior Light blue .520 gears for restricted band (Klaus #7 harder than yellow); **blue dyno peak RPM = open gap**.  
- MIKA JR LITE confirmed: **265 lb**, LO206/BLUE, VEGA BLUE 4.6/6.5 (wet VEGA W6). PSI unpublished — do not invent.

## Weekly KB refresh (Sep 28, 2026 ET) — first run

- **Material doc/source upgrades (no coaching-dim changes):** Linked official **Briggs 206 Factory Ruleset v2026.1.1** (unified US/Canada; Maple Leaf embossed stamp no longer required). Confirmed Junior **yellow .570″ #555741** + carb lock **#555726** + Hilliard Inferno Flame on approved clutch list from that PDF.
- **Ontario parallel (not MIKA):** TRAK 2026 Class Structure — Briggs Junior **300 lbs**, **VEGA BLUE ONT 4.6/6.5** (TRAK “GOLD SLIDE” naming — do not assume for MIKA).
- **Re-checked, unchanged coaching content:** Swift gear-ratio + AiM Race Studio LO206 guides; Hilliard Inferno Flame Health pack (on-disk PDF); trackside MyChron pack.
- **Still open:** MIKA Junior min-weight + tire/PSI PDFs (Mosport rules hub **404 from box** this pass).
- Rubric schema remains **1.8** after source-authority metadata bump (see `changelog_1_8`). Weekly log: `/workspace/n10-review/weekly-kb-changelog.md`.

## Weekly KB refresh (Oct 5, 2026 ET)

- **MIKA rules now fetched** from the new Mosport page ([rules-regulations](https://www.mosportkartingcentre.com/rules-regulations)): 2026 Class Structure V1, Supplemental Regs (Apr 19), Bulletin 2026-03 Contact Penalties, schedule v1.5. Local copies in `/workspace/briggs-coach-api/`.
- **Closed gaps:** MIKA Briggs Junior = **300 lb**, **LO206/YELLOW**, **VEGA BLUE 4.6/6.5**, wet **VEGA W6** 4.60/6.50, license B–B+, numbers 202–299, 91-octane spec fuel.
- **New racecraft rules for coaching:** contact that costs others positions can drop the offender behind all of them (D15/D16/D17); Junior follows ASN push-back bumper = 5 s, so no bump-drafting (D14).
- **Upcoming:** MIKA Race #14 Sat Oct 10 (Mosport National CCW), non-points Enduro Sun Oct 11.
- Rubric **1.8 → 1.9** (`series_rules_mika_2026`, `confirmed_class.mika_2026`). No dimension/drill or clutch RPM+speed changes.


## Class switch (Oct 5, 2026 ET) — Junior → Junior Light

- **User (Mathieu) confirmed:** default class = **LO206 Junior Light** (Factory name) / MIKA **BRIGGS JR LITE**.
- **Factory:** blue slide **.520″ #555734**, carb lock **#555726**, exhaust EXF5520/5507/5511. Ignition max **6,150** = all non-Kid Kart (not JL-specific).
- **MIKA Class Structure V1 row:** 265 lbs · ages 8–14 (*15) · LO206/BLUE · VEGA BLUE 4.6/6.5 · B–B+ · numbers 102–199. Wet VEGA W6 (Supp Regs 25.1).
- **Klaus #7 even harder** (blue more restricted than yellow .570); blue dyno peak RPM = **open gap** — do not invent.
- Prior yellow Junior (300 lb / LO206/YELLOW / numbers 202–299) retained as reference only.
- Rubric **1.9 → 1.10** (`changelog_1_10`). Concurrent weekly refresh’s 1.9 MIKA ingest preserved.

## Blockers / gaps

- Exact facility name ambiguous until user confirms.  
- Region-specific LO206 champion tip videos not fully catalogued.  
- Some elite analyses paywalled (Dove Substack).  
- Re-verify YouTube channel ownership before on-screen attribution.  
- Away-track (TMP, Hamilton) rulebooks still to fetch when BSC 2027 calendar posts.
- MIKA publishes **no tire PSI** — need the driver's own cold/hot baseline. BSC Ontario tire/weight docs not yet fetched (assume MIKA-like only after confirming).

## One-line product thesis

**Coach LO206 Junior Light like a momentum sport aimed at BSC Ontario wins:** use MIKA for reps; stack clean lines, protect exit RPM on the more-restricted blue .520, pass with planned inside ownership, manage tires over multi-day finals, and never confuse a gearing/tire problem for a “try harder” message.
