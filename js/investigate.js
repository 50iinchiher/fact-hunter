// Пост судлах, хайлт, нотолгоо, Галаагийн тусламж.

var Inv = { viralTimer: null, idleTimer: null, viralPost: null, viralStart: 0, viral: 0, pending: null };

var HINT_LEVELS = [
  { icon: "🧭", title: "1. Чиглэл өгөх", desc: "Хаанаас эхлэхийг сануулна", cost: 0, name: "ЧИГЛЭЛ" },
  { icon: "🔍", title: "2. Арга заах", desc: "Ямар хэрэгслийг яаж ашиглахыг тайлбарлана", cost: 2, name: "АРГА" },
  { icon: "📌", title: "3. Нотолгоог зааж өгөх", desc: "Гол баримт хаана байгааг шууд заана", cost: 5, name: "НОТОЛГОО" }
];

// ---------------------------------------------------------------- Жижиг HTML туслахууд
function imgHTML(image, extra) {
  if (!image) return "";
  var cap = image.caption ? '<span class="cap">' + esc(image.caption) + '</span>' : "";
  return '<div class="img ' + esc(image.kind) + ' ' + (extra || "") + '">' + cap + '</div>';
}

function bubbleHTML(text, opts) {
  opts = opts || {};
  var who = opts.player ? state.nickname.toUpperCase() : "ГАЛАА АХЛАХ";
  var img = opts.player ? GAME.meta.player.img : GAME.meta.mentor.img;
  return '<div class="hint ' + (opts.cls || "") + '"' + (opts.id ? ' id="' + opts.id + '"' : "") + '>' +
    '<img class="av' + (opts.player ? " c" : "") + '" src="' + esc(img) + '" alt="">' +
    '<div class="bubble' + (opts.player ? " me" : "") + '"><small>' + esc(opts.label || who) + '</small>' + text + '</div></div>';
}

function pinBtn(id, compact, label) {
  var on = isSaved(id);
  label = label || (compact ? "📌" : "📌 Хадгалах");
  var done = compact ? "✓" : "✓ Хадгалсан";
  return '<button class="pin' + (on ? " on" : "") + '" data-act="pin" data-arg="' + esc(id) + '" data-label="' + esc(label) + '" data-done="' + esc(done) + '" aria-label="Нотолгоо хадгалах">' + (on ? done : label) + '</button>';
}

// ---------------------------------------------------------------- Facebook пост
function postHTML(post, tags) {
  var p = post.page;
  function tag(txt, pos) { return tags ? '<span class="tag" style="' + pos + '">👆 ' + txt + '</span>' : ""; }
  var image = post.image ?
    '<div class="pimg-wrap"><button class="pimg hot" data-act="openImage" aria-label="Зургаар хайх">' + imgHTML(post.image) + tag("Зургаар хайх", "right:8px;top:8px") + '</button></div>' : "";
  var link = post.link ?
    '<button class="plink hot" data-act="openLink"><small>🔗 ' + esc(post.link.url.split("/")[0]) + '</small><b>' + esc(post.link.title) + '</b>' + tag("Холбоос", "right:8px;top:-11px") + '</button>' : "";
  return '' +
    '<article class="post">' +
      '<div class="ph-wrap"><button class="ph hot" data-act="openPage">' +
        '<div class="pav" style="background:' + esc(p.color) + '">' + esc(p.ini) + '</div>' +
        '<div style="flex:1;min-width:0"><div class="pn">' + esc(p.name) + '</div><div class="pm">' + esc(p.meta) + '</div></div>' +
        '<span class="pmore" aria-hidden="true">···</span>' + tag("Хуудас", "right:34px;top:-11px") +
      '</button></div>' +
      '<div class="ptxt">' + esc(post.text) + '</div>' +
      image + link +
      '<div class="react"><span>' + esc(post.reactions) + '</span>' +
        '<span style="display:flex;gap:4px;align-items:center"><button class="cnt hot" data-act="openComments">💬 ' + fmtNum(post.commentsCount) + ' сэтгэгдэл' + tag("Сэтгэгдэл", "right:calc(100% + 6px);top:50%;transform:translateY(-50%)") + '</button>' +
        (post.shares ? '<span>↗ ' + fmtNum(post.shares) + '</span>' : '') + '</span></div>' +
      '<div class="acts"><span>👍 Таалагдсан</span><span>💬 Сэтгэгдэл</span><span>↗ Хуваалцах</span></div>' +
    '</article>';
}

