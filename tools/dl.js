const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8795/'); await p.waitForFunction(() => document.querySelector('#loading.done'), null, { timeout: 30000 }); await p.waitForTimeout(2000);
  await p.click('[data-tab=s]'); await p.fill('#sq', '석포초'); await p.waitForTimeout(300); await p.click('[data-sch]'); await p.waitForTimeout(4000);
  for (const [act, ext] of [['hwpx', 'hwpx'], ['pdf', 'pdf']]) {
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.click(`[data-act=${act}]`)]);
    const f = `../work/test.${ext}`; await dl.saveAs(f); console.log(act, dl.suggestedFilename(), require('fs').statSync(f).size, 'B');
  }
  console.log(errs.join(' | ') || '오류 없음'); await b.close();
})();
