// node tests/models/shoot.cjs URL OUTDIR shot[@tod],shot[@tod],... [width=1720] [height=720]
// Loads the line-up page once, then for each shot moves the camera (window.goShot) and screenshots after 2 frames.
const { chromium } = require('playwright');
(async () => {
  const [url, outdir, list, w = '1720', h = '720'] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 6).join('\n')));
  page.on('console', (m) => { if (['error', 'warning', 'log'].includes(m.type())) logs.push(m.type() + ': ' + m.text().slice(0, 800)); });
  await page.goto(url, { timeout: 900000 });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 900000 });
  const t0 = Date.now();
  for (const item of list.split(',')) {
    const [name, tod] = item.split('@');
    await page.evaluate(([n, t]) => window.goShot(n, t == null ? null : +t), [name, tod == null ? null : tod]);
    await page.waitForFunction(() => window.shotFrames() >= 3, null, { timeout: 900000 });
    const out = `${outdir}/${name}${tod ? '-' + tod : ''}.png`;
    await page.screenshot({ path: out, timeout: 900000 });
    console.log('shot', out, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  const rep = await page.evaluate(() => window.__report);
  console.log(JSON.stringify({ rep, logs: logs.filter((l) => !l.includes('GPU stall')).slice(0, 20) }, null, 1));
  await browser.close();
})();
