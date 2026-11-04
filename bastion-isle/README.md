# Bastion Isle

A 3D hex-tile island city builder with coastal defence. Lay roads, grow a town, then fortify it against
waves of gunboats, landing parties, destroyers, battleships, dive bombers, heavy bombers and strike jets.
Survive 25 waves to win, then keep going in endless mode.

Built for PC and tuned for a 3440×1440 ultrawide at a steady 180 fps: the HUD hugs the screen edges so the
centre stays clear, the camera widens horizontally on wide screens, and the whole scene draws in roughly 70
draw calls.

## Play

- **No install:** open `index.html` in Chrome, Edge or Firefox (double-clicking it works). Everything ships in
  `dist/bastion.js`; there are no other downloads.
- **On the web:** wherever this repository's site is published, the game lives at `/bastion-isle/`.
- Press **F** (or F11) for fullscreen. Progress saves itself after every wave; Continue picks it up.

## How it works

- **Roads** connect everything. A building only works if it touches a road that leads back to the Town Hall.
  Red pins float over buildings that are cut off.
- **Houses** bring residents who pay taxes, eat food and fill jobs. Farms and docks are staffed first; if there
  are fewer people than jobs, everything else runs slower, including your guns.
- **Resources:** farms (grassland) and docks (the shore) make food; lumber camps want forest beside them;
  quarries want hills or mountains; iron mines go on hills. The Market boosts taxes nearby and sells materials
  for gold.
- **Defence:** MG nests shred landing troops and small boats, coastal guns outrange ships, flak bursts bring down
  aircraft, and barracks train marines who hunt raiders. Every weapon can be upgraded twice.
- **Research** (needs a War College): damage, range, rate of fire, tougher buildings, plus Radar (+20% range
  nearby, full raid intel), Missile Batteries and an Airfield of interceptor fighters.
- Raids come from the sea and the sky. The wave panel and the red arrows on the water show where the next one
  is coming from; call it early with **N** for bonus gold.

## Controls

| Input | Action |
| --- | --- |
| W A S D / arrows (Shift = fast) | Move camera |
| Right-drag | Pan |
| Q / E, middle-drag | Rotate and tilt |
| Mouse wheel | Zoom (towards the cursor) |
| Left-click | Place / select |
| Right-click, Esc | Cancel tool / deselect / pause menu |
| 1–9, Tab | Build from the open tab, switch City/Military |
| R / X | Road tool (drag) / bulldoze |
| U, Delete | Upgrade / demolish the selected building |
| T | Research |
| N | Send the next wave now |
| Space, + / − | Pause, game speed (1×–3×) |
| H, F, F3 | Jump to Town Hall, fullscreen, performance overlay |

## Performance

The frame rate follows your monitor's refresh rate, so a 180 Hz display gets 180 fps when each frame takes
under 5.5 ms. In automated tests at 3440×1440 during a large raid the scene was about 70 draw calls and 100k
triangles, and the simulation averaged about 0.1–0.2 ms per tick. Those tests ran with software rendering, so
they say nothing about your GPU's speed; press F3 in game to see the real numbers. Everything that moves is GPU-instanced,
particles are animated entirely on the GPU, and all shaders are compiled at start-up so the first explosion
never hitches.

If your GPU can't hold 180 fps at native resolution, open **Settings** and lower **Render resolution**, set
**Shadows** to Normal, or turn off **Anti-aliasing**. Press **F3** to see fps, frame time, worst frame and draw
calls. Use a Chromium browser with hardware acceleration on, and avoid battery-saver power modes.

## Development

```sh
npm install
npm run build   # bundles src/ into dist/bastion.js
npm run dev     # rebuilds on change and serves at http://localhost:8080
```

Source is plain ES modules on three.js:

| File | What it does |
| --- | --- |
| `src/world.js` | Procedural island generation on a hex grid (terrain, beaches, shallows) |
| `src/defs.js` | Every building, enemy, research item and balance number |
| `src/game.js` | Economy, placement rules, roads and connectivity, save/load |
| `src/combat.js` | Waves, ship/air/ground AI, towers, projectiles |
| `src/path.js` | A* over the hex grid |
| `src/models.js` | All 3D models, built procedurally from primitives |
| `src/render.js` | Renderer, instanced pools, terrain, water shader, health bars |
| `src/fx.js` | GPU particle system |
| `src/input.js` | Camera, picking, build tools |
| `src/ui.js` | HUD, menus, minimap, tooltips |
| `src/audio.js` | Synthesised sound effects (no audio files) |
