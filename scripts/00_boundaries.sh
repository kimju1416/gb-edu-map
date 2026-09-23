#!/usr/bin/env bash
# 행정동 경계(전국) → 경북 읍면동·시군·주변 시도 경계
set -e
cd "$(dirname "$0")/.."
MS="npx --yes mapshaper"
OUT=${OUT:-docs/data}
$MS raw/hjd.geojson -filter 'sidonm=="경상북도"' -each 'sigun=sggnm.replace(/\s*(남구|북구)$/,"").replace(/(시)(남구|북구)$/,"$1"); emd=adm_nm.split(" ").pop(); code=adm_cd2' -filter-fields sigun,emd,code,sggnm -o work/gb_emd_full.geojson
$MS work/gb_emd_full.geojson -simplify 12% keep-shapes -filter-fields sigun,emd,code -o precision=0.0001 $OUT/emd.geojson
$MS work/gb_emd_full.geojson -dissolve sigun -simplify 10% keep-shapes -o precision=0.0001 $OUT/sigun.geojson
$MS raw/hjd.geojson -filter 'sidonm!="경상북도"' -clip bbox=127.3,35.3,131.2,37.6 -dissolve sidonm -simplify 4% keep-shapes -o precision=0.001 $OUT/neighbors.geojson
