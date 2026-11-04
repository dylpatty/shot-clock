# Bastion Isle 2 — implementation spec and module contracts

This is the binding contract for everyone working on the redesign. The full design reviews it was distilled from
are in the session scratchpad (`review-*.txt`, `DESIGN.md`); where this file is silent, follow those reviews.

User goal: a PC game that looks like a modern realistic-leaning city builder crossed with a tower defence game. Hex
tiles, island, raids by sea and air. No fantasy/magic. Graphics "as good as possible". Steady 180 fps at 3440×1440.
Runs by opening `index.html` (all assets embedded in `dist/bastion.js`). three.js 0.170.0, postprocessing 6.36.7,
n8ao 1.9.4, esbuild. Never copy any specific game's name, art or UI — genre mechanics only, our own HUD identity.

## 0. Ground rules for all modules
- **Sim code never touches three.js, the DOM or audio.** Everything under `src/sim/` plus `world.js`, `hex.js`,
  `rng.js`, `path.js`, `defs.js`, `state.js` must import cleanly in plain Node (the balance harness runs there).
  Sim → presentation goes through `src/sim/events.js` hooks (`FX`, `SFX`) and `notify()`.
- **Seeded randomness in the sim:** use `rand()` from `src/sim/events.js` (mulberry32 seeded per game), never
  `Math.random()`, so harness runs reproduce. Cosmetic code (gfx) may use `Math.random`.
- **No per-frame allocation in hot paths.** Reuse vectors/arrays. Typed arrays for per-tile data.
- **Performance budgets (High preset, 3440×1440):** main-thread JS ≤ 3 ms/frame (sim ≤ 0.5 ms time-sliced, entity
  sync ≤ 0.6, composer submit ≤ 1.2, HUD ≤ 0.3); draw calls ≤ 150 total incl. post; triangles ≤ 600k main pass;
  shader programs ≤ 50 and constant after warm-up; ≤ 256 KB/frame average buffer uploads.
- **Fixed light rig:** exactly one DirectionalLight (castShadow always true), one HemisphereLight, scene.environment.
  No Point/Spot lights ever. Never toggle anything at runtime that changes a shader program (castShadow, fog type,
  material.transparent/vertexColors/maps presence, instanceColor presence, EffectPass contents).
- **Every `onBeforeCompile` material overrides `customProgramCacheKey()` with a unique string** and takes shared
  uniforms by reference from `src/gfx/uniforms.js` (`U`).
- **Colour spaces:** albedo/canvas colour textures `SRGBColorSpace`; normal/rough/mask/splat/data textures
  `NoColorSpace`. Raw floats in vertex/instance colour buffers are linear (convert palette hex with `THREE.Color`).
- **Scale:** 1 world unit = 12 m. Hex circumradius 1, across-flats 1.732. Storey = 0.25u. Car 0.36u long.

## 1. World (`src/world.js`, owner: core)
- Map radius **R = 32** (3,169 tiles). Island land target 1,000–1,500 tiles, centred, never touching the outer 4 rings.
- Terrain types unchanged (`T.DEEP, SHALLOW, SAND, GRASS, FOREST, HILLS, MOUNTAIN`) but mountains become low craggy
  rock (height ≤ 3.5u, no snow), and grass/forest heights are quantised to few levels so most neighbours share a
  height (continuous ground). Heights: sand 0.15, grass 0.30 / 0.48, forest same as grass levels, hills 0.66–0.9,
  mountain 1.2–3.0.
- Existing arrays stay: `q r x z h type bld road conn ruin nbr lookup land coast edge landing shore center version`.
- **New per-tile lot arrays** (allocated by `generateWorld`, length `W.count`):
  | array | type | meaning |
  |---|---|---|
  | `W.zone` | Uint8 | 0 none, 1 R, 2 C, 3 I |
  | `W.lvl` | Uint8 | 0 empty lot, 1–3 building level |
  | `W.occ` | Uint8 | occupancy 0–100 % |
  | `W.lotHp` | Uint16 | current hp of the lot building |
  | `W.fire` | Uint8 | fire intensity 0–255 (= f·255) |
  | `W.prog` | Uint8 | level-up progress 0–90 |
  | `W.flags` | Uint16 | bit flags `LF.*` below |
  | `W.lv` | Uint8 | land value 0–100 |
  | `W.poll` | Uint8 | pollution 0–60 |
  | `W.cover` | Uint16 | coverage bitmask `CV.*` below |
  | `W.style` | Uint8 | random variant seed chosen at construction |
  | `W.lotT` | Float32 | G.time when the current construction/upgrade started (−1 none) |
  | `W.timer` | Float32 | scratch timer for abandonment/rubble/regrowth (seconds) |
