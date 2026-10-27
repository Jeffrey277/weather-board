// app.js – 화면 동작 (목록 그리기, 일정 추가)

let tasks = [];
let weatherByRegion = {};   // 03 단원에서 지역별 날씨를 넣음

// 04 단원 : 기본 일정은 data/tasks.json 에서 먼저 읽고, 브라우저 저장(wx_added)의 추가 일정을 뒤에 붙임
// 더블클릭(file://)으로 열면 브라우저가 JSON 읽기를 막으므로 안내 문구를 띄움
async function loadTasks() {
  const saved = JSON.parse(localStorage.getItem('wx_added') || '[]');
  const msg = document.getElementById('loadMsg');
  try {
    const res = await fetch('data/tasks.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    tasks = (await res.json()).concat(saved);
    msg.textContent = '';
  } catch (err) {
    tasks = saved;
    msg.textContent = '일정 파일(data/tasks.json)을 읽지 못했습니다. 배포 주소로 열어 주세요.';
  }
}

function weatherText(w) {
  return w ? w.tempMax + '℃ · ' + w.windMax + 'm/s · ' + w.rainProb + '%' : '-';
}

function renderTasks() {
  const body = document.getElementById('taskList');
  body.innerHTML = '';
  for (const t of tasks) {
    const w = weatherByRegion[t.region];
    const r = judge(t.kind, w);
    const tr = document.createElement('tr');
    for (const v of [t.title, t.region, t.kind, t.owner, weatherText(w)]) {
      const td = document.createElement('td');
      td.textContent = v;
      tr.appendChild(td);
    }
    const td = document.createElement('td');
    td.textContent = r.text;
    td.className = r.level;
    tr.appendChild(td);
    body.appendChild(tr);
  }
}

function addTask(e) {
  e.preventDefault();
  const t = {
    title: document.getElementById('titleInput').value.trim(),
    region: document.getElementById('regionInput').value,
    kind: document.getElementById('kindInput').value,
    owner: document.getElementById('ownerInput').value.trim(),
  };
  if (!t.title || !t.owner) return;
  const saved = JSON.parse(localStorage.getItem('wx_added') || '[]');
  saved.push(t);
  localStorage.setItem('wx_added', JSON.stringify(saved));   // 화면에서 추가한 일정만 저장
  e.target.reset();
  tasks.push(t);
  renderTasks();
}

// PC 시간 기준 오늘 날짜 (toISOString 은 UTC 라 오전 9시 전엔 어제가 나옴)
function showToday() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  document.getElementById('todayDate').textContent =
    d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

// 03 단원 : 지역별 오늘 날씨를 받아 표를 다시 그림 (실패해도 목록은 그대로)
async function loadWeather() {
  const box = document.getElementById('weatherBox');
  box.textContent = '날씨 받는 중…';
  try {
    const res = await fetch(buildWeatherUrl());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    weatherByRegion = applyTestMode(parseWeather(await res.json()), location.search);
    const test = location.search.includes('test=wind') ? ' (시험 모드: 풍속 12 m/s)' : '';
    box.textContent = '기준: 오늘 하루 최댓값 · 출처: Open-Meteo' + test;
  } catch (err) {
    weatherByRegion = {};
    box.textContent = '날씨를 받지 못했습니다. 인터넷 연결을 확인하고 새로고침해 주세요.';
  }
  renderTasks();
}

document.getElementById('taskForm').addEventListener('submit', addTask);
showToday();
loadTasks().then(renderTasks);
loadWeather();
