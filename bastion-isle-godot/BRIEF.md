# Bastion Isle: brief for Claude Code on my PC

## Me and my PC
- Windows 11, AMD RX 9070 XT, 3440x1440 ultrawide at 180 Hz.
- Windows Smart App Control is on. It blocks unsigned .exe, .js and .bat files.

## Where the game stands
- Godot 4.3 project (GDScript, Forward+ renderer) in `bastion-isle-godot/`, about 9,800 lines.
- Repo: github.com/dylpatty/shot-clock, branch `claude/hex-tile-city-builder-6zp8dl`. Commit there if git access works.
- It was built on a cloud machine with no GPU and had never been seen rendered until my screenshot. The gameplay passes a headless self-test of all 20 raids.
- Run it: download Godot 4.3-stable win64 (standard build, not .NET), then `Godot.exe --path bastion-isle-godot`.
- Self-test: `Godot.exe --headless --path bastion-isle-godot -- --selftest`. It must keep passing.
- See it yourself: save screenshots (a script that saves `get_viewport().get_texture().get_image()` to PNG, or `--write-movie`) and look at them after every change.

## The game I want
- A PC 3D hex-tile island city builder crossed with tower defence: "Cities: Skylines and a tower defence had a baby", with ideas from Bloons TD, Thronefall, Civ 5/6 and Clash of Clans. No magic or fantasy.
- You start in medieval times: buildings, story and enemies are all medieval. Lay roads, grow the town, defend the island against boats, landing troops and, later, planes.
- Every raid comes from a later age: Medieval, Renaissance, Industrial, Modern, then Atomic. The last raids bring jets and a nuclear bomber.
- Between raids you get prep time: a timer, the next raid's units and where it comes from, and a button to start early for bonus gold.
- Science must keep up: weapons from an older age do far less damage to newer enemies.
- Assign workers to Farming, Industry, Science and Military.
- Clash of Clans-style levels: every building type upgrades level by level, and its look gradually modernises (for example Archer Tower, Musket Tower, Gatling Tower, Autocannon, Laser Turret).
- Game speed 1x, 2x, 3x and pause. R rotates the building being placed through 6 directions.
- Hovering over any enemy troop, ship or plane shows its type, age and HP left.

## The look I want
- Reference picture (I'll attach it): a cozy diorama island of chunky hex tiles with rocky cliff sides, lush meadows with flowers, dense pine forests, faceted grey mountains, golden beaches, clear turquoise shallows with foam, and a lighthouse.
- Mixed with the Clash of Clans / Clash Royale style: bright, warm, saturated, chunky and readable, with strong silhouettes, bevelled shapes and soft shadows. Imitate the style; don't copy their assets.
- Colours: rich and saturated. Right now they're washed out and pale. Leads: Filmic tonemapping with `tonemap_white = 3.2`, fog and ambient light in `scripts/main.gd` (around lines 90-110); `scripts/hud.gd` (around line 430) also sets up an Environment.
- Water: clear turquoise near shore, deeper blue offshore, foam at the coast, and little glare. Too much glare was an earlier complaint.
- Units need to look much better, Clash-style: chunky troops with big heads and hands, era-correct ships (sails and cannons, then funnels and turrets, then missiles), planes recognisable by era.
- Each building level must look clearly different from the last.
- Good effects: explosions, smoke, muzzle flashes, splashes, buildings being destroyed, a big nuke flash.
- Free public assets (CC0: Poly Haven, ambientCG, Kenney, Quaternius) are fine where they help. Keep one cohesive stylised look and credit them in `CREDITS.md`.

## Technical requirements
- A steady 180 fps at 3440x1440 on the RX 9070 XT. Measure fps and frame time, then fix what's slow:
  - use MultiMesh for trees, props and units;
  - don't rebuild the UI every frame;
  - tune shadow, SSAO, SSIL and MSAA settings;
  - add a Settings menu with quality presets and render scale.
- An ultrawide-friendly HUD: it hugs the screen edges and keeps the centre clear, nothing overlaps, and text is readable at 1920x1080 and 3440x1440. Add a UI scale option.
- UI bugs in my screenshot:
  - the build menu (Economy/Town/Defence, Road, Bulldoze) sits on top of the Workers panel;
  - a big empty dark panel covers the left third of the screen from top to bottom;
  - the "Next raid" tooltip covers the build buttons;
  - the resource bar is hidden;
  - the Workers panel text is faded.
  - The game also feels laggy and glitchy.
- Saving (F5/F9, plus the autosave after each raid) must keep working.
- Shipping: a "Bastion Isle" folder holding the official signed `Godot_v4.3-stable_win64.exe` renamed to `Bastion Isle.exe`, plus `Bastion Isle.pck` made with `--export-pack "Windows Desktop"` (see README, "Play on Windows"). Godot runs the .pck that has the same name as the .exe, and the signature keeps Smart App Control happy. Don't ship an unsigned .exe, .bat or .js.

## Not built yet
- A minimap and music. The HDRI sky images are included but not used.

## Order of work
1. Fix the UI and the colours.
2. Fix the performance.
3. Improve the unit and building models.
4. Add the missing features.

After each step, run the game on my GPU, check the screenshots, keep the self-test passing, and rebuild the "Bastion Isle" folder so I can play it.