// ---------------------------------------------------------------- HUD / самбар
function hudHTML() {
  var limit = stepLimit();
  var timer = limit !== Infinity ? '<span class="chip timer">⏱ ' + Math.max(0, stepsLeft()) + '/' + limit + '</span>' : "";
  return '<span class="chip dark">ӨДӨР ' + state.day + '</span>' +
    '<span class="mid">Пост ' + (state.quick ? caseNumber() + ' / ' + totalPosts() : (state.postIndex + 1) + ' / ' + currentDay().posts.length) + '</span>' +
    '<span class="right">' + timer + '<span class="chip gold">⭐ ' + state.score + '</span></span>';
}

function canJudge() {
  return state.quick || state.evidence.length > 0 || (stepsLeft() <= 0 && state.evidence.length === 0);
}

function barHTML() {
  var ok = canJudge();
  return '' +
    '<button class="tool" data-act="openSearch"><span class="ic">🔎</span>Хайх</button>' +
    '<button class="tool" data-act="openEvidence"><span class="ic">📒</span>Нотолгоо<span class="badge">' + state.evidence.length + '/' + MAX_EVIDENCE + '</span></button>' +
    '<button class="tool" data-act="openHelp"><img src="' + esc(GAME.meta.mentor.img) + '" alt="">Галаа<span class="badge">' + state.tickets + '</span></button>' +
    '<button class="judge' + (ok ? "" : " off") + '" data-act="judge">⚖ Дүгнэх' + (ok ? "" : " 🔒") + '</button>';
}

function refreshChrome() {
  var hud = document.getElementById("hud");
  if (hud) hud.innerHTML = hudHTML();
  var bar = document.getElementById("bar");
  if (bar) bar.innerHTML = barHTML();
  var lock = document.getElementById("lock");
  if (lock) lock.hidden = canJudge();
}

function setBubble(text, kind) {
  state.bubble = text ? { text: text, kind: kind || "" } : null;
  var el = document.getElementById("gbubble");
  if (!el) return;
  el.outerHTML = galaaBubble();
}

function galaaBubble() {
  var b = state.bubble;
  if (!b) return '<div id="gbubble" hidden></div>';
  var label = b.kind === "idle" ? "ГАЛАА АХЛАХ · САНУУЛГА" : b.kind ? "ГАЛАА АХЛАХ · " + b.kind : "ГАЛАА АХЛАХ";
  return bubbleHTML(esc(b.text), { id: "gbubble", cls: "pop" + (b.kind ? " tipped" : ""), label: label });
}

// ---------------------------------------------------------------- Дэлгэц
Screens.investigate = function () {
  var post = currentPost();
  if (!state.bubble) {
    if (state.day === 1 && post.hints.intro) state.bubble = { text: post.hints.intro, kind: "" };
    else if (state.day >= 2 && state.postIndex === 0 && !post.hints.intro && !state.quick) state.bubble = { text: "Өнөөдөр бие даана. Гацвал 🦢 дээр дарж намайг дууд. Пост бүрт ⏱ " + stepLimit() + " алхам шүү.", kind: "" };
    else if (post.hints.intro) state.bubble = { text: post.hints.intro, kind: "" };
  }
  var tags = state.day === GAME.days[0].day && state.postIndex === 0;
  var viral = post.shares ? '<div class="viral"><span>🔥 Чамайг судалж байх хооронд тархсаар...</span><span class="n" id="viral"></span></div>' : "";
  return '' +
    '<section class="view investigate">' +
      '<div class="hud" id="hud">' + hudHTML() + '</div>' +
      '<div class="stage">' +
        '<div class="body" id="feed">' +
          galaaBubble() +
          postHTML(post, tags) +
          viral +
          '<div class="lock-note" id="lock"' + (canJudge() ? " hidden" : "") + '>🔒 Дүгнэхийн тулд дор хаяж 1 нотолгоо хадгалах хэрэгтэй</div>' +
        '</div>' +
        '<div id="panel"></div>' +
      '</div>' +
      '<nav class="bar" id="bar">' + barHTML() + '</nav>' +
      '<div id="layer"></div>' +
    '</section>';
};

