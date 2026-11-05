// Info views and tool overlays. Everything the ground shader tints per tile is composed here into one RGBA array
// (plus a per-tile style byte) and handed to the ground module with X.setInfoView(rgba, style).
//   style bits: 1 outline, 2 diagonal hatch, 4 inset zone border, 8|16 colour-blind pattern (8 solid, 16 hatch 45°,
//   24 cross-hatch), 32 pulse.
// Views follow the systems review (concrete spec 23): Shift+1..8 or V to cycle. Clay mode and defence coverage are
// shared uniforms (U.uClay, U.uCoverMix) animated here.
import { W, T, LF, CV, isLand, isWater, isWalkable } from '../world.js';
import { G } from '../state.js';
import { BUILDINGS, ZONES, ZONE_TERRAIN } from '../defs.js';
import { U } from '../gfx/uniforms.js';
import { X, S } from './bridge.js';
import { TOOL, mouse, hasRoadNeighbour, zoneEligible, extraRings, CAM } from '../input.js';

export const STYLE = { OUTLINE: 1, HATCH: 2, INSET: 4, SOLID: 8, HATCH45: 16, CROSS: 24, PULSE: 32 };
const PATTERN = [0, STYLE.SOLID, STYLE.HATCH45, STYLE.CROSS];

export const VIEWS = [
  { id: 'zones', name: 'Zones', icon: 'layout-grid', key: 1 },
  { id: 'power', name: 'Power', icon: 'bolt', key: 2 },
  { id: 'water', name: 'Water', icon: 'droplet', key: 3 },
  { id: 'landvalue', name: 'Land value', icon: 'chart-area', key: 4 },
  { id: 'pollution', name: 'Pollution', icon: 'mist', key: 5 },
  { id: 'services', name: 'Services', icon: 'building-bank', key: 6, subs: [['fire', 'Fire'], ['police', 'Police'], ['health', 'Health'], ['school', 'School']] },
  { id: 'fire', name: 'Fire risk', icon: 'flame', key: 7 },
  { id: 'defence', name: 'Defence', icon: 'shield-half', key: 8, subs: [['sea', 'Sea'], ['air', 'Air'], ['ground', 'Ground']] },
];
export const VIEW_BY_ID = Object.fromEntries(VIEWS.map((v) => [v.id, v]));

export const IV = {
  sub: { services: 'fire', defence: 'sea' },
  clay: true,
  version: 0,          // bumps when the legend needs a refresh
  dataT: 0,
  lastLot: -1, lastWorld: -1, lastTool: -1, lastView: null, lastBuild: -1,
  counts: null,        // Uint8Array(W.count*3) defence coverage per tile (sea, air, ground)
  coverKey: '',
  eligible: null, eligibleKey: '',
  placeOk: null, placeKey: '',
  stats: {},           // numbers shown in the legend
};

let base = null, baseStyle = null, out = null, outStyle = null, active = false;

// ------------------------------------------------------------------ colours

const hex = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
const C = {
  accent: hex(0x3cc8d0), good: hex(0x5fd38a), warn: hex(0xffb547), hostile: hex(0xff4d3d), white: hex(0xf2f4f2),
  power: hex(0xf5cf4a), water: hex(0x4fb3ff), dim: hex(0x64737f), rubble: hex(0x8a857c),
  zone: [null, hex(0x5dbb63), hex(0x4c9be8), hex(0xe0a040)],
};
// viridis, colour-blind safe, for land value
const RAMP_LV = [hex(0x440154), hex(0x3b528b), hex(0x21918c), hex(0x5ec962), hex(0xfde725)];
const RAMP_POLL = [hex(0xd9c76a), hex(0xc0843a), hex(0x8f4a2a), hex(0x5a2a22)];
export const RAMPS = { landvalue: RAMP_LV, pollution: RAMP_POLL };
export const rampCSS = (r) => r.map((c, k) => `rgb(${c[0]},${c[1]},${c[2]}) ${((k / (r.length - 1)) * 100).toFixed(0)}%`).join(', ');

