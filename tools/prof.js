// 둘러보기 25초 CPU 기록 → 함수별 자체 시간 상위
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(process.argv[2] || 'http://localhost:8795/'); await p.waitForFunction(() => document.querySelector('#loading.done'), null, { timeout: 30000 }); await p.waitForTimeout(3000);
  if (process.argv[4]) await p.evaluate(process.argv[4]);
  const c = await p.context().newCDPSession(p);
  await c.send('Profiler.enable'); await c.send('Profiler.setSamplingInterval', { interval: 500 }); await c.send('Profiler.start');
  await p.evaluate(() => document.querySelector('#btnTour').click());
  await p.waitForTimeout(+process.argv[3] || 25000);
  const { profile } = await c.send('Profiler.stop');
  const self = new Map(), byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const dt = profile.timeDeltas; const cnt = new Map();
  profile.samples.forEach((id, i) => cnt.set(id, (cnt.get(id) || 0) + (dt[i] || 0)));
  let tot = 0;
  for (const [id, t] of cnt) { const n = byId.get(id); const f = n.callFrame; const k = (f.functionName || '(anon)') + ' ' + f.url.split('/').pop().slice(0, 30) + ':' + f.lineNumber; self.set(k, (self.get(k) || 0) + t); tot += t; }
  const top = [...self].sort((a, b) => b[1] - a[1]).slice(0, 25);
  console.log('총', Math.round(tot / 1000), 'ms');
  for (const [k, t] of top) console.log(String(Math.round(t / 1000)).padStart(6), 'ms', k);
  // 우리 코드(index) 합계
  let mine = 0; for (const [k, t] of self) if (/ :|localhost|index|\(anon\)  :/.test(k) && !/maplibre|deck/.test(k)) mine += t;
  await b.close();
})();