// show() дараа дуудагдана: таймерууд
function investigateMounted() {
  var post = currentPost();
  if (Inv.viralPost !== post.id) { Inv.viralPost = post.id; Inv.viralStart = post.shares; Inv.viral = post.shares; }
  paintViral(false);
  if (post.shares) Inv.viralTimer = setInterval(function () {
    Inv.viral += Math.max(5, Math.round(Inv.viral * (0.01 + Math.random() * 0.02)));
    paintViral(true);
  }, 3000);
  resetIdle();
}

function paintViral(bump) {
  var el = document.getElementById("viral");
  if (!el) return;
  el.textContent = fmtNum(Inv.viralStart) + " → " + fmtNum(Inv.viral);
  if (bump) { el.classList.add("bump"); setTimeout(function () { el.classList.remove("bump"); }, 200); }
}

function stopTimers() {
  clearInterval(Inv.viralTimer); Inv.viralTimer = null;
  clearTimeout(Inv.idleTimer); Inv.idleTimer = null;
}

// 45 секунд юу ч дарахгүй бол l1 сануулга (үнэгүй)
function resetIdle() {
  clearTimeout(Inv.idleTimer);
  if (current !== "investigate") return;
  Inv.idleTimer = setTimeout(function () {
    if (current !== "investigate") return;
    var post = currentPost();
    if (state.hintLevel >= 1) return;
    setBubble("Гацчихав уу? " + post.hints.l1, "idle");
    var feed = document.getElementById("feed");
    if (feed) feed.scrollTop = 0;
  }, 45000);
}

// ---------------------------------------------------------------- Алхам (2-р өдөр)
function useStep(key) {
  if (stepLimit() === Infinity || state.opened.has(key)) { state.opened.add(key); return true; }
  if (stepsLeft() <= 0) {
    toast("⏱ Алхам дууслаа. Цуглуулсан нотолгоогоороо дүгнэ!");
    return false;
  }
  state.steps++;
  state.opened.add(key);
  refreshChrome();
  if (stepsLeft() === 0) setBubble("⏱ Алхам дууслаа. Өмнө нээсэн цонхнуудаа дахин үзэж болно, дараа нь дүгнээрэй.", "");
  return true;
}

// ---------------------------------------------------------------- Panel / Sheet
function openPanel(html) {
  var el = document.getElementById("panel");
  if (el) el.innerHTML = html;
}
function openSheet(html) {
  var el = document.getElementById("layer");
  if (el) el.innerHTML = '<div class="dim" data-act="closeSheet"></div><div class="sheet" role="dialog"><div class="grab"></div>' + html + '</div>';
}
Actions.closePanel = function () { openPanel(""); };
Actions.closeSheet = function () { var el = document.getElementById("layer"); if (el) el.innerHTML = ""; Inv.pending = null; };

function factsBox(title, facts) {
  return '<div class="box-fb"><b>' + esc(title) + '</b>' +
    facts.map(function (f) {
      return '<div class="fact' + (isSaved(f.id) ? " on" : "") + '"><div><small>' + esc(f.label) + '</small><b>' + esc(f.value) + '</b></div>' + pinBtn(f.id) + '</div>';
    }).join("") + '</div>';
}

// B · Хуудсыг судлах
Actions.openPage = function () {
  if (!useStep("page")) return;
  state.sourcesVisited.add("page");
  var p = currentPost().page;
  openPanel('' +
    '<div class="panel">' +
      '<div class="topbar"><button class="back" data-act="closePanel" aria-label="Буцах">‹</button><span class="title">' + esc(p.name) + '</span></div>' +
      '<div class="body" style="padding:0 0 16px;gap:0">' +
        '<div class="cover" style="background:linear-gradient(90deg,' + esc(p.color) + ',' + esc(p.color) + '88)"></div>' +
        '<div class="page-id"><div class="pav" style="background:' + esc(p.color) + '">' + esc(p.ini) + '</div><div><div class="nm">' + esc(p.name) + '</div><div class="pm">' + esc(p.followers) + '</div></div></div>' +
        '<div style="display:flex;flex-direction:column;gap:10px;padding:8px 14px 0">' +
          factsBox(p.personal ? "ⓘ Хаягийн тухай" : "ⓘ Хуудасны ил тод байдал", p.facts || []) +
          '<b style="font-size:14px">Сүүлийн постууд</b>' +
          '<div class="recent">' + (p.recent || []).map(function (r) { return '<div>' + esc(r) + '</div>'; }).join("") + '</div>' +
        '</div>' +
      '</div>' +
    '</div>');
};

