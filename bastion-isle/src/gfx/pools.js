import * as THREE from 'three';

// Instanced mesh with a simple immediate-mode API (begin/put/end) for things that move every frame, and
// slot patching (setSlot/commit) for static content that changes rarely (lots, trees, roads).
export class Pool {
  constructor(geo, mat, max, opts = {}) {
    const m = new THREE.InstancedMesh(geo, mat, max);
    m.count = 0;
    m.frustumCulled = false;
    m.castShadow = opts.cast !== false;
    m.receiveShadow = opts.receive !== false;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.hasColor = opts.colors !== false;
    if (this.hasColor) {
      m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3).fill(1), 3);
      m.instanceColor.setUsage(THREE.DynamicDrawUsage);
    }
    if (opts.order != null) m.renderOrder = opts.order;
    this.mesh = m; this.max = max; this.n = 0;
    this.mArr = m.instanceMatrix.array;
    this.cArr = this.hasColor ? m.instanceColor.array : null;
    this.extras = [];        // extra InstancedBufferAttributes uploaded with the instances
    this.lo = Infinity; this.hi = -1; // dirty slot range for commit()
  }

  addAttribute(name, itemSize, fill = 0) {
    const a = new THREE.InstancedBufferAttribute(new Float32Array(this.max * itemSize).fill(fill), itemSize);
    a.setUsage(THREE.DynamicDrawUsage);
    this.mesh.geometry.setAttribute(name, a);
    this.extras.push(a);
    return a;
  }

  begin() { this.n = 0; }

  // y-rotation + per-axis scale + colour
  put(x, y, z, yaw = 0, sx = 1, sy = 1, sz = 1, r = 1, g = 1, b = 1) {
    if (this.n >= this.max) return -1;
    this.write(this.n, x, y, z, yaw, sx, sy, sz, r, g, b);
    return this.n++;
  }
  putMatrix(m4, r = 1, g = 1, b = 1) {
    if (this.n >= this.max) return -1;
    m4.toArray(this.mArr, this.n * 16);
    if (this.cArr) { const k = this.n * 3; this.cArr[k] = r; this.cArr[k + 1] = g; this.cArr[k + 2] = b; }
    return this.n++;
  }
  write(slot, x, y, z, yaw, sx, sy, sz, r = 1, g = 1, b = 1) {
    const o = slot * 16, a = this.mArr, c = Math.cos(yaw), s = Math.sin(yaw);
    a[o] = c * sx; a[o + 1] = 0; a[o + 2] = -s * sx; a[o + 3] = 0;
    a[o + 4] = 0; a[o + 5] = sy; a[o + 6] = 0; a[o + 7] = 0;
    a[o + 8] = s * sz; a[o + 9] = 0; a[o + 10] = c * sz; a[o + 11] = 0;
    a[o + 12] = x; a[o + 13] = y; a[o + 14] = z; a[o + 15] = 1;
    if (this.cArr) { const k = slot * 3; this.cArr[k] = r; this.cArr[k + 1] = g; this.cArr[k + 2] = b; }
  }
  end() {
    const m = this.mesh;
    m.count = this.n;
    m.visible = this.n > 0;
    if (!this.n) return;
    this.upload(0, this.n);
  }

  // --- static content: fixed capacity, write individual slots, then commit the touched range
  setCount(n) { this.n = n; this.mesh.count = n; this.mesh.visible = n > 0; }
  setSlot(slot, x, y, z, yaw, sx, sy, sz, r, g, b) {
    this.write(slot, x, y, z, yaw, sx, sy, sz, r, g, b);
    if (slot < this.lo) this.lo = slot;
    if (slot > this.hi) this.hi = slot;
  }
  hideSlot(slot) { this.setSlot(slot, 0, -500, 0, 0, 0, 0, 0, 0, 0, 0); }
  touch(slot) { if (slot < this.lo) this.lo = slot; if (slot > this.hi) this.hi = slot; }
  commit() {
    if (this.hi < this.lo) return 0;
    const n = this.hi - this.lo + 1;
    this.upload(this.lo, n);
    this.lo = Infinity; this.hi = -1;
    return n;
  }

  upload(start, count) {
    const im = this.mesh.instanceMatrix;
    im.clearUpdateRanges(); im.addUpdateRange(start * 16, count * 16); im.needsUpdate = true;
    if (this.cArr) {
      const ic = this.mesh.instanceColor;
      ic.clearUpdateRanges(); ic.addUpdateRange(start * 3, count * 3); ic.needsUpdate = true;
    }
    for (const e of this.extras) {
      e.clearUpdateRanges(); e.addUpdateRange(start * e.itemSize, count * e.itemSize); e.needsUpdate = true;
    }
    Pool.uploaded += count * (16 + (this.cArr ? 3 : 0)) * 4;
  }
}
Pool.uploaded = 0; // bytes uploaded since the counter was last reset (F3 overlay)
