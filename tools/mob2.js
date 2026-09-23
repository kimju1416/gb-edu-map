const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const run = async (name, fn) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage(); p.setDefaultTimeout(90000); p.on('pageerror', (e) => errs.push(name + ' ' + e.message));
    await p.goto('http://localhost:8795/'); await p.waitForFunction(() => document.querySelector('#loading.done'), null, { timeout: 90000 }); await p.waitForTimeout(5000);
    await fn(p); await p.screenshot({ path: `../work/mm_${name}.png` }); await ctx.close();
  };
  await run('1home', async () => {});
  await run('2half', async (p) => { await p.tap('#handle'); await p.waitForTimeout(800); });
  await run('3full', async (p) => { await p.tap('#handle'); await p.tap('#handle'); await p.waitForTimeout(800); });
  await run('4school', async (p) => { await p.tap('#handle'); await p.tap('[data-tab=s]'); await p.fill('#sq', '석포초'); await p.waitForTimeout(400); await p.tap('[data-sch]'); await p.waitForTimeout(7000); });
  await run('5schoolscroll', async (p) => { await p.tap('#handle'); await p.tap('[data-tab=s]'); await p.fill('#sq', '석포초'); await p.waitForTimeout(400); await p.tap('[data-sch]'); await p.waitForTimeout(4000); await p.tap('#handle'); await p.waitForTimeout(600); await p.evaluate(() => (document.querySelector('#pbody').scrollTop = 900)); await p.waitForTimeout(500); });
  await run('6dv', async (p) => { await p.tap('#handle'); await p.tap('[data-tab=s]'); await p.fill('#sq', '석포초'); await p.waitForTimeout(400); await p.tap('[data-sch]'); await p.waitForTimeout(3000); await p.evaluate(() => document.querySelector('[data-dv]').click()); await p.waitForTimeout(1500); });
  await run('7tour', async (p) => { await p.tap('#btnTour'); await p.tap('[data-act=bp-all]'); await p.waitForTimeout(11000); });
  await run('8menu', async (p) => { await p.tap('#indBtn'); await p.waitForTimeout(600); });
  await run('9city', async (p) => { await p.evaluate(() => map.jumpTo({ center: [128.338, 36.121], zoom: 14.2, pitch: 45 })); await p.waitForTimeout(10000); });
  console.log(errs.join('\n') || '오류 없음'); await b.close();
})();
