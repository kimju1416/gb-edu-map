// 지금 판 전체 훑기: 오류만 모은다
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [], url = process.argv[2];
  for (const mob of (process.argv[3] === 'm' ? [true] : [false, true])) {
    const nm = mob ? '폰' : 'PC';
    const ctx = await b.newContext(mob ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, acceptDownloads: true } : { viewport: { width: 1440, height: 900 }, acceptDownloads: true });
    const p = await ctx.newPage(); p.setDefaultTimeout(20000);
    p.on('pageerror', (e) => errs.push(`${nm} [오류] ${e.message}`));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_|vworld|net::/.test(m.text())) errs.push(`${nm} [콘솔] ${m.text().slice(0, 160)}`); });
    const step = async (name, fn) => { try { await fn(); } catch (e) { errs.push(`${nm} [검사 못함] ${name}: ${e.message.split('\n')[0]}`); } };
    await p.goto(url); await p.waitForFunction(() => document.querySelector('#loading.done'), null, { timeout: 90000 }); await p.waitForTimeout(4000);
    await step('탭 전부', async () => { for (const t of await p.$$('.ptab')) { await t.click({ force: true }); await p.waitForTimeout(900); } });
    await step('지표 전부', async () => { const keys = await p.evaluate(() => Object.keys(IND)); for (const k of keys) { await p.evaluate((k) => { S.ind = k; if (!IND[k].lv.includes(S.level)) S.level = IND[k].lv[0]; paint(); renderPanel(); }, k); await p.waitForTimeout(250); } });
    await step('단위 전부', async () => { for (const lv of ['sigun', 'emd', 'hak']) { await p.evaluate((lv) => { S.level = lv; S.ind = { sigun: 'change', emd: 'k05', hak: 'hakChg' }[lv]; paint(); renderPanel(); }, lv); await p.waitForTimeout(700); } });
    await step('보기 3가지', async () => { for (const v of ['3d', '2d', 'bar']) { await p.evaluate((v) => { S.view = v; applyView(); }, v); await p.waitForTimeout(1500); } });
    await step('이야기 전부', async () => { const ids = await p.evaluate(() => STORIES.map((s) => s.id)); for (const id of ids) { await p.evaluate((id) => openStory(id), id); await p.waitForTimeout(1200); } });
    await step('학교 5곳', async () => { for (const n of ['형곡초등학교', '석포초등학교', '포항고등학교', '경북과학고등학교', '울릉중학교']) { await p.evaluate((n) => { const s = D.schools.find((x) => x.name === n); if (s) openSchool(s.i); }, n); await p.waitForTimeout(2500); } });
    await step('공시 뷰어', async () => { const b2 = await p.$('[data-act=disc], .discbtn'); if (b2) { await b2.click({ force: true }); await p.waitForTimeout(2500); await p.keyboard.press('Escape'); } });
    await step('시군·읍면동 열기', async () => { await p.evaluate(() => openSigun('안동시')); await p.waitForTimeout(2000); });
    await step('어두운 화면', async () => { await p.evaluate(() => setTheme(true)); await p.waitForTimeout(2500); await p.evaluate(() => setTheme(false)); await p.waitForTimeout(2000); });
    await step('경북 둘러보기', async () => { console.log('시작:', await p.evaluate(() => { try { startTour(); return 'ok'; } catch (e) { return e.stack.split(String.fromCharCode(10)).slice(0, 6).join(' | ') + ' || S.view=' + S.view + ' tourIdx=' + tourIdx + ' story=' + (S.story && S.story.id); } })); await p.waitForTimeout(9000); await p.evaluate(() => { tourIdx = 3; tourStep(); }); await p.waitForTimeout(6000); await p.evaluate(() => stopTour()); await p.waitForTimeout(1500); });
    await step('지역 브리핑', async () => { await p.evaluate(() => startBrief('상주시')); for (let k = 1; k < 7; k++) { await p.waitForTimeout(3500); await p.evaluate((k) => { tourIdx = k; tourStep(); }, k); } await p.waitForTimeout(3000); await p.evaluate(() => stopTour()); await p.waitForTimeout(1500); });
    await step('PDF·한글', async () => { await p.evaluate(() => openSchool(D.schools.find((x) => x.name === '석포초등학교').i)); await p.waitForTimeout(3000);
      for (const a of ['pdf', 'hwpx']) { const [d] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.evaluate((a) => document.querySelector(`[data-act=${a}]`).click(), a)]); const f = await d.path(); console.log(nm, a, d.suggestedFilename(), require('fs').statSync(f).size + 'B'); } });
    await p.screenshot({ path: `../work/smoke_${mob ? 'm' : 'd'}.png` });
    await ctx.close();
  }
  console.log(errs.length ? errs.join('\n') : '오류 없음');
  await b.close();
})();
