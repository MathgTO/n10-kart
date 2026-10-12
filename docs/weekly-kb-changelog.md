# Weekly Briggs KB Changelog

## 2026-10-05 (ET) — class switch Junior → Junior Light (schema 1.10)

**Material = class default.** Rubric **1.9 → 1.10**. Concurrent weekly refresh’s 1.9 MIKA ingest preserved (do not overwrite).

### What changed

- **User (Mathieu) confirmed Oct 5, 2026:** default class = **LO206 Junior Light** (Factory) / MIKA **BRIGGS JR LITE**. Driver Gabriel, age 11. Goal unchanged: BSC Ontario wins @ Mosport / MIKA.
- **Factory Ruleset v2026.1.1:** blue slide **.520″ #555734**, carb lock **#555726**, exhaust EXF5520/5507/5511. Ignition Max RPM **6,150** = all non-Kid Kart — **not** Junior Light-specific.
- **MIKA Class Structure V1 row (JR LITE):** **265 lbs** · ages **8–14 (*15)** · **LO206/BLUE** · dry **VEGA BLUE 4.6/6.5** · license **B–B+** · numbers **102–199**. Wet **VEGA W6** 4.60/6.50 (Supp Regs 25.1).
- **Klaus #7 harder** (blue more restricted than yellow .570); **blue .520 dyno peak RPM = open gap** — do not invent.
- Yellow Junior retained as reference (`mika_2026_junior`: 300 lb / LO206/YELLOW / 202–299).
- Added `class_profiles` + `rpm_thresholds_policy`; trackside/clutch `class_default` → Junior Light.
- **Bumper note:** Supp Regs §15 names “Cadet, Junior” for ASN 5 s; Junior Light not verbatim (eligible list includes Briggs Junior Light; not in Senior/Masters warning exception) — coaching treats as ASN 5 s.

### What did **not** change

- 20 coaching dimensions, 0–5 scoring, drills, feedback caps
- Clutch Health RPM+speed pairing (class string only)
- Trackside signal map (S1–S18) — class overlays / gaps only
- `changelog_1_9` / `series_rules_mika_2026` content from concurrent refresh

### Still open

- Blue .520 dyno peak RPM (dyno/slide chart)
- Driver cold/hot PSI baseline (MIKA unpublished)
- Baseline sprocket / widths / clutch springs
- Away-track packs / BSC 2027 docs

### Current schema_version

**1.10** (`/workspace/briggs-coach-api/rubric-v1.json`)

### Files touched (class switch)

- `/workspace/briggs-karting-knowledge-base.md`
- `/workspace/briggs-karting-exec-summary.md`
- `/workspace/briggs-coach-api/rubric-v1.json` (→ **1.10**)
- `/workspace/briggs-coach-api/trackside-tuning-from-xrk-v1.json`
- `/workspace/briggs-coach-api/trackside-tuning-exec.md`
- `/workspace/briggs-coach-api/clutch-health-diagnostic-v1.json` (class_default only)
- `/workspace/n10-review/bake-paths.md`
- `/workspace/n10-review/weekly-kb-changelog.md`

**Left alone:** `rubric-v1.types.ts`, `rubric-v1.openapi.yaml` (stale); `clutch-health-n10-ui.md` (no class string).

---

## 2026-10-05 (ET) — second weekly refresh (MIKA docs; schema 1.9)

**Material = source authority.** Rubric **1.8 → 1.9** (superseded same day by class-switch **1.10** above).

### What changed

