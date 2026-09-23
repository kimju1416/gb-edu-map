// 사용: node shot.js <url> <out.png> [w] [h] [waitms] [js-before-shot]
const { chromium } = require('playwright-core');
(async () => {
  const [url, out, w = 1440, h = 900, wait = 6000, js] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  const logs = [];
  p.on('console', (m) => logs.push(m.type() + ': ' + m.text()));
  p.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message));
  await p.goto(url);
  await p.waitForTimeout(+wait);
  if (js) { const r = await p.evaluate(js); if (r !== undefined) console.log('JS→', typeof r === 'string' ? r : JSON.stringify(r)); await p.waitForTimeout(3500); }
  await p.screenshot({ path: out });
  console.log(logs.filter((l) => !/Download the React|DevTools/.test(l)).slice(0, 30).join('\n'));
  await b.close();
})();