// C · Зургаар хайх
Actions.openImage = function () {
  if (!useStep("image")) return;
  var post = currentPost();
  var list = post.imageSearch || [];
  if (list.length) state.sourcesVisited.add("image");
  var rows = list.length ? list.map(function (r) {
    return '<div class="res' + (isSaved(r.id) ? " on" : "") + '">' + imgHTML({ kind: post.image.kind }, "") +
      '<div class="t"><b>' + esc(r.date) + '</b><i>' + esc(r.source) + '</i><br>' + esc(r.title) + '</div>' + pinBtn(r.id, true) + '</div>';
  }).join("") : '<div class="empty">🖼 Ижил зураг олдсонгүй.<br>Энэ зураг өөр газар нийтлэгдээгүй бололтой. Бусад аргаар шалгаарай.</div>';
  openPanel('' +
    '<div class="panel">' +
      '<div class="topbar"><button class="back" data-act="closePanel" aria-label="Буцах">‹</button><div class="search" style="font-size:13px">🖼 Зургаар хайх · Мөрдөгчийн хайлт</div></div>' +
      '<div class="body">' +
        '<div class="query-img">' + imgHTML({ kind: post.image.kind }) + '<div><div style="font-size:11px;font-weight:600;color:var(--muted)">Хайж буй зураг</div><b style="font-size:13px">' + esc(post.page.name) + '-ийн постоос</b></div></div>' +
        (list.length ? '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><b style="font-size:14px">Ижил зураг ' + list.length + ' газар олдлоо</b><span class="chip gold" style="font-size:10.5px">⇅ Хамгийн эртнийх эхэнд</span></div>' : "") +
        rows +
        '<div class="habit">💡 <b>Мөрдөгчийн дадал:</b> Зургийн <b>хамгийн эртний</b> огноог ол. Бодит амьдрал дээр Google Lens, TinEye ашиглаарай.</div>' +
      '</div>' +
    '</div>');
};

// Холбоос шалгах
Actions.openLink = function () {
  if (!useStep("link")) return;
  state.sourcesVisited.add("link");
  var l = currentPost().link;
  openPanel('' +
    '<div class="panel">' +
      '<div class="topbar"><button class="back" data-act="closePanel" aria-label="Буцах">‹</button><span class="title">Холбоос шалгах</span></div>' +
      '<div class="body">' +
        '<div class="urlbar">🔒 <span>' + esc(l.url) + '</span></div>' +
        '<b style="font-size:16px">' + esc(l.title) + '</b>' +
        factsBox("ⓘ Холбоосны мэдээлэл", l.facts || []) +
        '<div class="habit">💡 <b>Мөрдөгчийн дадал:</b> Линк дээр дарахаасаа өмнө хаашаа хөтөлж байгааг, юу асууж байгааг шалга.</div>' +
      '</div>' +
    '</div>');
};

// E · Сэтгэгдэл
Actions.openComments = function () {
  if (!useStep("comments")) return;
  state.sourcesVisited.add("comments");
  var post = currentPost();
  var botsShown = false, html = "";
  post.comments.forEach(function (c, i) {
    var next = post.comments[i + 1];
    html += '<div class="cmt' + (c.bot ? " bot" : "") + (c.pin && isSaved(c.pin.id) ? " picked" : "") + '">' +
      '<div class="cav" style="background:' + esc(c.color) + '">' + esc(c.ini) + '</div>' +
      '<div><div class="cb"><b>' + esc(c.name) + '</b>' + esc(c.text) + '</div>' +
      (c.pin ? '<div class="cmt-acts">' + pinBtn(c.pin.id, false, "📌 Сэжүүр болгох") + '<button class="pin alt" data-act="openSearch">🔎 Хайж батлах</button></div>' : "") +
      '</div></div>';
    if (c.bot && !(next && next.bot) && !botsShown && state.day === GAME.days[0].day) {
      botsShown = true;
      html += '<div class="warn">⚠ Ижил текст, нэргүй шинэ хаягууд → бот байж магадгүй</div>';
    }
  });
  openSheet('' +
    '<div class="sheet-h"><b>Сэтгэгдэл · ' + fmtNum(post.commentsCount) + '</b><button class="x" data-act="closeSheet" aria-label="Хаах">✕</button></div>' +
    '<div style="font-size:12px;font-weight:700;color:var(--fbg);margin-top:-6px">Хамгийн хамааралтай ▾</div>' +
    html +
    bubbleHTML("Сэтгэгдэл бол <b>сэжүүр</b>, нотолгоо биш. Сонирхолтой зүйл олбол өөрөө хайж батлаарай.", { cls: "tipnote" }));
};

