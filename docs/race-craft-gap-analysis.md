# N10 vs Briggs LO206 Junior — Race-Craft Gap Analysis

**Date:** Fri Sep 18, 2026 (ET)  
**Audience:** Racing Coach Application product bot  
**Sources:** rubric schema **1.5** (`/workspace/briggs-coach-api/rubric-v1.json`), KB + exec summary, live N10 (`https://n10-kart.netlify.app` + `/workspace/n10-kart/dist` assets), `/workspace/lo206-kart-cam-coach`, AiM Race Studio 3 / Swift LO206 public guides.  
**Rule:** Race-craft truth + analysis features only (not polish UI). No fabricated video titles/stats. No invented Mosport corner GPS in the coaching contract.

---

## 0. Two products, one goal

| | **N10 (live)** | **Kart-cam coach thesis (rubric/KB)** |
| --- | --- | --- |
| Ingest | MyChron drop / USB-C **`.xrz`** | Onboard **kart-cam** upload |
| North-star copy | “The next tenth. This session.” — sector, exit, delta vs reference; focus **Brake, apex, exit** | Continuous improvement after every practice/race → **BSC Ontario** wins |
| Evidence | Speed / RPM / delta panes, sectors, theoretical best-sectors lap, IndexedDB session history | 20 scored dims + timestamps, **one** primary drill, setup tagged separately, vs-last trends |
| Class/track bias in demos | Mosport GP default; demo kart **Briggs Junior · Birel ART · LO206 Yellow** | Explicit **LO206 Junior @ Mosport / MIKA**, yellow .570″ slide overlays |

**Implication:** Racing Coach Application should **keep N10’s MyChron-first “next run focus”** and **bake the rubric’s race-craft / continuous-improvement contract** so it beats AiM Race Studio 3 as a *coach*, not as a generic logger UI.

---

## 1. What N10 appears to optimize for today

Evidence from homepage + minified `/workspace/n10-kart/dist/assets/shell-*.js` / `routes-*.js`:

1. **MyChron telemetry ingest** — “Drop the MyChron file”; next-run CTA “USB-C `.xrz` onto this Mac”.
2. **Focus call for the next run** — sector / exit / **delta versus the reference**; focus triad **Brake, apex, exit**.
3. **Overlay panes** — default store panes: `speed`, `rpm`, `delta`; map modes; cursor-on-distance.
4. **Lap math** — flying laps, sector splits, per-lap `minSpeed` / `maxSpeed` / `maxRpm` / `minRpm` / water, channels for throttle/brake/lat/lon when present; **theoretical** lap from best sectors.
5. **Mosport-centric layouts (app-side geometry)** — GP full (~1.38 km, 12 corners), Short, National, Club, GP reverse; home circuit picker includes Mosport + other ON/CA venues. Corner *names* exist in the app (e.g. T4 Hairpin, T5 Uphill Hairpin, T9 Sweep) — **do not promote those GPS distances into the rubric**.
6. **Session persistence** — IndexedDB `pitline-v1` (meta / telemetry / laps); demo practice / qualifying / heat sessions labeled Briggs Junior.

**Missing vs coach thesis:** no 20-dimension scoring, no one-drill enforcement, no setup-vs-driver separation, no racecraft dims (D14–D17), no BSC series weighting, no kart-cam evidence clips, no “advance priority when ≥4” continuous-improvement queue.

---

## 2. Kart-cam coach intended features (from `lo206-kart-cam-coach`)

From README + `src/lib/scoring.ts` / routes:

- Upload video + series tag `practice | mika | bsc_ontario | other`
- Score **D1–D20** with Mosport bias + Junior emphasis + higher racecraft weight for `bsc_ontario`
- Report: composites (qualifying pace / racecraft / race win), top 3 weaknesses + timestamps, **one** drill, setup box, **vs-last** deltas
- Session history in localStorage; drills + knowledge pages
- Analyzer is pluggable (vision/LLM later); default is cue+heuristic

This is the **coaching contract** N10 must absorb — not replace MyChron with video-only.

---

## 3. Gaps vs rubric 1.5 / KB (prioritized)

### MUST

| ID | Gap | Why it matters | Implement hint |
| --- | --- | --- | --- |
| **M1** | **Bake full 20-dimension scoring** into the Racing Coach report path (even when input is MyChron-only) | Rubric is the contract; N10 today has no D1–D20 | Map telemetry fingerprints → dims where honest (D4/D7/D10/D18); mark vision-only dims (D9/D12/D13/D14–D17) as `needs_kart_cam` until video exists |
| **M2** | **Hard “one primary drill” + top-3 weaknesses** | KB/Lorandi: change one priority per session; N10 focus copy is close but not drill-bound | After delta analysis, emit `primary_drill_id` from worst weighted dim; suppress spray advice |
| **M3** | **Exit RPM as LO206 race currency (D4) + Junior restricted-slide gearing** | Swift + Klaus #7; yellow slide peaks earlier — don’t coach “hit 6100” | On focus corner: show exit RPM vs ~5800–6100 *and* Junior overlay `restricted_slide_gearing`; if RPM lazy but line/speed OK → **setup** tag, not “try harder” |
| **M4** | **Setup hypotheses tagged `setup`, never mixed with driver blame** | Core KB/exec-summary rule | When exit RPM / bog / mysterious slow: emit templates `gear_plus_one`, `restricted_slide_gearing`, `clutch_health`, `chassis_before_engine` in a separate box |
| **M5** | **Continuous improvement loop for BSC** | Product north star: after every session; advance when score ≥4; weight racecraft higher for `bsc_ontario` | Persist dim trends; `vs_last` language; series enum; next-session goal = last drill until ≥4 |

