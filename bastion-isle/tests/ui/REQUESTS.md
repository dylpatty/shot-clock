# UI module: requests for core and the other modules

The UI (src/ui/**, src/input.js, style.css, index.html) only talks to the game through `src/ui/bridge.js`.
main.js passes the real functions in `initUI({ sim, gfx, ... })`; anything missing falls back to a safe stand-in, so
the HUD never crashes while modules land. Please keep these exact names and return shapes.

## 1. main.js wiring (core)

```js
import { initInput, updateCamera, updatePointer, focus, snapCamera, setOrbit, CAM } from './input.js';
import { initUI, uiFrame, showMainMenu, showHUD, forceRefresh, setThumbs, setSilhouettes, UI } from './ui/index.js';

initInput(canvas, camera);                     // canvas = #view, camera = the PerspectiveCamera main renders with
initUI({
  sim: { ...gameExports, ...economyExports, ...zonesExports, ...combatExports }, // spread whole modules; unknown keys are ignored
  gfx: { setInfoView, setField, setRings, rebuildCoverage, setGhost, raidMarkers },
  camera, renderer,
  newGame: ({ seed, difficulty, sandbox }) => {...},   // start a run, then call showHUD()
  continueGame: () => {...},                            // load bastion.save.v2, then showHUD()
  toMenu: () => {...},                                  // back to the orbiting showcase, then showMainMenu(seed)
  reroll: () => newSeed,                                // new menu island; return the seed number
  applySettings: (key) => {...},                        // SETTINGS[key] changed: 'quality' -> post.build(SETTINGS.quality),
                                                        // 'renderScale', 'dayNight', 'volume', 'showFps'...
});
setThumbs(makeThumbnails(renderer, Object.keys(BUILDINGS)));      // { type: dataURL } (cards, inspector)
setSilhouettes(makeSilhouettes(renderer, Object.keys(ENEMIES)));  // { type: dataURL } (raid clock, report)
showMainMenu(seed);                            // also turns on the 0.02 rad/s camera orbit (setOrbit)

// frame, per SPEC section 7:
updateCamera(rdt); updatePointer();            // step 1
... sim, sync, render ...
uiFrame(rdt, perf.frame(rdt));                 // step 6; perfText (HTML) is shown only while F3 is on
```

- When a run starts call `showHUD()` (it hides menus, stops the orbit and forces a full HUD refresh). After loading
  a save, `forceRefresh()` redraws the minimap and every throttled panel on the next frame.
- The UI detects from G by itself: game over (`G.mode === 'over'`, reason in `G.overReason = 'hq' | 'bankrupt'`),
  victory (`G.victory` turning true), raid start (`G.wave.state` prep -> active: critical banner, auto-pause option),
  the raid report (`G.wave.report` becoming a new object), milestones (`G.milestone` increasing: advisor card).
- The HUD clock prefers `G.clockHours` (0-24, e.g. `lighting.hours()`) and falls back to `G.tod * 24`.
- `G.paused` / `G.speed` are written by the UI (Space, + / -, speed buttons, pause menu, auto-pause settings).
- `G.selected`, `G.tool` and `G.infoView` are written by the UI/input.
- `hooks.isUIBlocking()` (input.js) is true while a modal menu is open; main.js does not need to check it.
- Audio: UI sounds go through `SFX.play(name)` (src/sim/events.js) unless `initUI({ sound })` is given. Names used:
  click, open, error, build, demolish, upgrade, zone, alarm.
- Please add `autoPauseHQ: false` to SETTINGS defaults (the settings screen offers "pause when the Town Hall drops
  below 50%"; it already works with the key missing).

## 2. Sim functions the UI calls (sim-city / sim-combat)

Errors: return a short sentence string; success: null/undefined (or anything that is not a string / `{ error }`).

| name | signature | used for |
|---|---|---|
| tryPlace | (type, tile) -> err | placement tool |
| tryRoad | (tile) -> err | road tool, per tile of the A* path |
| bulldoze | (tile) -> err | bulldoze drag, inspector Demolish/Clear |
| zonePaint | (tiles[], zone 1/2/3) -> count or err | zone brush (called continuously while dragging, only new eligible tiles) |
| dezone | (tiles[]) | de-zone brush |
| upgrade | (building) -> err | inspector, tower card, U |
| sell | (building) -> err | inspector, tower card, Delete |
| setTargetMode | (building, mode 'first'/'nearest'/'strongest'/'weakest', domainPref 'any'/'sea'/'air'/'ground') | 6-way control; Shift+click applies to all of the type |
| buyResearch | (id) -> err | research sheet |
| callWaveEarly | () -> bonus $ (number) or err | Raid Clock button, N |
| landValueBreakdown | (tile) -> [{ label, value }] | tooltips, inspector, land value view |
| demandBreakdown | () -> { R: [{label, value}], C, I } | demand bar tooltips (falls back to G.demandTerms) |
| budgetBreakdown | () -> { income: [{ key, label, value }], expense: [{ key, label, value, items?: [{label, value}] }], net? } | budget sheet (falls back to G.budget.income/expense). Income keys R C I spoils; expense keys roads power water fire police health education parks military repairs. Military items by tower type are computed by the UI when absent. |
| missingRequirements | (tile) -> [{ key, label, ok }] (keys road power water fire police health school) | lot inspector checklist (UI also derives it from W.flags/W.cover and ZONES.req) |
| placeProblem | (type, tile) -> err | ghost colour, cursor chip, valid-tile outlines (called for every land tile once per tool/lot change) |
| roadProblem | (tile) -> err | road preview, A* passability |
| rebuildRuin | (tile) -> err or Building | inspector on ruins |
| rebuildAllRuins | () -> err | raid report button |
| ruinsCost | () -> $ | raid report button label (or `report.ruinsCost`) |
| saveGame / loadGame / hasSave | () -> bool | pause menu, main menu Continue |
| isUnlocked | (type) -> bool | cards (default: `BUILDINGS[type].unlock <= G.milestone`) |
| sellValue | (building) -> $ | sell buttons (default: 75% of `b.invested`, 100% within 15 s) |
| upgradeCost | (building) -> $ or null | (default: `def.upgradeCost(level)` below maxLevel) |
| weaponStats | (building) -> { dmg, range, rate, splash } | (default: `b.ws`) |
| previewUpgrade | (building) -> ['+35% damage', ...] | optional, upgrade hover |
| enemiesAlive | () -> number | raid progress (default counts `G.enemies` with alive && team !== 'A') |
| setTax | (key 'R'/'C'/'I', pct 0..25) | budget sliders (default writes G.taxes) |
| lotName | (tile) -> string | optional; the UI generates '14 Harbour Street' deterministically otherwise |

G fields read: money, netPerMin, moneyHist (1 sample/min, last 10), taxes, budget, overdraftT, negT, pop, workers, jobs
{gov,C,I}, staffing, unemployment, demand, demandTerms, power/water {supply, demand}, milestone, threat, blockade,
fires, wave { n, state 'prep'|'active', timer, current, total, queue, plan { counts, dirs, targets? }, report },
buildings (Building: id type def tile x y z level hp maxHp alive connected powered kills dmgDealt targetMode domainPref
invested upkeep born lastHit units ws radarBoost), byId, hq, enemies (type domain team alive x y z hp maxHp), research,
mod, stats, victory, hints, difficulty, raidsOff (optional, sandbox), overReason.

`wave.plan.targets` (optional): `{ type: 'power and water' }` per enemy type; otherwise the UI uses AIM_TEXT.
`wave.report` (after each raid): `{ n, kills: { type: count }, bounty, bonus, lostOwn, lostPrivate, firesStarted,
firesOut, repairBill, taxLost, ruinsCost? }`.

## 3. Ground (gfx-ground): overlay contract

- `setInfoView(rgba, style)`: `rgba` is a Uint8Array(W.count * 4) per tile (sRGB colour, A = fill alpha 0..255), or
  `null` to clear. `style` is a Uint8Array(W.count) of bit flags the shader can use for the zoning visuals and the
  colour-blind patterns (UX concrete spec 11/13):
  `1 OUTLINE` (1.5 px hex outline via fwidth, in the tile colour or white), `2 HATCH` (red diagonal hatch: no road
  access, blocked, uncovered), `4 INSET` (zone-coloured inset border 0.06u wide, 0.12u in from the edge),
  `8 SOLID / 16 HATCH45 / 24 CROSS` (R / C / I pattern), `32 PULSE` (burning tiles). The UI eases
  `U.uOverlayMix` itself; please multiply the overlay by it. The same per-tile layer carries tool previews
  (road path, zone brush, bulldoze hover, placement validity), so it is updated whenever the hovered tile changes.
- `U.uClay` (0..1, eased by the UI over ~250 ms while an info view is open) and `U.uGrid` (1 while a road, zone or
  placement tool is active) are set by the UI.
- `U.uCoverMix` is set to 1 in the Defence view and 0.5 while placing a military building. Please add
  `U.uCoverMask` (Vector3, sea/air/ground multipliers) so the Defence view can show one domain; the UI sets it when
  present.
- `rebuildCoverage(list)` is called when towers change, with `[{ x, z, r, sea, air, ground }]` (booleans).
- `setRings(list)` with `[{ x, z, r, style, color }]`, max 8: style 0 solid (selected tower, accent #3CC8D0),
  1 dashed (placement ghost, animated), 2 coverage edge (service districts in the Services view). Falls back to
  `ringSet` from uniforms.js.
- Please add `U.uSelectTile` (int tile index, -1 none) for the cyan selected-tile outline; the UI writes it when the
  uniform exists. `U.uHighlightTile` is written every frame with the hovered tile (-1 none).
- `setField` is not used yet (all views are per tile); smooth land value / pollution fields can come later.

## 4. Models (gfx-models)

- `makeThumbnails(renderer, keys)` -> `{ type: dataURL }` at about 280x184 px (card 8.75rem x 5.75rem at 2x), golden-hour
  light, transparent or sky background. The inspector uses the same image at 4.5rem square (object-fit: cover).
- `makeSilhouettes(renderer, enemyKeys)` -> `{ type: dataURL }`, orthographic side view, single hostile colour
  (#FF4D3D), transparent background, about 64x32 px.
- `setGhost(type | null, x, y, z, yaw, ok)`: a placement ghost for a building type (green-ish when ok, red when not).
  Owner can be models or core; the UI calls it every time the hovered tile changes.

## 5. Life (gfx-life)

- Optional `raidMarkers(camera)` -> `[{ sx, sy, ang, type, count, x, z }]` for off-screen chevrons (screen px of the
  edge point, angle in radians in screen space, world x/z to jump to). Without it the UI projects `G.enemies` itself.
