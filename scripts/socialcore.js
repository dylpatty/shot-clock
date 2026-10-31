/* The Social tab's lists: merging each run's posts into the last day's feed (social.json) and keeping the biggest posts
   of the week and season (social-archive.json). Source readers live in social-sources.js; this file has no network. */

const HOUR = 3600000, DAY = 24 * HOUR;
// Per site, how many of its biggest posts the week and season lists keep
export const KEEP = { week: 60, season: 100 };
// The season starts in October; the season list covers from Oct 1 (or last Oct 1 before July)
export function seasonStart(now) {
  const d = new Date(now), y = d.getUTCMonth() >= 6 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  return Date.UTC(y, 9, 1);
}

// The same yardstick the site ranks by: comments and reposts count extra, since they mean people are talking. A Reddit
// post's score is only real once the archive re-reads it (sf); before that its comments stand in. Game threads pile up
// thousands of play-by-play comments, so theirs count for little
export function engagement(it) {
  const s = it.stats || {};
  if (it.src === 'reddit') { const c = (s.replies || 0) * (/game thread/i.test(it.flair || '') ? 0.15 : 1); return (it.sf ? (s.up || 0) : 4 * c) + 3 * c; }
  return (s.likes || 0) + 2 * (s.reposts || 0) + 3 * (s.replies || 0) + 2 * (s.quotes || 0);
}

/* Merges fresh posts into the previous list: a post seen again keeps its first time and gets the newer counts (counts
   only go up, so a source that reports less this run, or a cached copy, can't shrink them); posts older than a day leave.
   fresh: { src: items[] } for the sources read this run */
export function mergeFeed(prevItems, fresh, now) {
  const by = new Map((prevItems || []).map(it => [it.id, it]));
  for (const list of Object.values(fresh)) {
    for (const it of list || []) {
      if (!it || !it.id || !it.time) continue;
      const old = by.get(it.id);
      if (!old) { by.set(it.id, it); continue; }
      const stats = Object.assign({}, old.stats);
      Object.entries(it.stats || {}).forEach(([k, v]) => { if (Number.isFinite(v)) stats[k] = Math.max(v, stats[k] || 0); });
      by.set(it.id, Object.assign({}, old, it, { time: old.time || it.time, stats, top: it.top || old.top, media: (it.media && it.media.length ? it.media : old.media) }));
    }
  }
  return [...by.values()].filter(it => now - it.time < DAY).sort((a, b) => b.time - a.time);
}

// The biggest posts per site within a window, from the previous list plus today's
export function mergeArchive(prevList, items, since, keep) {
  const by = new Map();
  [...(prevList || []), ...items].forEach(it => {
    if (!it || it.time < since) return;
    const old = by.get(it.id);
    if (!old || engagement(it) >= engagement(old)) by.set(it.id, it);
  });
  const groups = {};
  by.forEach(it => { (groups[it.src] = groups[it.src] || []).push(it); });
  return Object.values(groups).flatMap(g => g.sort((a, b) => engagement(b) - engagement(a)).slice(0, keep));
}

export function buildArchive(prev, items, now) {
  const p = prev || {};
  return {
    week: mergeArchive(p.week, items, now - 7 * DAY, KEEP.week),
    season: mergeArchive(p.season, items, seasonStart(now), KEEP.season),
  };
}

// Posts are kept lean: long text is cut and empty fields dropped, so the lists stay small for phones
export function slim(it) {
  const out = {};
  for (const [k, v] of Object.entries(it)) {
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) continue;
    out[k] = typeof v === 'string' && v.length > 700 ? v.slice(0, 680).replace(/\s+\S*$/, '') + '…' : v;
  }
  return out;
}