function ramp(r, f, o) {
  f = Math.max(0, Math.min(1, f)) * (r.length - 1);
  const k = Math.min(r.length - 2, Math.floor(f)), t = f - k;
  o[0] = r[k][0] + (r[k + 1][0] - r[k][0]) * t;
  o[1] = r[k][1] + (r[k + 1][1] - r[k][1]) * t;
  o[2] = r[k][2] + (r[k + 1][2] - r[k][2]) * t;
  return o;
}
const _c = [0, 0, 0];
function put(a, s, i, c, alpha, style = 0) {
  const o = i * 4;
  a[o] = c[0]; a[o + 1] = c[1]; a[o + 2] = c[2]; a[o + 3] = alpha;
  if (s) s[i] = style;
}

function ensure() {
  const n = W.count;
  if (!base || base.length !== n * 4) {
    base = new Uint8Array(n * 4); baseStyle = new Uint8Array(n);
    out = new Uint8Array(n * 4); outStyle = new Uint8Array(n);
    IV.counts = new Uint8Array(n * 3);
    IV.eligible = new Uint8Array(n);
    IV.placeOk = new Uint8Array(n);
    IV.coverKey = ''; IV.eligibleKey = ''; IV.placeKey = '';
  }
}

const COVER_BIT = { fire: CV.FIRE, police: CV.POLICE, health: CV.HEALTH, school: CV.SCHOOL };
const SERVICE_TYPES = { fire: ['fire'], police: ['police'], health: ['clinic'], school: ['school'] };
const isLotTile = (i) => W.zone[i] > 0 && W.lvl[i] > 0 && !(W.flags[i] & LF.RUBBLE);

// ------------------------------------------------------------------ defence coverage (per tile, per domain)

export function towerDomains(b) {
  const d = b.def || BUILDINGS[b.type];
  const ws = S.weaponStats(b) || b.ws;
  if (d.weapon) {
    const t = d.weapon.targets || {};
    return { r: ws ? ws.range : d.weapon.range * (G.mod.range || 1), sea: (t.sea || 0) >= 0.5, air: (t.air || 0) >= 0.5, ground: (t.ground || 0) >= 0.5 };
  }
  if (b.type === 'barracks') return { r: d.guard || 15, sea: false, air: false, ground: true };
  if (b.type === 'airfield') return { r: 22, sea: true, air: true, ground: false };
  return null;
}

export function refreshCoverage(force) {
  ensure();
  let key = '';
  for (const b of G.buildings) if (b.def && (b.def.kind === 'military' || b.type === 'hq')) key += `${b.id}:${b.level}:${b.hp > 0 ? 1 : 0};`;
  key += G.mod.range;
  if (!force && key === IV.coverKey) return false;
  IV.coverKey = key;
  const cnt = IV.counts;
  cnt.fill(0);
  const list = [];
  for (const b of G.buildings) {
    if (!b.def || !(b.def.kind === 'military' || b.type === 'hq')) continue;
    const dm = towerDomains(b);
    if (!dm) continue;
    list.push({ x: b.x, z: b.z, r: dm.r, sea: dm.sea, air: dm.air, ground: dm.ground });
    const rad = Math.ceil(dm.r / 1.732) + 1, r2 = dm.r * dm.r;
    const q0 = W.q[b.tile], r0 = W.r[b.tile], R = W.R;
    for (let dq = -rad; dq <= rad; dq++) {
      const lo = Math.max(-rad, -dq - rad), hi = Math.min(rad, -dq + rad);
      for (let dr = lo; dr <= hi; dr++) {
        const q = q0 + dq, r = r0 + dr;
        if (q < -R || q > R || r < -R || r > R || q + r < -R || q + r > R) continue;
        const j = W.lookup[(q + R) * (2 * R + 1) + (r + R)];
        if (j < 0) continue;
        const dx = W.x[j] - b.x, dz = W.z[j] - b.z;
        if (dx * dx + dz * dz > r2) continue;
        if (dm.sea && cnt[j * 3] < 255) cnt[j * 3]++;
        if (dm.air && cnt[j * 3 + 1] < 255) cnt[j * 3 + 1]++;
        if (dm.ground && cnt[j * 3 + 2] < 255) cnt[j * 3 + 2]++;
      }
    }
  }
  X.rebuildCoverage(list);
  return true;
}

