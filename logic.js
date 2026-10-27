// logic.js – 판단 규칙만 (화면을 다루는 코드 금지)

// 교육용 가상 기준 (실제 작업 중지 · 행사 취소 기준은 각 기관 규정을 따름)
const RULES = { wind: 10, rain: 60, heat: 33 };

// 일정 구분과 날씨로 판단 (w가 없으면 '날씨 확인 전')
function judge(kind, w) {
  if (!w) return { level: 'none', text: '날씨 확인 전' };
  if (kind === '실내') return { level: 'ok', text: '영향 없음' };
  if (kind === '고소' && w.windMax >= RULES.wind) return { level: 'stop', text: '중지 검토 (강풍)' };
  if (w.tempMax >= RULES.heat) return { level: 'warn', text: '폭염 휴식' };
  if (w.rainProb >= RULES.rain) return { level: 'warn', text: '우천 주의' };
  return { level: 'ok', text: '진행' };
}

// 지역별 대략 좌표 (각 시 · 군청 근처)
const REGIONS = {
  '세종': { lat: 36.480, lon: 127.289 },
  '대전': { lat: 36.350, lon: 127.385 },
  '태안': { lat: 36.746, lon: 126.298 },
  '보령': { lat: 36.333, lon: 126.613 },
};

// Open-Meteo 주소 (키 없음) : 4곳을 한 번에, 오늘 하루 최댓값, 풍속은 m/s
function buildWeatherUrl() {
  const names = Object.keys(REGIONS);
  return 'https://api.open-meteo.com/v1/forecast'
    + '?latitude=' + names.map(n => REGIONS[n].lat).join(',')
    + '&longitude=' + names.map(n => REGIONS[n].lon).join(',')
    + '&daily=temperature_2m_max,wind_speed_10m_max,precipitation_probability_max'
    + '&wind_speed_unit=ms&timezone=Asia%2FSeoul&forecast_days=1';
}

// 응답을 { 세종: { tempMax, windMax, rainProb }, ... } 로 바꿈 (지역 순서는 REGIONS 순서)
function parseWeather(json) {
  const list = Array.isArray(json) ? json : [json];
  const names = Object.keys(REGIONS);
  const result = {};
  list.forEach((loc, i) => {
    const d = loc.daily;
    result[names[i]] = {
      tempMax: d.temperature_2m_max[0],
      windMax: d.wind_speed_10m_max[0],
      rainProb: d.precipitation_probability_max[0],
    };
  });
  return result;
}

// 주소 끝이 ?test=wind 이면 모든 지역 풍속을 12 m/s 로 바꿔 규칙 시험
function applyTestMode(weather, search) {
  if (new URLSearchParams(search).get('test') !== 'wind') return weather;
  const result = {};
  for (const name in weather) result[name] = { ...weather[name], windMax: 12 };
  return result;
}

if (typeof module !== 'undefined') module.exports = { RULES, judge, REGIONS, buildWeatherUrl, parseWeather, applyTestMode };