// D · Түлхүүр үгээр хайх
Actions.openSearch = function () {
  Actions.closeSheet();
  var post = currentPost();
  var s = post.search || { suggest: [], results: [] };
  var last = state.lastSearch;
  var limited = stepLimit() !== Infinity;
  openPanel('' +
    '<div class="panel">' +
      '<div class="topbar"><button class="back" data-act="closePanel" aria-label="Буцах">‹</button>' +
        '<form class="search" data-form="search" role="search"><span aria-hidden="true">🔎</span>' +
          '<input id="q" type="search" enterkeyhint="search" autocomplete="off" placeholder="Түлхүүр үгээр хайх..." value="' + esc(last ? last.q : "") + '">' +
          '<button class="go" type="submit">Хайх</button></form></div>' +
      '<div class="body" style="gap:9px">' +
        '<div class="chips"><span class="label">САНАЛ:</span>' +
          (s.suggest || []).map(function (q) { return '<button class="chip' + (last && last.q === q ? " on" : "") + '" data-act="chip" data-arg="' + esc(q) + '">' + esc(q) + '</button>'; }).join("") +
        '</div>' +
        (limited ? '<div class="who" id="stepnote">⏱ Шинэ хайлт бүр 1 алхам · ' + Math.max(0, stepsLeft()) + ' үлдсэн</div>' : "") +
        '<div id="results" style="display:flex;flex-direction:column;gap:9px">' + (last ? resultsHTML(last.results) : '<div class="empty">Юу шалгах вэ? Түлхүүр үг бич эсвэл дээрх саналаас сонго.</div>') + '</div>' +
        '<div class="habit">💡 <b>Мөрдөгчийн дадал:</b> Нэг эх сурвалжид бүү итгэ. 2-оос дээш газраас шалга.</div>' +
      '</div>' +
    '</div>');
};

function resultsHTML(results) {
  if (!results.length) return '<div class="empty">Үр дүн олдсонгүй. Өөр түлхүүр үгээр хайгаад үз 🙂</div>';
  return '<b style="font-size:12px;color:var(--muted)">' + results.length + ' үр дүн</b>' + results.map(function (r) {
    return '<div class="sr' + (isSaved(r.id) ? " on" : "") + '">' +
      '<span class="src">' + esc(r.icon || "🌐") + ' ' + esc(r.source) + ' · ' + esc(r.date) + '</span>' +
      '<span class="h">' + esc(r.title) + '</span>' +
      '<span class="s">' + esc(r.snippet) + '</span>' +
      '<div class="foot"><span class="who">ⓘ Хэн бичсэн? ' + esc(r.who) + '</span>' + pinBtn(r.id) + '</div></div>';
  }).join("");
}

// Түлхүүр үг оруулсан текстэд агуулагдвал (эсвэл 4+ үсэгтэй үг түлхүүр үгийн эхлэл бол) тааруулна
function matchSearch(q) {
  var text = q.toLowerCase().trim();
  var words = text.split(/\s+/).filter(function (w) { return w.length >= 4; });
  var results = (currentPost().search && currentPost().search.results) || [];
  return results.filter(function (r) {
    return (r.keywords || []).some(function (k) {
      k = k.toLowerCase();
      return text.indexOf(k) >= 0 || words.some(function (w) { return k.indexOf(w) === 0; });
    });
  });
}

