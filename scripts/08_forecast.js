// 학교별 학생 수 예측(2027~2032) — 비율법(cohort ratio)
// 1) 통학구역 ∩ 행정동 면적 비율로 학구 안 나이별 인구를 추정
// 2) 2026 실제 1학년 ÷ 학구 안 같은 출생 연도 인구 = 이 학교로 오는 비율(r)
// 3) 더 어린 출생 연도에 r을 곱해 해마다 입학생, 학교별 진급 비율로 학년을 올림
// 4) 중학교 입학생 = 중학구 안 초등학교 6학년(전년) × 비율
// 06_population.js 다음에 실행. 결과: schools[].pj, stats.sigun[].pj, stats.pjTotal
const fs = require('fs'), path = require('path');
const turf = require(path.join(__dirname, '../tools/node_modules/@turf/turf'));
const ROOT = path.join(__dirname, '..');
const rd = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const schools = rd('docs/data/schools.json'), stats = rd('docs/data/stats.json');
const emds = rd('work/gb_emd_full.geojson').features;
const PY = [2027, 2028, 2029, 2030, 2031, 2032];

/* 행정동 1세 단위 인구 0~17세 (2026. 8. 말) */
const txt = new TextDecoder('euc-kr').decode(fs.readFileSync(path.join(ROOT, 'raw/pop.csv')));
const L = txt.split(/\r?\n/).filter(Boolean), H = L[0].split(','), c = (n) => H.indexOf(n);
const ages = {};
for (const ln of L.slice(1)) { const r = ln.split(','); if (r[c('시도명')] !== '경상북도') continue; ages[r[c('행정기관코드')]] = Array.from({ length: 18 }, (_, a) => (+r[c(`${a}세남자`)] || 0) + (+r[c(`${a}세여자`)] || 0)); }
// 출생 연도 B 인구 ≈ 만 나이(2026−B)의 8/12 + 만 나이(2025−B)의 4/12 (8월 말 기준, 출생 고르게 가정)
const born = (a, B) => (2 / 3) * (a[2026 - B] || 0) + (1 / 3) * (a[2025 - B] || 0);
// 입학 연도 Y의 초1 = Y−7년생
const entryCohort = (a, Y) => born(a, Y - 7);

