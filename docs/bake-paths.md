# Racing Coach Application — Bake Paths

**Date:** Mon Sep 28, 2026 (ET) — weekly KB refresh (first run)  
**Purpose:** Exact `/workspace` paths the Racing Coach Application should bake at build time, with schema version notes.

> Prior Sep 18 note said schema **1.5** — **stale**. Current coaching contract is **`schema_version`: `1.8`**.

---

## Schema version

| Artifact | Path | Schema / version | Notes |
| --- | --- | --- | --- |
| **Source of truth rubric** | `/workspace/briggs-coach-api/rubric-v1.json` | **`schema_version`: `1.8`** | Bake this file. See `changelog_1_5` … `changelog_1_8`. |
| Clutch Health diagnostic | `/workspace/briggs-coach-api/clutch-health-diagnostic-v1.json` | diagnostic `1.0` | Hilliard Inferno Flame; **require RPM+speed** for early/late slip |
| Trackside tuning pack | `/workspace/briggs-coach-api/trackside-tuning-from-xrk-v1.json` | pack from 1.7 era | Unchanged this weekly refresh |
| TypeScript types | `/workspace/briggs-coach-api/rubric-v1.types.ts` | Header still older — **stale** | Regenerate against 1.8 JSON |
| OpenAPI | `/workspace/briggs-coach-api/rubric-v1.openapi.yaml` | older — **stale** | Bump when regenerating |

**Filename note:** Keep filename `rubric-v1.json` (major family v1); version lives in `schema_version` inside JSON (`1.8`).

---

## Exact paths to bake (weekly refresh Sep 28, 2026 ET)

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
| TRAK 2026 Class Structure (local; not MIKA) | `/workspace/briggs-coach-api/2026-TRAK-Class-Structure.pdf` |
| Hilliard Inferno Flame guide | `/workspace/briggs-coach-api/hilliard-inferno-flame-clutch-guide.pdf` |
| Gap analysis | `/workspace/n10-review/race-craft-gap-analysis.md` |

---

## Rubric 1.8 bump — what changed (weekly refresh)

| Change | Intent |
| --- | --- |
| `schema_version` 1.7 → **1.8** | Audit trail for weekly source refresh |
| `home_track.briggs_rule_set` | Point to unified **Factory Ruleset v2026.1.1** URL + local PDF |
| `confirmed_class.rules_references` / TRAK parallel | Ontario Junior 300 lb / Vega Blue ONT with **not-MIKA** warning |
| `changelog_1_8` | Documents no dim/drill/clutch RPM+speed regressions |

**Not changed:** 20 dimensions, drills, clutch_health RPM+speed pairing, trackside_tuning signal map, Mosport GPS policy.

---

## Post-bake checklist for the product bot

1. Assert `rubric.schema_version === "1.8"` at startup.  
2. Enforce `session_rules.change_one_priority_per_session` and `feedback_caps.max_primary_drills === 1`.  
3. Keep clutch Health diagnoses paired on **RPM + speed** (never RPM alone).  
4. Do **not** invent MIKA Junior weight/PSI — Factory Ruleset + TRAK parallel are not MIKA Class Structure.  
5. On MyChron-only sessions: score data-backed dims; set `needs_kart_cam` on vision/racecraft dims.
