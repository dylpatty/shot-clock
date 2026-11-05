# Bastion Isle v3

A hex-island city builder with tower-defence raids, built from the ground up in **Godot 4.3** (GDScript).
You found a medieval settlement on a lush island and carry it through five ages - Medieval, Renaissance,
Industrial, Modern and Atomic - while the Grey Armada raids you from the sea and, later, from the sky.

## Open and play

1. Install **Godot 4.3-stable** (standard build, not .NET): https://godotengine.org/download/archive/4.3-stable/
2. Start Godot, choose **Import**, and select `project.godot` in this folder (`bastion-isle-godot/`).
3. The first import takes a few seconds (textures). Then press **Play** (F5) or the play button.

The game needs a desktop GPU with Vulkan (Forward+ renderer). Saves go to `user://bastion_v3_save.json`
(on Windows `%APPDATA%\Godot\app_userdata\Bastion Isle v3\`).

To make a stand-alone build: *Project > Export*, add a Windows or Linux preset (Godot will offer to download the
export templates), then *Export Project*. Note that an unsigned Windows .exe may be blocked by Windows Smart App
Control; running from the editor always works.

## How to play

- **Roads**: every building except walls needs a road to the Town Hall (red marker = not connected).
- **Workers**: citizens fill open jobs automatically. The Workers panel (left) moves people between
  **Farming, Industry, Science and Military** with + / - (Shift: 5 at a time). A sector you lower by hand is
  capped (`*`); *Auto-assign all* clears the caps. Production scales with staffing; unstaffed weapons fire slowly.
- **Ages**: upgrade the **Town Hall** (costs science) to enter the next age. That unlocks the next level of every
  building, Clash-style: each level has its own model, name and stats (Thatched Cottage -> Timber House ->
  Brick Townhouse -> Apartment Block -> Habitat Tower; Archer Tower -> Musket Tower -> Gatling Tower ->
  Autocannon Bunker -> Laser Turret; Catapult -> Cannon Battery -> Coastal Gun -> Howitzer -> Railgun; ...).
  The info panel shows a 3D preview, name and cost of the next level. Upgrades take construction time.
- **Raids**: 20 raids, four per age. Each raid comes from an age; a weapon from an older age than its target deals
  only 60% damage per age of difference, so science must keep up. Aircraft arrive with the Industrial Armada
  (build Air Defence and an Airfield), and the Atomic Armada brings a nuclear bomber that can wipe out a district.
  Every fourth raid brings a flagship (Dragon Ship, Ship of the Line, Dreadnought, Battleship, Supercarrier).
- Between raids: a timer, raid composition and red arrows on the sea showing where they will come from.
  *Start now* calls the raid early for bonus gold. A report follows every raid. The game autosaves after raids.
- Walls block landing parties (they must break through or go round); barracks soldiers hunt them down.
- Research (L) and the market (select it, *Trade*) give more choices for science and surplus goods.

## Controls

| Action | Input |
|---|---|
| Pan | W A S D / arrow keys, or right-drag |
| Rotate | Q / E, or middle-drag |
| Zoom | mouse wheel |
| Select / place | left click (roads and bulldoze: click and drag) |
| Rotate the building being placed | **R** (6 hex orientations, saved with the building) |
| Road tool / bulldoze | T / X |
| Upgrade selected / demolish | U / Delete |
| Research | L |
| Game speed / pause | 1, 2, 3 / Space |
| Cancel / menu | right click, Esc |
| Save / load | F5 / F9 (between raids) |
| Help | H or F1 |
| Hover | any unit or building shows type, age and HP (Alt shows the terrain type) |

## What is in the box

- Procedural pointy-top hex island (circumradius 1) with beaches, grassland, forests, rocky hills, faceted
  snow-tipped mountains, turquoise shallows, deep sea and a lighthouse rock; chunky bevelled tiles with
  earthy cliff sides in one merged mesh; MultiMesh pines, broadleaf trees, bushes, boulders, grass and flowers
  with wind sway; water shader with waves, depth colour, shoreline foam and low glare; caustics on the sea floor.
- Lighting: soft-shadowed sun, sky ambient, Filmic tonemap, SSAO, SSIL, glow, fog (Graphics option in the pause
  menu lowers the heavy effects).
- 15 building types x up to 5 levels (71 distinct procedural models), turrets that track targets, windmills,
  water wheels and radar dishes that turn, chimney smoke, scaffolding during construction, rubble ruins that can
  be rebuilt, road surfaces that modernise with your age.
- 30 enemy types across five ages (ships, landing craft, infantry, biplanes, zeppelins, jets, bombers, the
  nuclear bomber, five flagships) and 8 friendly unit types, each with its own chunky cartoon model.
- Ambient life: townsfolk walk the roads, gulls circle, sheep and cows on farms, boats at the docks.
- Procedural sound effects, story chronicle panels (opening and every new age), main/pause menus, win and lose
  screens.

## Headless self-test

```
godot --headless --path . --import
godot --headless --path . -- --selftest [--waves=20] [--seed=7]   # AI with extra resources: every age, every system
godot --headless --path . -- --selftest --fair [--waves=20]       # AI without cheats: a balance check
```

The self-test builds a town through the normal placement API, plays the raids, round-trips a save, builds every
model, drives the UI and input code paths, and exits with code 0 on success.

## Code map

- `scripts/defs.gd` - all data: ages, buildings and their levels, enemies, allies, research, story.
- `scripts/hexworld.gd`, `hexpath.gd` - island generation, hex maths, A*.
- `scripts/game.gd` (autoload `G`) - economy, workers, placement, upgrades, ages, research, save/load.
- `scripts/combat.gd` - raids, ships, landings, aircraft, towers, soldiers, fighters, projectiles.
- `scripts/mk.gd`, `models.gd`, `unit_models.gd` - procedural mesh kit and every model.
- `scripts/terrain_view.gd`, `world_view.gd`, `fx.gd`, `audio.gd`, `camera_rig.gd`, `hud.gd`, `main.gd` - presentation.
- `shaders/` - terrain, water, models, props, particles, overlays.
