# Briggs Karting Race-Win Knowledge Base

**Research date:** Friday, Sep 11, 2026 (trackside MyChron tuning Mon Sep 28, 2026; weekly KB refreshes Mon Sep 28 + Mon Oct 5, 2026 ET)  
**Purpose:** Source-backed knowledge for a video-analysis coaching app that reviews kart-camera (onboard/GoPro) uploads from Briggs-class racers.  
**Rule for consumers of this doc:** Prefer attributable coaching cues; do not invent quotes, video titles, or URLs. Where a URL could not be confirmed, that is marked clearly.

---

## Scope & definition

### What “Briggs Karting” most likely means

**Primary resolution (high confidence):** Briggs & Stratton–powered club/spec kart racing — especially the **Local Option 206 (LO206 / “206”)** sealed 4-stroke class, and related Briggs platforms (**Animal**, Junior/Kid restrictor variants).

Evidence:
- Official Briggs Racing 206 page: sealed short-block, **6,100 RPM** digital rev limiter, ~**8.8 hp / 10 ft-lbs**, 204 cc, 87-octane, stock carb jets, designed for performance parity ([briggsracing.com/racing-engines/206](https://www.briggsracing.com/racing-engines/206)).
- Industry/community distinction: **LO206** = factory-sealed, box-stock, gas, rev-limited; **Animal** = same family but typically builder-blueprinted, often methanol, higher RPM/power (forum consensus on Bob’s 4 Cycle Karting; treat as community knowledge, not factory marketing).
- Popularity: LO206 revived North American club karting with large equal-equipment grids; Cup Karts North America events reported with 500+ drivers across Briggs classes ([gotothegrid.com LO206 overview, Nov 2025](https://www.gotothegrid.com/en/blog/briggs-lo206-how-a-4-stroke-engine-conquered-the-karting-world)).

**Secondary resolution (facility names — do not assume without user confirmation):**
- There is **no widely documented facility literally named “Briggs Karting”** as a standalone brand matching that exact string.
- Closest named facilities:
  - **Briggs & Stratton Motorplex** at Road America (Plymouth, WI) — home of Road America Karting Club (RAKC) LO206 racing ([roadamerica.com/karting-club](https://www.roadamerica.com/karting-club)).
  - Toronto-area clubs that run **Briggs LO206 classes** (not named “Briggs Karting”):
    - **Goodwood Kartways / TRAK** (Uxbridge/Stouffville, ON) — Briggs Cadet / Junior Lite / Junior / Senior / Masters ([goodwoodkartways.com](http://goodwoodkartways.com/faqs/), TRAK 2026 supplements PDF).
    - **Toronto Kart Club @ Brechin Motorsport Park / Gamebridge** — Briggs LO206 or ROK ([gamebridgegokarts.com/club-racing](https://gamebridgegokarts.com/club-racing/)).
    - **Mosport Karting Centre** (Bowmanville) — supports Briggs programs among others.

**Implication for the app:** Default knowledge pack = **LO206 / Briggs 206 race craft**. Prompt the user to confirm class (Cadet/Junior/Senior/Masters), series, and home track.

### Why Briggs/LO206 driving differs from high-power 2-stroke classes

| Factor | Briggs LO206 | Typical Rotax/X30/OK |
| --- | --- | --- |
| Power | ~9 hp, flat torque, sealed parity | Much higher peak power |
| Gearbox | Single-speed centrifugal clutch | Often clutch + (sometimes) gearbox |
| Rev ceiling | Hard 6,100 RPM limiter | Higher / different curves |
| Passing | Momentum, draft, exit speed, patience | More “power past” options |
| Driver emphasis | Line, consistency, RPM band management | Can mask mistakes with power |

Coaching implication: **carry speed, protect exit RPM, minimize scrub/slide, plan passes over multiple corners.** Mistakes are highly visible because power cannot hide them.

---

## Source list (ranked)

### Tier A — Official / series / engine authority
1. **Briggs Racing — 206 Racing Engine** — [https://www.briggsracing.com/racing-engines/206](https://www.briggsracing.com/racing-engines/206) — Specs, sealed philosophy, docs list (carb guide, 16 Common Mistakes).
2. **Briggs Racing — “The 16 Common Mistakes, A Preventative Guide” (David Klaus)** — [https://www.briggsracing.com/sites/default/files/2022-08/16commonmistakes.pdf](https://www.briggsracing.com/sites/default/files/2022-08/16commonmistakes.pdf) — Engine install, clutch, oil, gearing-for-power-band, chassis-first diagnosis.
3. **Briggs 206 Factory Ruleset v2026.1.1** (effective Jan 31, 2026) — [https://www.briggsracing.com/sites/default/files/2026-01/Briggs%202026%20206%20Rules_Final.pdf](https://www.briggsracing.com/sites/default/files/2026-01/Briggs%202026%20206%20Rules_Final.pdf) — Unified US/Canada engine rules; Junior Light blue .520″ #555734 / Junior yellow .570″ #555741 + carb lock #555726; approved clutches include Inferno by Hilliard Flame; Canadian “Maple Leaf” embossed stamp **no longer required** (Canadian Eligibility §2). Local copy: `/workspace/briggs-coach-api/Briggs-2026-206-Rules_Final.pdf`.
4. **Briggs news — Unified 2026 206 Rule Set** (Jan 30, 2026) — [https://www.briggsracing.com/support/news/briggs-stratton-motorsports-simplifies-racing](https://www.briggsracing.com/support/news/briggs-stratton-motorsports-simplifies-racing) — Announces US/Canada unification and removal of Canadian Maple Leaf seal requirement.
5. **ASN Canada karting regulations hub** — [https://www.asncanada.ca/karting-regulations](https://www.asncanada.ca/karting-regulations) — Hosts same Briggs 2026 Factory PDF + **Bulletin 2026-01 LO206 Camshaft** (intake lobe centerline 105°–107.5° at pushrod; tech, not coaching). Local bulletin copy: `/workspace/briggs-coach-api/2026-ASN-Kart-Bulletin-01-LO206-Camshaft.pdf`.
6. **TRAK / Goodwood 2026 Class Structure** — [https://goodwoodkartways.com/wp-content/uploads/2026/04/2026-TRAK-Class-Structure.pdf](https://goodwoodkartways.com/wp-content/uploads/2026/04/2026-TRAK-Class-Structure.pdf) — Ontario parallel (not MIKA): Briggs Junior **300 lbs**, tires **VEGA BLUE ONT 4.6/6.5**; TRAK lists “GOLD SLIDE” for Junior — **do not assume MIKA uses TRAK slide naming**. Local copy: `/workspace/briggs-coach-api/2026-TRAK-Class-Structure.pdf`.
- 6a. **MIKA 2026 Class Structure V1** — [PDF](https://cdn.prod.website-files.com/69cb22d96d2aef5d02e95d66/69fe6d99e4a2bb2418b4c7de_2026%20MIKA%20Class%20Structure%20V1.pdf) (also on [mosportkartingcentre.com/kart-owners](https://www.mosportkartingcentre.com/kart-owners)) — **MIKA authority** (fetched Oct 5, 2026 ET): **default class Briggs JR LITE 265 lbs**, ages **8–14 (*15)**, **LO206/BLUE**, **VEGA BLUE 4.6/6.5**, license **B–B+**, numbers **102–199**. Briggs Junior (reference): 300 lbs, LO206/YELLOW, same tires, numbers 202–299. Local copy: `/workspace/briggs-coach-api/2026-MIKA-Class-Structure-V1.pdf`.
- 6b. **2026 MIKA Supplemental Regulations (updated Apr 19, 2026)** + **MIKA Bulletin 2026-03 Contact Penalties** (effective Apr 26, 2026) — [Supp Regs PDF](https://cdn.prod.website-files.com/69cb22d96d2aef5d02e95d66/69fe66d4c4554c1c7623a38c_FINAL_2026_MIKA_supplemental_regulations_APR19.2026..pdf) · [Bulletin 2026-03 PDF](https://cdn.prod.website-files.com/69cb22d96d2aef5d02e95d66/69fe6a8fe7d024f9e476888f_2026-03%20-%20MIKA%20Bulletin%20-%20CONTACT%20PENALTY.pdf) — wet tire **VEGA W6** (4.60/6.50), spec **91-octane** fuel voucher, Junior on **ASN push-back bumper** rules, contact **position penalties**, points/drop rules. Local copies: `/workspace/briggs-coach-api/2026-MIKA-Supplemental-Regulations-APR19.pdf`, `/workspace/briggs-coach-api/2026-03-MIKA-Bulletin-Contact-Penalty.pdf`. Rules page: [mosportkartingcentre.com/rules-regulations](https://www.mosportkartingcentre.com/rules-regulations).
7. **Road America Karting Club / Briggs & Stratton Motorplex** — [https://www.roadamerica.com/karting-club](https://www.roadamerica.com/karting-club) — Named Briggs facility + LO206 club racing.

### Tier B — LO206-specific technical coaching (setup/data)
8. **Swift Karting — LO206 gear ratio tuning guide** (May 28, 2026) — [https://swiftkarting.com/pages/lo206-gear-ratio-tuning-guide](https://swiftkarting.com/pages/lo206-gear-ratio-tuning-guide) — Power band 5,800–6,100; one-tooth fixes; grid-position gearing; tire management via ratio.
9. **Swift Karting — AiM Race Studio LO206 analysis** — [https://swiftkarting.com/blogs/news/how-to-use-aim-race-studio-lo206-data](https://swiftkarting.com/blogs/news/how-to-use-aim-race-studio-lo206-data) — Overlay speed/RPM; exit RPM vs gearing vs driving.
10. **Swift Karting — LO206 resources/downloads** — [https://swiftkarting.com/pages/lo206-resources-downloads](https://swiftkarting.com/pages/lo206-resources-downloads) — Dyno, clutch, gear charts, tire growth.
11. **GoToTheGrid — LO206 phenomenon overview** (Nov 11, 2025) — [https://www.gotothegrid.com/en/blog/briggs-lo206-how-a-4-stroke-engine-conquered-the-karting-world](https://www.gotothegrid.com/en/blog/briggs-lo206-how-a-4-stroke-engine-conquered-the-karting-world) — Context: educational driving school effect of low power + parity.

### Tier C — Elite karting coaches (general technique; highly transferable; note class differences)
12. **Alessio Lorandi / PURPL / Senndit** — 2013 CIK-FIA Karting World Champion; articles on line, trail braking, overtaking, beginner mistakes:
    - Racing line: [https://purpl.app/blog/racing-line-karting/](https://purpl.app/blog/racing-line-karting/)
    - Trail braking: [https://purpl.app/blog/trail-braking-karting/](https://purpl.app/blog/trail-braking-karting/)
    - Overtaking: [https://purpl.app/blog/overtaking-in-karting/](https://purpl.app/blog/overtaking-in-karting/)
    - Racecraft: [https://senndit.com/karting-racecraft-101-when-to-overtake-vs-when-to-defend/](https://senndit.com/karting-racecraft-101-when-to-overtake-vs-when-to-defend/)
    - Beginner mistakes (data fingerprints): [https://purpl.app/blog/beginner-karting-mistakes/](https://purpl.app/blog/beginner-karting-mistakes/)
    - YouTube channel (confirmed in author schema): [https://www.youtube.com/@senndit](https://www.youtube.com/@senndit)
13. **Terence Dove — On Racing Drivers (Substack)** — Deep onboard video analysis of elite kart technique:
    - Deep braking masterclass: [https://www.terencedove.com/p/how-to-brake-super-deep](https://www.terencedove.com/p/how-to-brake-super-deep)
    - Smooth steering masterclass: [https://www.terencedove.com/p/smooth-steering-masterclass](https://www.terencedove.com/p/smooth-steering-masterclass)
14. **Scott Mansell / Driver61 — Trail braking** — [https://driver61.com/uni/trail-braking/](https://driver61.com/uni/trail-braking/) — Car-rooted but foundational friction-circle / release skill; kart coaches frequently adapt it.
15. **Kart-Map — Racing lines guide** (Apr 1, 2026) — [https://www.kart-map.com/en/blog/kart-racing-lines-apex-braking-exit-guide](https://www.kart-map.com/en/blog/kart-racing-lines-apex-braking-exit-guide) — Late apex / exit priority primer.
16. **Red Bull — 7 novice karting mistakes** (Aug 29, 2022) — [https://www.redbull.com/mea-en/karting-mistakes-novices-make](https://www.redbull.com/mea-en/karting-mistakes-novices-make) — Hands position, hard brake then release, early turn-in, look ahead.
17. **Redline Racing USA — Overtaking techniques** (Feb 6, 2026) — [https://redlineracingusa.com/go-kart-overtaking-techniques/](https://redlineracingusa.com/go-kart-overtaking-techniques/) — Clean passes, switchback, set up a corner ahead.

### Tier D — Community / secondary (use cautiously; verify against Tier A–C)
18. Reddit r/Karting threads on LO206 passing and clutch (useful for common pain points; not authoritative).
19. Chassis brand discussion (OTK / Birel ART / CRG popularity in LO206) — forums/Reddit; treat as “common in paddock,” not ranked superiority.

### YouTube / video sources (titles & URLs only where found)

| Title / resource | Creator | URL | Notes |
| --- | --- | --- | --- |
| HOW TO WIN GO KARTING - Tips From A Professional Driver [Kart Racing For Beginners] | Commonly attributed to Driver61 / Scott Mansell content ecosystem | [https://www.youtube.com/watch?v=SBXktNg_1M0](https://www.youtube.com/watch?v=SBXktNg_1M0) | URL returned by search aggregators; **re-verify channel attribution before citing as Driver61-owned** |
| How to CORNER in Karting (tips for beginners) | (aggregator-listed) | [https://www.youtube.com/watch?v=guzileTcuZI](https://www.youtube.com/watch?v=guzileTcuZI) | Beginner cornering |
| How NOT to drive in Karting (5 common mistakes) | (aggregator-listed) | [https://www.youtube.com/watch?v=60BHloXKPME](https://www.youtube.com/watch?v=60BHloXKPME) | Common mistakes |
| Senndit channel | Alessio Lorandi | [https://www.youtube.com/@senndit](https://www.youtube.com/@senndit) | Channel confirmed via Senndit author metadata |
| Terence Dove onboard analyses | Terence Dove | Embedded in Substack posts above | Authoritative for steering/braking visual standards; exact YouTube IDs not separately confirmed in this research pass |
| LO206-specific YouTube tutorials | Various paddock creators | **Gap:** many exist; few are “canonical” with champion-level authority | Prefer Swift Karting + Briggs official docs for LO206 tech; prefer Lorandi/Dove for technique |

---

## Winning framework (qualifying, race start, mid-race, finish)

### Guiding principle (Briggs-specific overlay on general racecraft)
Because engines are sealed and similar, **wins come from:** (1) qualifying consistency, (2) start survival + early-lap racecraft, (3) tire/momentum management over the race distance, (4) high-percentage passes that preserve exit speed, (5) not defending yourself into a slow race.

Pace first, then racecraft when pace alone is not enough (Lorandi / Senndit racecraft guide).

### Qualifying
**Goals observable on video:**
- Clean-air lap with full track width every corner.
- Repeatable braking markers; stacked GPS/visual lines.
- Late apexes onto straights; early full throttle.
- Minimal steering corrections; no mid-corner sawing.
- Body quiet in seat (weight transfer intentional, not thrashing).

**LO206 overlay:**
- Gear so exit RPM stays in usable band and you approach limiter on longest straight without living on limiter mid-corner (Swift: target living ~5,800–6,100 on power; gear for power band, not ego).
- Qualifying often wants the **faster single-lap setup**; race may want **longer gear** for tire life (Swift gearing guide).

### Race start / lap 1
**General:**
- Survive first corners; cold tires + optimism = high crash rate (Lorandi overtaking article).
- Own inside into Turn 1 if defending pole; otherwise prioritize clean exit over heroic outside lunges.
- Present yourself early if attacking — half-alongside at turn-in owns nothing.

**LO206 overlay:**
- Clutch engagement and launch feel matter more than in karts with different drivetrains; bogging off the line is a race-ruiner (see clutch notes).
- From mid/back grid, Swift suggests **shorter ratio** (more rear teeth) for early-lap acceleration/passes; from front, **longer ratio** for top speed + consistency.

### Mid-race
**Defend selectively:**
- Legal: one move, cover inside early, stay predictable; do not weave or squeeze someone already alongside (Lorandi).
- Hard defending early in a long race often costs the gap to the leaders (Lorandi: “almost never a good reason to defend hard early”).
- Make defender pay: sit close, force covered insides, harvest their poor exits (switchback).

**Attack with plan:**
1. Scout weak corner / early brake / sagging exit (1 lap).
2. Build tow into the best braking zone (1 lap).
3. Execute inside ownership before turn-in; keep enough exit to hold the pass (Lorandi; Redline).
4. If door closes, abort early — plan survives; crash does not.

**Traffic / trains:**
- Avoid donating positions with outside moves unless arithmetic favors you (soft defender + late race, or safe gap behind).
- In a train into a wide hairpin with space behind, late-brake outside group move is a known high-risk/high-reward exception (Lorandi) — coach as “advanced only.”

### Finish / last laps
- Last-lap P1 battles: prioritize a **pass that sticks** even if it costs time; prevent immediate switchback (Lorandi).
- Tire degradation: LO206 long mains often won by fresher rear grip + ratio that doesn’t cook the tire (Swift: consider longest clean ratio you ran).
- Dirty air vs tow: following may hurt front grip in fast corners but pay on straights — final-lap lines often differ from qualifying (Lorandi racing-line article).

### Consistency & tire management (kart-cam cues)
- Lap-to-lap line stack vs wandering.
- Progressive increase in rear slide / opposite lock as tires heat/glaze.
- Steering angle creep (more lock needed for same corner) = grip loss; coach smoother inputs + earlier throttle discipline.
- LO206: when times drop 3–5 tenths with slide on tight exits, paddock fix is often **+1 rear tooth** (Swift) — app can flag “exit RPM/feel soft + slide” as a setup conversation, not only a driving fault.

---

## Technique library (observable from kart cam)

Each item: **what good looks like**, **what bad looks like**, **coaching cue**. Sources noted.

### 1. Racing line / apex
- **Good:** Outside → deliberate apex → outside; late apex before long straights; uses full width; eyes look to next reference (Lorandi; Kart-Map; Red Bull).
- **Bad:** Early turn-in → early apex → runs wide / lifts on exit; floating a kart-width inside white line every lap (Lorandi beginner mistakes #3, #4).
- **Cue:** “Hold straight one beat longer; apex later so throttle opens at/just before apex without eating the exit barrier.”

### 2. Braking
- **Good (kart):** Hard initial hit (near lock threshold), then progressive release into turn-in — trail as a **release skill**, not “brake later forever” (PURPL trail braking; Red Bull; Driver61 concepts adapted).
- **Bad:** Soft long squeeze; coasting shelf between release and turn-in; snap-off brakes → nose light / understeer (PURPL beginner #2; trail braking article).
- **Cue:** “Hit firm, then bleed; never dump the pedal. No coasting gap.”
- **Elite visual (Dove):** Deep “on the nose” braking with late left-foot release, minimal steering after rotation, immediate roll onto power — useful as a *target model*, not day-one expectation.

### 3. Trail braking (kart-specific)
- Rear-brake-only karts: trailing shares rear tire budget for stop + turn → finer release than cars (PURPL).
- Use most in **slow/medium** corners for rotation; less/none in fast commitment corners; avoid early wet laps (PURPL).
- **Video tell:** Speed still falling gently after turn-in; minimum speed earlier; then clean throttle climb. Double-dip speed = grabbed brake again.

### 4. Throttle application
- **Good:** Progressive roll-on once rotation done; early full throttle when exit is open; holds full throttle without pumping.
- **Bad:** Stabbing; late throttle because early apex trapped the exit; throttle-brake overlap chaos (overlap OK only as intentional trail transition, not mid-corner confusion).
- **LO206 cue:** Protect corner-exit RPM; lazy exit RPM may be gearing **or** timid throttle/line — separate with data if available (Swift Race Studio guide).

### 5. Steering
- Hands fixed ~9-and-3 / quarter-to-three; smooth load; minimal angle (Red Bull; Dove).
- **Good:** One commitment; hold steady through bumps; after rotation, unwind toward neutral (Dove hairpin description).
- **Bad:** Sawing / death grip / mid-corner corrections → scrub, front push, V-shaped speed (PURPL steering themes; Lorandi beginner #9).
- **Cue:** “Commit once. If you’re correcting mid-corner, fix turn-in timing, not the middle.”

### 6. Weight transfer / body
- Quiet upper body; intentional lean only as needed for feel; no bouncing that unloads tires.
- On brakes: kart pitches forward — use that for front bite (Dove “on the nose”).
- Visible thrash usually correlates with over-slowing + corrections.

### 7. Corner types (apply differently)
| Type | Priority | Typical technique |
| --- | --- | --- |
| Hairpin / slow | Rotate early, open exit | Trail brake; late apex; early throttle |
| Medium | Blend | Trail then clean arc |
| Fast sweeper | Stability | Less trail; smooth steering; eyes far ahead |
| Linked / sequence | Exit of **last** corner onto straight | Sacrifice first apex if needed (Kart-Map; Lorandi) |
| Double apex | Plan both | Don’t treat painted kerb as mandatory worship (Lorandi) |

### 8. Following distance / draft / overtaking (race craft on camera)
- **Good attack:** Close enough for tow; nose clearly inside before turn-in; exit preserved.
- **Bad:** Dive after turn-in into disappearing space; outside donation; pass then get switchbacked (Lorandi; Reddit LO206 thread consensus aligns: present before turn-in).
- **Defense:** Cover inside early; one line; protect exit; don’t turn into someone already level.

### 9. Wet vs dry (high level)
- Dry rubbered line often becomes **slow** in wet; leave painted kerbs alone (Lorandi line article).
- Less trail early when grip scarce (PURPL trail braking).
- Video cues: earlier brake markers, smoother everything, avoid kerb strikes, larger following gaps.

---

## Briggs/LO206-specific notes

### Engine / drivetrain characteristics (attributable)
- Sealed LO206, ~8.8 hp, 6,100 RPM limiter, 87 octane, stock jets philosophy (Briggs Racing).
- Peak HP unrestricted ~5,600 RPM per Klaus guide; **restricted slides peak earlier** — gear for power band, **not** the limiter (Klaus mistake #7: e.g., Green slide peak ~4,800 — gearing past ~5,300 can be slower).
- Single-speed centrifugal clutch; #35 chain common; drivers often 17T (also 18/19 where allowed); rear sprocket primary tuning lever (Swift).

### Gearing (actionable)
- Ratio = rear ÷ clutch driver. Example: 68/17 = 4.00 (Swift).
- Typical sprint starting zone often ~3.8–4.7 depending on track/weight (Swift).
- Quick fixes (Swift, 17T driver):
  - Tires wearing / sliding exits → **+1 rear tooth**
  - Front row / long main tire save → **−1 tooth** (longer)
  - Mid/back grid early-lap pass need → **+1–2 teeth**
- Same numerical ratio, bigger sprocket pair = more rotating inertia (smoother, flowing tracks); smaller pair = snappier (tight tracks) (Swift).

### Clutch (high level)
- Engagement often targeted near peak torque region (~3,000–3,200 RPM cited in Kart-start clutch PDF circulating in LO206 community; treat as popular guidance — confirm against current local rules/clutch brand).
- Common approved families historically include Hilliard Inferno (Flame etc.), Max-Torque, Noram/Premier (Klaus/community lists vary by series — **always check current rulebook**).
- Briggs official warning: clutch must be locked against crank shoulder — **floating clutch damages keyway** (Klaus #3).

### Carb / jetting (high level only)
- Float height critical after shipping; wrong float → bog or overheating/fuel starve (Klaus #1).
- Briggs publishes carburetor tuning guide on 206 docs tab — app should **not** invent jet recipes; point users to official guide + local tech rules (many classes fix jets).

### Oil / maintenance (affects “mysterious slow”)
- Briggs recommends **Briggs 4T** synthetic; warns against many “karting” oils and automotive splash misuse (Klaus #2).
- Check valve lash after break-in heat cycles (Klaus #6).
- Chassis/setup first when “engine feels down” (Klaus #12) — coaching app should not always blame driver or engine.

### Tires / warm-up
- Series-dependent; e.g., TRAK Ontario materials reference specified compounds (Vega Blue called out in TRAK class structure snippets for some Briggs classes — **confirm current year PDF**).
- Warm-up observable on camera: progressively later brakes / more lean-in as grip arrives; cold-tire heroics = spin risk.
- Tire growth with heat changes effective gearing (Swift tire growth charts).

### Weight / classes (examples — verify locally)
- Ontario TRAK 2026 class structure (from published PDFs) includes Briggs Cadet / Junior Lite / Junior / Senior / Masters with age/weight boxes (e.g., Cadet ~235 lb cited in TRAK PDF snippets) — **user must confirm their exact class minimum**.
- Higher weight = more momentum, harder to rotate, more tire stress — technique leans even more on line efficiency.

### Chassis notes (paddock-common, not ranked)
- LO206 runs on broad chassis pool (OTK family, Birel ART, CRG, and many others); CRG historically offered FS4 4-stroke packages in Europe (GoToTheGrid).
- Coaching app: chassis brand rarely diagnosable from GoPro alone; focus on driver inputs. Setup conversations: understeer/oversteer symptoms visible as push vs rear step.

### Wet vs dry LO206
- Same principles as general karting, amplified: low power means wet mistakes (slide, scrub, early apex) destroy lap time permanently until next straight.
- Shorter gear sometimes used when grip low to keep RPM in band (Swift tire/grip scenarios).

---

## Champion & influencer lessons (with URLs and key takeaways)

### Alessio Lorandi (2013 CIK-FIA Karting World Champion; Senndit / PURPL)
**Why authoritative:** World champion, long coaching practice, publishes technique with data signatures useful for video/telemetry apps.

| Lesson | Source | Takeaway for app |
| --- | --- | --- |
| Inside owns the corner | Overtaking article | Score “nose alongside before turn-in” |
| Outside usually donates | Same | Flag outside attempts without gap behind |
| Defend selectively | Racecraft 101 | Penalize unnecessary mid-race defense that kills exit |
| Don’t get switchbacked | Racecraft 101 | After a pass, protect exit / don’t overshoot |
| Early turn-in is #1 line killer | Racing line + beginner mistakes | Detect early apex + late throttle |
| Trail = release skill | Trail braking | Score progressive brake-out vs dump |
| Eyes one reference ahead | Racing line | Infer from late corrections / target fixation |

### Terence Dove
**Why authoritative:** Long-time kart coach; frame-by-frame onboard analysis of elite drivers (e.g., Nathan Chafer examples in 2026 posts).

| Lesson | Source | Takeaway |
| --- | --- | --- |
| Minimal steering angle | Smooth Steering Masterclass | Score steering smoothness / magnitude |
| Deep braking “on the nose” | How to Brake Super-Deep | Late brake release + planted front as advanced target |
| Rotate then straighten | Same / steering post | After rotation, wheel toward neutral |

### Scott Mansell / Driver61
**Why authoritative:** Massive driver-education audience; trail braking / corner technique explainers widely used by amateurs.

| Lesson | Source | Takeaway |
| --- | --- | --- |
| Brake max straight, then blend | Trail braking guide | Teach sequence: straight stop → ease → turn |
| Trail more in slow corners | Same | Corner-type dependent scoring |
| Use brakes to manage balance | Same | Understeer → trail a touch longer; oversteer → release earlier |

### David Klaus / Briggs Racing
**Why authoritative:** Director, Briggs Racing; writes official preventative guidance for 206 owners.

| Lesson | Source | Takeaway |
| --- | --- | --- |
| Gear for power band, not limiter | 16 Common Mistakes #7 | Especially slide-restricted classes |
| Chassis before engine blame | #12 | App should ask setup questions |
| Clutch install / float / oil | #1–3 | Pre-race checklist content |

### Swift Karting (MC Engines / LO206 specialists)
**Why authoritative:** LO206-focused technical publishing with dyno/gear/data workflows (2025–2026 dated guides).

| Lesson | Source | Takeaway |
| --- | --- | --- |
| One rear tooth ≈ 0.05–0.06 ratio | Gear guide | Coaching “feels lazy off corner” → gearing hypothesis |
| Front vs back grid gearing | Same | Race strategy module |
| Overlay speed + RPM | Race Studio guide | Pair video with logger when available |

### Note on named LO206 “celebrity champions”
National LO206 winners vary by series/year (CKNA, SKUSA-adjacent 4-cycle classes, RAKC, local clubs). This research pass did **not** lock a single globally iconic LO206 driver-coach equivalent to Lorandi/Dove. Prefer series result pages + local club champions for region-specific inspiration; do not fabricate interviews.

---

## Common mistakes (kart-cam detectable)

Grouped for the video app. G = general karting; B = Briggs/LO206-amplified.

1. **Early turn-in / early apex** (G/B) → wide exit, late throttle (Red Bull; Lorandi; Kart-Map).
2. **Unused track width** (G/B) → permanently lower minimum speed (Lorandi).
3. **Soft brake + coast** (G/B) — especially costly with low power (PURPL #2).
4. **Snap brake release** (G) → understeer push (PURPL trail braking).
5. **Sawing steering / death grip** (G) (Red Bull; PURPL #9).
6. **Hands leaving 9-and-3** (G) (Red Bull).
7. **Looking at dash / not far enough ahead** (G) (PURPL #1; Red Bull #6).
8. **Throttle stabbing / pumping** (G/B) → rear slide, scrub, tire heat (B: cooks LO206 tire + drops RPM).
9. **Dive-bomb after turn-in** (G) — common LO206 complaint when packs are tight (Lorandi; r/Karting LO206 passing thread).
10. **Outside lunges without gap behind** (G) (Lorandi; PURPL #6).
11. **Pass then switchbacked** (G) (Lorandi; Redline switchback).
12. **Unnecessary hard defending mid-race** (G) (Lorandi).
13. **Living on rev limiter in restricted classes / wrong gear** (B) (Klaus #7; Swift).
14. **Cold-tire aggression lap 1** (G/B).
15. **Sliding for style** (G/B) — LO206 cannot afford momentum loss.
16. **Body thrash / bouncing** (G) → unload tires.
17. **Inconsistent braking markers** (G) (PURPL #8).
18. **Following too far to ever tow / too close and unsettled** (G) — race craft balance.

---

## Coaching rubric for video analysis app

Score each dimension **0–5** (or 0–100 scaled). Prefer **evidence clips** + one coaching cue. Change **one priority** per session (Lorandi advice).

### Dimension table

| ID | Dimension | Observable signals (kart cam) | Good cues (4–5) | Bad cues (0–2) | Briggs note |
| --- | --- | --- | --- | --- | --- |
| D1 | Track width usage | Distance to white line/kerb entry & exit | Touches/uses edges consistently | Floats inside; unused exit kerb | Critical for min speed without power |
| D2 | Turn-in timing | When wheel moves vs visual markers | Patient turn-in; late apex onto straights | Early dart to apex | Amplifies exit loss |
| D3 | Apex quality | Where kart is at max lock / closest inside | Apex supports exit; not “kerb worship” | Early apex + lift; double-steer to hit paint | |
| D4 | Exit commitment | Throttle timing vs track-out | Early progressive full throttle; uses exit | Late throttle; lifts; runs out of road | Exit RPM = race currency |
| D5 | Braking aggressiveness | Decel intensity; lock chirp rarity | Firm initial hit | Soft squeeze | |
| D6 | Brake release / trail | Continuity of deceleration into turn | Smooth bleed; no coast shelf; no snap-off | Coast; dump; double-dip | Rear-brake-only sensitivity |
| D7 | Braking consistency | Lap-to-lap brake point variance | Stacked markers | 10+ m wander | |
| D8 | Steering smoothness | Wheel motion frequency/amplitude | Minimal angle; hold; unwind | Sawing; corrections | Scrub kills LO206 |
| D9 | Hands discipline | Hand position stability | Fixed 9–3 | Sliding hands / one-hand | |
| D10 | Throttle smoothness | Pedal continuity (if visible) / exhaust note / jerk | Roll-on; holds full | Stabbing; pump | Tire + RPM |
| D11 | Rotation management | Rear step controlled vs spin | Controlled rotate then settle | Snap oversteer; mid-corner panic | |
| D12 | Vision / anticipation | Head/eye direction; late reactions | Looks to apex then exit | Target fixation on hazard; dash staring | |
| D13 | Body control | Upper body stability | Quiet, planted | Thrashing | Weight class dependent |
| D14 | Following / draft use | Gap control on straights | Closes for tow then peels for pass | Never closes; or taps bumper | Passes need tow |
| D15 | Overtake quality | Position at turn-in; exit after pass | Inside owned; exit kept; sticks | Half-alongside; outside donation; switchbacked | |
| D16 | Defense quality | Line choice under pressure | Early legal cover; exit prioritized | Weave; squeeze alongside; over-defend mid-race | |
| D17 | Race start / lap 1 | Conservatism vs chaos | Survives; gains without crash | Cold-tire lunges | |
| D18 | Consistency | Lap-to-lap visual overlay | Lines stack | Every lap reinvented | Wins mains |
| D19 | Tire management | Slide increase over stint | Smooth as tires age; adapts | Increasing opposite lock / wheelspin | May need gear chat |
| D20 | Wet adaptation | Marker shifts; kerb avoidance | Earlier brakes; off painted kerbs | Dry line in rain; kerb strikes | |

### Composite scores (suggested)
- **Qualifying Pace Index** = weighted D1–D12, D18
- **Racecraft Index** = D14–D17, D15–D16
- **Race Win Index** = Qualifying Pace + Racecraft + D19 (tire) + start

### Coaching output format (for the other bot)
1. Top 3 scored weaknesses with timestamps.
2. One primary drill (e.g., “one corner: later turn-in for 5 laps”).
3. One race-craft cue if race footage.
4. Optional setup hypothesis **tagged separately** (gearing/clutch/tire) so it is never confused with driver blame.
5. Link-out to Tier A–C sources for human reading.

### Example drill library (implementable)
- **Later turn-in drill** — pick one hairpin; delay turn-in 1 kart length; compare exit.
- **No-coast braking drill** — eliminate flat speed shelf before turn-in.
- **Trail creep drill** — deepen release 1 m per session (PURPL).
- **Hands quiet drill** — count “one” holding steering mid-corner (PURPL steering theme).
- **Reference naming** — driver must name turn-in marker for 3 corners (Lorandi).
- **Racecraft practice** — dedicate a practice session to passes/defense, not lap time (Lorandi).

---

## Home track: Mosport Karting Centre (confirmed)

**Confirmed by user:** Sep 11, 2026 — primary coaching bias = **Mosport Karting Centre** (Bowmanville / Canadian Tire Motorsport Park, ON).

### Facility / club context
- Owner/driver club racing via **MIKA** (Mosport International Karting Association); typically ~13–14 Sunday race events/year (+ specials) ([CASC MIKA](https://www.casc.on.ca/club/mika)).
- Facility site: [mosportkartingcentre.com](https://mosportkartingcentre.com/) — lists Briggs & Stratton + multiple track layouts; kart-owner rules/regs page lists MIKA / ASN / Briggs downloads (hub **404 from box** on weekly refresh Sep 28, 2026 ET — prefer Factory Ruleset PDF URL + re-check hub live).
- Also hosts / has hosted **Briggs & Stratton Challenge Ontario (BSC Ontario)** events (CKN, Jun 2026 coverage).

### Circuit characteristics (coaching-relevant)
- ~**1.5 km**, ~**12-turn** permanent outdoor circuit with elevation changes and multiple configurations ([Kart Directory](https://kartdirectory.racing/ca/circuit/mosport-karting-centre/); CTMP karting page).
- Named feature: **Ron Fellows Bowl** (historically corner naming; renovated area commonly referenced as **turns 9/10**) — flowing bowl / linked corners after a tighter mid-section (CKN renovation coverage; historic naming).
- Classic challenge called out in renovation coverage: **tight Turn 5 hairpin** — late apex / exit RPM especially important on LO206.
- Coaching bias for video analysis at Mosport:
  - Prioritize **exit commitment (D4)** and **turn-in patience (D2)** on hairpin / slow-in corners (T5-type).
  - Score **steering smoothness (D8)** and **trail release (D6)** through linked / bowl sections (scrub costs more with elevation + low power).
  - Race footage: draft use (D14) on longer pulls; overtake quality (D15) into hairpins where inside ownership matters.

### Briggs classes observed at MIKA (2026 results samples)
Public 2026 MIKA result grids at Mosport include (non-exhaustive): **LO206 Cadet, Junior Lite, Junior, Senior, Senior Lite/Light, Senior Heavy, Masters** (and combined Briggs Sr Heavy/Sr Light grids). Exact weights/tires = **MIKA 2026 Class Structure V1** (fetched Oct 5, 2026 ET — see “MIKA 2026 series rules” below). Engine slide/lock/clutch = **Briggs 206 Factory Ruleset v2026.1.1**. App should link the live Mosport rules page when available plus the Factory Ruleset PDF.

### Official docs to prefer for Mosport users
1. Mosport rules page (new site): https://www.mosportkartingcentre.com/rules-regulations — fetched OK Oct 5, 2026 ET and links all MIKA/ASN/Briggs PDFs. Legacy URL `mosportkartingcentre.com/private-karting/for-members/rules-and-regulations/` still **404** from box.
2. **Briggs 206 Factory Ruleset v2026.1.1** (unified US/Canada; replaces separate “Canadian Rule Set” naming for engine tech): https://www.briggsracing.com/sites/default/files/2026-01/Briggs%202026%20206%20Rules_Final.pdf — also mirrored on ASN hub and Goodwood.
3. 2026 MIKA Supplemental Regulations (Apr 19) + Class Structure V1 + Bulletin 2026-03 — fetched Oct 5, 2026 ET; local copies in `/workspace/briggs-coach-api/`. 2026 schedule v1.5: [PDF](https://cdn.prod.website-files.com/69c7debe960b525c3df152f9/6a027adb1d8d1519117e58d4_MIKA_2026_Race_Schedule_v1.5.pdf) (local `/workspace/briggs-coach-api/MIKA_2026_Race_Schedule_v1.5.pdf`).
4. Track map PDF linked under Forms & Waivers (“Mosport Track Map”)
5. BSC Ontario series site: https://bscontario.com/ — championship context (prizing/weekends); still prefer CKN + club bulletins for sporting detail.

### Still needed from user
- Exact **class** (e.g. LO206 Senior vs Masters vs Sr Heavy/Light)
- Whether they race **MIKA club**, **BSC Ontario**, both, or practice-only

---

## Confirmed class: LO206 Junior Light (Mosport / MIKA)

**Confirmed by user:** Oct 5, 2026 — Mathieu switched default class to **LO206 Junior Light** (driver Gabriel, age 11). Prior Sep 11 confirmation was LO206 Junior (yellow) — kept below as reference only.

### Spec notes (Briggs 206 Factory Ruleset v2026.1.1 + MIKA 2026 Class Structure V1)
From **Briggs 206 Factory Ruleset v2026.1.1** class chart:
- **Blue slide** Briggs Part **#555734**, max opening **.520”** (Junior Light)
- **Carb lock** required (locking cap Part **#555726**) for Kid Kart / Cadet / Junior Light / Junior
- Exhaust for non-Kid Kart classes: RLV **EXF5520** (formerly 5506), **EXF5507**, or **EXF5511**
- Slide optimization allowed only by removing material from the highlighted throttle-cap area; multiple gaskets / machining the slide prohibited; do not exceed No-Go — Briggs cautions ~0.1 hp for an extra .010” opening vs DQ risk
- **Ignition Max RPM 6,150** (Factory §34 green ignition) applies to **all classes except Kid Kart** — it is **not** a Junior Light-specific limiter
- **Canadian Eligibility:** Maple Leaf embossed stamp **no longer required**

**MIKA 2026 Class Structure V1 row — BRIGGS JR LITE** (fetched Oct 5, 2026 ET; local `/workspace/briggs-coach-api/2026-MIKA-Class-Structure-V1.pdf`):
| Field | Value |
| --- | --- |
| Class label | **BRIGGS JR LITE** |
| Weight | **265 lbs** |
| Age | **8–14 (*15)** |
| Engine | **LO206/BLUE** |
| Dry tires | **VEGA BLUE 4.6/6.5** |
| License | **B – B+** |
| Race numbers | **102 – 199** |

Wet tires (Supp Regs 25.1, all Briggs classes): **VEGA W6**, **4.60 fronts / 6.50 rears**. PSI **unpublished** — do not invent.

**Ontario parallel (TRAK 2026):** BRIGGS JUNIOR LITE — **265 lbs**, ages **11–15**, **LO206 BLUE SLIDE**, VEGA BLUE ONT 4.6/6.5 (TRAK PDF; MIKA is Mosport authority).

### Reference — prior class LO206 Junior (yellow .570)
Kept for comparison / if Gabriel moves up. Factory: yellow slide **#555741** .570″. MIKA JUNIOR row: **300 lbs**, LO206/YELLOW, VEGA BLUE 4.6/6.5, B–B+, numbers **202–299**, ages 8–14 (*15).

### Coaching overlays vs Senior/Masters (and vs yellow Junior)
- Blue **.520** is **more restricted** than yellow **.570** — less power; **Klaus #7 applies even harder**: gear for the restricted-slide power-band peak (comes **earlier** than yellow), **not** the 6,150 ignition-max ego.
- **Open gap:** blue-slide dyno peak RPM — **do not invent**; confirm via dyno/slide chart before hard RPM targets.
- Even more emphasis on **exit RPM (D4)**, **late apex (D2/D3)**, **no scrub (D8)**, **consistency (D18)**.
- Youth racecraft: inside ownership (D15), selective defense (D16), lap-1 survival (D17), clean passes.
- Setup hypotheses: `restricted_slide_gearing` for **blue** slide; avoid Senior stock-slide and yellow-Junior peak assumptions.

### App defaults to set
- `default_class_assumption` = `LO206 Junior Light @ Mosport / MIKA`
- Prefer: `restricted_slide_gearing`, `gear_plus_one` / `gear_minus_one`
- Rubric `schema_version` **1.10** (`changelog_1_10`); MIKA docs from concurrent refresh remain under `changelog_1_9`
- Sources: Factory Ruleset v2026.1.1 + MIKA Class Structure V1 + Supp Regs / Bulletin 2026-03

---

## MIKA 2026 series rules that change coaching (added Oct 5, 2026 ET)

Sources: 2026 MIKA Supplemental Regulations (updated Apr 19, 2026), MIKA Bulletin 2026-03 Contact Penalties (effective Apr 26, 2026), 2026 MIKA Class Structure V1, MIKA 2026 schedule v1.5. All local copies in `/workspace/briggs-coach-api/`.

- **Contact position penalties (Bulletin 2026-03):** on top of ASN 1-15 penalties (warning, 5 s minimum, black flag, last place, rear of grid next race, DQ), officials may place the offender **behind every driver who lost positions** from the contact, weighing positional loss, severity/avoidability, and circumstances. **Coaching:** a contact pass is a bad pass even if it “sticks” on track (D15); late blocks that cause contact carry the same risk (D16); lap-1 pack contact can cost more than it gains (D17).
- **Push-back bumper (Supp Regs §15):** MIKA softened one-side-in to a warning **only for Briggs Senior/Masters**. **Quote:** “Cadet, Junior and all 2 stroke classes will follow the ASN regulations on the push back bumper” (1 side / both sides = **5 s**). Junior Light / JR LITE is **not named** in that sentence (eligible-class list does include Briggs Junior Light; not in Senior/Masters warning exception). **Coaching default:** treat Junior Light as ASN 5 s like Junior; never suggest bump-draft (D14).
- **Wet tires (Supp Regs 25.1):** all Briggs classes run **VEGA W6** in the wet, **4.60 fronts / 6.50 rears** (Cadet 4.60 all round). Relevant to D20 wet sessions.
- **Spec fuel:** all Briggs classes buy a **91-octane spec fuel voucher**; jug and kart must be empty and dry before filling.
- **Points:** 5 bonus points for pole in timed qualifying; Briggs drivers drop their worst **3** finishes; black flag in the Final or post-tech DQ = 0 points and **cannot** be dropped; must qualify and start the Prefinal/Heat to race the Final; rookies start at the back for their first 2 races.
- **Clutch:** MIKA relaxes Factory rule 36(a) for **Cadet only** — Junior Light / Junior follow Factory Ruleset §36 fully (Hilliard Inferno Flame still approved).
- **Tire pressure:** MIKA documents publish **no** cold/hot PSI — keep methodology-only.
- **Remaining 2026 MIKA dates (schedule v1.5, “subject to change”):** Race #14 **Sat Oct 10** at Mosport, National Track CCW; MIKA Enduro (non-points) **Sun Oct 11**, National CCW; Awards Banquet Nov 21 at CTMP.

---

## Competition focus: MIKA now → BSC Ontario wins

**Confirmed by user:** Sep 11, 2026
- **Near-term:** MIKA club racing at Mosport (weekly seat time, points, habits)
- **Ultimate objective:** **Win Briggs & Stratton Challenge Ontario (BSC Ontario)** races in LO206 Junior Light

### What BSC Ontario is (2026 inaugural context)
- Provincial Briggs-focused championship presented by REV Performance Materials; debuted alongside major weekends (e.g. RMC Ontario at Mosport) ([CKN opener coverage](https://www.canadiankartingnews.com/bsc-ontario-set-to-debut-this-weekend-at-mosport/)).
- Typical event shape (Round 1 Mosport): **two complete race days** (Sat + Sun), each with practice, qualifying, pre-final, final. Drivers may do one or both days; both maximizes points/track time.
- ASN National Licence **not required** for BSC Ontario (accessibility noted by CKN).
- Mosport BSC weekends can **double as MIKA** for many Briggs categories (eligible classes get free MIKA drop; points from avg of Sat/Sun finals) — Junior Light should verify current eligibility bulletin.
- 2026 calendar signals (CKN): Mosport R1 → **Toronto Motorsports Park** (Jul 17–19) → **Hamilton Karting Complex** (Aug 7–9 finale). Coach must eventually generalize beyond Mosport, but Mosport remains home practice base.
- Opener notes: Briggs Junior field ~15 with close finishes both days — **racecraft + consistency** decide, not just one flyer ([CKN opener recap](https://www.canadiankartingnews.com/strong-turnout-and-thrilling-racing-highlight-bsc-ontario-opener/)).

### Coaching product implications
1. **MIKA sessions = training ground.** Score practice/club races for the BSC skill stack: qualifying pace (D1–D12, D18), start/lap1 (D17), draft/pass/defense (D14–D16), tire management over longer finals (D19).
2. **BSC win profile for Junior Light:** one-lap speed for grid + multi-day stamina + high-% passes in 10–20 car packs + no mid-race over-defense that drops RPM/exit.
3. **Away rounds:** TMP + Hamilton will need track packs later; until then teach transferable cues (late apex onto straights, exit RPM, inside ownership) using Mosport footage.
4. **Series vs club:** App reports can tag `series: mika | bsc_ontario` and weight racecraft higher for BSC race uploads.
5. Do **not** confuse with Ontario Inter-Club Challenge (separate Briggs inter-club series: Goodwood / Mosport / Hamilton) — related ecosystem, different program ([inter-club.ca](https://inter-club.ca/)).

---

## Product north star: continuous improvement AI coach

**Confirmed by user:** Sep 11, 2026 — build an **AI coach** used **after every practice and race** to aim for **excellence** via **continuous improvement** (MIKA reps → BSC Ontario wins in LO206 Junior Light @ Mosport).

### Operating loop (for the app + this KB)
1. **Upload** onboard kart-cam (practice or race).
2. **Score** all 20 rubric dimensions with timestamped evidence.
3. **One primary drill** only (don’t spray advice).
4. **Separate setup hypotheses** (never mix with driver blame).
5. **Compare to prior sessions** — trend the weak dims; celebrate closed gaps.
6. **Next session goal** = last primary drill until it scores ≥4, then advance.

### Excellence definition (LO206 Junior Light / BSC-oriented)
- Qualifying: stacked lines, late apex onto straights, exit RPM in band.
- Race: clean lap-1, high-% inside passes, selective defense, tire that lasts the final.
- Season: MIKA footage shows measurable dim gains that transfer to BSC multi-day weekends.

### What “continuous improvement” changes in coaching copy
- Prefer “vs your last session” language over absolute scolding.
- Cap feedback: top 3 weaknesses + 1 drill + optional racecraft cue.
- Keep a running **priority queue** of dimensions below target.
- BSC race uploads may weight racecraft higher; practice uploads bias lap craft.

---

## Clutch health: Hilliard Inferno Flame (LO206) — RPM + speed

**Source (user-provided, 25 Sep 2026):** `/workspace/briggs-coach-api/hilliard-inferno-flame-clutch-guide.pdf`  
**Machine pack for N10 Health:** `/workspace/briggs-coach-api/clutch-health-diagnostic-v1.json`  
**App rule:** clutch findings are always **`setup`-tagged**, never driver blame. Confirm cover name + **bronze bushing vs needle bearing** before lube advice (rules differ).

### Model & goal
- Four-shoe **centrifugal** clutch (Hilliard Inferno Flame assumed when “Hillier/Hilliard” is named).
- Free at idle → predictable **initial contact** → short controlled slip → **prompt lock**. Goal is not zero slip; long slip = heat.

### Baseline (Hilliard starting tune)
- Four **leading** shoes; **2 white + 2 black** springs opposite matching colors; no optional weights.
- Suggested **initial contact ~3,400 rpm** (first touch, **not** full lock-up).
- Spring-only approx. initial contact (four same color): Black 3800 · White 2800 · Yellow 2300 · Orange 1900 · Red 1400 · Green 1200.

### How to read early vs late slip with MyChron (RPM + speed together)

| Signature | RPM | Speed | Meaning | First setup move (after mechanical OK) |
| --- | --- | --- | --- | --- |
| **Late / long slip** | Flares / climbs hard | Lags / rises slowly | Clutch slipping under load → heat | Cool → clean/decontaminate → weaker springs **or** add balanced weights; leading shoes |
| **Early bite** | Drops sharply as it grabs; or contact below target | Still low / boggy launch | Engaging too soon for available torque | Stronger springs; remove balanced weights; verify idle & freewheel |
| **Incomplete lock** | Stays high after road speed catches up | Has caught up | Not locking — stop | Full inspection before next run |
| **Not clutch slip** | Stays **low** | Poor acceleration | Engine/throttle, brake drag, gearing, load | Diagnose those **before** clutch tune |

**Tuning direction cheat:** heavier/stronger springs = **later** engagement; lighter/weaker = **earlier**. More shoe weight ≈ **100–200 rpm earlier** contact + more capacity (identical on opposite shoes). Leading = sharper/less slip; trailing = softer/more slip.

**Change order:** mechanical fault → contamination/wear → gearing/load → springs/weights/orientation.

### Stop-now (Health UI red)
Drives at idle / won’t release · cracked drum · broken spring · missing retainer · loose bolt · blue/purple smoked drum · seized/gritty bearing.

### N10 Health UI requirements
1. Always plot/compare **RPM vs speed** on launches and slow-corner exits.  
2. Emit `clutch_late_slip_flare` or `clutch_early_bite` setup hypotheses — never “driver not aggressive enough.”  
3. Shop checklist: 4–6 plain lines in `clutch-health-diagnostic-v1.json` → `shop_checklist_plain`.

---


---

## Trackside tuning from MyChron session data

**Purpose:** Feed a future expert **tuning bot** that ingests AiM MyChron **`.xrk` / `.xrz`** (and related Race Studio exports) and emits **setup-tagged** directions — never driver blame mixed into setup.  
**Product rules (hard):** (1) every setup hypothesis tagged `setup`; (2) **one change at a time**; (3) LO206 Junior Light = **blue .520″ slide #555734** → gear for **restricted power band** (earlier than yellow; Klaus #7 even harder); **blue dyno peak RPM = open gap** — do not invent.  
**Machine pack:** `/workspace/briggs-coach-api/trackside-tuning-from-xrk-v1.json`  
**1-page brief:** `/workspace/briggs-coach-api/trackside-tuning-exec.md`  
**Related:** clutch Health pack `clutch-health-diagnostic-v1.json` (RPM+speed); N10 already MyChron-first.

### File formats (AiM)

| Ext | Role | Source |
| --- | --- | --- |
| **`.xrk`** | Native logged session from MyChron5/6-class devices (channels + laps) | [AiM File Types PDF](https://www.aimsports.com/webinars/Documents/AiM_FileTypes.pdf) |
| **`.xrz`** | Compressed wrapper; contains one `.xrk` (faster USB transfer) | Same |
| **CSV / Race Studio export** | Human/bot-friendly channel tables after RS3 analysis | Race Studio 3 workflow |
| **`.drk` / legacy** | Older RS2 ecosystem; prefer `.xrk/.xrz` for N10 | Same PDF |

N10 observed ingest today: **`.xrz`**. Tuning bot should accept `.xrk`, `.xrz`, and RS3 CSV when present.

### Channels that matter for LO206 (priority order)

Attributed to Swift Karting “Most Important AiM Channels” (Nov 24, 2025): [swiftkarting.com/blogs/news/most-important-aim-channels-lo206](https://swiftkarting.com/blogs/news/most-important-aim-channels-lo206)

| Priority | Channel | Why for tuning bot |
| --- | --- | --- |
| 1 | **Engine RPM** | Peak on longest straight; exit RPM after key corners; draft bumps; lazy pull if geared tall |
| 2 | **Wheel speed** (rear axle or front wheel) | Better than GPS for acceleration / gear math / clutch slip detection |
| 3 | **GPS speed** | Fallback if no wheel-speed sensor; smoother/less precise on hard accel |
| 4 | **CHT / water-style temp** (as logged) | Draft heat, bind/load, lean/float starve signals (pair with feel + Klaus) |
| 5 | **Longitudinal accel (G)** | Filter “on power” segments for RPM histograms / pull quality |
| 6 | **Brake / throttle** (if present) | Separate timid throttle / early brake from gearing |
| 7 | **Infrared tire temps** (optional upgrade) | Pressure / balance confirmation — not required for v1 bot |

**Always pair RPM + speed** (never RPM alone) for clutch and gearing calls — same rule as Hilliard Health pack.

### Qualitative power-band bands (sourced; Junior Light overlay)

| Band | Unrestricted / “stock slide” LO206 (Swift) | Junior Light blue .520″ (Klaus overlay) |
| --- | --- | --- |
| Usable power band cited for gearing | **~5,800–6,100 RPM** ([Swift gear guide](https://swiftkarting.com/pages/lo206-gear-ratio-tuning-guide)) — **stock-slide context** | **Do not treat 6,150 ignition max as the target.** Restricted slides peak **earlier**; blue .520 is **more restricted than yellow .570**, so peak comes earlier still. Klaus example: unrestricted peak HP ~5,600; **Green** slide peak ~4,800 — gearing past ~5,300 can be slower ([Klaus PDF #7](https://www.briggsracing.com/sites/default/files/2022-08/16commonmistakes.pdf)). **Blue .520 dyno peak RPM = OPEN GAP** — confirm dyno/slide chart; until then prefer **exit RPM in the strong mid-band** over “kiss the limiter.” |
| Ignition max (Factory §34) | **6,150 RPM** all non-Kid Kart classes | Same 6,150 — **not** Junior Light-specific |


### Signal → tune action table (setup-tagged)

Use this as the bot’s decision spine. Every row emits `tag: setup` (or `tag: driving` only when RPM band is healthy and speed is the problem — and still **do not blame**; coach a drill).

| ID | Session feature (from .xrk) | Primary hypothesis | One-change action | Sources |
| --- | --- | --- | --- | --- |
| **S1** | Exit RPM **below** usable band on slow corners **and** min corner speed is already competitive vs reference | Gearing **too tall** (long) | `gear_plus_one` — add **1** rear tooth | Swift Race Studio + gear guide; PURPL RPM article |
| **S2** | Exit RPM **in band** but min corner / exit **speed** low vs reference | Line / confidence / balance — **not** first a shorter gear | Driving drill (later apex / width) **or** chassis balance template; **do not** stack gear+chassis same run | Swift: “If rpm is fine but speed is low → driving/line/balance” |
| **S3** | Peak RPM **flat on limiter early** on longest straight (solo, not only in draft) | Gearing **too short** | `gear_minus_one` — remove **1** rear tooth | Swift; PURPL; Harris RPM guide pattern |
| **S4** | Peak RPM **never approaches** band top / soft pull all straight | Gearing too tall **or** drag (brake, chain, bind) | First rule out drag (Klaus #12); then `gear_plus_one` | Klaus #12; Swift |
| **S5** | **Junior-specific:** living on **6,100** mid-straight while exits feel lazy / peak after restrictor peak | Gear for **restricted-slide peak**, not limiter | `restricted_slide_gearing` — lengthen enough to leave limiter ego; re-check exit floors | Klaus #7 |
| **S6** | RPM **flares** while **speed lags** on launch or hairpin exit (divergence) | Clutch **late / long slip** | Cool → inspect → weaker springs / add balanced weights (see clutch Health pack) | Hilliard guide + clutch JSON; PURPL slip |
| **S7** | RPM **drops sharply** as clutch grabs; boggy launch; contact below target | Clutch **early bite** | Stronger springs / remove weights; verify idle & freewheel | Clutch Health pack |
| **S8** | After speed catches up, RPM **stays high** / keeps flaring | **Incomplete lock** — stop | Full clutch inspection before next run | Clutch Health pack |
| **S9** | RPM **stays low** + poor accel (**no** flare) | Power / throttle / brake drag / gear / load — **not** classic slip | Diagnose those before clutch springs | Clutch Health “power_or_drag_not_clutch” |
| **S10** | Water/CHT **elevated** + top-end soft / sluggish; or bog on tip-in | Carb **float** / fuel starve / wrong oil side-effects / exhaust wrap heat (high level) | Verify float per Briggs carb guide; **no invented jet recipes** (class locks jets) | Klaus #1, #2, #5 |
| **S11** | Lap times fall **3–5 tenths**; slide on tight exits; exit RPM drifting out of band as stint ages | Tire wear / glaze → ratio behaves “too long” | `gear_plus_one` for next race segment **or** tire-pressure check if hot PSI overshot | Swift gear scenarios |
| **S12** | Hot PSI **above** compound window late; kart feels “on ice” / greasy | Tire pressure **too high hot** | Lower next **cold** start (methodology below); bleed hot toward target between sessions if needed | [Swift tire pressure guide](https://swiftkarting.com/pages/lo206-tire-pressure-guide-hot-vs-cold-growth) |
| **S13** | Hot PSI **below** window; kart heavy / won’t rotate / drags exit | Tire pressure **too low hot** | Raise next cold start slightly | Swift tire guide |
| **S14** | Min corner speed **inconsistent** lap-to-lap while RPM peaks stable | Grip / pressure / line consistency | Prefer `tire_pressure_session` or D18 consistency drill — **one** lever | Swift + rubric D18 |
| **S15** | Push / understeer entry–mid (speed stays high, driver can’t rotate; video or notes) | Chassis: more front “jack” / load | Widen **front** track a spacer step **or** more caster (manufacturer chart) — one change | CRG setup guide patterns; ANGRI track-width notes |
| **S16** | Snap oversteer / rear step on entry or power | Chassis: too much rear grip / unload | Narrow **rear** slightly **or** seat/ballast toward stability — one change | Same chassis literature |
| **S17** | Delta vs reference: biggest loss on **exit** of hairpin (Mosport T5-type) with low exit RPM | Gear **or** early apex (split with S1/S2) | If RPM low → S1; if RPM OK → later turn-in drill | Mosport overlay + Swift overlay method |
| **S18** | Same numerical ratio but pair choice (e.g. 17/68 vs 19/76) | Rotating inertia | Bigger pair = smoother flowing; smaller = snappier tight tracks | Swift gear guide §5 |

### Gearing (trackside protocol)

1. Log **peak RPM** end of longest straight + **exit RPM** at 1–2 slowest corners every session (PURPL 10-minute routine; Swift).  
2. Write peak next to sprocket on the setup sheet.  
3. Change **one tooth** at the rear; re-run; compare reference lap.  
4. Grid strategy (Swift): front row → often **−1** (longer) for top speed/tire; mid/back → **+1–2** for early passes.  
5. Tire growth / heat changes effective rollout — use Swift tire-circumference tools when ambient/track temp swings ([resources](https://swiftkarting.com/pages/lo206-resources-downloads)).

### Clutch (pointer)

Full diagnostic lives in **Clutch health** section above + `clutch-health-diagnostic-v1.json`. Tuning bot must call that pack for S6–S9 and keep findings `setup`-tagged.

### Tires / pressure methodology (no fake Mosport PSI)

**MIKA tire (confirmed Oct 5, 2026 ET):** Briggs Junior dry = **VEGA BLUE 4.6/6.5**; wet = **VEGA W6** 4.60/6.50 (2026 MIKA Class Structure + Supp Regs 25.1). **No series-published PSI** — do **not** invent Mosport Junior cold/hot numbers. BSC Ontario tire still to confirm from series docs.

**Published methodology (Swift LO206 tire guide, Feb 2026):** [swiftkarting.com/pages/lo206-tire-pressure-guide-hot-vs-cold-growth](https://swiftkarting.com/pages/lo206-tire-pressure-guide-hot-vs-cold-growth)

- Cold PSI = starting guess; **hot PSI is the goal**.  
- Typical growth on sprint tracks: ~**2–4 PSI** (can exceed **5** hot/abrasive/aggressive; minimal in wet/cold).  
- Measure **hot immediately** on pit-in (not 5 minutes later).  
- Illustrative only (Swift): many hard-compound kart tires often operate ~**14–18 PSI hot** — **confirm your series tire**. Kinetic Karting MG Red notes (US paddock) target ~13–14 hot — **not** authority for Mosport unless MIKA specs MG Red.  
- Vega manufacturer guidance (TKART): work inside maker’s **hot window**; prefer lower end of window for wear when safe ([TKART Vega](https://tkart.it/en/magazine/expert-advice/tire-management-track-experts)).  
- Aggressive sliding drivers need **lower cold starts** to hit the same hot target.

**Bot output template:** `Confirm series tire → set consistent cold baseline → log hot within ~60s → adjust cold ±0.5–1.0 PSI next run → one change only.`

### Chassis balance cues (honest / attributable)

Kart chassis response is brand-specific; use **directions**, not absolute Mosport widths, unless measured on MathG’s chassis.

| Symptom | Common first lever | Cited pattern |
| --- | --- | --- |
| Understeer / push | **Widen front** track (more scrub/jack → help unload inside rear) | CRG setup guide; ANGRI |
| Too much front bite / bind | Narrow front or reduce caster | Same |
| Loose rear / snap | **Narrow rear** slightly or soften rear grip path; check pressures | Same |
| Won’t rotate / heavy | Seat forward / slightly more front %; check pressures too low | Swift scaling guide: ~42–44% front common LO206 start |
| Exit traction loss (LO206-critical) | Protect rear %; don’t add large front ballast casually | KartBalance LO206 weight notes |

CRG baseline example (general kart, **not** Mosport-spec): front width ~45.5–46″; rear near legal max; caster/camber II/II start; weight ~43/57 ([CRG setup PDF via NHKA](https://nhka.net/wp-content/uploads/2018/02/crg-setup-guide.pdf)). **Junior legal rear width may be narrower than Senior** — check MIKA/ASN tech.

**Klaus #12:** when “engine won’t pull,” systematically check chassis bind, kerb strike → mount shift, toe, bent axle, rubbered track bind — **before** engine blame.

### Carb / float (high level only — legal)

- Float height critical after shipping; too much fuel → bog/sluggish; too little → **heat up** + top-end starve (Klaus #1).  
- Official Briggs carburetor tuning guide on 206 docs; Canadian LO206 Junior typically **locks jets** + yellow slide + carb lock — **no illegal jet changes**.  
- Tuning bot may suggest: verify float, idle mixture screw (air bleed) per Briggs guide, clean filter — never invent main-jet sizes.

### Change-one-variable protocol

1. Pick **one** setup ID (S1–S18) from largest delta loss.  
2. Apply **one** physical change (one tooth **or** one pressure step **or** one spacer **or** one clutch spring step).  
3. Keep driving cues as **separate** optional drill if S2.  
4. Re-log same reference corner; compare RPM+speed+delta.  
5. Only then queue the next change.  
Matches Swift Race Studio step 5 (“one or two specific goals”) and rubric `change_one_priority_per_session`.

### Junior Light / Mosport overlays

- Class: **LO206 Junior Light** (MIKA **JR LITE**), blue slide **.520″** (#555734), carb lock #555726; MIKA min weight **265 lb**, VEGA BLUE 4.6/6.5, numbers 102–199 (2026 MIKA Class Structure V1). Ignition max **6,150** is all-classes-except-Kid-Kart, not JL-specific.  
- Engine rules: [Briggs 206 Factory Ruleset v2026.1.1 PDF](https://www.briggsracing.com/sites/default/files/2026-01/Briggs%202026%20206%20Rules_Final.pdf). Mosport rules page: [rules-regulations](https://www.mosportkartingcentre.com/rules-regulations) (new site; legacy hub URL 404).  
- Track: hairpin / T5-type → prioritize **exit RPM + min speed** (S1/S2/S17). Bowl / linked → scrub & consistency.  
- Series path: MIKA reps → BSC Ontario multi-day — prefer tire-saving longer ratios for long finals when peaks still within ~100 RPM of clean limit (Swift), **Junior Light-adjusted** (blue more restricted than yellow).

### Canadian / Briggs rule posture (high level)

- Sealed engine, stock jets philosophy, approved clutch list, no illegal mods.  
- Engine tech authority for 2026: **Briggs 206 Factory Ruleset v2026.1.1** (unified US/Canada). ASN + Mosport may still label downloads “Canadian Rule Set” — same PDF family; prefer the Factory Ruleset URL above.  
- Approved clutches in Factory Ruleset §36 include **Inferno Racing by Hilliard: Fire, Flame, Blaze or Fury** (matches N10 Hilliard Inferno Flame Health pack).  
- Point users to Factory Ruleset + **MIKA supplements** for weights/tires/slides — bot must not invent legal parts or Mosport numbers.  
- ASN Canada karting regs hub: [asncanada.ca/karting-regulations](https://www.asncanada.ca/karting-regulations).

### Open gaps (do not fabricate)

1. ~~MIKA 2026 Junior Light (JR LITE) min weight / tires / numbers~~ — **closed Oct 5, 2026 ET:** **265 lb**, LO206/BLUE, VEGA BLUE 4.6/6.5, numbers 102–199 (MIKA Class Structure V1). Wet VEGA W6 per Supp Regs 25.1.  
2. Cold/hot **PSI** remains **unpublished** by MIKA — methodology only; need driver’s measured baseline.  
3. **Blue .520 dyno peak RPM** for this engine build — **confirm dyno/slide chart; do not invent.**  
4. MathG’s measured **baseline sprocket**, front/rear width, seat holes, clutch spring set.  
5. Whether N10 session always includes **wheel speed** vs GPS-only.  
6. Away-track packs (TMP, Hamilton) / BSC 2027 tire-weight docs.  
7. Supp Regs §15 bumper sentence names “Cadet, Junior” only — Junior Light not verbatim; coaching treats as ASN 5 s pending organizer clarification if needed.  


## Gaps / what needs user confirmation

1. **Exact meaning of “Briggs Karting” for this user** — **Resolved:** LO206 Junior Light at Mosport Karting Centre (MIKA).
2. **Home track and series** — **Mosport / MIKA (near-term).** **Ultimate: win BSC Ontario (LO206 Junior Light).** Still optional: Inter-Club Challenge interest.
3. **Class & weight** — **Class confirmed LO206 Junior Light (blue .520” slide #555734) by Mathieu Oct 5, 2026.** MIKA JR LITE min weight **265 lb** (Class Structure V1). Prior yellow Junior 300 lb retained as reference.
4. **Tire brand/compound** — **MIKA confirmed VEGA BLUE 4.6/6.5 (wet VEGA W6)**; PSI not published (driver baseline needed).
5. **Clutch brand allowed** — Factory Ruleset lists Hilliard Inferno Flame among legal options; MIKA Supp Regs add no Junior clutch limits (only a Cadet 36(a) relaxation).
6. **Chain pitch** — #35 vs #219 adapter rules by sanctioning body.
7. **Whether Animal (open/builder) is in scope** — driving similar but power/RPM/fuel differ; do not mix tech notes blindly.
8. **Champion interviews** — region-specific LO206 champions’ tip videos not fully catalogued; needs a second pass once series is known.
9. **Exact YouTube attributions** — some popular video URLs were aggregator-confirmed; channel ownership should be re-checked before the app cites “Driver61 says…” on-screen.
10. **Paywalls** — Terence Dove best analyses are often on Substack (some paid); Senndit programs may be gated; Briggs PDFs were freely fetchable in this pass.
11. **Onboard camera angle standards** — app accuracy depends on forward + hands/pedals visibility; recommend mounting guidance as a product requirement.

---

## Quick “general vs Briggs-specific” cheat sheet

| Topic | General karting truth | Briggs/LO206-specific |
| --- | --- | --- |
| Line & late apex | Universal | Even more decisive (low power) |
| Trail braking | Universal with kart caveats | Same; protect rear on release |
| Overtaking | Inside ownership, patience | Draft + exit; fewer power passes |
| Defending | Selective | Same; slow karts punish over-defense harder |
| Gearing | N/A or different | Primary setup lever; 1 tooth matters |
| Clutch | Class-dependent | Engagement + install critical |
| Engine parity | Often not true | Core premise of LO206 |
| Tire management | Important | Ratio + smooth inputs over long mains |
| Rev limiter | Soft/hard varies | Hard 6100; don’t gear only to hit it (esp. restricted slides) |

---

*End of knowledge base. Core research Sep 11, 2026; trackside MyChron tuning pack Sep 28, 2026; weekly KB refresh Sep 28, 2026 ET (unified Factory Ruleset + TRAK class structure); weekly KB refresh Oct 5, 2026 ET (MIKA Class Structure + Supp Regs + Bulletin 2026-03).*
