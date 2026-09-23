// 첫 화면 속도: 느린 망(4Mbps·지연 60ms)에서 #loading.done 까지 걸린 시간
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const url = process.argv[2] || 'http://localhost:8795/';
  const out = [];
  for (let r = 0; r < +(process.argv[3] || 2); r++) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    const c = await ctx.newCDPSession(p);
    await c.send('Network.enable'); await c.send('Network.setCacheDisabled', { cacheDisabled: true });
    await c.send('Network.emulateNetworkConditions', { offline: false, latency: 60, downloadThroughput: 4e6 / 8, uploadThroughput: 1e6 / 8 });
    const t0 = Date.now();
    await p.goto(url);
    await p.waitForFunction(() => document.querySelector('#loading.done'), null, { timeout: 120000, polling: 100 });
    const t1 = Date.now() - t0;
    const fetches = await p.evaluate(() => performance.getEntriesByType('resource').filter((e) => /data\/|maplibre-gl\.js|positron|terrarium|vworld/.test(e.name)).slice(0, 14).map((e) => `${e.name.split('/').slice(-2).join('/').slice(0, 40).padEnd(40)} ${Math.round(e.startTime)}→${Math.round(e.responseEnd)}`));
    out.push(t1); console.log(`회차 ${r + 1}: ${t1}ms`); if (r === 0) console.log(fetches.join('\n'));
    await ctx.close();
  }
  console.log('평균', Math.round(out.reduce((a, x) => a + x, 0) / out.length), 'ms');
  await b.close();
})();
