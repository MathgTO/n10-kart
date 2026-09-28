# Trackside tuning from MyChron — 1-page brief

**Date:** Mon Sep 28, 2026 (ET)  
**Audience:** MathG + future tuning bot  
**Class:** LO206 Junior @ Mosport / MIKA → BSC Ontario  
**Packs:** `trackside-tuning-from-xrk-v1.json` · clutch Health `clutch-health-diagnostic-v1.json` · rubric **1.7**  
**KB section:** `## Trackside tuning from MyChron session data` in `/workspace/briggs-karting-knowledge-base.md`

## Job

Ingest MyChron **`.xrk` / `.xrz`** (N10 already MyChron-first). Emit **setup-tagged** directions. Never driver-blame a gearing/clutch/tire/chassis call. **One CATEGORY per outing** (gear OR clutch OR tires OR chassis; magnitude from data). Junior = yellow **.570″** → gear for **restricted band**, not 6100 ego (Klaus #7).

## Read order for the bot

1. Channels: **RPM + speed** (wheel preferred; GPS fallback) → optional water/CHT, brake, throttle.  
2. Pick biggest delta loss corner.  
3. Match **S1–S18** in the JSON.  
4. Emit one `setup` action + sources. Optional separate drill only if S2 (RPM OK, speed soft).

## Top signal → tune map (cheat)

| Signal | Tune (setup) |
| --- | --- |
| Exit RPM low, min speed OK | **+N rear teeth** from data (±1 or ±2+; too tall) |
| Exit RPM OK, speed soft | Line/chassis — **not** short gear first |
| Limiter early solo on long straight | **−N rear teeth** from data (±1 or ±2+) |
| Junior living on 6100 + lazy exits | **Restricted-slide gearing** (lengthen) |
| RPM flare, speed lag | **Clutch late slip** → Health pack |
| RPM drop on grab / bog | **Clutch early bite** → Health pack |
| Hot PSI high / “ice” late | Lower next **cold** start (confirm series tire) |
| Push understeer | Widen **front** one step (or +caster) |

## Numbers we will cite vs gaps

**Cite:** Swift band ~5800–6100 (stock-slide gearing context); 68/17=4.00 start example; ±1 tooth ≈0.05–0.06; growth ~2–4 PSI cold→hot; Klaus Green peak example 4800 / don’t gear past ~5300; Hilliard clutch springs from Health pack.  
**Do not invent:** Mosport Junior exact cold/hot PSI or tire brand; MIKA exact min weight without current PDF (~300 lb national chart typical — verify).

## Product line for MathG

Upload session → bot returns **one category** setup card (`tag: setup`) + optional drill. Next session compares the same corner. MIKA reps build the habit; BSC weekends use tire-saving longer ratios when peaks still clean.
