const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8795/'); await p.waitForFunction(() => document.querySelector('#loading.done'), null, { timeout: 30000 }); await p.waitForTimeout(2000);
  await p.click('[data-tab=s]'); await p.fill('#sq', '석포초'); await p.waitForTimeout(300); await p.click('[data-sch]'); await p.waitForTimeout(4000);
  const [pop] = await Promise.all([ctx.waitForEvent('page'), p.click('[data-act=report]')]);
  await pop.evaluate(() => { window.print = () => {}; });
  await pop.waitForTimeout(3500);
  await pop.emulateMedia({ media: 'print' });
  await pop.pdf({ path: '../work/report.pdf', format: 'A4', printBackground: true }).catch(() => {});
  await pop.setViewportSize({ width: 820, height: 1160 }); await pop.screenshot({ path: '../work/report.png', fullPage: true });
  console.log(errs.join(' | ') || '오류 없음');
  await b.close();
})();
