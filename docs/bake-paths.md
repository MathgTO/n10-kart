# Racing Coach Application — Bake Paths

**Date:** Fri Sep 18, 2026 (ET)  
**Purpose:** Exact `/workspace` paths the Racing Coach Application should bake at build time, with schema version notes.

---

## Schema version

| Artifact | Path | Schema / version | Notes |
| --- | --- | --- | --- |
| **Source of truth rubric** | `/workspace/briggs-coach-api/rubric-v1.json` | **`schema_version`: `1.5`** (bumped from 1.4 on 2026-09-18) | Bake this file. See changelog below. |
| TypeScript types | `/workspace/briggs-coach-api/rubric-v1.types.ts` | Header still says **1.1** — **stale** | Regenerate or hand-extend for 1.5 fields (`input_modes`, `data_coach_parity`, `mychron_signals`, updated `product_north_star.loop`, `changelog_1_5`). Until then, treat JSON as authority. |
| OpenAPI | `/workspace/briggs-coach-api/rubric-v1.openapi.yaml` | info.version **`1.1`** — **stale** | Bump OpenAPI `info.version` to `1.5` when regenerating schemas; add new document fields. |
| App copies (kart-cam repo) | `/workspace/lo206-kart-cam-coach/briggs-coach-api/rubric-v1.json` | Synced to **1.5** | Mirror of workspace API folder |
| | `/workspace/lo206-kart-cam-coach/src/data/rubric-v1.json` | Synced to **1.5** | What Next app imports today |

**Filename note:** Keep filename `rubric-v1.json` (major family v1); version lives in `schema_version` inside JSON (`1.5`).

---

## Exact paths to bake

### Required (coaching contract)

| Bake as | Absolute path |
| --- | --- |
| Rubric JSON | `/workspace/briggs-coach-api/rubric-v1.json` |
| Rubric types | `/workspace/briggs-coach-api/rubric-v1.types.ts` |
| Rubric OpenAPI | `/workspace/briggs-coach-api/rubric-v1.openapi.yaml` |
| Knowledge base | `/workspace/briggs-karting-knowledge-base.md` |
| Exec summary | `/workspace/briggs-karting-exec-summary.md` |

### Recommended companion (product intent / reference implementation)

| Bake or read-only reference | Absolute path |
| --- | --- |
| Kart-cam coach README (routes, scoring intent) | `/workspace/lo206-kart-cam-coach/README.md` |
| Scoring weights reference | `/workspace/lo206-kart-cam-coach/src/lib/scoring.ts` |
| KB inside coach repo (duplicate) | `/workspace/lo206-kart-cam-coach/docs/briggs-karting-knowledge-base.md` |
| Exec summary inside coach repo | `/workspace/lo206-kart-cam-coach/docs/briggs-karting-exec-summary.md` |
| This gap analysis | `/workspace/n10-review/race-craft-gap-analysis.md` |
| This bake list | `/workspace/n10-review/bake-paths.md` |

### N10 live / dist (feature baseline — do not treat as coaching contract)

| Reference | Path / URL |
| --- | --- |
| Live app | `https://n10-kart.netlify.app` |
| Built assets (MyChron/telemetry behavior) | `/workspace/n10-kart/dist/assets/` (`shell-*.js`, `routes-*.js`) |
| Source tree | `/workspace/n10-kart` — **dist only** as of 2026-09-18 (no app source) |

---

## Rubric 1.5 bump — what changed

Bumped **1.4 → 1.5** in `/workspace/briggs-coach-api/rubric-v1.json` (and synced into `lo206-kart-cam-coach` copies).

| Change | Intent |
| --- | --- |
| `product` → “Briggs LO206 Racing Coach (MyChron + kart-cam)” | Reflect N10 MyChron-first + coach thesis |
| `input_modes` | Primary `mychron_telemetry` (`.xrz` observed); secondary `kart_cam_video`; pairing rule |
| `product_north_star.loop` | Dual path: ingest MyChron or kart-cam → reference/focus → speed/RPM/delta → score → one drill → setup tags → vs-last → advance ≥4 |
| `data_coach_parity` | AiM RS3 / Swift LO206 workflows N10 must match or beat + observed N10 baseline |
| `mychron_signals` on D4, D7, D10, D18 | Honest data fingerprints without inventing video |
| `session_rules.output_order` | Lead with focus corner/sector vs reference; allow distance markers; include vs-last |
| `home_track.gps_policy` + `layout_names_app_side_only` | **No fabricated Mosport corner GPS in rubric**; layout names stay app-side |
| `changelog_1_5` | Audit trail |

**Not changed:** 20 dimensions, 6 drills, setup templates, Mosport/Junior/BSC metadata, score scale, “one drill” rule. No corner GPS coordinates added.

---

## Suggested bake mapping for Racing Coach Application

```
/workspace/briggs-coach-api/rubric-v1.json
  → src/data/rubric-v1.json  (or import alias @rubric)

/workspace/briggs-coach-api/rubric-v1.types.ts
  → src/lib/rubric-types.ts  (regen to 1.5 first)

/workspace/briggs-karting-knowledge-base.md
  → docs/ or content/kb (searchable; do not invent quotes)

/workspace/briggs-karting-exec-summary.md
  → docs/ north-star blurb for UI copy

/workspace/n10-review/race-craft-gap-analysis.md
  → internal PRODUCT.md / backlog for MUST M1–M5
```

---

## Post-bake checklist for the product bot

1. Assert `rubric.schema_version === "1.5"` at startup.  
2. Enforce `session_rules.change_one_priority_per_session` and `feedback_caps.max_primary_drills === 1`.  
3. Wire Mosport bias + Junior overlays + `bsc_ontario` racecraft weight from rubric (see kart-cam `scoring.ts` as reference).  
4. On MyChron-only sessions: score data-backed dims; set `needs_kart_cam` on vision/racecraft dims — do not fake video evidence.  
5. Regenerate types + OpenAPI to 1.5 before shipping typed clients.