// ------------------------------------------------------------------ info view layer

function computeView(view) {
  const a = base, s = baseStyle, n = W.count;
  a.fill(0); s.fill(0);
  const st = { covered: 0, uncovered: 0, unpowered: 0, dry: 0, burning: 0, lots: 0, gaps: 0, beaches: 0, avg: 0 };
  if (view === 'zones') {
    for (let i = 0; i < n; i++) {
      const z = W.zone[i];
      if (z) {
        const rub = W.flags[i] & LF.RUBBLE;
        put(a, s, i, rub ? C.rubble : C.zone[z], W.lvl[i] ? 170 : 90, PATTERN[z] | (W.lvl[i] ? 0 : STYLE.INSET));
        st.lots++;
      } else if (W.road[i]) put(a, s, i, W.conn[i] ? C.white : C.hostile, W.conn[i] ? 60 : 140, W.conn[i] ? 0 : STYLE.HATCH);
    }
  } else if (view === 'power' || view === 'water') {
    const bit = view === 'power' ? LF.POWER : LF.WATER, col = view === 'power' ? C.power : C.water;
    for (let i = 0; i < n; i++) {
      if (W.bld[i]) {
        const b = G.byId.get(W.bld[i]);
        if (!b) continue;
        const v = view === 'power' ? b.def.power || 0 : b.def.water || 0;
        if (v > 0 || b.type === 'hq') put(a, s, i, col, 235, STYLE.OUTLINE);
        else if (v < 0) {
          const ok = view === 'power' ? b.powered !== false : b.watered !== false;
          put(a, s, i, ok ? col : C.hostile, ok ? 120 : 220, ok ? 0 : STYLE.HATCH);
          if (!ok) st.unpowered++;
        }
      } else if (isLotTile(i)) {
        const ok = W.flags[i] & bit;
        put(a, s, i, ok ? col : C.hostile, ok ? 120 : 220, ok ? 0 : STYLE.HATCH);
        if (!ok) st.unpowered++;
        st.lots++;
      } else if (W.zone[i]) {
        put(a, s, i, W.flags[i] & bit ? col : C.dim, 50, STYLE.INSET);
      } else if (W.road[i]) {
        put(a, s, i, W.conn[i] ? col : C.dim, W.conn[i] ? 70 : 90);
      }
    }
  } else if (view === 'landvalue') {
    let sum = 0, cnt = 0;
    for (let i = 0; i < n; i++) {
      if (!isLand(W.type[i]) || W.type[i] === T.MOUNTAIN) continue;
      if (W.road[i]) continue;
      const v = W.lv[i];
      put(a, s, i, ramp(RAMP_LV, v / 100, _c), W.zone[i] ? 205 : 150);
      if (W.zone[i]) { sum += v; cnt++; }
    }
    st.avg = cnt ? sum / cnt : 0;
  } else if (view === 'pollution') {
    for (let i = 0; i < n; i++) {
      const p = W.poll[i];
      if (!p || !isLand(W.type[i])) continue;
      const f = Math.min(1, p / 60);
      put(a, s, i, ramp(RAMP_POLL, f, _c), 70 + f * 170);
      if (isLotTile(i) && W.zone[i] === 1) st.lots++;
    }
  } else if (view === 'services') {
    const sub = IV.sub.services, bit = COVER_BIT[sub];
    for (let i = 0; i < n; i++) {
      if (!isLand(W.type[i])) continue;
      const cov = W.cover[i] & bit;
      if (isLotTile(i)) {
        put(a, s, i, cov ? C.accent : C.hostile, cov ? 150 : 190, cov ? 0 : STYLE.HATCH);
        if (cov) st.covered++; else st.uncovered++;
      } else if (cov && !W.road[i]) put(a, s, i, C.accent, 60);
    }
  } else if (view === 'fire') {
    for (let i = 0; i < n; i++) {
      if (!isLand(W.type[i])) continue;
      if (W.fire[i]) { put(a, s, i, C.hostile, 245, STYLE.PULSE); st.burning++; continue; }
      const covered = W.cover[i] & CV.FIRE;
      if (isLotTile(i) || W.bld[i]) {
        const ind = W.zone[i] === 3;
        put(a, s, i, covered ? C.good : C.warn, covered ? 110 : ind ? 230 : 180, covered ? 0 : STYLE.HATCH);
        if (!covered) st.uncovered++;
      } else if (covered && !W.road[i]) put(a, s, i, C.good, 40);
    }
  } else if (view === 'defence') {
    refreshCoverage();
    const dom = IV.sub.defence, k = dom === 'sea' ? 0 : dom === 'air' ? 1 : 2, cnt = IV.counts;
    const landing = new Uint8Array(n);
    for (const j of W.landing) landing[j] = 1;
    for (let i = 0; i < n; i++) {
      const land = isLand(W.type[i]);
      // which tiles matter for this domain: sea lanes within reach of the island, land for troops, all for air
      if (dom === 'sea' && land) continue;
      if (dom === 'ground' && !land && !landing[i]) continue;
      if (dom === 'sea' && W.type[i] === T.DEEP && cnt[i * 3] === 0 && !nearShore(i)) continue;
      if (dom === 'air' && !land && cnt[i * 3 + 1] === 0 && !nearShore(i)) continue;
      const c = cnt[i * 3 + k];
      if (dom === 'ground' && landing[i]) {
        const guard = landingGuarded(i);
        put(a, s, i, guard ? C.good : C.hostile, 230, STYLE.HATCH | STYLE.OUTLINE);
        st.beaches++; if (!guard) st.gaps++;
        continue;
      }
      put(a, s, i, c >= 2 ? C.good : c === 1 ? C.warn : C.hostile, c >= 2 ? 120 : c === 1 ? 140 : 110, c ? 0 : STYLE.HATCH);
      if (!c) st.gaps++;
    }
  }
  IV.stats = st;
}

