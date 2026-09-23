// 위치 표준데이터에 없는 학교(특수학교·이름 바뀐 학교)의 좌표를 키 없이 채운다
// 순서: ① 옛 이름으로 위치 자료 찾기 ② OpenStreetMap 이름 검색(같은 시군 안일 때만) ③ 주소의 읍면동 대표점
// 출력: work/geo_fallback.json  { "시군|학교명": {lat, lon, how} }
const fs = require('fs');
const path = require('path');
const https = require('https');
const ROOT = path.join(__dirname, '..');
const rd = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

// 이름이 바뀐 학교: 새 이름 → 위치 자료에 남은 옛 이름
const ALIAS = {
  '지품천초등학교증산분교장': '증산초등학교',
  '공학성의중학교': '성의중학교',
  '김천한일고등학교': '한일여자고등학교',
  '동국대학교사범대학부속선화여자고등학교': '선화여자고등학교',
  '고령중학교우곡분교장': '우곡중학교',
  '금성초등학교가음분교장': '가음초등학교',
  '후포초등학교후포동부분교장': '후포동부초등학교',
};

const emd = rd('work/gb_emd_full.geojson').features.map((f) => {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  let ax = 0, ay = 0, aa = 0;
  for (const p of polys) { const r = p[0]; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const c = r[j][0] * r[i][1] - r[i][0] * r[j][1]; aa += c; ax += (r[j][0] + r[i][0]) * c; ay += (r[j][1] + r[i][1]) * c; } }
  return { ...f.properties, polys, cx: ax / (3 * aa), cy: ay / (3 * aa) };
});
const inRing = (x, y, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const findEmd = (x, y) => emd.find((e) => e.polys.some((p) => inRing(x, y, p[0])));

const csv = fs.readFileSync(path.join(ROOT, 'raw/schloc.csv'), 'utf8').replace(/^﻿/, '').split('\n').map((l) => l.split(','));
const H = csv[0];
const loc = csv.slice(1).filter((r) => r[H.indexOf('시도교육청명')] === '경상북도교육청');

const get = (url) => new Promise((ok, no) => https.get(url, { headers: { 'User-Agent': 'gb-edu-map/0.1 (school statistics map for teachers)' } }, (res) => { let b = ''; res.on('data', (d) => (b += d)); res.on('end', () => { try { ok(JSON.parse(b)); } catch (e) { no(e); } }); }).on('error', no));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const out = fs.existsSync(path.join(ROOT, 'work/geo_fallback.json')) ? rd('work/geo_fallback.json') : {};
  for (const u of rd('work/unmatched.json')) {
    const key = `${u.sgg}|${u.name}`;
    if (out[key]) continue;
    // ① 옛 이름
    const old = ALIAS[u.name];
    const l = old && loc.find((r) => r[H.indexOf('학교명')] === old && r.join(',').includes(u.sgg));
    if (l) { out[key] = { lat: +l[H.indexOf('위도')], lon: +l[H.indexOf('경도')], how: 'alias:' + old }; console.log('옛 이름', u.name); continue; }
    // ①-2 같은 도로명주소(같은 학교급)
    const road = (u.addr || '').match(/^경상북도\s+\S+\s+(?:\S+[읍면]\s+)?\S+(?:로|길)\s*[\d-]+/);
    const byAddr = road && loc.find((r) => r[H.indexOf('학교급구분')] === u.kind && r[H.indexOf('소재지도로명주소')].replace(/\s+/g, '').startsWith(road[0].replace(/\s+/g, '')));
    if (byAddr) { out[key] = { lat: +byAddr[H.indexOf('위도')], lon: +byAddr[H.indexOf('경도')], how: 'addr:' + byAddr[H.indexOf('학교명')] }; console.log('같은 주소', u.name, '←', byAddr[H.indexOf('학교명')]); continue; }
    // ② OSM
    let hit = null;
    for (const q of [u.name, `${u.name.replace(/^(경북|경상북도)/, '')} ${u.sgg}`]) {
      const res = await get(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=kr&limit=5&viewbox=127.7,37.6,131.0,35.5&bounded=1&q=${encodeURIComponent(q)}`);
      await wait(1100);
      hit = res.find((r) => { const e = findEmd(+r.lon, +r.lat); return e && e.sigun === u.sgg; });
      if (hit) break;
    }
    if (hit) { out[key] = { lat: +(+hit.lat).toFixed(5), lon: +(+hit.lon).toFixed(5), how: 'osm' }; console.log('OSM', u.name); continue; }
    // ③ 주소 읍면동
    const toks = (u.addr || '').replace(/[()]/g, ' ').split(/\s+/);
    const e = emd.find((x) => x.sigun === u.sgg && toks.includes(x.emd));
    if (e) { out[key] = { lat: +e.cy.toFixed(5), lon: +e.cx.toFixed(5), how: 'emd' }; console.log('읍면 대표점', u.name, e.emd); continue; }
    console.log('실패', u.name, u.addr);
  }
  fs.writeFileSync(path.join(ROOT, 'work/geo_fallback.json'), JSON.stringify(out, null, 1));
})();
