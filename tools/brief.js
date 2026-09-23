// 지역 브리핑 검사: 고르기 창, 장면마다 캡처, 끝내기 뒤 원래 지도로 돌아오는지
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const url = process.argv[2] || 'http://localhost:8795/';
  const only = process.argv[3]; // d | m
  for (const [nm, vp, mob] of [['d', { width: 1440, height: 900 }, false], ['m', { width: 390, height: 844 }, true]]) {
    if (only && only !== nm) continue;
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob });
    const p = await ctx.newPage(); p.setDefaultTimeout(90000);
    p.on('pageerror', (e) => errs.push(nm + ' ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|vworld|ERR_/.test(m.text())) errs.push(nm + ' console ' + m.text().slice(0, 200)); });
    await p.goto(url); await p.waitForFunction(() => document.querySelector('#loading.done'), null, { timeout: 90000 }); await p.waitForTimeout(3000);
    await p.click('#btnTour'); await p.waitForTimeout(600);
    await p.screenshot({ path: `../work/br_${nm}_pick.png` });
    await p.click('[data-brief="구미시"]');
    const n = await p.evaluate(() => BR.scenes.length);
    for (let k = 0; k < n; k++) {
      if (k) await p.evaluate((k) => { tourIdx = k; tourStep(); }, k);
      await p.waitForTimeout(k === 2 ? 12000 : 9500);
      await p.screenshot({ path: `../work/br_${nm}_${k}.png` });
      const info = await p.evaluate(() => ({ id: BR.scenes[tourIdx].id, mk: brMk.length, vis: brMk.filter((m) => !m.getElement().classList.contains('dc')).length, h: Object.keys(brHnow).length, top: document.querySelector('#ttop').textContent.slice(0, 60) }));
      console.log(nm, k, JSON.stringify(info));
    }
    // 끝내기 → 원래 지도
    await p.click('#tStop'); await p.waitForTimeout(1500);
    console.log(nm, '끝낸 뒤', await p.evaluate(() => ({ br: BR, briefing: document.body.classList.contains('briefing'), sigunFill: map.getLayoutProperty('sigun-fill', 'visibility'), brBar: map.getLayoutProperty('br-bar', 'visibility'), lbl: document.querySelectorAll('.lbl.brl').length })));
    // 작은 군·울릉
    for (const sg of ['영양군', '울릉군']) {
      await p.evaluate((sg) => startBrief(sg), sg); await p.waitForTimeout(6000);
      console.log(nm, sg, await p.evaluate(() => BR.scenes.map((x) => x.id).join(',')));
      await p.screenshot({ path: `../work/br_${nm}_${sg}.png` });
      await p.evaluate(() => stopTour());
    }
    await ctx.close();
  }
  console.log(errs.join('\n') || '오류 없음');
  await b.close();
})();