- **MIKA rules finally fetched** from the new Mosport Webflow page [rules-regulations](https://www.mosportkartingcentre.com/rules-regulations) (legacy private-karting hub still 404 from the box).
- **Closed open gaps:**
  - MIKA Briggs Junior min weight = **300 lb**
  - Dry tires = **VEGA BLUE 4.6/6.5**; wet = **VEGA W6** 4.60/6.50
  - Engine label = **LO206/YELLOW**; ages 8–14 (*15); license B–B+; numbers 202–299
  - Spec fuel = **91-octane voucher** at Mosport pump
- **New series racecraft rules baked into rubric `series_rules_mika_2026`:**
  - Bulletin **2026-03** contact **position penalties** → coaching hooks on **D15 / D16 / D17**
  - Junior push-back bumper stays **ASN** (5 s one- or both-sides) → **D14** no bump-draft
- **Upcoming calendar note:** MIKA Race #14 **Sat Oct 10** National Track CCW; Enduro (non-points) **Sun Oct 11**.
- Kart-owners class page also confirms the same Junior row: [mosportkartingcentre.com/kart-owners](https://www.mosportkartingcentre.com/kart-owners).

### What did **not** change

- 20 coaching dimensions, drills, feedback caps
- Clutch Health **RPM + speed** pairing (`clutch-health-diagnostic-v1.json`)
- Trackside MyChron / `.xrk` signal map
- Briggs Factory Ruleset v2026.1.1 (still current; no Oct bulletin)
- Swift gear-ratio / AiM Race Studio LO206 guides (re-checked; no new rules beyond existing KB)
- Hilliard Inferno Flame on-disk guide
- Tire **PSI** — still unpublished by MIKA (methodology only)

### Still open

- Driver’s measured cold/hot PSI baseline
- BSC Ontario 2027 calendar / tire box (2026 season already concluded Aug at Hamilton)
- Yellow-slide dyno peak RPM for MathG’s build
- Away-track packs (TMP, Hamilton)

### Schema after that run

**1.9** at end of MIKA ingest; then **1.10** after class switch (same day).

### Exact bake paths for Racing Coach Application

- `/workspace/briggs-coach-api/rubric-v1.json` (**1.10** current)
- `/workspace/briggs-coach-api/clutch-health-diagnostic-v1.json`
- `/workspace/briggs-coach-api/trackside-tuning-from-xrk-v1.json`
- `/workspace/briggs-coach-api/trackside-tuning-exec.md`
- `/workspace/briggs-coach-api/clutch-health-n10-ui.md`
- `/workspace/briggs-karting-knowledge-base.md`
- `/workspace/briggs-karting-exec-summary.md`
- `/workspace/n10-review/weekly-kb-changelog.md`
- Companion: `/workspace/n10-review/bake-paths.md`
- New local PDFs: `/workspace/briggs-coach-api/2026-MIKA-Class-Structure-V1.pdf`, `2026-MIKA-Supplemental-Regulations-APR19.pdf`, `2026-03-MIKA-Bulletin-Contact-Penalty.pdf`, `MIKA_2026_Race_Schedule_v1.5.pdf`

### Sources checked (this run)

| Query / target | Result |
| --- | --- |
| Briggs LO206 / 206 updates Oct 2026 | Factory Ruleset v2026.1.1 still current — **no new bulletin** |
| Mosport / MIKA 2026 Class Structure | **Fetched** Class Structure V1 + Supp Regs + Bulletin 2026-03 — **added** |
| MIKA kart-owners class page | Confirms Junior 300 lb / VEGA Blue / yellow — **added** |
| MIKA 2026 race schedule | v1.5 — Race #14 Oct 10 noted |
| BSC Ontario 2026 | Season already ran (Mosport / TMP / Hamilton); opener recaps already in KB |
| Swift / AiM LO206 | Re-fetched; no new coaching rules |
| Hilliard Inferno Flame | On-disk PDF still primary |
| TRAK Class Structure | Unchanged parallel |

### Files touched this run

- `/workspace/briggs-karting-knowledge-base.md`
- `/workspace/briggs-karting-exec-summary.md`
- `/workspace/briggs-coach-api/rubric-v1.json` (→ **1.9**)
- `/workspace/n10-review/bake-paths.md`
- `/workspace/n10-review/weekly-kb-changelog.md` (this file)
- New PDFs under `/workspace/briggs-coach-api/` (listed above)

**Not touched:** clutch-health-diagnostic-v1.json, trackside-tuning-from-xrk-v1.json, trackside-tuning-exec.md, clutch-health-n10-ui.md (still current).

---

## 2026-09-28 (ET) — first weekly refresh

**Material = source authority.** Rubric **1.7 → 1.8**.

### What changed

- Linked official **Briggs 206 Factory Ruleset v2026.1.1** (unified US/Canada; Maple Leaf seal no longer required).
- Confirmed Junior yellow **.570″ #555741** + carb lock **#555726** + Hilliard Inferno Flame on approved clutch list from that PDF.
- Ontario parallel (not MIKA at the time): TRAK 2026 Class Structure — Briggs Junior **300 lbs**, **VEGA BLUE ONT 4.6/6.5**.
- Local PDF copies of Factory Ruleset, TRAK Class Structure, ASN LO206 camshaft bulletin.

### What did not change

- Clutch diagnostic JSON — not altered (RPM+speed pairing retained).
- BSC Ontario calendar/context already in KB (CKN); bscontario.com noted as series site.

### Still open (as of Sep 28 — closed Oct 5 where noted)

- ~~MIKA 2026 Junior min weight PDF~~ → closed Oct 5 (300 lb).
- ~~MIKA Junior tire brand/compound~~ → closed Oct 5 (VEGA BLUE / W6); PSI still open.
- Yellow-slide dyno peak RPM for MathG’s build.

### Current schema_version (after that run)

**1.8** then; now superseded by **1.9**.

### Exact bake paths (still valid; schema now 1.9)

- `/workspace/briggs-coach-api/rubric-v1.json`
- `/workspace/briggs-coach-api/clutch-health-diagnostic-v1.json`
- `/workspace/briggs-coach-api/trackside-tuning-from-xrk-v1.json`
- `/workspace/briggs-coach-api/trackside-tuning-exec.md`
- `/workspace/briggs-coach-api/clutch-health-n10-ui.md`
- `/workspace/briggs-karting-knowledge-base.md`
- `/workspace/briggs-karting-exec-summary.md`
- `/workspace/n10-review/weekly-kb-changelog.md`
