# GFX-CITY assets (zone-lot buildings, trees, rocks)

No external asset files are used. Everything the city module draws is generated at load time in code:

- `src/gfx/buildings.js`: kit geometry (unit box, pitched-roof prism, parapet ring, 12-sided cylinder, hex lot pad,
  tower crane) and procedural facades (windows, shopfronts, cladding, roofs, scaffold netting, rubble) in the
  fragment shader. Palette from the UX review (concrete spec 8).
- `src/gfx/trees.js`: three tree species (broadleaf, conifer, poplar), craggy outcrops (clusters of tapered shards)
  and boulders, built from icosahedra/prisms with baked vertex AO.

Nothing to credit. Licence: same as the project code.

## Candidates reviewed and rejected
| candidate | licence | why not used |
|---|---|---|
| `asset-src/candidates/trees/babylonjs-assets/tree1.glb`, `tree2.glb` (Babylon.js Assets villagePack) | CC BY 4.0 | 1084 / 362 triangles each (budget 60-120), textured, stylised village look |
| `asset-src/candidates/trees/godot-trucktown` ("tree low-poly", Ricardo Sanchez, Sketchfab) | CC BY 4.0 | 778 triangles, two textures, needs attribution |
| `asset-src/candidates/trees/kaykit-hexpack` | CC0 | medieval hex-game style, rejected by the art direction (UX review must_change 4) |
| `asset-src/candidates/buildings_res/kaykit-citybits`, `godot-trucktown` | CC0 / CC BY | building kits are banned for zone lots (UX review must_change 4, cut 7) |