/* 학구 ∩ 행정동 → 학구의 나이별 인구 */
const emdArea = emds.map((e) => turf.area(e));
const emdBox = emds.map((e) => turf.bbox(e));
function zoneAges(zone) {
  const zb = turf.bbox(zone), out = new Array(18).fill(0);
  emds.forEach((e, i) => {
    const b = emdBox[i]; if (b[0] > zb[2] || b[2] < zb[0] || b[1] > zb[3] || b[3] < zb[1]) return;
    const a = ages[e.properties.code]; if (!a) return;
    let inter; try { inter = turf.intersect(turf.featureCollection([zone, e])); } catch (err) { return; }
    if (!inter) return;
    const w = turf.area(inter) / emdArea[i];
    for (let k = 0; k < 18; k++) out[k] += w * a[k];
  });
  return out;
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const sum = (a) => a.reduce((x, y) => x + (y || 0), 0);
const med = (a) => { const b = a.filter((v) => isFinite(v)).sort((x, y) => x - y); return b.length ? b[b.length >> 1] : null; };

/* 진급 비율: 학교 값을 시군 값 쪽으로 당긴다(작은 학교는 흔들림이 크므로) */
function survival(s, grades) {
  if (!s.g25) return null;
  const prev = sum(s.g25.slice(0, grades - 1)), now = sum(s.g.slice(1, grades));
  return prev ? { v: now / prev, n: prev } : null;
}
const sgSurv = {};
for (const kind of ['초등학교', '중학교']) {
  const gr = kind === '초등학교' ? 6 : 3;
  for (const sg of Object.keys(stats.sigun)) {
    const xs = schools.filter((s) => s.kind === kind && s.sigun === sg).map((s) => survival(s, gr)).filter(Boolean);
    const p = sum(xs.map((x) => x.n)), q = sum(xs.map((x) => x.v * x.n));
    (sgSurv[kind] ||= {})[sg] = p ? clamp(q / p, 0.9, 1.08) : 1;
  }
}
const survOf = (s, gr) => { const x = survival(s, gr), base = sgSurv[s.kind][s.sigun]; return x ? clamp((x.n * x.v + 40 * base) / (x.n + 40), 0.85, 1.1) : base; };

/* ---------- 초등학교 ---------- */
const zonesE = rd('raw/zones_e.geojson').features;
const els = schools.filter((s) => s.kind === '초등학교' && !s.state);
const byZoneE = {}; els.forEach((s) => { if (s.ze !== undefined) (byZoneE[s.ze] ||= []).push(s); });
const zAgeE = {};
let t0 = Date.now();
for (const zi of Object.keys(byZoneE)) zAgeE[zi] = zoneAges(zonesE[zi]);
console.log('초등 학구 인구 계산', Object.keys(zAgeE).length, '곳', ((Date.now() - t0) / 1000).toFixed(1) + '초');
// 비율 r 계산(공동학구는 올해 1학년 비중으로 나눔)
const rE = [];
for (const [zi, list] of Object.entries(byZoneE)) {
  const g1 = sum(list.map((s) => s.g[0]));
  for (const s of list) {
    s._share = g1 ? (s.g[0] || 0) / g1 : 1 / list.length;
    const base = s._share * entryCohort(zAgeE[zi], 2026);
    s._r = base >= 3 ? (s.g[0] || 0) / base : null;
    if (s._r !== null) rE.push({ sg: s.sigun, r: s._r });
  }
}
const rMedSg = {}; for (const sg of Object.keys(stats.sigun)) rMedSg[sg] = med(rE.filter((x) => x.sg === sg).map((x) => x.r)) ?? 1;
function projectElem(s) {
  const a = s.ze !== undefined ? zAgeE[s.ze] : null;
  const r = clamp(s._r ?? rMedSg[s.sigun], 0, 60), sv = survOf(s, 6); // 도시 학구는 면적 비례 인구가 작게 잡혀 r이 크다 — 비율법이라 그대로 써야 합이 맞음
  let g = s.g.map((v) => v || 0);
  const out = { stu: [], g1: [], g6: [] };
  for (const Y of PY) {
    const e1 = a ? r * s._share * entryCohort(a, Y) : (s.g[0] || 0);
    g = [e1, ...g.slice(0, 5).map((v) => v * sv)];
    out.stu.push(Math.round(sum(g))); out.g1.push(Math.round(e1)); out.g6.push(g[5]);
  }
  return out;
}
for (const s of els) { const p = projectElem(s); s.pj = { stu: p.stu, g1: p.g1, how: s.ze !== undefined ? (s._r !== null ? 'zone' : 'zone-sg') : 'flat' }; s._g6 = p.g6; }
// 학구 안 0~5세(앞으로 이 학교에 올 아이들), 공동학구는 올해 1학년 비중으로 나눔
for (const s of els) if (s.ze !== undefined && zAgeE[s.ze]) s.pj.kids05 = Math.round(s._share * zAgeE[s.ze].slice(0, 6).reduce((x, y) => x + y, 0));

/* ---------- 중학교 ---------- */
const zonesM = rd('raw/zones_m.geojson').features;
function inZone(z, lon, lat) { return turf.booleanPointInPolygon(turf.point([lon, lat]), z); }
const mids = schools.filter((s) => s.kind === '중학교' && !s.state);
const byZoneM = {}; mids.forEach((s) => { if (s.zm !== undefined) (byZoneM[s.zm] ||= []).push(s); });
for (const [zi, list] of Object.entries(byZoneM)) {
  const feeders = els.filter((e) => inZone(zonesM[zi], e.lon, e.lat));
  const g6now = sum(feeders.map((e) => (e.g25 ? e.g25[5] : 0))); // 올해 중1 = 작년 초6
  const g1 = sum(list.map((s) => s.g[0]));
  for (const s of list) {
    s._share = g1 ? (s.g[0] || 0) / g1 : 1 / list.length;
    s._r = g6now * s._share >= 3 ? (s.g[0] || 0) / (g6now * s._share) : null;
    s._feed = feeders;
  }
}
const rM = mids.filter((s) => s._r !== undefined && s._r !== null);
const rMsg = {}; for (const sg of Object.keys(stats.sigun)) rMsg[sg] = med(rM.filter((s) => s.sigun === sg).map((s) => s._r)) ?? 1;
for (const s of mids) {
  const sv = survOf(s, 3), r = clamp(s._r ?? rMsg[s.sigun], 0, 60);
  let g = s.g.slice(0, 3).map((v) => v || 0);
  const out = [], g1s = [];
  PY.forEach((Y, k) => {
    // Y년 중1 = (Y−1)년 초6. 2027년은 2026 실제 초6, 그 뒤는 예측
    const g6prev = s._feed ? sum(s._feed.map((e) => (k === 0 ? e.g[5] || 0 : e._g6[k - 1]))) : null;
    const e1 = s._feed && s._feed.length ? r * s._share * g6prev : (s.g[0] || 0);
    g = [e1, g[0] * sv, g[1] * sv];
    out.push(Math.round(sum(g))); g1s.push(Math.round(e1));
  });
  s.pj = { stu: out, g1: g1s, how: s._feed && s._feed.length ? 'zone' : 'flat' };
}

/* ---------- 결과 정리 ---------- */
for (const s of schools) {
  for (const k of Object.keys(s)) if (k.startsWith('_')) delete s[k];
  if (s.pj) {
    const below = PY.findIndex((y, i) => s.pj.stu[i] <= 60);
    s.pj.below60 = (s.stu[4] || 0) > 60 && below >= 0 ? PY[below] : null;
  }
}
const pjSum = (list) => PY.map((_, i) => sum(list.map((s) => (s.pj ? s.pj.stu[i] : 0))));
const actSum = (list, yi) => sum(list.map((s) => s.stu[yi]));
for (const sg of Object.keys(stats.sigun)) {
  const l = schools.filter((s) => s.sigun === sg && s.pj);
  // 초·중 학생: 2022~2026 실제(지금 있는 학교 기준) + 2027~2032 예측
  stats.sigun[sg].pj = [...[0, 1, 2, 3, 4].map((yi) => actSum(l, yi)), ...pjSum(l)];
  const a = stats.sigun[sg].pj;
  stats.sigun[sg].pjChg = a[4] ? Math.round((a[9] / a[4] - 1) * 1000) / 10 : null; // 2026→2031
  stats.sigun[sg].pjBelow = l.filter((s) => s.pj.below60 && s.pj.below60 <= 2031).length;
}
const all = schools.filter((s) => s.pj);
stats.pjTotal = { years: [2022, 2023, 2024, 2025, 2026, ...PY], stu: [...[0, 1, 2, 3, 4].map((yi) => actSum(all, yi)), ...pjSum(all)] };
stats.pjTotal.elem = pjSum(els); stats.pjTotal.mid = pjSum(mids);
stats.pjTotal.below = all.filter((s) => s.pj.below60 && s.pj.below60 <= 2031).length;
stats.pjTotal.small2031 = all.filter((s) => s.pj.stu[4] <= 60).length;
stats.pjTotal.small2026 = all.filter((s) => (s.stu[4] || 0) <= 60).length;
stats.meta.forecast = '비율법: 2026 실제 입학생 ÷ 학구 안 같은 출생 연도 인구 비율을 어린 연령에 적용, 진급 비율은 2025→2026 학교·시군 값';
fs.writeFileSync(path.join(ROOT, 'docs/data/schools.json'), JSON.stringify(schools));
fs.writeFileSync(path.join(ROOT, 'docs/data/stats.json'), JSON.stringify(stats));
const T = stats.pjTotal;
console.log('초·중 합계', T.years.map((y, i) => `${y}:${T.stu[i]}`).join(' '));
console.log('60명 이하 2026→2031', T.small2026, '→', T.small2031, '· 새로 60명 아래로', T.below);
console.log('예측 방법', Object.entries(all.reduce((o, s) => ((o[s.pj.how] = (o[s.pj.how] || 0) + 1), o), {})));
const ex = ['양서초등학교', '봉화초등학교', '석포초등학교', '포항제철중학교'].map((n) => schools.find((s) => s.name === n)).filter(Boolean);
ex.forEach((s) => console.log(s.name, s.stu.join('/'), '→', s.pj.stu.join('/'), '입학', s.pj.g1.join('/')));
