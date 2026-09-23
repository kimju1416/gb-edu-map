const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message + (e.stack||'').split(String.fromCharCode(10)).slice(1,4).join(' ')));
  await p.goto('http://localhost:8795/'); await p.waitForFunction(() => document.querySelector('#loading.done'), null, { timeout: 90000 }); await p.waitForTimeout(3000);
  await p.evaluate(() => { S.ind = 'pjStu'; paint(); });
  await p.waitForTimeout(2000);
  const r = await p.evaluate(async () => {
    const gaps = []; let last = performance.now(), run = true; const f = (t) => { gaps.push(t - last); last = t; if (run) requestAnimationFrame(f); }; requestAnimationFrame(f);
    document.querySelector('#play').click();
    const hs = []; for (let k = 0; k < 8; k++) { await new Promise((r) => setTimeout(r, 1000)); hs.push(curH['봉화군']); }
    await new Promise((r) => setTimeout(r, 1500)); run = false; gaps.sort((a, b) => a - b);
    return { frames: gaps.length, p50: Math.round(gaps[gaps.length >> 1]), p95: Math.round(gaps[Math.floor(gaps.length * .95)]), 봉화높이: hs, fy: S.fy };
  });
  console.log(JSON.stringify(r), errs.join('|') || '오류 없음'); await b.close();
})();
