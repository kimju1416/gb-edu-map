// 둘러보기 20초 동안 프레임 간격을 잰다(느린 프레임 수·최대 간격)
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message + ' @ ' + (e.stack || '').split(String.fromCharCode(10)).slice(1, 6).join(' / ')));
  await p.goto('http://localhost:8795/'); await p.waitForFunction(() => document.querySelector('#loading.done'), null, { timeout: 30000 }); await p.waitForTimeout(3000);
  const r = await p.evaluate(async () => {
    const gaps = []; let last = performance.now(), run = true;
    const f = (t) => { gaps.push(t - last); last = t; if (run) requestAnimationFrame(f); }; requestAnimationFrame(f);
    document.querySelector('#btnTour').click();
    await new Promise((r) => setTimeout(r, 20000)); run = false;
    gaps.sort((a, b) => a - b);
    return { frames: gaps.length, p50: Math.round(gaps[gaps.length >> 1]), p95: Math.round(gaps[Math.floor(gaps.length * 0.95)]), max: Math.round(gaps[gaps.length - 1]), over100: gaps.filter((g) => g > 100).length };
  });
  console.log(JSON.stringify(r), errs.join(' | '));
  await b.close();
})();
