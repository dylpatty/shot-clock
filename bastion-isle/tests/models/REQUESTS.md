# GFX-MODELS requests to other modules

## core (main.js, pools, uniforms, warm-up)
1. **Create one Pool per registry key** with `entry.geometry` and `entry.material` (`uberMaterial` for structures/heads/
   rotors/rubble, `uberUnitMaterial` for units, vehicles, boats, projectiles). Always keep `colors` on (the default):
   instanceColor must be present on every uber pool or a second program variant appears.
   `castShadow`: use `entry.cast` (High preset: infantry, vehicles, projectiles off).
2. **Boot order**: `await loadAssetModels()` (src/gfx/assets.js) before the first `getModels()`-based pool is created,
   so `jet` / `ally_fighter` point at the imported F-35 / F-16 geometry. Then `makeThumbnails(renderer, BUILD_TYPES,
   { environment: scene.environment })` and `makeSilhouettes(renderer, KEYS.enemies, { environment })` BEFORE the
   warm-up program snapshot (they reuse the uber program when given the main environment texture).
3. **Warm-up**: put one instance of every uber pool off-screen in the warm-up frames (as today) plus one ghost
   instance; programs expected from this module: `uber` (shared by both uber materials) + three's instanced depth
   variant (shadow pass) + `ghost`.
4. **HQ weapon height**: the Town Hall rooftop gun pivots at `HQ_HEAD_Y = 0.93` (registry `hq.headY`). combat.js uses
   `w.headY || 0.2` for the muzzle, so `BUILDINGS.hq.weapon` should get `headY: 0.93` (muzzleY 1.05 = headY + 0.12).
5. **Night light map UVs**: the uber material samples `U.uNightLight` at `(worldXZ - uMapMin) / uMapSize` (u = x, v = z)
   with a height falloff, so models near lamps and fires get lit. GFX-LIFE must render the map with that orientation.
6. **Hit flash / selection rim** (optional, later): if wanted on uber models, add a per-pool `aFlash` instanced
   attribute in a new uber revision; do not toggle materials per instance.

## sim (combat.js)
- Muzzle offsets match the models: mg 0.32, coastal 0.85, flak 0.5 (barrels elevated ~49 deg), missile 0.3; heads pivot
  at the defs `headY`. Airfield parking spots for parked interceptors are in `entry.spots` (`[x, z, yaw, scale]`,
  local to the airfield, scale 0.5).

## GFX-LIFE (traffic, boats, raid fx)
- Vehicle keys: `car_sedan car_hatch car_suv taxi police_car van ambulance truck bus firetruck`; boats:
  `ferry trawler yacht`. Body paint comes from instanceColor (paint mask): use `CAR_PAINTS`, `TAXI_PAINT`,
  `VAN_PAINTS`, `BUS_PAINTS`, `BOAT_PAINTS` (linear rgb triples). Police car, ambulance and fire truck ignore the tint.
- Headlights / tail lights glow from `U.uNight`; fire truck, police car and ambulance flashers blink by themselves
  (phase hashed per instance position). No extra uniforms needed.
- Tracers: `tracer` is a unit box from z = 0 to 1; scale x/y for thickness and z for length; tint with
  `TRACER_FRIENDLY` / `TRACER_HOSTILE` (the core is paint-masked emissive).
- Wind turbine rotors: pool `wind_rotor`, matrix via `putSpin(pool, x + sin(yaw)*rotorZ, y + rotorY,
  z + cos(yaw)*rotorZ, yaw, angle)`; ~1.2 rad/s looks right.
