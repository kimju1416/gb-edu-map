# 경북교육지도

경상북도 초·중·고·특수학교 925곳(2026. 4. 1. 기준)의 5년 통계를 3D 지도로 보는 교사용 정보 사이트입니다.

- 학생 수 변화(2022~2026), 학급당·교원 1인당 학생 수, 학생 1인당 교지 면적
- 작은학교(60명 이하), 신입생 0명 학교, 면·도서벽지 지역 학교 비율
- 법정 도서·벽지 지정 학교, 폐교 재산과 활용 현황, 인구감소지역
- 읍면동별 가장 가까운 초·중·고까지 직선거리
- 학교 카드: 5년 학생 수, 학년별 학생, 경북 중앙값 비교, 비슷한 규모 학교, 나이스 급식·학사일정(실시간)
- 교육문제 질문 8개와 시연(드론 투어) 모드

## 구조

```
docs/            GitHub Pages로 나가는 사이트(단일 index.html + data/*.json)
scripts/         공개 자료 → docs/data 변환
  01_kess_extract.py      KESS 학교별 엑셀(2022~2026)에서 경북 학교만 추출
  02_build.js             학교 위치·도서벽지·폐교·경계를 붙여 JSON 생성
  03_geocode_fallback.js  위치 자료에 없는 학교 좌표 채우기(키 없음)
  04_verify.py            원자료 엑셀 합계와 지도 자료 합계 대조
```

## 자료 새로 만들기

원자료(`raw/`)는 용량이 커서 저장소에 넣지 않았습니다. 아래 주소에서 받아 `raw/`에 둡니다.

| 파일 | 출처 |
|---|---|
| `kess_2022.xlsx` ~ `kess_2026.xlsx` | [KESS 학교별 데이터셋(상반기)](https://kess.kedi.re.kr/contents/dataset) |
| `schloc.csv` | [한국교육시설안전원 초중등학교위치](https://www.data.go.kr/data/15159184/fileData.do) |
| `closed.json` | [전국폐교재산기본정보 표준데이터](https://www.data.go.kr/data/15107729/standard.do) |
| `hjd.geojson` | [행정동 경계 vuski/admdongkor ver20260701](https://github.com/vuski/admdongkor) |
| `byeokji.json` | [도서·벽지 교육진흥법 시행규칙 별표](https://www.law.go.kr/LSW/lsBylInfoP.do?bylSeq=17938657&lsiSeq=282771&efYd=20260301)에서 경북 학교 추출 |

```bash
python scripts/01_kess_extract.py
bash scripts/00_boundaries.sh
node scripts/02_build.js
node scripts/03_geocode_fallback.js && node scripts/02_build.js
python scripts/04_verify.py   # 한 곳이라도 다르면 실패로 끝남
```

## 출처 표기

통계: 한국교육개발원 교육통계서비스(KESS) · 위치: 한국교육시설안전원 · 경계: 통계청 SGIS(vuski/admdongkor) · 폐교: 공공데이터포털 표준데이터 · 급식·학사일정: 나이스 교육정보 개방 포털 · 배경 지도: OpenFreeMap, © OpenStreetMap 기여자 · 지형: Mapzen Terrain Tiles(AWS)
