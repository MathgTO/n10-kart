# Racing Coach Application — Bake Paths

**Date:** Mon Oct 5, 2026 (ET) — weekly KB refresh (second run) + **class switch to Junior Light (schema 1.10)**  
**Purpose:** Exact `/workspace` paths the Racing Coach Application should bake at build time, with schema version notes.

> Current coaching contract is **`schema_version`: `1.10`** (1.9 = MIKA docs refresh; 1.10 = Junior → Junior Light class switch).

---

## Schema version

| Artifact | Path | Schema / version | Notes |
| --- | --- | --- | --- |
| **Source of truth rubric** | `/workspace/briggs-coach-api/rubric-v1.json` | **`schema_version`: `1.10`** | Bake this file. See `changelog_1_5` … `changelog_1_10`. |
| Clutch Health diagnostic | `/workspace/briggs-coach-api/clutch-health-diagnostic-v1.json` | diagnostic `1.0` | Hilliard Inferno Flame; **require RPM+speed** for early/late slip |
| Trackside tuning pack | `/workspace/briggs-coach-api/trackside-tuning-from-xrk-v1.json` | pack from 1.7 era | Unchanged this weekly refresh |
| TypeScript types | `/workspace/briggs-coach-api/rubric-v1.types.ts` | Header still older — **stale** | Regenerate against 1.10 JSON |
| OpenAPI | `/workspace/briggs-coach-api/rubric-v1.openapi.yaml` | older — **stale** | Bump when regenerating |

**Filename note:** Keep filename `rubric-v1.json` (major family v1); version lives in `schema_version` inside JSON (`1.10`).

---

## Exact paths to bake (weekly refresh Oct 5, 2026 ET)

### Required (coaching contract)

| Bake as | Absolute path |
| --- | --- |
| Rubric JSON | `/workspace/briggs-coach-api/rubric-v1.json` |
| Clutch Health diagnostic | `/workspace/briggs-coach-api/clutch-health-diagnostic-v1.json` |
| Trackside tuning pack | `/workspace/briggs-coach-api/trackside-tuning-from-xrk-v1.json` |
| Trackside tuning exec brief | `/workspace/briggs-coach-api/trackside-tuning-exec.md` |
| Clutch Health N10 UI notes | `/workspace/briggs-coach-api/clutch-health-n10-ui.md` |
| Knowledge base | `/workspace/briggs-karting-knowledge-base.md` |
| Exec summary | `/workspace/briggs-karting-exec-summary.md` |
| Weekly KB changelog | `/workspace/n10-review/weekly-kb-changelog.md` |

### Recommended companion

| Bake or read-only reference | Absolute path |
| --- | --- |
| This bake list | `/workspace/n10-review/bake-paths.md` |
| Briggs 206 Factory Ruleset v2026.1.1 (local) | `/workspace/briggs-coach-api/Briggs-2026-206-Rules_Final.pdf` |
| TRAK 2026 Class Structure (local; Ontario parallel) | `/workspace/briggs-coach-api/2026-TRAK-Class-Structure.pdf` |
| **MIKA 2026 Class Structure V1** | `/workspace/briggs-coach-api/2026-MIKA-Class-Structure-V1.pdf` |
| **MIKA Supplemental Regulations (Apr 19)** | `/workspace/briggs-coach-api/2026-MIKA-Supplemental-Regulations-APR19.pdf` |
| **MIKA Bulletin 2026-03 Contact Penalties** | `/workspace/briggs-coach-api/2026-03-MIKA-Bulletin-Contact-Penalty.pdf` |
| MIKA 2026 Race Schedule v1.5 | `/workspace/briggs-coach-api/MIKA_2026_Race_Schedule_v1.5.pdf` |
| Hilliard Inferno Flame guide | `/workspace/briggs-coach-api/hilliard-inferno-flame-clutch-guide.pdf` |
| Gap analysis | `/workspace/n10-review/race-craft-gap-analysis.md` |

---

## Rubric 1.9 bump — what changed (weekly refresh Oct 5)

| Change | Intent |
| --- | --- |
| `schema_version` 1.8 → **1.9** | Audit trail for MIKA rules ingest |
| `home_track.rules_hub_url` | Point at live Webflow `/rules-regulations` |
| `confirmed_class.mika_2026` | 300 lb / VEGA BLUE / W6 / YELLOW / B–B+ / 202–299 |
| `series_rules_mika_2026` | Contact position penalty + Junior bumper + points + remaining dates |
| `changelog_1_9` | Documents no dim/drill/clutch RPM+speed regressions |

**Not changed:** 20 dimensions, drills, clutch_health RPM+speed pairing, trackside_tuning signal map, Mosport GPS policy.

---


---

## Rubric 1.10 bump — class switch (Oct 5, 2026 ET)

| Change | Intent |
| --- | --- |
| `schema_version` 1.9 → **1.10** | Class switch after concurrent 1.9 MIKA refresh |
| `default_class_assumption` / `confirmed_class` | **LO206 Junior Light** (blue .520 #555734); MIKA JR LITE **265 lb** / LO206/BLUE / VEGA BLUE 4.6/6.5 / numbers 102–199 |
| `mika_2026` + `mika_2026_junior_light` | Junior Light defaults; `mika_2026_junior` keeps 1.9 yellow Junior 300 lb reference |
| `class_profiles` + `rpm_thresholds_policy` | cadet / junior_light / junior / senior_stock sourced facts; RPM thresholds keyed per slide |
| `changelog_1_10` | Class switch; dims / 0–5 scoring / clutch RPM+speed unchanged |

**Not changed:** 20 dimensions, drills, clutch_health RPM+speed pairing, trackside signal map keys, Mosport GPS policy. **Open gap:** blue .520 dyno peak RPM.

## Post-bake checklist for the product bot

1. Assert `rubric.schema_version === "1.10"` at startup.  
2. Enforce `session_rules.change_one_priority_per_session` and `feedback_caps.max_primary_drills === 1`.  
3. Keep clutch Health diagnoses paired on **RPM + speed** (never RPM alone).  
4. Use `confirmed_class.mika_2026` / `mika_2026_junior_light` for Junior Light weight/tire defaults (265 lb / BLUE); keep `mika_2026_junior` as yellow reference; **do not invent PSI or blue dyno peak RPM**.  
5. Apply `series_rules_mika_2026` coaching hooks on race-session D14–D17 feedback.  
6. On MyChron-only sessions: score data-backed dims; set `needs_kart_cam` on vision/racecraft dims.