### SHOULD

| ID | Gap | Notes |
| --- | --- | --- |
| **S1** | Mosport Junior coaching bias dims (D2, D4, D6, D8, D14, D15) + Junior amplify (D2/D3/D4/D8/D18) | Already in rubric `home_track` / `confirmed_class`; wire into ranking weights like `lo206-kart-cam-coach` scoring |
| **S2** | Racecraft index (D14–D17) when race/pack context or kart-cam exists | BSC Ontario win profile; N10 demos have `kind: race` but no pass/defense coaching |
| **S3** | Evidence markers: video timestamps **or** distance/sector markers from MyChron | Rubric 1.5 `output_order` allows either; don’t fake video stamps from GPS alone |
| **S4** | Composites: qualifying_pace_index / racecraft_index / race_win_index | Surface on session report for BSC weekends |
| **S5** | Source linkouts (Lorandi / Swift / Klaus) on every report | Already in rubric `source_linkouts` |

### LATER

| ID | Gap | Notes |
| --- | --- | --- |
| **L1** | Kart-cam vision pipeline for D9/D12/D13 + racecraft | Pluggable `analyzeSession` already sketched in kart-cam repo |
| **L2** | Away-round packs (TMP, Hamilton) | Teach transferable cues until track packs exist |
| **L3** | Wet adaptation (D20) auto from conditions flag | |
| **L4** | Ideal-lap consistency → D18 drill automation | N10 already builds theoretical best-sectors lap — connect to drill |
| **L5** | Multi-day BSC stamina / tire (D19) across Sat–Sun | |

---

## 4. Gaps vs AiM Race Studio 3 / Swift LO206 workflows

Concrete workflows a coach app should **match or beat** for LO206 Junior @ Mosport (from Swift “How to Use AiM Race Studio…” + RS3 analysis docs + common MyChron RPM guides):

| AiM / Swift workflow | N10 today (approx.) | Coach must beat by… |
| --- | --- | --- |
| Clean data + **pick reference lap** | Reference language on homepage; lap select in analysis | Persist reference across sessions; use as continuous-improvement baseline |
| **Time compare / delta** (gain/loss slopes) | `delta` pane default | Auto-select **one** biggest-loss corner/sector as next-run focus (not a wall of graphs) |
| **Overlay speed + RPM** in key corners | `speed` + `rpm` panes | Ask Swift’s three questions in coach voice: later brake? higher min speed? better RPM at full throttle? |
| **Exit RPM vs gearing vs driving** | RPM traces exist; no gearing coach | If exit RPM soft → setup hypothesis; if RPM OK & speed low → line/turn-in drill (D2/D4) |
| **Ideal lap / consistency gap** | Theoretical best-sectors lap present | Map gap → D18 + `reference_naming`; vs-last consistency |
| **Session / driver compare** | Multi-import IndexedDB | Dim trends + series tags; one shared reference |
| **One–two next-session goals** (Swift Step 5) | Focus triad copy only | Enforce **max 1 primary drill** (rubric) |
| Notes/history per track | Partial (imported sessions) | Session notes + setup changes + dim scores |

N10 already has strong **logger UX seeds**. The gap is **coaching decisions** (drill, setup tag, BSC racecraft, continuous improvement), not more channels.

---

## 5. MyChron-first vs kart-cam thesis (product synthesis)

```
MyChron (.xrz) ──► reference + delta + exit RPM ──► focus corner
                                              │
                                              ├─► D4/D7/D10/D18 scores + one drill
                                              └─► setup hypotheses (tagged)

Kart-cam (optional) ──► D1–D3, D5–D6, D8–D9, D11–D17 evidence clips
                                              │
                                              └─► racecraft cue on race days

Both ──► vs-last trends ──► advance priority when ≥4 ──► BSC Ontario
```

**Do not** abandon MyChron for video purity. **Do not** treat N10 overlays as “done coaching.” Bake rubric 1.5 so Racing Coach Application speaks LO206 Junior truth on top of the data N10 already loves.

---

## 6. Top 5 MUST fixes (implement first)

1. **M1 — 20-dim scoring path** (data-honest + `needs_kart_cam` flags)  
2. **M2 — One primary drill** from worst weighted weakness  
3. **M3 — Exit RPM band + Junior restricted-slide coaching**  
4. **M4 — Setup vs driver separation**  
5. **M5 — Continuous improvement / BSC series weighting + vs-last**

---

## 7. Non-goals / anti-fabrication

- Do not invent champion quotes, video titles, or lap-time “wins.”  
- Do not bake fabricated Mosport corner GPS into the rubric (app may keep its own layout models).  
- Do not blame the sealed engine before chassis/clutch/gearing hypotheses (Klaus #12).  
- Do not spray more than 3 weaknesses or more than 1 primary drill.
