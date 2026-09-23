const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(process.argv[2] || 'http://localhost:8795/');
  const t0 = Date.now();
  for (const ms of [2500, 5000, 8000, 12000]) { await p.waitForTimeout(ms - (Date.now() - t0)); await p.screenshot({ path: `../work/intro_${ms}.png` }); }
  await b.close();
})();
