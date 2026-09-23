// 행정안전부 행정동별 1세 단위 주민등록 인구(raw/pop.csv, EUC-KR)와 학구 경계를 stats.json·schools.json에 붙인다
// 02_build.js 다음에 실행한다.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const rd = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const stats = rd('docs/data/stats.json');
const schools = rd('docs/data/schools.json');

/* ---------- 인구 ---------- */
const txt = new TextDecoder('euc-kr').decode(fs.readFileSync(path.join(ROOT, 'raw/pop.csv')));
const lines = txt.split(/\r?\n/).filter(Boolean);
const H = lines[0].split(',');
const col = (name) => H.indexOf(name);
const ageCols = (a) => [col(`${a}세남자`), col(`${a}세여자`)];
const month = lines[1].split(',')[col('기준연월')].replace(/\D/g, ''); // 예: 20260831
let hit = 0;
const pop = {};
for (const ln of lines.slice(1)) {
  const r = ln.split(',');
  if (r[col('시도명')] !== '경상북도') continue;
  const code = r[col('행정기관코드')];
  const age = (a) => ageCols(a).reduce((s, i) => s + (+r[i] || 0), 0);
  const range = (a, b) => { let s = 0; for (let x = a; x <= b; x++) s += age(x); return s; };
  pop[code] = { total: +r[col('계')] || 0, a0: range(0, 2), a6: range(6, 8), a0_5: range(0, 5), a6_11: range(6, 11), a12_17: range(12, 17), a0_14: range(0, 14) };
}
const r1 = (v) => (v === null || !isFinite(v) ? null : Math.round(v * 10) / 10);
for (const [code, e] of Object.entries(stats.emd)) {
  const p = pop[code];
  if (!p) { console.warn('인구 없음', e.sigun, e.emd, code); continue; }
  hit++;
  Object.assign(e, { pop: p.total, k05: p.a0_5, k611: p.a6_11, k014: p.a0_14, a0: p.a0, a6: p.a6,
    kidShare: p.total ? r1((p.a0_14 / p.total) * 100) : null });
}
console.log('읍면동 인구 연결', hit, '/', Object.keys(stats.emd).length, '기준', month);
for (const sg of Object.keys(stats.sigun)) {
  const es = Object.values(stats.emd).filter((e) => e.sigun === sg && e.pop !== undefined);
  const sum = (k) => es.reduce((a, e) => a + (e[k] || 0), 0);
  const s = stats.sigun[sg];
  Object.assign(s, { pop: sum('pop'), k05: sum('k05'), k611: sum('k611'), k014: sum('k014'), a0: sum('a0'), a6: sum('a6') });
  s.kidShare = s.pop ? r1((s.k014 / s.pop) * 100) : null;
  // 0~2세 ÷ 6~8세(지금 초1~3 또래): 몇 년 뒤 초등 입학생이 지금보다 얼마나 줄어드는지
  s.cohort = s.a6 ? r1((s.a0 / s.a6 - 1) * 100) : null;
}
for (const e of Object.values(stats.emd)) e.cohort = e.a6 >= 30 ? r1((e.a0 / e.a6 - 1) * 100) : null; // 6~8세가 30명 미만이면 비율이 튀므로 비움
const tot = (k) => Object.values(stats.sigun).reduce((a, s) => a + (s[k] || 0), 0);
stats.popTotal = { pop: tot('pop'), k05: tot('k05'), k611: tot('k611'), k014: tot('k014'), a0: tot('a0'), a6: tot('a6') };
stats.popTotal.cohort = r1((stats.popTotal.a0 / stats.popTotal.a6 - 1) * 100);
stats.meta.popMonth = `${month.slice(0, 4)}. ${+month.slice(4, 6)}.`;
stats.meta.sources = stats.meta.sources.filter((s) => !/주민등록/.test(s.name)).concat([
  { name: '행정안전부 지역별(행정동) 성별 연령별 주민등록 인구수', url: 'https://www.data.go.kr/data/15097972/fileData.do', date: `${month.slice(0, 4)}. ${+month.slice(4, 6)}. 말` },
  { name: '학구도안내시스템 통학구역(교육부·한국교육학술정보원)', url: 'https://schoolzone.emac.kr', date: '2026-09 조회' },
]);
console.log('경북 인구', stats.popTotal);

/* ---------- 학구: 학교 점이 들어가는 통학구역 ---------- */
function inRing(x, y, ring) { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; }
function ringKm2(ring, lat) { let a = 0; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]; return Math.abs(a / 2) * 111.32 * 110.54 * Math.cos((lat * Math.PI) / 180); }
for (const [lv, kind, key] of [['e', '초등학교', 'ze'], ['m', '중학교', 'zm']]) {
  const z = rd(`docs/data/zones_${lv}.geojson`).features;
  z.forEach((f) => { const rings = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates; f._p = rings; const lat = rings[0][0][0][1]; f._km2 = rings.reduce((a, p) => a + ringKm2(p[0], lat) - p.slice(1).reduce((b, h) => b + ringKm2(h, lat), 0), 0); });
  let n = 0;
  for (const s of schools.filter((x) => x.kind === kind)) {
    const i = z.findIndex((f) => f._p.some((p) => inRing(s.lon, s.lat, p[0]) && !p.slice(1).some((h) => inRing(s.lon, s.lat, h))));
    if (i >= 0) { s[key] = i; s[key + 'n'] = z[i].properties.name; s[key + 'a'] = r1(z[i]._km2); n++; }
  }
  console.log(kind, '학구 연결', n, '/', schools.filter((x) => x.kind === kind).length);
}
fs.writeFileSync(path.join(ROOT, 'docs/data/stats.json'), JSON.stringify(stats));
fs.writeFileSync(path.join(ROOT, 'docs/data/schools.json'), JSON.stringify(schools));
