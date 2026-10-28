// Тоглоомын төлөв ба оноо. Бүгд санах ойд (сервер, бүртгэл байхгүй).

var Actions = {}; // data-act="нэр" товчны үйлдлүүд (файл бүр нэмнэ)

var VERDICTS = {
  "true":       { label: "Үнэн",        icon: "✅", stamp: "ҮНЭН" },
  "false":      { label: "Худал",       icon: "❌", stamp: "ХУДАЛ" },
  "unverified": { label: "Баталгаагүй", icon: "❓", stamp: "БАТАЛГААГҮЙ" }
};
var STRENGTH = { strong: "🟢 Хүчтэй", clue: "🟡 Сэжүүр" };
var MAX_EVIDENCE = 3;

function newState() {
  return {
    nickname: GAME.meta.player.defaultName,
    day: 1,
    postIndex: 0,
    score: 0,
    tickets: GAME.meta.ticketsPerDay,
    steps: 0,
    evidence: [],          // [{id, text, source, strength}]
    cards: [],             // [{id, title, desc, how, day}]
    decisions: [],         // [{id, day, verdict, correct, points}]
    pre: [],               // ["yes"|"no"|"unknown"]
    post: [],
    hintsUsedThisPost: 0,
    sourcesVisited: new Set(),
    // Пост тус бүрийн нэмэлт төлөв
    hintLevel: 0,
    penalty: 0,
    opened: new Set(),     // алхам аль хэдийн зарцуулсан эх сурвалж
    lastSearch: null,      // {q, results}
    verdict: null,
    selected: [],
    bubble: null,          // {text, kind}
    // Дэлгэцийн дотоод индекс
    introIndex: 0,
    quizIndex: 0,
    judgeMode: false,
    quick: false           // ⚡ Хурдан шалгалт: оршил, даалгавар, өдрийн дүн, алхмын хязгааргүй
  };
}

var state = newState();

function resetState(keepNickname) {
  var nick = state.nickname;
  state = newState();
  if (keepNickname) state.nickname = nick;
}

function resetPost() {
  state.steps = 0;
  state.evidence = [];
  state.hintsUsedThisPost = 0;
  state.sourcesVisited = new Set();
  state.hintLevel = 0;
  state.penalty = 0;
  state.opened = new Set();
  state.lastSearch = null;
  state.verdict = null;
  state.selected = [];
  state.bubble = null;
}

function startDay(day) {
  state.day = day;
  state.postIndex = 0;
  state.tickets = GAME.meta.ticketsPerDay;
  resetPost();
}

function currentDay() {
  for (var i = 0; i < GAME.days.length; i++) if (GAME.days[i].day === state.day) return GAME.days[i];
  return GAME.days[0];
}
function currentPost() { return currentDay().posts[state.postIndex]; }
function isLastDay() { return GAME.days[GAME.days.length - 1].day === state.day; }

// Тоглоомын эхнээс хэддүгээр пост вэ (ХЭРЭГ №)
function caseNumber() {
  var n = 0;
  for (var i = 0; i < GAME.days.length && GAME.days[i].day < state.day; i++) n += GAME.days[i].posts.length;
  return n + state.postIndex + 1;
}

// 2-р өдрөөс эхлэн пост бүрт алхмын хязгаар
function stepLimit() { return state.day >= 2 && !state.quick ? GAME.meta.day2StepLimit : Infinity; }
function totalPosts() { return GAME.days.reduce(function (n, d) { return n + d.posts.length; }, 0); }
function stepsLeft() { return stepLimit() - state.steps; }

function isSaved(id) {
  return state.evidence.some(function (e) { return e.id === id; });
}

// Пост дотор 📌 хадгалж болох бүх мөр
function pinnables(post) {
  var m = {};
  function add(id, text, source, strength) { m[id] = { id: id, text: text, source: source, strength: strength || "clue" }; }
  var pageSrc = post.page.personal ? "Хаягийн мэдээлэл" : "Хуудасны ил тод байдал";
  (post.page.facts || []).forEach(function (f) { add(f.id, f.label + ": " + f.value, pageSrc, f.strength); });
  if (post.link) (post.link.facts || []).forEach(function (f) { add(f.id, f.label + ": " + f.value, "Холбоос шалгах · " + post.link.url, f.strength); });
  (post.imageSearch || []).forEach(function (r) { add(r.id, r.date + " · " + r.title, "Зургаар хайлт · " + r.source, r.strength); });
  ((post.search && post.search.results) || []).forEach(function (r) { add(r.id, r.title, r.source, r.strength); });
  (post.comments || []).forEach(function (c) { if (c.pin) add(c.pin.id, c.pin.text, "Сэтгэгдэл · " + c.name, c.pin.strength); });
  return m;
}

// Пост дүгнэсний оноо
function scorePost(post) {
  var correct = state.verdict === post.answer;
  var keyId = null;
  state.selected.forEach(function (id) { if (!keyId && post.keyEvidence.indexOf(id) >= 0) keyId = id; });
  var keyEv = keyId && state.evidence.filter(function (e) { return e.id === keyId; })[0];
  var nSources = state.sourcesVisited.size;
  var lines = [];
  lines.push(correct ? ["✅ Дүгнэлт зөв", 10] : ["Дүгнэлт таарсангүй", 0]);
  lines.push(keyEv ? ["🟢 Гол нотолгоо олсон (" + keyEv.source.split(" · ")[0] + ")", 5] : ["Гол нотолгоо сонгогдоогүй", 0]);
  lines.push(nSources >= 2 ? ["🔎 " + nSources + " өөр эх сурвалж шалгасан", 3] : ["🔎 " + nSources + " эх сурвалж шалгасан (2+ хэрэгтэй)", 0]);
  if (state.hintsUsedThisPost) lines.push(["🦢 Галаагийн тусламж (" + state.hintLevel + "-р түвшин хүртэл)", -state.penalty]);
  var gain = (correct ? 10 : 0) + (keyEv ? 5 : 0) + (nSources >= 2 ? 3 : 0);
  return { correct: correct, key: !!keyEv, lines: lines, gain: gain, total: gain - state.penalty };
}

function addCard(t) {
  if (!t || state.cards.some(function (c) { return c.id === t.id; })) return false;
  state.cards.push({ id: t.id, title: t.title, desc: t.desc, how: t.how, day: state.day });
  return true;
}

function quizCorrect(answers, test) {
  return test.items.filter(function (it, i) { return answers[i] === it.correct; }).length;
}

// "{name}"-ийг хочоор солих
function fill(text) {
  return String(text || "").replace(/\{name\}/g, state.nickname);
}

// 1100 → "1.1K"
function fmtNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

// HTML-д аюулгүй оруулах
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
