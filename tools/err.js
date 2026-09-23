const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on('pageerror', (e) => console.log('ERR', e.message, '\n', (e.stack || '').split('\n').slice(0, 6).join('\n')));
  await p.goto('http://localhost:8795/'); await p.waitForTimeout(8000);
  await p.evaluate(process.argv[2]);
  await p.waitForTimeout(+process.argv[3] || 13000);
  await b.close();
})();
