// node tests/ui/shoot.cjs URL OUTDIR [sizes] [scenes]
//   sizes: comma list like 3440x1440,2560x1440,1920x1080   scenes: hud,lot,raid,budget,research,report,menu,settings,help,pause,over
// Loads the UI demo once per size, switches scenes through window.__demo, screenshots each, and prints panel overlaps.
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [url, out, sizesArg = '3440x1440,2560x1440,1920x1080', scenesArg = 'hud,lot,raid,budget,research,report,menu,settings,help,pause,over'] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const report = {};
  for (const size of sizesArg.split(',')) {
    const [w, h] = size.split('x').map(Number);
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const logs = [];
    page.on('pageerror', (e) => logs.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text().slice(0, 300)); });
    await page.goto(url, { timeout: 300000 });
    await page.waitForFunction(() => window.__ready === true && window.__demo, null, { timeout: 300000 });
    for (const sc of scenesArg.split(',')) {
      await page.evaluate((n) => window.__demo.scene(n), sc);
      const f0 = await page.evaluate(() => window.__demo.frames());
      await page.waitForFunction((f) => window.__demo.frames() >= f + 4, f0, { timeout: 120000 });
      await page.evaluate(() => window.__demo.ready());
      const f1 = await page.evaluate(() => window.__demo.frames());
      await page.waitForFunction((f) => window.__demo.frames() >= f + 2, f1, { timeout: 120000 });
      const file = `${out}/${sc}-${w}x${h}.png`;
      await page.screenshot({ path: file, timeout: 300000 });
      report[`${sc}@${size}`] = await page.evaluate(() => window.__demo.overlaps());
      console.log('shot', file, JSON.stringify(report[`${sc}@${size}`]));
    }
    if (logs.length) console.log('logs', size, logs.slice(0, 15).join('\n'));
    await page.close();
  }
  fs.writeFileSync(`${out}/overlaps.json`, JSON.stringify(report, null, 1));
  await browser.close();
})();
