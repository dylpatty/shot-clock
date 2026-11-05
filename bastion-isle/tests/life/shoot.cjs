// node tests/life/shoot.cjs URL OUT.png [width=1200] [height=500] [timeoutMs=400000]
// Like tests/gfx/shoot.cjs, plus the gfx-life counters (window.__life, __lifeDraws, __lmDraws, __markers, __perf).
const { chromium } = require('playwright');
(async () => {
  const [url, out, w = '1200', h = '500', to = '400000'] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const logs = [];
  page.on('pageerror', (e) => logs.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 6).join('\n')));
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) || m.text().startsWith('PERF')) logs.push(m.type() + ': ' + m.text().slice(0, 1500)); });
  await page.goto(url, { timeout: +to });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: +to });
  await page.screenshot({ path: out, timeout: +to });
  const info = await page.evaluate(() => ({ stats: window.H && window.H.stats, life: window.__life, lifeDraws: window.__lifeDraws, lmDraws: window.__lmDraws, markers: window.__markers, perf: window.__perf }));
  console.log(JSON.stringify({ out, ...info, logs: logs.filter((l) => !l.includes('GPU stall due to ReadPixels')).slice(0, 14) }, null, 1));
  await browser.close();
})();
