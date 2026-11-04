// node tests/gfx/shoot.cjs URL OUT.png [width=1720] [height=720] [timeoutMs=300000]
// Waits for window.__ready (set by H.start), prints console errors and H.stats, writes a screenshot.
const { chromium } = require('playwright');
(async () => {
  const [url, out, w = '1720', h = '720', to = '300000'] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text().slice(0, 500)); });
  await page.goto(url, { timeout: +to });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: +to });
  await page.screenshot({ path: out, timeout: +to });
  const stats = await page.evaluate(() => window.H && window.H.stats);
  console.log(JSON.stringify({ out, stats, logs: logs.filter((l) => !l.includes('GPU stall due to ReadPixels')).slice(0, 12) }, null, 1));
  await browser.close();
})();