let shoreDist = null, shoreKey = -1;
function nearShore(i) {
  if (shoreKey !== W.version || !shoreDist || shoreDist.length !== W.count) {
    shoreKey = W.version;
    shoreDist = new Uint8Array(W.count).fill(255);
    const q = [];
    for (let j = 0; j < W.count; j++) if (isLand(W.type[j])) { shoreDist[j] = 0; q.push(j); }
    for (let k = 0; k < q.length; k++) {
      const c = q[k];
      if (shoreDist[c] >= 9) continue;
      for (let d = 0; d < 6; d++) { const j = W.nbr[c * 6 + d]; if (j >= 0 && shoreDist[j] > shoreDist[c] + 1) { shoreDist[j] = shoreDist[c] + 1; q.push(j); } }
    }
  }
  return shoreDist[i] <= 8;
}
// a landing beach counts as guarded with an MG post or barracks within 6 tiles (advisor hint rule)
function landingGuarded(i) {
  for (const b of G.buildings) {
    if (b.type !== 'mg' && b.type !== 'barracks') continue;
    if (Math.hypot(b.x - W.x[i], b.z - W.z[i]) <= 6 * 1.732) return true;
  }
  return false;
}

// ------------------------------------------------------------------ tool layer

function refreshEligible() {
  const key = `${W.version}|${W.lotVersion}`;
  if (key === IV.eligibleKey) return;
  IV.eligibleKey = key;
  const e = IV.eligible;
  for (let i = 0; i < W.count; i++) e[i] = zoneEligible(i) && hasRoadNeighbour(i) ? 1 : 0;
}
function refreshPlaceable(type) {
  const key = `${type}|${W.version}|${W.lotVersion}|${G.buildings.length}`;
  if (key === IV.placeKey) return;
  IV.placeKey = key;
  const e = IV.placeOk;
  e.fill(0);
  for (const i of W.land) e[i] = S.placeProblem(type, i) ? 0 : 1;
}