Actions.runSearch = function (q) {
  q = String(q || "").trim();
  if (!q) { toast("Түлхүүр үг бичнэ үү 🙂"); return; }
  if (!useStep("search:" + q.toLowerCase())) return;
  var results = matchSearch(q);
  if (results.length) state.sourcesVisited.add("search");
  state.lastSearch = { q: q, results: results };
  var input = document.getElementById("q");
  if (input) { input.value = q; input.blur(); }
  var box = document.getElementById("results");
  if (box) box.innerHTML = resultsHTML(results);
  var note = document.getElementById("stepnote");
  if (note) note.textContent = "⏱ Шинэ хайлт бүр 1 алхам · " + Math.max(0, stepsLeft()) + " үлдсэн";
  app.querySelectorAll('[data-act="chip"]').forEach(function (c) { c.classList.toggle("on", c.dataset.arg === q); });
};
Actions.chip = function (q) { Actions.runSearch(q); };

// ---------------------------------------------------------------- 📌 Нотолгоо
Actions.pin = function (id) {
  var item = pinnables(currentPost())[id];
  if (!item) return;
  if (isSaved(id)) {
    state.evidence = state.evidence.filter(function (e) { return e.id !== id; });
    toast("Нотолгоо хасагдлаа · " + state.evidence.length + "/" + MAX_EVIDENCE);
  } else if (state.evidence.length >= MAX_EVIDENCE) {
    Inv.pending = id;
    openSwap(item);
    return;
  } else {
    state.evidence.push(item);
    toast("📌 Нотолгоо хадгалагдлаа · " + state.evidence.length + "/" + MAX_EVIDENCE + "  " + STRENGTH[item.strength]);
  }
  refreshPins();
};

function openSwap(item) {
  openSheet('' +
    '<div class="sheet-h"><b>📒 Дэвтэр дүүрсэн (3/3)</b><button class="x" data-act="closeSheet" aria-label="Хаах">✕</button></div>' +
    '<div class="answer">Шинэ: <b>' + esc(item.text) + '</b></div>' +
    '<div class="label">Алийг нь солих вэ?</div>' +
    state.evidence.map(function (e, i) {
      return '<div class="ev"><div class="t">' + esc(e.text) + '<small>' + esc(e.source) + '</small></div><span class="str ' + e.strength + '">' + STRENGTH[e.strength] + '</span>' +
        '<button class="pin" data-act="swap" data-arg="' + i + '">⇄ Солих</button></div>';
    }).join("") +
    '<button class="btn ghost" data-act="closeSheet">Болих</button>');
}

Actions.swap = function (i) {
  var item = pinnables(currentPost())[Inv.pending];
  if (!item) return Actions.closeSheet();
  state.evidence[+i] = item;
  Actions.closeSheet();
  toast("⇄ Нотолгоо солигдлоо · " + STRENGTH[item.strength]);
  refreshPins();
};

function refreshPins() {
  app.querySelectorAll('[data-act="pin"]').forEach(function (b) {
    var on = isSaved(b.dataset.arg);
    b.classList.toggle("on", on);
    b.textContent = on ? b.dataset.done : b.dataset.label;
    var row = b.closest(".fact,.res,.sr");
    if (row) row.classList.toggle("on", on);
    var cmt = b.closest(".cmt");
    if (cmt) cmt.classList.toggle("picked", on);
  });
  refreshChrome();
}

Actions.openEvidence = function () {
  var list = state.evidence.length ? state.evidence.map(function (e) {
    return '<div class="ev"><div class="t">' + esc(e.text) + '<small>Эх: ' + esc(e.source) + '</small></div><span class="str ' + e.strength + '">' + STRENGTH[e.strength] + '</span>' +
      '<button class="pin" data-act="unpin" data-arg="' + esc(e.id) + '" aria-label="Хасах">✕</button></div>';
  }).join("") : '<div class="empty">Одоохондоо нотолгоо алга.<br>Улаан хүрээтэй хэсгүүд дээр дарж, 🔎 хайлт хийгээд 📌 хадгал.</div>';
  openSheet('' +
    '<div class="sheet-h"><b>📒 Нотолгооны дэвтэр · ' + state.evidence.length + '/' + MAX_EVIDENCE + '</b><button class="x" data-act="closeSheet" aria-label="Хаах">✕</button></div>' +
    list +
    '<div class="habit">🟢 <b>Хүчтэй:</b> албан эх сурвалж, зургийн огноо · 🟡 <b>Сэжүүр:</b> сэтгэгдэл, хуудасны шинж</div>' +
    '<button class="btn ghost" data-act="closeSheet">Үргэлжлүүлэх</button>');
};
Actions.unpin = function (id) { Actions.pin(id); Actions.openEvidence(); };

