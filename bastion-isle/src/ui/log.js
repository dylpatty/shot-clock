// Harbour Log: a terse dispatch list at the frame's right edge (UX concrete spec 6, systems spec 24). At most 4 cards,
// newest on top, 8 s each; critical ('alert') cards stay until clicked; repeats within 5 s merge into one card with a
// count; a click jumps the camera. Plus the 3 s critical banner under the Raid Clock and a 50-entry history (L).
import { G, MSG } from '../state.js';
import { icon } from './icons.js';
import { $, el, esc, setText, fmtTime } from './util.js';
import { focus } from '../input.js';
import { UI, sound } from './ustate.js';

const MAX_CARDS = 4, LIFE = 8, MERGE = 5;
export const HISTORY = [];
const cards = []; // { el, key, n, t, kind, x, z, msg }

const CATS = [
  [/raid|wave|incoming|attack|enemy|landing|bomber|warship|destroyer|battleship|gunboat|jets?\b/i, 'Raid', 'alert-octagon'],
  [/fire|burn|blaze|flame/i, 'Fire', 'flame'],
  [/milestone|reached|unlock|now a (village|town|city|metropolis)/i, 'Milestone', 'award'],
  [/research/i, 'Research', 'flask-2'],
  [/power|\bMW\b|blackout/i, 'Power', 'bolt'],
  [/water|\bkL\b/i, 'Water', 'droplet'],
  [/bankrupt|treasury|budget|tax|income|sold|afford|money|\$/i, 'Treasury', 'coins'],
  [/abandon|road|zone|lot|street|build|upgrade/i, 'City', 'building-community'],
];
const KIND_ICON = { alert: 'alert-octagon', bad: 'alert-triangle', info: 'info-circle', good: 'circle-check' };
const KIND_TITLE = { alert: 'Alert', bad: 'Problem', info: 'Harbour Log', good: 'Report' };

export function classify(m) {
  const text = String(m.text || '');
  let title = m.title || '', body = text, ic = m.icon || null;
  const c = text.indexOf(': ');
  if (!title && c > 0 && c <= 34) { title = text.slice(0, c); body = text.slice(c + 2); }
  let cat = null;
  for (const [re, name, i] of CATS) if (re.test(text)) { cat = name; if (!ic) ic = i; break; }
  if (!title) title = cat || KIND_TITLE[m.kind] || 'Harbour Log';
  // warnings always carry a triangle, never colour alone; good news about raids gets a shield
  if (m.kind === 'bad' && ic !== 'flame') ic = 'alert-triangle';
  if (m.kind === 'good' && (cat === 'Raid' || !cat)) ic = cat === 'Raid' ? 'shield-check' : 'circle-check';
  if (!ic) ic = KIND_ICON[m.kind] || 'info-circle';
  return { title, body, icon: ic };
}

export function initLog() {
  const box = $('#log');
  box.addEventListener('click', (e) => {
    const c = e.target.closest('.lg-card');
    if (!c) return;
    const k = cards.findIndex((x) => x.el === c);
    if (k < 0) return;
    const card = cards[k];
    if (card.x != null && card.z != null) { focus(card.x, card.z, 24); sound('click'); }
    dismiss(k);
  });
}

function dismiss(k) {
  const c = cards[k];
  if (!c) return;
  cards.splice(k, 1);
  c.el.classList.add('out');
  setTimeout(() => c.el.remove(), 180);
}

export function pushMessage(m) {
  const now = performance.now() / 1000;
  const key = m.kind + '|' + m.text;
  HISTORY.unshift({ ...m, at: G.time, n: 1 });
  if (HISTORY.length > 50) HISTORY.pop();
  const ex = cards.find((c) => c.key === key && now - c.t0 < MERGE + (c.n - 1) * MERGE);
  if (ex) {
    ex.n++; ex.t = now; ex.t0 = now;
    setText(ex.el.querySelector('.lg-n'), `×${ex.n}`);
    ex.el.classList.add('multi');
    ex.el.classList.remove('bump'); void ex.el.offsetWidth; ex.el.classList.add('bump');
    if (HISTORY[1] && HISTORY[1].text === m.text) { HISTORY.shift(); HISTORY[0].n = ex.n; }
    return;
  }
  const { title, body, icon: ic } = classify(m);
  const e = el('div', `lg-card ch k-${m.kind || 'info'}${m.x != null ? ' jump' : ''}`);
  e.innerHTML = `<i class="lg-ic">${icon(ic)}</i><div class="lg-tx"><b>${esc(title)}</b><span>${esc(body)}</span></div><span class="lg-n tnum"></span>${m.x != null ? `<i class="lg-go">${icon('current-location')}</i>` : ''}`;
  const box = $('#log');
  box.prepend(e);
  cards.unshift({ el: e, key, n: 1, t: now, t0: now, kind: m.kind, x: m.x, z: m.z, msg: m });
  // keep at most 4: drop the oldest non-critical first
  while (cards.length > MAX_CARDS) {
    let k = -1;
    for (let j = cards.length - 1; j >= 0; j--) if (cards[j].kind !== 'alert') { k = j; break; }
    if (k < 0) k = cards.length - 1;
    dismiss(k);
  }
}

export function updateLog() {
  while (MSG.length) pushMessage(MSG.shift());
  const now = performance.now() / 1000;
  for (let k = cards.length - 1; k >= 0; k--) {
    const c = cards[k];
    if (c.kind !== 'alert' && now - c.t > LIFE) dismiss(k);
  }
}

export function clearLog() {
  for (let k = cards.length - 1; k >= 0; k--) dismiss(k);
  MSG.length = 0;
}

// ------------------------------------------------------------------ critical banner (3 s)

let bannerT = 0;
export function banner(text, kind = 'crit') {
  const b = $('#banner');
  setText(b.querySelector('[data-k="bntext"]'), text);
  b.className = kind;
  bannerT = 3;
}
export function updateBanner(dt) {
  if (bannerT <= 0) return;
  bannerT -= dt;
  if (bannerT <= 0) $('#banner').classList.add('hidden');
}

export function historyHTML() {
  if (!HISTORY.length) return '<div class="empty">Nothing logged yet.</div>';
  return `<ul class="hist">${HISTORY.map((m) => {
    const { title, body, icon: ic } = classify(m);
    return `<li class="k-${m.kind || 'info'}"><span class="tnum t">${fmtTime(m.at || 0)}</span><i>${icon(ic)}</i><b>${esc(title)}</b><span>${esc(body)}${m.n > 1 ? ` <em>×${m.n}</em>` : ''}</span></li>`;
  }).join('')}</ul>`;
}

export { UI };
