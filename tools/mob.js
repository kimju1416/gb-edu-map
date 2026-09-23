const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const run = async (name, fn) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage(); p.setDefaultTimeout(90000); p.on('pageerror', (e) => errs.push(name + ' ' + e.message));
    await p.goto(process.argv[2] || 'http://localhost:8795/'); await p.waitForFunction(() => document.querySelector('#loading.done'), null, { timeout: 90000 }); await p.waitForTimeout(2500);
    await fn(p); await p.screenshot({ path: `../work/m_${name}.png` }); await ctx.close();
  };
  await run('home', async (p) => {});
  await run('sheet', async (p) => { await p.tap('#handle'); await p.waitForTimeout(800); });
  await run('story', async (p) => { await p.tap('#handle'); await p.waitForTimeout(500); await p.tap('[data-story=forecast]'); await p.waitForTimeout(5000); });
  await run('school', async (p) => { await p.tap('#handle'); await p.tap('[data-tab=s]'); await p.fill('#sq', '형곡초'); await p.waitForTimeout(400); await p.tap('[data-sch]'); await p.waitForTimeout(8000); });
  await run('bar', async (p) => { await p.tap('[data-v=bar]'); await p.waitForTimeout(4000); });
  await run('city', async (p) => { await p.evaluate(() => map.jumpTo({ center: [128.338, 36.121], zoom: 14.3, pitch: 45 })); await p.waitForTimeout(9000); });
  await run('tour', async (p) => { await p.tap('#btnTour'); await p.tap('[data-act=bp-all]'); await p.waitForTimeout(9000); });
  console.log(errs.join('\n') || '오류 없음');
  await b.close();
})();
