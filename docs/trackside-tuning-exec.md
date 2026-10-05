# Trackside tuning from MyChron — 1-page brief

**Date:** Mon Sep 28, 2026 (ET); class switch Oct 5, 2026 ET → Junior Light  
**Audience:** MathG + future tuning bot  
**Class:** LO206 Junior Light (blue .520 #555734) @ Mosport / MIKA → BSC Ontario  
**Packs:** `trackside-tuning-from-xrk-v1.json` · clutch Health `clutch-health-diagnostic-v1.json` · rubric **1.10**  
**KB section:** `## Trackside tuning from MyChron session data` in `/workspace/briggs-karting-knowledge-base.md`

## Job

Ingest MyChron **`.xrk` / `.xrz`** (N10 already MyChron-first). Emit **setup-tagged** directions. Never driver-blame a gearing/clutch/tire/chassis call. **One CATEGORY per outing** (gear OR clutch OR tires OR chassis; magnitude from data). Junior Light = blue **.520″ #555734** → gear for **restricted band** (earlier than yellow; Klaus #7 harder). Ignition max 6,150 is all non-Kid Kart — not JL-specific. **Blue dyno peak RPM = open gap** — do not invent.

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
| Junior Light living on ignition max + lazy exits | **Restricted-slide gearing** (lengthen; blue peaks earlier than yellow) |
| RPM flare, speed lag | **Clutch late slip** → Health pack |
| RPM drop on grab / bog | **Clutch early bite** → Health pack |
| Hot PSI high / “ice” late | Lower next **cold** start (confirm series tire) |
| Push understeer | Widen **front** one step (or +caster) |

## Numbers we will cite vs gaps

**Cite:** Swift band ~5800–6100 (**stock-slide** gearing context only); Factory ignition max 6150 (all non-Kid Kart); 68/17=4.00 start example; ±1 tooth ≈0.05–0.06; growth ~2–4 PSI cold→hot; Klaus Green peak example 4800 / don’t gear past ~5300; Hilliard clutch springs from Health pack.  
**Do not invent:** Blue .520 dyno peak RPM; Mosport Junior Light cold/hot PSI (MIKA unpublished). **MIKA JR LITE weight = 265 lb** (Class Structure V1).

## Product line for MathG

Upload session → bot returns **one category** setup card (`tag: setup`) + optional drill. Next session compares the same corner. MIKA reps build the habit; BSC weekends use tire-saving longer ratios when peaks still clean.
