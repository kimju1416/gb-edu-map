const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  for (const [nm, vp, mob] of [['d', { width: 1440, height: 900 }, false], ['m', { width: 390, height: 844 }, true]]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob });
    const p = await ctx.newPage(); p.setDefaultTimeout(90000); p.on('pageerror', (e) => errs.push(nm + ' ' + e.message));
    await p.goto(process.argv[2] || 'http://localhost:8795/'); await p.waitForFunction(() => document.querySelector('#loading.done'), null, { timeout: 90000 }); await p.waitForTimeout(3000);
    await p.click('#btnTour'); await p.click('[data-act=bp-all]');
    for (const [i, t] of [[0, 3500], [0, 11000], [1, 11000]]) { if (t === 11000 && i === 1) await p.evaluate(() => { tourIdx = 1; tourStep(); }); await p.waitForTimeout(t === 11000 && i === 0 ? 7500 : t); await p.screenshot({ path: `../work/tour_${nm}_${i}_${t}.png` }); }
    await ctx.close();
  }
  console.log(errs.join('\n') || '오류 없음'); await b.close();
})();