- `LF = { POWER:1, WATER:2, ROAD:4, ABANDONED:8, BUILDING:16 (under construction), SHELTER:32, RUBBLE:64, UNDERSTAFFED:128, NO_POWER_ICON:256, NO_WATER_ICON:512, NO_ROAD_ICON:1024 }`.
- `CV = { FIRE:1, POLICE:2, HEALTH:4, SCHOOL:8, PARK:16, PLAZA:32, AA:64, NOISE1:128, NOISE2:256 }`.
- `W.lotVersion` (number) increments on any lot visual change; `W.lotDirty` (array of tile indices) lists tiles whose
  visuals changed since the renderer last consumed it (renderer clears it). Helper `markLot(i)` in `sim/core.js`.

## 2. Core sim API (`src/sim/core.js`, `src/sim/events.js`, owner: core)
- `events.js`: `FX` (object of no-op functions: `explosion(x,y,z,s,water)`, `splash(x,z,s)`, `muzzle(x,y,z,s)`,
  `flakBurst(x,y,z,s)`, `trail(x,y,z,s,dark)`, `fire(x,y,z,s)`, `smokePuff(x,y,z,s,g)`, `dust(x,y,z,s)`,
  `wake(x,z,s)`, `sparks(x,y,z)`, `shake(x,z,amount)`, `bounty(x,y,z,amount)`), `SFX.play(name,x,z)`,
  `seedRand(seed)`, `rand()`, `randRange(a,b)`. main.js wires FX/SFX to the real implementations.
- `core.js`: `markLot(i)`, `tilesWithin(i, radius, out)` (hex radius, reuse `out`), `damageTile(i, dmg, kind)`
  (kind: 'shell'|'bomb'|'rocket'|'bullet'|'fire'|'melee'; routes to a lot or to a Building; ignites per §5.6),
  `lotAt(i)` helpers, `isLot(i)` (zone>0 && lvl>0 && not rubble), `buildingAt(i)`.
- Player-built structures stay `Building` objects (class in `sim/game.js`) with new fields:
  `kind` ('hq'|'service'|'utility'|'military'|'park'), `invested` ($ for sell refund), `upkeep`, `targetMode`
  ('first'|'nearest'|'strongest'|'weakest'), `domainPref` ('any'|'sea'|'air'|'ground'), `dmgDealt`, `powered`.

## 3. Gameplay numbers (owner: sim) — adopt the systems review tables verbatim
Money start $30,000 (Relaxed 50k, Hard 20k, Sandbox 250k); overdraft to −$10,000; bankruptcy rules; Town Hall
supplies 5 MW, 5 kL, 10 residents, 5 jobs. Zoned lot table (residents/jobs, power, water, hp, pollution), workers
0.5·P with government jobs staffed first, demand formulas with EMA τ = 8 s and per-term tooltips, growth every 2 s,
level-up requirements and progress, abandonment/rubble timings, land value formula with per-term breakdown, taxes
(0–25 %, default 10 %), services table, utilities table (wind, gas plant, water tower, water pump), roads $40/tile
(+$10 hills, +$20 forest) upkeep $1.5/tile/min, towers cost/upkeep/upgrade/power/crew table, sell 75 % (100 % within
15 s), repair 20 % cost × fraction, targeting modes (re-check 0.5 s, switch only if ≥ 15 % better), waves budget with
difficulty × prominence(log2) and timings (first raid 300 s, gap 120 s Standard), bounties ×25, enemy target
priorities per type, fire ignition/spread/trucks/firebreaks/cap, milestones (Settlement / Village 300 or wave 3 /
Town 1,000 or wave 6 / City 2,500 or wave 10 / Metropolis 5,000 or wave 14) with unlock lists and cash rewards,
research list in $, budget panel lines, advisor hints, pacing targets. Defaults chosen there are binding unless a
harness run proves them wrong — then change `defs.js` and record why in a comment.
Also: blockade, sheltering, sabotage, police officers reuse marine AI, growth slows during raids, high-tech military
needs power (radar 2, missile 2, airfield 4 MW), difficulty presets + Sandbox, auto-pause options.

## 4. Rendering architecture (owner: core unless noted)
- `gfx/uniforms.js`: `U = { uTime, uNight, uDayLight, uCloudOfs, uNightLight (texture), uNightLightMin/Size,
  uOverlayTex, uOverlayMix, uOverlayMode, uClay, uRings (vec4[8]), uRingCol (vec3[8]), uRingCount, uCoverTex,
  uCoverMix, uGrid, uMapMin, uMapSize, uSplat, uShadowFade … }`. Every patched material references these objects.
