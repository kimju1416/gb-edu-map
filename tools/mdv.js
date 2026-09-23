const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8795/'); await p.waitForFunction(() => document.querySelector('#loading.done'), null, { timeout: 30000 }); await p.waitForTimeout(2000);
  await p.tap('#handle'); await p.tap('[data-tab=s]'); await p.fill('#sq', '석포초'); await p.waitForTimeout(400); await p.tap('[data-sch]'); await p.waitForTimeout(3000);
  await p.evaluate(() => document.querySelector('[data-dv]').click()); await p.waitForTimeout(1500);
  await p.fill('#dvQ', '돌봄'); await p.waitForTimeout(500);
  await p.screenshot({ path: '../work/m_dv.png' }); await b.close();
})();
