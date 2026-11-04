import { W } from './world.js';

// A* over the hex grid with reusable typed arrays, so a search allocates only its result
let gScore, came, seen, closed, heapI, heapF, hn = 0, stamp = 0;

export function initPath() {
  const n = W.count;
  gScore = new Float32Array(n);
  came = new Int32Array(n);
  seen = new Uint32Array(n);
  closed = new Uint32Array(n);
  heapI = new Int32Array(n * 8);
  heapF = new Float32Array(n * 8);
  stamp = 0;
}

function push(i, f) {
  if (hn >= heapI.length) return;
  let k = hn++;
  heapI[k] = i; heapF[k] = f;
  while (k > 0) {
    const p = (k - 1) >> 1;
    if (heapF[p] <= heapF[k]) break;
    const ti = heapI[p], tf = heapF[p];
    heapI[p] = heapI[k]; heapF[p] = heapF[k]; heapI[k] = ti; heapF[k] = tf;
    k = p;
  }
}

function pop() {
  const top = heapI[0];
  hn--;
  if (hn > 0) {
    heapI[0] = heapI[hn]; heapF[0] = heapF[hn];
    let k = 0;
    for (;;) {
      const l = k * 2 + 1, r = l + 1;
      let m = k;
      if (l < hn && heapF[l] < heapF[m]) m = l;
      if (r < hn && heapF[r] < heapF[m]) m = r;
      if (m === k) break;
      const ti = heapI[m], tf = heapF[m];
      heapI[m] = heapI[k]; heapF[m] = heapF[k]; heapI[k] = ti; heapF[k] = tf;
      k = m;
    }
  }
  return top;
}

// cost(next, from) > 0 to enter a tile, <= 0 when impassable. Returns tile indices from start to goal.
export function findPath(start, cost, isGoal, heuristic, maxIter = 5000) {
  if (start < 0) return null;
  stamp++;
  hn = 0;
  gScore[start] = 0; seen[start] = stamp; came[start] = -1;
  push(start, heuristic(start));
  let it = 0;
  while (hn > 0 && it++ < maxIter) {
    const cur = pop();
    if (closed[cur] === stamp) continue;
    closed[cur] = stamp;
    if (isGoal(cur)) {
      const path = [];
      for (let c = cur; c !== -1; c = came[c]) path.push(c);
      path.reverse();
      return path;
    }
    const gc = gScore[cur];
    for (let d = 0; d < 6; d++) {
      const nb = W.nbr[cur * 6 + d];
      if (nb < 0 || closed[nb] === stamp) continue;
      const c = cost(nb, cur);
      if (c <= 0) continue;
      const ng = gc + c;
      if (seen[nb] !== stamp || ng < gScore[nb]) {
        seen[nb] = stamp; gScore[nb] = ng; came[nb] = cur;
        push(nb, ng + heuristic(nb));
      }
    }
  }
  return null;
}
