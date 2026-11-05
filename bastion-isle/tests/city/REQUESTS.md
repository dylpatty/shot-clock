# GFX-CITY requests for core (main.js, sim, shared gfx)

The city module only touches its own files. These are the changes it needs elsewhere.

## main.js wiring (SPEC.md section 7)
```js
import { initCity, cityOnWorldChanged, syncLots, cityOnRoadsChanged, cityFrame, lotTop, cityStats } from './gfx/city.js';
initCity(scene);                    // at startup, before warm-up (pools stay visible with count 0 so the
                                    // 4 programs compile during compileAsync + the warm-up frames)
cityOnWorldChanged();               // after generateWorld() and after loading a save (new W arrays)
// presentation sync, every frame:
const dirty = W.lotDirty.splice(0);
syncLots(dirty);                    // patches only those tiles; syncLots(null) = rebuild every lot
if (roadsChanged) cityOnRoadsChanged();
cityFrame(dt);                      // lit-window fractions + a cheap W.road/W.bld/W.ruin/W.type change scan
```
- Warm-up: for the construction / crane / burning variants nothing extra is needed: they are the same program.
- F3: `cityStats()` returns `{ draws, tris, instances, pools[], timing: { full, patch, patchTiles }, uploads }`.

## Sim (zones.js / fire.js), owner SIM-CITY
1. When construction or an upgrade starts: set `LF.BUILDING`, `W.lotT[i] = G.time`, set `W.lvl[i]` to the level
   being built, then `markLot(i)`. When it completes: clear `LF.BUILDING`, `markLot(i)`. The shader rises the
   scaffold from `W.lotT` over `GROWTH.buildTime` (new lots) or `GROWTH.levelUpRebuild` (upgrades, L2/L3) seconds of
   `U.uGameTime`, so it needs no per-frame updates. If the sim uses other durations, tell GFX-CITY (or put them in
   `GROWTH`).
2. Rubble: keep `W.zone` while `LF.RUBBLE` is set (rubble renders even with `W.lvl = 0`).
3. Fire: please `markLot(i)` only when `W.fire[i]` crosses one of 8 steps (`fire >> 5` changes), not on every tick.
   Window flicker is animated in the shader; each patch costs ~0.03 ms plus a small upload.
4. `U.uGameTime` must be `G.time` (the harness does this) so construction progress matches `W.lotT`.

## Shared uniforms (gfx/uniforms.js)
- Optional: move `CU.uCityLit` (vec3 lit-window fractions R/C/I, written by `cityFrame`) into `U` as `uCityLit`
  if another module (light map: window spill sprites) wants the same fractions.
- Night light map convention used by the city and nature shaders: `uv = (world.xz - uMapMin) / uMapSize`,
  u along +x, v along +z, rgb = linear additive irradiance. Please keep `uNightLight` on that convention.
- Cloud shadows are NOT applied on buildings/trees yet: they must match the terrain exactly. If GFX-GROUND exports
  its cloud function as a GLSL string (or core adds `src/gfx/chunks.js`), the city can multiply it into the sun
  term in one line. `CITY_GLSL` (exported from city.js) holds the city's hash/noise helpers if anyone wants them.

## GFX-GROUND
- Lot pads (hex, radius 0.975, top at `W.h + 0.014`) are drawn by the city for every built lot, construction site
  and rubble lot: lawn (R), paving (C), concrete yard (I), dirt (construction), debris (rubble). Terrain under
  lots can stay plain; please do not draw ground decals between `h + 0.005` and `h + 0.02` on lot tiles.
- Forest tiles lose their trees as soon as a road, a lot or a player building occupies them (handled here).

## GFX-LIFE
- `lotTop(i)` gives the world-space y of a lot's roof (0 when the lot shows nothing): use it to place problem icons,
  fire and smoke above zone buildings. For construction sites it returns the final height.

## world.js
- `treesFor()` is no longer used by the renderer (trees.js places its own); it can be removed once render.js is gone.
