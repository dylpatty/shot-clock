// Small DOM helpers. HUD text only changes through setText/setHTML/setW so unchanged values never touch the DOM.

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

export function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

export function setText(e, s) {
  if (!e) return;
  s = String(s);
  if (e._t !== s) { e._t = s; e.textContent = s; }
}
export function setHTML(e, s) {
  if (!e) return;
  if (e._h !== s) { e._h = s; e.innerHTML = s; }
}
// width of a bar as a percentage (0..1), diffed at 0.1% resolution
export function setW(e, f) {
  if (!e) return;
  const v = Math.round(Math.max(0, Math.min(1, f)) * 1000);
  if (e._w !== v) { e._w = v; e.style.width = v / 10 + '%'; }
}
export function setStyle(e, prop, v) {
  if (!e) return;
  const k = '_s_' + prop;
  if (e[k] !== v) { e[k] = v; e.style.setProperty(prop, v); }
}
export function setClass(e, cls, on) {
  if (!e) return;
  const k = '_c_' + cls;
  on = !!on;
  if (e[k] !== on) { e[k] = on; e.classList.toggle(cls, on); }
}
export function setAttr(e, a, v) {
  if (!e) return;
  const k = '_a_' + a;
  if (e[k] !== v) { e[k] = v; if (v == null || v === false) e.removeAttribute(a); else e.setAttribute(a, v === true ? '' : v); }
}

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

const nf = new Intl.NumberFormat('en-US');
export const fmtInt = (v) => nf.format(Math.round(v || 0));
// '$48,230', '-$1,200'
export const fmtMoney = (v) => (v < 0 ? '-$' : '$') + nf.format(Math.round(Math.abs(v || 0)));
// '+$1,240' / '-$310'
export const fmtSignedMoney = (v) => (v < 0 ? '-$' : '+$') + nf.format(Math.round(Math.abs(v || 0)));
export const fmtSigned = (v, d = 0) => (v >= 0 ? '+' : '-') + Math.abs(v).toFixed(d);
// compact money for small spaces: $1.2k, $15k, $1.25M
export function fmtK(v) {
  const a = Math.abs(v), s = v < 0 ? '-$' : '$';
  if (a >= 1e6) return s + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2) + 'M';
  if (a >= 1e4) return s + Math.round(a / 1000) + 'k';
  if (a >= 1000) return s + (a / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return s + Math.round(a);
}
export function fmtTime(s) {
  s = Math.max(0, Math.ceil(s || 0));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
export const fmtPct = (f, d = 0) => (f * 100).toFixed(d) + '%';
export const roman = (n) => ['', 'I', 'II', 'III', 'IV', 'V'][n] || String(n);
export const plural = (n, one, many = one + 's') => `${fmtInt(n)} ${n === 1 ? one : many}`;

// The sim reports problems as a string (or { error }) and success as null/undefined/false/true/object.
export function errOf(r) {
  if (typeof r === 'string') return r;
  if (r && typeof r === 'object' && typeof r.error === 'string') return r.error;
  return null;
}

// Normalise a breakdown (array of {label, value} | [label, value] | object map) into [{ label, value, note }]
export function terms(x) {
  if (!x) return [];
  if (Array.isArray(x)) {
    return x.map((t) => (Array.isArray(t) ? { label: t[0], value: +t[1] || 0 } : { label: t.label || t.name || t.key || '', value: +(t.value ?? t.v ?? 0) || 0, note: t.note }));
  }
  if (typeof x === 'object') return Object.entries(x).map(([label, value]) => ({ label, value: +value || 0 }));
  return [];
}

// Compass name for a direction angle measured from +z with -z as north (matches the sim's convention).
const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
export function compassName(angle) {
  const a = ((Math.atan2(Math.sin(angle), -Math.cos(angle)) / (Math.PI * 2)) * 8 + 8.5) % 8;
  return COMPASS[Math.floor(a)];
}
export function listJoin(arr) {
  if (arr.length <= 1) return arr.join('');
  return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
}

// rem in px at the current root font size
export function remPx() { return parseFloat(getComputedStyle(document.documentElement).fontSize) || 15; }