- `gfx/post.js`: pipeline per rendering review §2–6 (HalfFloat, no MSAA, N8AO transparencyAware=false,
  Bloom blendFunction ADD threshold 1.0, ToneMapping NEUTRAL, hue/sat + contrast, vignette, dithering; SMAA own pass
  on Ultra/High, FXAA merged on Performance). Then **overlayScene** rendered straight to the canvas.
- `gfx/lighting.js`: LUT day/night per UX review §15 + rendering review §8 (exposure ramp 1.0→1.45, moon ≥ 0.9
  key on #9DB4FF, hemi ≥ 0.35 at night, cycle 12 min = 8 day + 1 golden + 2 night + 1 golden), shadow fit with
  texel snapping per rendering review §7, sun elevation clamped 15–62° for the shadow light.
- Sky: cheap gradient sky dome drawn last among opaques (horizon = fog colour), sun disc, stars and moon at night.
- Draw order: terrain/roads 0, buildings 1, props/trees 2, units/vehicles 3, water 5, sky 6.
- Warm-up: compileAsync + 2 full composer frames (day and night) with every pool populated off-screen; then
  snapshot `renderer.info.programs.length`; F3 shows red if it grows.
- F3 overlay per rendering review §15 (fps, p95/p99/worst, refresh estimate, CPU per phase, GPU timer queries when
  available, draws/tris/programs/uploads, preset, counts).

## 5. Module ownership for the parallel build
Each owner works ONLY in its files (plus new test files under `tests/<module>/`), builds its own test bundle into the
scratchpad (never `dist/`), and keeps to the interfaces here. Shared files (`main.js`, `state.js`, `defs.js`,
`world.js`, `sim/core.js`, `sim/events.js`, `gfx/uniforms.js`, `gfx/post.js`, `gfx/pools.js`) are owned by core;
request changes in your report instead of editing them.

### 5.1 SIM-CITY — `src/sim/economy.js zones.js utilities.js services.js fire.js milestones.js`, `tests/sim/*`
Implements §3 city half. Exposes `tickEconomy(dt)`, `tickZones(dt)`, `tickUtilities()`, `tickServices()`,
`tickFire(dt)`, `checkMilestones()`, `zonePaint(tiles, zone)`, `dezone(tiles)`, `landValueBreakdown(i)`,
`demandBreakdown()`, `budgetBreakdown()`; maintains `G.money, G.budget, G.taxes, G.demand, G.demandTerms, G.pop,
G.workers, G.jobs, G.staffing, G.unemployment, G.power, G.water, G.milestone, G.threat, G.bankrupt*, G.trucks`.
Builds the **Node balance harness** (`tests/sim/harness.mjs`) with bots: balanced, no-defence, all-military,
no-fire-station across ≥ 20 seeds, printing pacing vs the target bands.

### 5.2 SIM-COMBAT — `src/sim/combat.js` (moved from `src/combat.js`), `src/sim/game.js` (moved from `src/game.js`)
Money costs/bounties, enemy target priorities per type, `damageTile` for lots, hex-radius lookups instead of
building loops, targeting modes + domain preference, police officers, blockade/sheltering/sabotage, power needs for
radar/missile/airfield, fire ignition from explosives, wave budget with prominence, milestone-gated towers, save v2
(`bastion.save.v2`, RLE per-tile arrays), sell/repair rules. Seeded rand. Events through FX/SFX hooks.

### 5.3 GFX-CITY — `src/gfx/buildings.js trees.js`, `tests/gfx/buildings.*`
Kit-instanced lot buildings per rendering review §5 and UX review §5/§10: one unit-box body pool for all bodies,
2–3 roof pools, 3–4 rooftop prop pools, lot dressing pools (hedge, fence, planter, container, pallet), scaffold
pool + tower cranes, facade shader with procedural windows (storey 0.25u) and hashed night windows per UX §9,
abandoned/burning looks, construction rise. Fixed slot blocks per land tile so a lot change patches only its slots.
API: `initBuildings(scene)`, `syncLots(force)` (consumes `W.lotDirty`), `updateBuildings()`. Trees and rocks with
vertex wind and matching customDepthMaterial; 3 tree species; craggy rock outcrops for mountains.

### 5.4 GFX-GROUND — `src/gfx/terrain.js roads.js water.js overlay.js`
Terrain: flat hex prisms without bevel, splat map (sand/grass/rock/dirt + urban paving under lots and roads),
macro variation, cliff texturing on height steps, procedural textures generated at load (or CC0 ones if provided),
overlay system (per-hex overlay texture via flat vTile, smooth map-space fields, rings uRings, defence coverage
texture, grid lines only when a tool is active, clay mode). Roads per UX §3 (asphalt ribbon 0.52u, dashed centre,
sidewalks, curbs, junction pads, crosswalks, lamp posts) as chunked merged geometry. Water gets rings/coverage/clay.
API: `initGround(scene)`, `rebuildTerrain()`, `updateSplat()`, `rebuildRoads(dirty)`, `setInfoView(view, data)`,
`setRings(list)`, `rebuildCoverage()`, `lampPositions()` (for the night light map).

### 5.5 GFX-LIFE — `src/gfx/traffic.js lightmap.js billboards.js raidfx.js ambient.js`
Cosmetic traffic (SoA, ≤ 600 cars, count from population, lanes, headlights/tail lights), fire trucks rendered from
`G.trucks`, civilian boats, gulls, smoke stacks; night light map per rendering review §should-4; instanced billboards
(health bars, problem icons per lot/building with the priority rules, bounty floaters); raid visuals per UX §13
(spawn beacons, radar lanes, off-screen chevron data for the HUD), AA searchlights at night during raids.

### 5.6 GFX-MODELS — `src/gfx/models.js` (+ `src/gfx/uber.js`)
One uber MeshStandardMaterial with per-vertex `aPBR` (roughness, metalness, emissive mask, paint mask) used by every
procedural model; all military, enemy, ally, projectile, service, utility, park and HQ models rebuilt to the art
palette and scale table, with level visuals (L2 skirts/second barrel, L3 dish/mast), nav lights, strobes, wind
turbine rotors. Vehicle models (car, van, truck, bus, fire truck, civilian boats) — procedural or normalised CC0
from the asset research. Thumbnails/silhouettes renderer for the UI.

### 5.7 UI — `src/ui/*.js`, `style.css`
The HUD per UX review §must-1 and concrete specs 1–17: centred frame, city card, raid clock, status cluster, command
dock (civic | defence) with drawers and cards, RCI widget, inspector (zone lots + towers with targeting control),
Harbour Log feed, critical banner, hex minimap + info-view rail + legend, budget sheet (key B), settings (presets,
render scale, HUD scale/width, time of day mode, auto-pause), wave report, advisor hints, menus. Font Barlow Semi
Condensed (@fontsource, OFL) and Tabler icons (MIT) embedded. Reads `G`; calls sim/gfx APIs only.

## 6. Verification (everyone)
- Node harness for sim; headless Chromium for gfx/UI at 1720×720 (SwiftShader is too slow for 3440×1440 beyond a
  few frames). Counters: draw calls, programs constant after warm-up, uploads per frame, longtasks.
- Canonical screenshot set (UX review §15) after each milestone; luma bands day/night.
- No claims of measured fps: SwiftShader cannot measure GPU time.

## 7. Frame order and integration rules (main.js, owner: core)
```
1. input + camera            ui/input: updateCamera(rdt), updatePointer()
2. simulation (fixed ≤1/30 s substeps while playing):
     G.time += dt; tickEconomy(dt); tickZones(dt); tickUtilities(); tickServices(); tickFire(dt);
     updateCombat(dt); checkMilestones()
3. presentation sync:
     const dirty = W.lotDirty.splice(0)        // ONLY main.js clears W.lotDirty
     syncLots(dirty)  (gfx-city)   groundOnLotsChanged(dirty)  (gfx-ground)   lifeOnLotsChanged(dirty) (gfx-life)
     if roads changed: groundOnRoadsChanged(); lifeOnRoadsChanged()
     per frame: buildingsFrame(dt), groundFrame(dt), lifeFrame(dt), syncEntities() (core: towers, units, projectiles)
4. lighting.update(cycle); lighting.fitShadow(camera target, dist); post.setZoom(dist); uniforms (uTime, uGameTime)
5. lightmap.render(renderer) (gfx-life) → post.render() → overlay scene
6. uiFrame(rdt) (HUD text at 4–10 Hz)
```
- Modules never clear shared dirty state; they receive what changed as arguments.
- Modules create their meshes in `init*(scene, ...)` and only touch their own objects afterwards.
- Overlay-only things (health bars, icons, floaters, rings drawn as meshes) go into `post.overlay` (a Scene drawn
  after post-processing, depthTest off).
- Anything that needs a texture from `assets/` imports it as bytes (esbuild loaders: .hdr/.glb/.jpg/.png binary)
  and decodes it with `gfx/env.js` helpers (`hdrTexture`, `imageTexture`) or GLTFLoader.parse. Put files under
  `assets/<your-module>/` and record source + licence in `assets/credits/<your-module>.md`.
- Builds for testing: `node tests/gfx/build.mjs <entry> <scratch outdir>`; never write `dist/`; never commit.
