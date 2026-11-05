// node tests/city/shoot.cjs URL OUTPREFIX [width] [height] [shots-json]
// Loads the demo once, then for each shot {name, cam:{x,z,dist,yaw,tilt}, tod, gt, clay} sets it, waits a few
// frames and writes OUTPREFIX-name.png. Prints H.stats and city stats per shot.
const { chromium } = require('playwright');
(async () => {
  const [url, prefix, w = '1200', h = '500', shotsArg = '[{"name":"a"}]', to = '600000'] = process.argv.slice(2);
  const shots = JSON.parse(shotsArg);
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text().slice(0, 2500)); });
  const t0 = Date.now();
  await page.goto(url, { timeout: +to });
  try { await page.waitForFunction(() => window.__ready === true, null, { timeout: +to }); } catch (e) { logs.push('timeout ' + e.message); }
  console.log('ready after', ((Date.now() - t0) / 1000).toFixed(1), 's');
  for (const s of shots) {
    await page.evaluate((s) => window.__shot && window.__shot(s), s);
    await page.waitForFunction(() => window.__frames >= 2, null, { timeout: +to });
    const out = `${prefix}-${s.name}.png`;
    await page.screenshot({ path: out, timeout: +to });
    const stats = await page.evaluate(() => window.H && window.H.stats);
    const city = await page.evaluate(() => window.__city && window.__city());
    const brief = city && { fullMs: +city.fullMs.toFixed(2), patchMs: +city.patchMs.toFixed(3), lots: city.lots, draws: city.draws, tris: city.tris, inst: city.instances };
    console.log(JSON.stringify({ out, t: ((Date.now() - t0) / 1000).toFixed(1), stats, city: brief }));
  }
  const city = await page.evaluate(() => window.__city && window.__city());
  if (city) console.log(city.pools.map((p) => `${p.name}:${p.count}/${p.tris}`).join(' '));
  console.log(JSON.stringify(logs.filter((l) => !l.includes('GPU stall due to ReadPixels')).slice(0, 8), null, 1));
  await browser.close();
})();
