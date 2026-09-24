const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(process.argv[2]); await p.waitForFunction(() => document.querySelector('#loading.done'), null, { timeout: 90000 }); await p.waitForTimeout(3000);
  await p.evaluate(() => openSchool(D.schools.find((x) => x.name === '형곡초등학교').i)); await p.waitForTimeout(4000);
  console.log('단추:', await p.evaluate(() => { const bs = [...document.querySelectorAll('[data-act=brief]')]; return bs.map((b) => b.dataset.sg + '/' + (b.offsetParent ? '보임' : '숨음')).join(', '); })); await p.evaluate(() => { const b = [...document.querySelectorAll('[data-act=brief]')].find((x) => x.offsetParent); b.scrollIntoView(); }); await p.waitForTimeout(500); await p.tap('[data-act=brief] >> visible=true'); await p.waitForTimeout(1500); console.log('바로:', await p.evaluate(() => (BR ? BR.sg : 'BR없음') + ' touring=' + touring)); await p.waitForTimeout(7500);
  console.log('브리핑:', await p.evaluate(() => BR && BR.sg + ' ' + BR.scenes[tourIdx].id + ' z' + map.getZoom().toFixed(1)));
  await p.screenshot({ path: '../work/fix_brief_from_school.png' });
  await p.evaluate(() => stopTour()); await p.waitForTimeout(1000);
  await p.evaluate(() => openSchool(D.schools.find((x) => x.name === '울릉중학교').i)); await p.waitForTimeout(4000);
  await p.tap('#btnTour'); await p.tap('[data-act=bp-all]'); await p.waitForTimeout(6000);
  console.log('둘러보기:', await p.evaluate(() => touring + ' z' + map.getZoom().toFixed(1) + ' ' + map.getCenter().lng.toFixed(2)));
  await p.screenshot({ path: '../work/fix_tour_from_school.png' });
  console.log(errs.join('\n') || '오류 없음'); await b.close();
})();
