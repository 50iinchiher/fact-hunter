// Эхлүүлэх, навигаци.

var app = document.getElementById("app");
var current = null;

// quiet: ижил дэлгэцийг дахин зурахад анимэйшн, scroll байрлалаа хадгална
function show(name, arg, quiet) {
  stopTimers();
  var body = app.querySelector(".body");
  var scroll = quiet && body ? body.scrollTop : 0;
  current = name;
  var render = Screens[name];
  app.innerHTML = render ? render(arg) : Screens.start();
  var view = app.firstElementChild;
  if (quiet && view) view.classList.add("still");
  var nb = app.querySelector(".body");
  if (nb) nb.scrollTop = scroll;
  if (name === "investigate") investigateMounted();
}

var toastTimer = null;
function toast(msg, ms) {
  var old = app.querySelector(".toast");
  if (old) old.remove();
  clearTimeout(toastTimer);
  var t = document.createElement("div");
  t.className = "toast";
  t.setAttribute("role", "status");
  t.textContent = msg;
  app.appendChild(t);
  toastTimer = setTimeout(function () { t.remove(); }, ms || 2200);
}

function readNickname() {
  var input = document.getElementById("nick");
  var v = input ? input.value.trim() : "";
  state.nickname = v || GAME.meta.player.defaultName;
}

Actions.begin = function () {
  readNickname();
  state.judgeMode = false;
  state.quizIndex = 0;
  show("pretest");
};

// ⚡ Хурдан шалгалт: ярилцлага, оршил, даалгаваргүй шууд постууд
Actions.quick = function () {
  readNickname();
  state.judgeMode = false;
  state.quick = true;
  startDay(GAME.days[0].day);
  show("investigate");
};

// Шүүгчийн горим: ярилцлага, оршлыг алгасаад 2-р өдрөөс
Actions.judgeMode = function () {
  readNickname();
  state.judgeMode = true;
  startDay(GAME.days[GAME.days.length - 1].day);
  show("brief");
};

app.addEventListener("click", function (e) {
  var el = e.target.closest("[data-act]");
  if (!el || !app.contains(el) || el.disabled) return;
  var fn = Actions[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el.dataset.arg, el); }
});

app.addEventListener("submit", function (e) {
  e.preventDefault();
  if (e.target.dataset.form === "search") Actions.runSearch(e.target.querySelector("input").value);
});

app.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && e.target.id === "nick") Actions.begin();
  if (e.key === "Escape") { Actions.closeSheet(); Actions.closePanel(); }
});

// Идэвхгүй сануулгын таймерыг дахин эхлүүлэх
["pointerdown", "keydown"].forEach(function (ev) {
  app.addEventListener(ev, function () { if (current === "investigate") resetIdle(); }, true);
});

(function init() {
  console.log("Баримт Анчин · контент ачаалагдлаа:", GAME.days.length + " өдөр,",
    GAME.days.reduce(function (n, d) { return n + d.posts.length; }, 0) + " пост");
  var params = new URLSearchParams(location.search);
  if (params.get("day") === "2") { Actions.judgeMode(); return; }
  show("start");
})();
