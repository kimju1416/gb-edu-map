const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const W = +(process.argv[3] || 390);
  const run = async (name, fn) => {
    const ctx = await b.newContext({ viewport: { width: W, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage(); p.setDefaultTimeout(90000); p.on('pageerror', (e) => errs.push(name + ' ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|vworld/.test(m.text())) errs.push(name + ' console ' + m.text().slice(0, 200)); });
    await p.goto(process.argv[2] || 'http://localhost:8795/'); await p.waitForFunction(() => document.querySelector('#loading.done'), null, { timeout: 90000 }); await p.waitForTimeout(4500);
    await fn(p); await p.screenshot({ path: `../work/m3_${name}.png` }); await ctx.close();
  };
  await run('home', async (p) => {});
  await run('menu', async (p) => { await p.tap('#indBtn'); await p.waitForTimeout(600); });
  await run('menu-kind', async (p) => { await p.tap('#indBtn'); await p.tap('#kindSeg [data-k="고등학교"]'); await p.waitForTimeout(800); await p.tap('#map', { position: { x: 200, y: 700 } }).catch(() => {}); await p.waitForTimeout(800); console.log('menu-kind sub:', await p.textContent('#indSub'), '열림:', await p.evaluate(() => document.querySelector('#inddd').classList.contains('open'))); });
  await run('lay', async (p) => { await p.tap('#btnLay'); await p.waitForTimeout(600); });
  await run('lay-dark', async (p) => { await p.tap('#btnLay'); await p.tap('#btnTheme2'); await p.waitForTimeout(2500); await p.tap('#btnLay'); await p.waitForTimeout(300); console.log('dark:', await p.evaluate(() => document.body.classList.contains('dark')), 'lay 닫힘:', await p.evaluate(() => !document.body.classList.contains('lay-open'))); });
  await run('forecast', async (p) => { await p.tap('#handle'); await p.waitForTimeout(500); await p.tap('[data-story=forecast]'); await p.waitForTimeout(5000); });
  await run('fc-text', async (p) => { await p.evaluate(() => openStory('forecast')); await p.waitForTimeout(2500); await p.evaluate(() => { document.querySelector('#panel').classList.remove('min'); document.body.classList.remove('sheet-min'); document.querySelector('#panel').classList.add('full'); document.body.classList.add('sheet-full'); }); await p.waitForTimeout(600); const txt = await p.textContent('#pbody'); console.log('고등 문단:', (txt.match(/고등학교는 통학구역이 없어[^.]*\.[^.]*\./) || ['없음'])[0]); await p.evaluate(() => { const el = [...document.querySelectorAll('#pbody p')].find((x) => x.textContent.includes('고등학교는 통학구역')); el && el.scrollIntoView(); }); await p.waitForTimeout(300); });
  await run('high', async (p) => { await p.evaluate(() => openSchool(D.schools.find((x) => x.name === '포항고등학교').i)); await p.waitForTimeout(6000); await p.evaluate(() => { document.querySelector('#panel').classList.add('full'); document.body.classList.add('sheet-full'); document.querySelector('#panel').classList.remove('min'); document.body.classList.remove('sheet-min'); const el = [...document.querySelectorAll('.sec-l')].find((x) => x.textContent.includes('추정')); el && el.scrollIntoView(); }); await p.waitForTimeout(600); });
  console.log(errs.join('\n') || '오류 없음');
  await b.close();
})();
