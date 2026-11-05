# Model credits (GFX-MODELS)

All structure, unit, ship, vehicle, boat, projectile and rubble models are generated procedurally at load time by
`src/gfx/models.js` (original work for Bastion Isle, no third-party geometry).

## Embedded third-party models (`assets/models/`)

| File | Used as | Source | Licence |
|---|---|---|---|
| `jet-f35.glb` | hostile Strike Jet (`jet`, `jet_f35`) | munim-maps-vehicles 0.5.0, `glb/jet-f35.glb`, by Munim Technologies / sheehanmunim (https://github.com/munimtechnologies/munim-maps, npm `munim-maps-vehicles`) | Apache License 2.0 |
| `jet-f16.glb` | friendly Interceptor (`ally_fighter`, `ally_f16`) | munim-maps-vehicles 0.5.0, `glb/jet-f16.glb`, same author | Apache License 2.0 |

Copyright 2026 sheehanmunim. Licensed under the Apache License, Version 2.0; a copy of the licence is in
`assets/credits/LICENSE-munim-maps-vehicles-Apache-2.0.txt` (http://www.apache.org/licenses/LICENSE-2.0).

### Modifications (Apache-2.0 section 4b)
- The shipped GLBs are the asset curator's final simplified copies (`/home/user/asset-src/final/aircraft/`, byte-identical):
  glTF-Transform weld / simplify / palette / join, 14.6k / 13.5k triangles reduced to about 2.2k / 1.8k.
- At load time `src/gfx/assets.js` discards the original materials and textures, bakes every vertex to the Bastion Isle
  palette (hostile greys and red markings for the F-35, naval greys and a cyan fin flash for the F-16), rescales the
  models to game units (1.0 unit long), re-centres them, turns them to face +z, recolours fin tops and wingtips as
  faction markings, and adds navigation lights, a strobe, a beacon and an engine glow.

## Candidates reviewed and not used
- Kenney Car Kit (CC0, via `@netforge/asset-library-files`): 1.4k-2.6k triangles per car is 10x the traffic budget
  (about 150 triangles per car for up to 600 cars) and the chunky toy style clashes with the procedural set;
  traffic vehicles are procedural instead.
- Kenney Space Kit satellite dishes (CC0): replaced by procedural lathe dishes that match the military set.