// ---------------------------------------------------------------- 🦢 Галаагийн тусламж
Actions.openHelp = function () {
  var post = currentPost();
  var max = GAME.meta.ticketsPerDay;
  var tickets = new Array(state.tickets + 1).join("🎟") + new Array(max - state.tickets + 1).join("▫");
  var opened = "";
  for (var i = 1; i <= state.hintLevel; i++) {
    opened += '<div class="bubble tip"><small>ГАЛАА АХЛАХ · ' + HINT_LEVELS[i - 1].name + '</small>' + esc(post.hints["l" + i]) + '</div>';
  }
  var levels = HINT_LEVELS.map(function (L, i) {
    var lvl = i + 1, used = lvl <= state.hintLevel, next = lvl === state.hintLevel + 1;
    var costCls = L.cost === 0 ? "free" : L.cost === 2 ? "mid" : "high";
    var cost = used ? '<span class="cost free">✓ Ашигласан</span>' : '<span class="cost ' + costCls + '">' + (L.cost ? "−" + L.cost + " ⭐" : "Үнэгүй") + '</span>';
    return '<button class="lvl' + (used ? " used" : "") + (next ? " next" : "") + '" data-act="hint" data-arg="' + lvl + '"' + (used || !next || !state.tickets ? " disabled" : "") + '>' +
      '<span class="n">' + L.icon + '</span><span class="t"><b>' + L.title + '</b>' + L.desc + '</span>' + cost + '</button>';
  }).join("");
  openSheet('' +
    '<div style="display:flex;gap:12px;align-items:center"><img class="av lg" src="' + esc(GAME.meta.mentor.img) + '" alt="">' +
      '<div style="flex:1"><b style="font-size:17px">Галаа ахлахаас асуух</b><div style="font-size:12px;color:var(--muted)">Тасалбар: ' + tickets + ' (' + state.tickets + '/' + max + ' үлдсэн)</div></div>' +
      '<button class="x" data-act="closeSheet" aria-label="Хаах">✕</button></div>' +
    opened + levels +
    (state.tickets ? "" : '<div class="empty" style="padding:10px">🎟 Өнөөдрийн тасалбар дууслаа. Өөрөө чадна шүү!</div>') +
    '<div style="font-size:11.5px;color:var(--muted);text-align:center;line-height:1.4">Тусламж аваагүй бол “🧭 Бие даасан мөрдөгч” тэмдэг авна</div>' +
    '<button class="btn ghost" data-act="closeSheet">Өөрөө үргэлжлүүлэх</button>');
};

Actions.hint = function (lvl) {
  lvl = +lvl;
  if (lvl !== state.hintLevel + 1 || state.tickets <= 0) return;
  var L = HINT_LEVELS[lvl - 1];
  var post = currentPost();
  state.tickets--;
  state.hintLevel = lvl;
  state.hintsUsedThisPost++;
  state.penalty += L.cost;
  state.score -= L.cost;
  setBubble(post.hints["l" + lvl], L.name);
  refreshChrome();
  if (L.cost) toast("🦢 " + L.title.slice(3) + " · −" + L.cost + " ⭐");
  if (lvl === 3) { Actions.closeSheet(); Actions.closePanel(); flashTarget(post); }
  else Actions.openHelp();
};

// 3-р түвшин: гол нотолгоо байгаа hotspot-ыг 2 сек анивчуулна
function flashTarget(post) {
  var map = { f: "openPage", l: "openLink", i: "openImage", s: "openSearch", c: "openComments" };
  var id = post.keyEvidence[0] || "";
  var kind = (id.split("_")[1] || "").charAt(0);
  var el = app.querySelector('[data-act="' + (map[kind] || "openSearch") + '"]');
  if (!el) return;
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
  setTimeout(function () { el.classList.remove("flash"); }, 2100);
}

// ---------------------------------------------------------------- ⚖ Дүгнэх
Actions.judge = function () {
  if (!canJudge()) { toast("📌 Эхлээд нотолгоо цуглуул"); return; }
  if (state.evidence.length === 1) state.selected = [state.evidence[0].id];
  show("notebook");
};
