// app.js – 화면 동작 (목록 그리기, 일정 추가)

let tasks = [];
let weatherByRegion = {};   // 03 단원에서 지역별 날씨를 넣음

// 04 단원 DB : 일정은 Supabase 표 wx_tasks 에서 읽고 추가함 (연결 정보는 config.js)
let db = null;
try {
  db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (err) {
  db = null;   // config.js 가 비었거나 supabase-js 를 못 받음 → loadTasks 에서 안내
}

async function loadTasks() {
  const msg = document.getElementById('loadMsg');
  try {
    if (!db) throw new Error('no client');
    const { data, error } = await db.from('wx_tasks').select('title, region, kind, owner').order('id');
    if (error) throw error;
    tasks = data;
    msg.textContent = '';
  } catch (err) {
    tasks = [];
    msg.textContent = '일정 DB에 연결하지 못했습니다. config.js 의 주소 · 공개용 키와 setup.sql 실행 여부를 확인해 주세요.';
  }
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

async function addTask(e) {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById('msgBox');
  const t = {
    title: document.getElementById('titleInput').value.trim(),
    region: document.getElementById('regionInput').value,
    kind: document.getElementById('kindInput').value,
    owner: document.getElementById('ownerInput').value.trim(),
  };
  if (!t.title || !t.owner) return;
  const { error } = db ? await db.from('wx_tasks').insert(t) : { error: 'no client' };
  if (error) {
    msg.textContent = '저장하지 못했습니다. 연결 상태와 지역 · 구분 값을 확인해 주세요.';
    return;
  }
  msg.textContent = '저장했습니다.';
  form.reset();
  await loadTasks();
  renderTasks();
}

// PC 시간 기준 오늘 날짜 YYYY-MM-DD (toISOString 은 UTC 라 오전 9시 전엔 어제가 나옴)
function todayStr() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function showToday() {
  document.getElementById('todayDate').textContent = todayStr();
}

// 04 단원 : 지금 표를 마크다운으로 만들어 '현장일정_판단_YYYY-MM-DD.md' 로 내려받기
function downloadJudge() {
  const date = todayStr();
  const testNote = location.search.includes('test=wind') ? '시험 모드: 풍속 12 m/s (실제 날씨 아님)' : '';
  const md = buildJudgeMarkdown(tasks, weatherByRegion, date, testNote);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '현장일정_판단_' + date + '.md';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
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
document.getElementById('mdBtn').addEventListener('click', downloadJudge);
showToday();
loadTasks().then(renderTasks);
loadWeather();
