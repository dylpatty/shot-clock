// WebGL counters without a GPU (rendering review concrete spec 17).
// node tests/ci/counters.cjs URL [frames=8] [width=3440] [height=1440] [setupJS]
// Wraps WebGL2 calls before the page loads, then reports per-frame averages for the last N frames:
// draw calls (+instances), framebuffer binds (passes), program switches, shader compiles/links (must be 0 after
// warm-up), buffer upload bytes, texture upload bytes, and synchronous stalls (readPixels/getError/getParameter/
// getProgramParameter/getShaderParameter/finish, which must be 0 per frame).
const { chromium } = require('playwright');
(async () => {
  const [url, framesArg = '8', w = '3440', h = '1440', setup = ''] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--js-flags=--expose-gc'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const C = { draw: 0, inst: 0, fb: 0, prog: 0, compile: 0, link: 0, buf: 0, tex: 0, stall: 0, frames: [] };
    window.__C = C;
    const P = WebGL2RenderingContext.prototype;
    const wrap = (name, fn) => { const o = P[name]; if (!o) return; P[name] = function (...a) { fn(a); return o.apply(this, a); }; };
    wrap('drawArrays', () => { C.draw++; });
    wrap('drawElements', () => { C.draw++; });
    wrap('drawArraysInstanced', (a) => { C.draw++; C.inst += a[3]; });
    wrap('drawElementsInstanced', (a) => { C.draw++; C.inst += a[4]; });
    wrap('bindFramebuffer', () => { C.fb++; });
    wrap('useProgram', () => { C.prog++; });
    wrap('compileShader', () => { C.compile++; });
    wrap('linkProgram', () => { C.link++; });
    wrap('bufferSubData', (a) => { C.buf += (a[2] && a[2].byteLength) || 0; });
    wrap('bufferData', (a) => { C.buf += (a[1] && a[1].byteLength) || 0; });
    wrap('texSubImage2D', (a) => { const d = a[a.length - 1]; C.tex += (d && d.byteLength) || 0; });
    wrap('texImage2D', (a) => { const d = a[a.length - 1]; C.tex += (d && d.byteLength) || 0; });
    for (const n of ['readPixels', 'getError', 'getProgramParameter', 'getShaderParameter', 'finish', 'getProgramInfoLog']) wrap(n, () => { C.stall++; });
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => raf((t) => {
      const before = { ...C, frames: undefined };
      cb(t);
      const d = {};
      for (const k of ['draw', 'inst', 'fb', 'prog', 'compile', 'link', 'buf', 'tex', 'stall']) d[k] = C[k] - before[k];
      C.frames.push(d);
      if (C.frames.length > 400) C.frames.shift();
    });
    // long tasks after warm-up
    window.__long = [];
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push(e.duration); }).observe({ entryTypes: ['longtask'] }); } catch (e) { /* unsupported */ }
  });
  await page.goto(url, { timeout: 300000 });
  if (setup) await page.evaluate(setup);
  const N = +framesArg;
  await page.waitForFunction((n) => window.__C && window.__C.frames.length >= n + 3, N, { timeout: 900000 });
  const startLen = await page.evaluate(() => window.__C.frames.length);
  await page.waitForFunction((a) => window.__C.frames.length >= a.s + a.n, { s: startLen, n: N }, { timeout: 900000 });
  const res = await page.evaluate((n) => {
    const fr = window.__C.frames.slice(-n);
    const avg = {}, max = {};
    for (const k of Object.keys(fr[0])) { avg[k] = fr.reduce((a, f) => a + f[k], 0) / fr.length; max[k] = Math.max(...fr.map((f) => f[k])); }
    return { frames: fr.length, avg, max, programs: window.__bastion && window.__bastion.R && window.__bastion.R.renderer.info.programs.length };
  }, N);
  console.log(JSON.stringify({ url, ...res, errors: errors.slice(0, 5) }, null, 1));
  await browser.close();
})();