function composeTool(a, s) {
  const t = G.tool;
  if (!t) return false;
  if (t.kind === 'zone' || t.kind === 'dezone') {
    refreshEligible();
    const n = W.count;
    for (let i = 0; i < n; i++) {
      const z = W.zone[i];
      if (z) {
        const o = i * 4;
        // zoned lots: inset border in the zone colour; empty ones also get a 22% tint and their pattern
        if (!a[o + 3]) put(a, s, i, C.zone[z], W.lvl[i] ? 40 : 56, STYLE.INSET | (W.lvl[i] ? 0 : PATTERN[z]));
        else s[i] |= STYLE.INSET;
      } else if (t.kind === 'zone' && IV.eligible[i] && !a[i * 4 + 3]) {
        put(a, s, i, C.white, 64, STYLE.OUTLINE);
      }
    }
    const col = t.kind === 'zone' ? C.zone[t.zone] : C.hostile;
    for (const i of TOOL.preview) put(a, s, i, col, 115, STYLE.OUTLINE | (t.kind === 'zone' ? PATTERN[t.zone] : STYLE.HATCH));
    for (const i of TOOL.previewBad) put(a, s, i, C.hostile, 120, STYLE.HATCH);
    return true;
  }
  if (t.kind === 'road') {
    for (const i of TOOL.roadPath) if (W.road[i]) put(a, s, i, C.white, 70, STYLE.OUTLINE);
    const afford = TOOL.roadCost <= G.money;
    for (const i of TOOL.preview) put(a, s, i, afford ? C.accent : C.warn, 165, STYLE.OUTLINE);
    for (const i of TOOL.previewBad) put(a, s, i, C.hostile, 160, STYLE.HATCH);
    return true;
  }
  if (t.kind === 'bulldoze') {
    for (const i of TOOL.preview) put(a, s, i, C.hostile, 77, STYLE.OUTLINE);
    return true;
  }
  if (t.kind === 'build') {
    refreshPlaceable(t.type);
    for (const i of W.land) if (IV.placeOk[i] && !a[i * 4 + 3]) put(a, s, i, C.white, 38, STYLE.OUTLINE);
    for (const i of TOOL.preview) put(a, s, i, C.accent, 115, STYLE.OUTLINE);
    for (const i of TOOL.previewBad) put(a, s, i, C.hostile, 115, STYLE.HATCH);
    return true;
  }
  return false;
}

// ------------------------------------------------------------------ public

export function setView(id) {
  if (id && !VIEW_BY_ID[id]) id = null;
  G.infoView = id || null;
  IV.dataT = 0; IV.version++;
  rebuildServiceRings();
}
export function cycleView(dir = 1) {
  const k = VIEWS.findIndex((v) => v.id === G.infoView);
  const n = k + dir;
  setView(n < 0 || n >= VIEWS.length ? null : VIEWS[n].id);
}
export function setSub(view, sub) {
  IV.sub[view] = sub;
  IV.dataT = 0; IV.version++;
  rebuildServiceRings();
}
// pressing a view's key again cycles its sub-view (services, defence), then turns it off
export function toggleView(id) {
  const v = VIEW_BY_ID[id];
  if (G.infoView === id && v && v.subs) {
    const k = v.subs.findIndex((s) => s[0] === IV.sub[id]);
    if (k < v.subs.length - 1) { setSub(id, v.subs[k + 1][0]); return; }
    IV.sub[id] = v.subs[0][0];
    setView(null);
    return;
  }
  setView(G.infoView === id ? null : id);
}

function rebuildServiceRings() {
  extraRings.length = 0;
  if (G.infoView !== 'services') return;
  const types = SERVICE_TYPES[IV.sub.services] || [];
  const list = G.buildings.filter((b) => types.includes(b.type));
  list.sort((p, q) => Math.hypot(p.x - CAM.tx, p.z - CAM.tz) - Math.hypot(q.x - CAM.tx, q.z - CAM.tz));
  for (const b of list.slice(0, 7)) {
    const r = (b.level > 1 && b.def.upgradeRadius ? b.def.upgradeRadius : b.def.radius) * 1.732 + 0.6;
    extraRings.push({ x: b.x, z: b.z, r, style: 2, color: 0x3cc8d0 });
  }
}

// per frame (cheap unless something changed): recompute the view data at 1 Hz or when lots change, recompose with
// the tool layer when the tool preview changes, animate clay and coverage
export function updateOverlay(dt) {
  if (!W.count) return;
  ensure();
  const view = G.mode === 'menu' ? null : G.infoView;
  IV.dataT -= dt;
  let dirty = false;
  if (view !== IV.lastView) { IV.lastView = view; IV.dataT = 0; dirty = true; rebuildServiceRings(); }
  if (view && (IV.dataT <= 0 || (W.lotVersion !== IV.lastLot && IV.dataT < 0.75))) {
    IV.dataT = 1;
    IV.lastLot = W.lotVersion;
    computeView(view);
    if (view === 'services') rebuildServiceRings();
    IV.version++;
    dirty = true;
  }
  if (!view && IV.hadView) { base.fill(0); baseStyle.fill(0); IV.hadView = false; dirty = true; }
  if (view) IV.hadView = true;
  if (TOOL.version !== IV.lastTool) { IV.lastTool = TOOL.version; dirty = true; }
  if (G.tool && (G.tool.kind === 'zone' || G.tool.kind === 'build') && (W.lotVersion + W.version * 7) !== IV.lastBuild) { IV.lastBuild = W.lotVersion + W.version * 7; dirty = true; }

  if (dirty) {
    out.set(base); outStyle.set(baseStyle);
    const tool = composeTool(out, outStyle);
    const any = !!view || tool;
    if (any) X.setInfoView(out, outStyle);
    else if (active) X.setInfoView(null);
    active = any;
  }
  // shared uniforms, eased (clay over ~250 ms)
  const k = 1 - Math.exp(-dt * 14);
  U.uOverlayMix.value += ((active ? 1 : 0) - U.uOverlayMix.value) * k;
  U.uClay.value += ((view && IV.clay ? 1 : 0) - U.uClay.value) * k;
  const placingMil = G.tool && G.tool.kind === 'build' && BUILDINGS[G.tool.type] && BUILDINGS[G.tool.type].kind === 'military';
  const cover = view === 'defence' ? 1 : placingMil ? 0.5 : 0;
  IV.coverT = (IV.coverT || 0) - dt;
  if (cover > 0 && IV.coverT <= 0) { IV.coverT = 0.5; refreshCoverage(); }
  U.uCoverMix.value += (cover - U.uCoverMix.value) * k;
  if (U.uCoverMask) {
    const d = IV.sub.defence;
    U.uCoverMask.value.set(view === 'defence' ? (d === 'sea' ? 1 : 0) : 1, view === 'defence' ? (d === 'air' ? 1 : 0) : 1, view === 'defence' ? (d === 'ground' ? 1 : 0) : 1);
  }
}

// counts used by tooltips: towers covering tile i per domain
export function coverageAt(i) {
  if (!IV.counts || i < 0) return null;
  refreshCoverage();
  return { sea: IV.counts[i * 3], air: IV.counts[i * 3 + 1], ground: IV.counts[i * 3 + 2] };
}
