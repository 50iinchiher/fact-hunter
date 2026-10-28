// Дэлгэц бүрийн render функц. Бүгд HTML мөр буцаана; товчнууд data-act-аар Actions-ийг дуудна.

var Screens = {};

function galaaSays(html, label) { return bubbleHTML(html, { label: label }); }
function miikuSays(html, label) { return bubbleHTML(html, { player: true, label: label }); }

function techCard(t, isNew) {
  return '<div class="tcard"><span class="ic">🃏</span><div><small>' + (isNew ? "ШИНЭ КАРТ НЭЭГДЛЭЭ" : "АРГЫН КАРТ") + '</small>' +
    '<div class="nm">' + esc(t.title) + '</div><p>' + esc(t.desc) + '<br><b style="color:#fff">Шалгах арга:</b> ' + esc(t.how) + '</p></div></div>';
}

// ---------------------------------------------------------------- 1. Эхлэл
Screens.start = function () {
  var m = GAME.meta;
  var motto = m.tagline.split(". ").map(function (w) { return "<span>" + esc(w.replace(/\.$/, "")) + ".</span>"; }).join("");
  return '' +
    '<section class="view start">' +
      '<div class="body">' +
        '<div class="masthead"><span>«' + esc(m.newsroom) + '»</span><span>БАРИМТ ШАЛГАХ АЛБА</span></div>' +
        '<div class="logo">' +
          '<span class="tape">ШИНЭ АЖИЛТАН</span>' +
          '<h1>Баримт<span>Анчин</span></h1>' +
        '</div>' +
        '<div class="motto">' + motto + '</div>' +
        '<div class="duo" aria-hidden="true">' +
          '<div class="say l">Хуваалцахаасаа өмнө нягтал!</div>' +
          '<img class="g" src="' + esc(m.mentor.img) + '" alt="">' +
          '<img class="c" src="' + esc(m.player.img) + '" alt="">' +
          '<div class="say r">Би бэлэн! 🔍</div>' +
        '</div>' +
        '<div class="field">' +
          '<label for="nick">МӨРДӨГЧИЙН ХОЧ</label>' +
          '<div class="input"><span aria-hidden="true">🕵️</span>' +
            '<input id="nick" maxlength="16" autocomplete="off" value="' + esc(state.nickname) + '" placeholder="' + esc(m.player.defaultName) + '">' +
          '</div>' +
        '</div>' +
        '<button class="btn" data-act="begin">🕵️ Мөрдөгчийн түүх <small class="mode-time">≈10 мин</small></button>' +
        '<button class="btn ghost" data-act="quick">⚡ Хурдан шалгалт <small class="mode-time">≈4 мин</small></button>' +
        '<div class="center"><button class="link" data-act="judgeMode">Шүүгчийн горим: 2-р өдөр рүү →</button></div>' +
        '<p class="foot">Бүх нэр, хуудас, байгууллага зохиомол.<br>MILHACK 2026 · Хэвлэлийн Хүрээлэн + EAVI</p>' +
      '</div>' +
    '</section>';
};

// ---------------------------------------------------------------- 2 & 9. Ажлын ярилцлага / шалгалт
Screens.quiz = function (kind) {
  var test = kind === "post" ? GAME.postTest : GAME.preTest;
  var i = state.quizIndex, item = test.items[i];
  var answers = state[kind];
  var dots = test.items.map(function (_, k) { return '<i class="' + (k === i ? "on" : "") + '"></i>'; }).join("");
  var intro = test.intro.replace(/^Галаа ахлах:\s*/, "");
  function opt(val, label) { return '<button class="' + (answers[i] === val ? "on" : "") + '" data-act="quizPick" data-arg="' + kind + ':' + val + '">' + label + '</button>'; }
  return '' +
    '<section class="view paper">' +
      '<div class="hud"><span class="chip dark">' + esc(test.title.toUpperCase()) + '</span><span class="mid">' + (i + 1) + ' / ' + test.items.length + '</span><span class="chip gold">' + (kind === "post" ? "📝" : "🤝") + '</span></div>' +
      '<div class="body" style="gap:16px">' +
        galaaSays(esc(fill(intro))) +
        '<div class="dots">' + dots + '</div>' +
        '<div class="label center">ЭНЭ ГАРЧИГТ ИТГЭХ ҮҮ?</div>' +
        '<div class="clip"><div class="q">' + esc(item.text) + '</div></div>' +
        '<div class="opt3">' + opt("yes", "👍<br>Итгэнэ") + opt("no", "👎<br>Итгэхгүй") + opt("unknown", "🤷<br>Мэдэхгүй") + '</div>' +
        '<div class="spacer"></div>' +
        '<p class="center who">Зөв, буруу гэж үнэлэхгүй. Анхны бодлоороо хариул.</p>' +
      '</div>' +
    '</section>';
};
Screens.pretest = function () { return Screens.quiz("pre"); };
Screens.posttest = function () { return Screens.quiz("post"); };

Actions.quizPick = function (arg) {
  var parts = arg.split(":"), kind = parts[0], val = parts[1];
  var test = kind === "post" ? GAME.postTest : GAME.preTest;
  state[kind][state.quizIndex] = val;
  var btns = app.querySelectorAll(".opt3 button");
  btns.forEach(function (b) { b.classList.toggle("on", b.dataset.arg === arg); b.disabled = true; });
  setTimeout(function () {
    if (state.quizIndex < test.items.length - 1) { state.quizIndex++; show(kind + "test"); return; }
    state.quizIndex = 0;
    if (kind === "pre") { state.introIndex = 0; show("intro"); }
    else show("ending");
  }, 220);
};

// ---------------------------------------------------------------- 3. Оршил яриа
Screens.intro = function () {
  var line = GAME.intro[state.introIndex];
  var isMentor = line.who === "mentor";
  var last = state.introIndex === GAME.intro.length - 1;
  return '' +
    '<section class="view">' +
      '<div class="vn-scene">' +
        '<div class="window"></div><div class="sign">ҮНЭН ЦАГ</div><div class="board"></div>' +
        '<div class="vn-chars">' +
          '<img class="g' + (isMentor ? "" : " quiet") + '" src="' + esc(GAME.meta.mentor.img) + '" alt="' + esc(GAME.meta.mentor.name) + '">' +
          '<img class="c' + (isMentor ? " quiet" : "") + '" src="' + esc(GAME.meta.player.img) + '" alt="' + esc(state.nickname) + '">' +
        '</div>' +
      '</div>' +
      '<div class="vn-box">' +
        '<span class="vn-name' + (isMentor ? "" : " me") + '">' + esc(isMentor ? GAME.meta.mentor.name.toUpperCase() : state.nickname.toUpperCase()) + '</span>' +
        '<p class="vn-text">' + esc(fill(line.text)) + '</p>' +
        '<div class="dots">' + GAME.intro.map(function (_, k) { return '<i class="' + (k === state.introIndex ? "on" : "") + '"></i>'; }).join("") + '</div>' +
        '<div class="vn-acts">' +
          (last ? "" : '<button class="link" data-act="introSkip">Алгасах</button>') +
          '<button class="btn" data-act="introNext">' + (last ? "Ажилдаа орох ▸" : "Дараах ▸") + '</button>' +
        '</div>' +
      '</div>' +
    '</section>';
};
Actions.introNext = function () {
  if (state.introIndex < GAME.intro.length - 1) { state.introIndex++; show("intro", null, true); }
  else Actions.introSkip();
};
Actions.introSkip = function () { startDay(GAME.days[0].day); show("brief"); };

// ---------------------------------------------------------------- 4. Өдрийн даалгавар
Screens.brief = function () {
  var d = currentDay(), b = d.brief;
  var stars = new Array(d.difficulty + 1).join("●") + new Array(4 - d.difficulty).join("○");
  return '' +
    '<section class="view paper">' +
      '<div class="hud"><span class="chip dark">ӨДӨР ' + d.day + '</span><span class="mid">Өдрийн даалгавар</span><span class="chip gold">⭐ ' + state.score + '</span></div>' +
      '<div class="body" style="gap:14px">' +
        '<div class="folder" data-tab="ХЭРЭГ №' + d.day + '">' +
          '<div><div class="sub">СЭДЭВ · Хүндрэл ' + stars + '</div><h2>' + esc(d.title) + '</h2></div>' +
          '<div class="note"><b>📌 ӨДРИЙН БАРИМТ</b><br>' + esc(b.fact) + '<small>Эх сурвалж: ' + esc(b.factSource) + '</small></div>' +
          '<ul class="tasks">' + b.tasks.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join("") + '</ul>' +
        '</div>' +
        galaaSays(esc(fill(b.mentor))) +
        '<div class="spacer"></div>' +
        '<button class="btn" data-act="openFeed">📰 Лент нээх</button>' +
      '</div>' +
    '</section>';
};
Actions.openFeed = function () { resetPost(); show("investigate"); };

// ---------------------------------------------------------------- 6. Нотолгооны дэвтэр + дүгнэлт
Screens.notebook = function () {
  var post = currentPost();
  state.selected = state.selected.filter(isSaved);
  var ready = state.verdict && (state.quick || state.selected.length > 0 || state.evidence.length === 0);
  var thumb = post.image ? imgHTML(post.image) : '<div class="img" style="width:60px;height:46px;background:' + esc(post.page.color) + '"></div>';
  var evs = state.evidence.length ? state.evidence.map(function (e) {
    var sel = state.selected.indexOf(e.id) >= 0;
    return '<button class="ev' + (sel ? " sel" : "") + '" data-act="selEv" data-arg="' + esc(e.id) + '" aria-pressed="' + sel + '">' +
      '<span class="box">' + (sel ? "✓" : "") + '</span><span class="t">' + esc(e.text) + '<small>Эх: ' + esc(e.source) + '</small></span>' +
      '<span class="str ' + e.strength + '">' + STRENGTH[e.strength] + '</span></button>';
  }).join("") : '<div class="empty">' + (state.quick ? "Нотолгоо хадгалаагүй байна. Хадгалбал +5 ⭐ авах боломжтой." : "⏱ Алхам дуусч, нотолгоогүй үлдлээ. Одоо байгаа мэдээллээрээ дүгнэ.") + '</div>';
  function vbtn(v) {
    var V = VERDICTS[v];
    return '<button class="v-' + v + (state.verdict === v ? " on" : "") + '" data-act="verdict" data-arg="' + v + '">' + V.icon + '<br>' + V.label + '</button>';
  }
  var think = state.verdict
    ? "Миний дүгнэлт: <b>" + VERDICTS[state.verdict].label + "</b>. " + (state.selected.length ? "Үүнийг " + state.selected.length + " нотолгоо батална." : "Одоо батлах нотолгоогоо сонгоё.")
    : "Цуглуулсан нотолгоогоо харж байгаад шийдье...";
  return '' +
    '<section class="view paper">' +
      '<div class="hud"><span class="chip dark">ХЭРЭГ №' + caseNumber() + '</span><span class="mid">Нотолгооны дэвтэр</span><span class="chip gold">⭐ ' + state.score + '</span></div>' +
      '<div class="body" style="gap:9px">' +
        '<div class="post-mini">' + thumb + '<div style="min-width:0"><b>' + esc(post.page.name) + '</b><br>' + esc(post.text.length > 70 ? post.text.slice(0, 70) + "..." : post.text) + '</div></div>' +
        '<span class="label">📒 Цуглуулсан нотолгоо · ' + state.evidence.length + '/' + MAX_EVIDENCE + '</span>' +
        evs +
        '<b style="font-size:13px;margin-top:4px">Чиний дүгнэлт?</b>' +
        '<div class="verd">' + vbtn("true") + vbtn("false") + vbtn("unverified") + '</div>' +
        (state.evidence.length ? '<div class="who">☑ Дүгнэлтээ батлах 1–2 нотолгоо сонго</div>' : "") +
        miikuSays(think) +
        '<div class="spacer"></div>' +
        '<button class="btn' + (ready ? "" : " off") + '" data-act="submit">📨 Галаад тайлагнах</button>' +
        '<div class="center"><button class="link" data-act="backToPost">‹ Буцаж судлах</button></div>' +
      '</div>' +
    '</section>';
};
Actions.selEv = function (id) {
  var i = state.selected.indexOf(id);
  if (i >= 0) state.selected.splice(i, 1);
  else if (state.selected.length >= 2) { toast("Хамгийн ихдээ 2 гол нотолгоо сонгоно"); return; }
  else state.selected.push(id);
  show("notebook", null, true);
};
Actions.verdict = function (v) { state.verdict = v; show("notebook", null, true); };
Actions.backToPost = function () { show("investigate"); };
Actions.submit = function () {
  if (!state.verdict) { toast("Эхлээд дүгнэлтээ сонго"); return; }
  if (state.evidence.length && !state.selected.length && !state.quick) { toast("Дүгнэлтээ батлах 1–2 нотолгоо сонго"); return; }
  var post = currentPost();
  var res = scorePost(post);
  state.score += res.gain;
  res.newCard = addCard(post.technique);
  res.solo = state.hintsUsedThisPost === 0;
  res.missedShown = missedApplies(post);
  state.decisions.push({ id: post.id, day: state.day, verdict: state.verdict, correct: res.correct, points: res.total });
  state.lastResult = res;
  show("result");
};

// "Алгассан сэжүүр" ямар эх сурвалжид байгааг тексээс таамаглаж, тоглогч тэр эх сурвалжийг нээгээгүй бол харуулна
function missedApplies(post) {
  if (!post.missed) return false;
  var m = post.missed.toLowerCase();
  var src = m.indexOf("сэтгэгдэл") >= 0 ? "comments" : m.indexOf("холбоос") >= 0 ? "link" : m.indexOf("зураг") >= 0 && post.imageSearch && post.imageSearch.length ? "image" : "search";
  return !state.sourcesVisited.has(src) || !state.selected.some(function (id) { return post.keyEvidence.indexOf(id) >= 0; });
}

// ---------------------------------------------------------------- 6. Үр дүн
Screens.result = function () {
  var post = currentPost(), r = state.lastResult;
  var A = VERDICTS[post.answer], mine = VERDICTS[state.verdict];
  var head = r.correct ? (r.key ? "Зөв! Нотолгоо чинь хүчтэй" : "Зөв дүгнэлт!") : "Энэ удаа таарсангүй";
  var lines = r.lines.map(function (l) {
    return '<div><span>' + esc(l[0]) + '</span><b class="' + (l[1] < 0 ? "neg" : "") + '">' + (l[1] > 0 ? "+" : "") + l[1] + '</b></div>';
  }).join("");
  var last = state.postIndex >= currentDay().posts.length - 1;
  var next = !last ? "Дараагийн пост →" : !state.quick ? "📰 Өдрийн дүн →" : isLastDay() ? "📩 Мессеж нээх" : "Дараагийн пост →";
  return '' +
    '<section class="view paper">' +
      '<div class="hud"><span class="chip dark">ХЭРЭГ №' + caseNumber() + '</span><span class="mid">Үнэлгээ</span><span class="chip gold">⭐ ' + state.score + '</span></div>' +
      '<div class="body" style="gap:11px">' +
        '<div class="verdict' + (r.correct ? "" : " wrong") + '"><span class="stamp ' + post.answer + '">' + A.stamp + '</span><b>' + head + '</b></div>' +
        (r.correct ? "" : '<div class="answer">Чиний дүгнэлт: <b>' + mine.icon + ' ' + mine.label + '</b><br>Зөв хариулт: <b>' + A.icon + ' ' + A.label + '</b><br><span class="who">Алдаа бол суралцах боломж. Доорх тайлбарыг уншаад дараагийнхыг илүү сайн хийнэ ээ.</span></div>') +
        '<div class="score">' + lines + '<div><span>Нийт</span><span style="color:' + (r.total >= 0 ? "var(--green)" : "var(--red)") + '">' + (r.total >= 0 ? "+" : "") + r.total + ' ⭐</span></div></div>' +
        (r.solo ? '<span class="chip solo">🧭 Бие даасан мөрдөгч</span>' : "") +
        galaaSays(esc(post.explain)) +
        (r.missedShown ? '<div class="missed">🔦 <b>Алгассан сэжүүр:</b> ' + esc(post.missed) + '</div>' : "") +
        (r.newCard ? techCard(post.technique, true) : "") +
        '<div class="spacer"></div>' +
        '<button class="btn" data-act="nextPost">' + next + '</button>' +
      '</div>' +
    '</section>';
};
Actions.nextPost = function () {
  if (state.postIndex >= currentDay().posts.length - 1) {
    if (!state.quick) { show("report"); return; }
    // Хурдан шалгалт: өдрийн дүнгүйгээр дараагийн өдрийн пост руу, сүүлд нь эргэлт
    if (isLastDay()) { show(GAME.twist ? "twist" : "ending"); return; }
    startDay(state.day + 1);
    show("investigate");
    return;
  }
  state.postIndex++;
  resetPost();
  show("investigate");
};

// ---------------------------------------------------------------- 7. Өдрийн дүн (сонины нүүр)
Screens.report = function () {
  var d = currentDay();
  var mine = state.decisions.filter(function (x) { return x.day === d.day && x.id !== "twist"; });
  var correct = mine.filter(function (x) { return x.correct; }).length;
  var stopped = 0;
  mine.forEach(function (x) {
    var p = d.posts.filter(function (p) { return p.id === x.id; })[0];
    if (x.correct && p && p.answer !== "true") stopped += p.shares || 0;
  });
  var cards = state.cards.filter(function (c) { return c.day === d.day; });
  var headline = stopped
    ? "Мөрдөгч " + state.nickname + " хуурамч мэдээний " + fmtNum(stopped) + " хуваалцалтыг зогсоолоо!"
    : "Мөрдөгч " + state.nickname + " өдрийн ажлаа дуусгалаа";
  return '' +
    '<section class="view paper">' +
      '<div class="hud"><span class="chip dark">ӨДӨР ' + d.day + '</span><span class="mid">Өдрийн дүн</span><span class="chip gold">⭐ ' + state.score + '</span></div>' +
      '<div class="body" style="gap:14px">' +
        '<div class="news">' +
          '<div class="mast"><h2>' + esc(GAME.meta.newsroom) + '</h2><small><span>ӨДӨР ' + d.day + '</span><span>' + esc(d.title.toUpperCase()) + '</span><span>№' + d.day + '</span></small></div>' +
          '<div class="head">' + esc(headline) + '</div>' +
          '<div class="stats">' +
            '<div class="stat"><b>' + correct + '/' + mine.length + '</b><span>зөв дүгнэлт</span></div>' +
            '<div class="stat"><b>' + fmtNum(stopped) + '</b><span>зогсоосон хуваалцалт</span></div>' +
            '<div class="stat"><b>⭐ ' + state.score + '</b><span>нийт оноо</span></div>' +
            '<div class="stat"><b>🃏 ' + cards.length + '</b><span>шинэ карт</span></div>' +
          '</div>' +
          (cards.length ? '<div class="cards">' + cards.map(function (c) { return '<span>🃏 ' + esc(c.title) + '</span>'; }).join("") + '</div>' : "") +
        '</div>' +
        galaaSays(esc(fill(d.report.mentor))) +
        '<div class="spacer"></div>' +
        '<button class="btn" data-act="afterReport">' + (isLastDay() ? "📩 Мессеж нээх" : "☀ " + (d.day + 1) + "-р өдөр эхлэх →") + '</button>' +
      '</div>' +
    '</section>';
};
Actions.afterReport = function () {
  if (isLastDay()) { show(GAME.twist ? "twist" : "posttest"); return; }
  startDay(state.day + 1);
  show("brief");
};

// ---------------------------------------------------------------- 8. Эргэлт (хуурамч Галаа)
Screens.twist = function () {
  var t = GAME.twist;
  return '' +
    '<section class="view msgr">' +
      '<div class="msgr-top"><img class="av" src="' + esc(GAME.meta.mentor.img) + '" alt=""><div style="flex:1;min-width:0"><div class="nm">' + esc(t.sender) + '</div><small>' + esc(t.senderNote) + '</small></div><span style="font-size:20px">📞</span></div>' +
      '<div class="msgr-body">' +
        '<div class="msgr-time">' + esc(t.time) + '</div>' +
        t.messages.map(function (m) { return '<div class="msg">' + esc(fill(m)) + '</div>'; }).join("") +
        '<div class="spacer"></div>' +
        bubbleHTML(esc(t.thought), { player: true, cls: "thought", label: state.nickname.toUpperCase() + " · ДОТРОО" }) +
      '</div>' +
      '<div class="choices">' +
        '<span class="label">ЧИ ЮУ ХИЙХ ВЭ?</span>' +
        t.options.map(function (o) { return '<button class="btn ghost" data-act="twistPick" data-arg="' + esc(o.id) + '">' + esc(o.label) + '</button>'; }).join("") +
      '</div>' +
    '</section>';
};
Actions.twistPick = function (id) {
  var o = GAME.twist.options.filter(function (x) { return x.id === id; })[0];
  state.score += o.points;
  state.twistChoice = o;
  state.twistNewCard = addCard(GAME.twist.technique);
  state.decisions.push({ id: "twist", day: state.day, verdict: o.id, correct: o.correct, points: o.points });
  show("twistResult");
};

Screens.twistResult = function () {
  var t = GAME.twist, o = state.twistChoice;
  return '' +
    '<section class="view paper">' +
      '<div class="hud"><span class="chip dark">ЭРГЭЛТ</span><span class="mid">Хэн бичсэн бэ?</span><span class="chip gold">⭐ ' + state.score + '</span></div>' +
      '<div class="body" style="gap:12px">' +
        '<div class="verdict' + (o.correct ? "" : " wrong") + '"><span class="stamp">ЛУЙВАР</span><b>' + (o.correct ? "Зөв шийдвэр! +" + o.points + " ⭐" : "Аюултай шийдвэр байлаа") + '</b></div>' +
        '<div><div class="label" style="margin-bottom:6px">🚩 Анхааруулах шинжүүд</div><div class="flags">' + t.flags.map(function (f) { return '<span>' + esc(f) + '</span>'; }).join("") + '</div></div>' +
        '<div class="galaa-real"><img src="' + esc(GAME.meta.mentor.img) + '" alt=""><div><span class="label">🦢 Жинхэнэ ' + esc(GAME.meta.mentor.name) + ' ирлээ</span>' +
          '<div class="bubble" style="margin-top:6px"><small>ГАЛАА АХЛАХ</small>' + esc(fill(o.result)) + '</div></div></div>' +
        techCard(t.technique, state.twistNewCard) +
        '<div class="spacer"></div>' +
        (state.quick
          ? '<button class="btn" data-act="toEnding">🏁 Дүн харах →</button>'
          : '<button class="btn" data-act="toPostTest">📝 Ажлын шалгалт →</button>') +
      '</div>' +
    '</section>';
};
Actions.toPostTest = function () { state.quizIndex = 0; show("posttest"); };
Actions.toEnding = function () { show("ending"); };

// ---------------------------------------------------------------- 10. Төгсгөл
function finalStats() {
  var total = state.decisions.length;
  var correct = state.decisions.filter(function (d) { return d.correct; }).length;
  // 9 шийдвэрээс 7 гэсэн харьцааг шүүгчийн горимд (цөөн шийдвэр) ч хадгална
  var all = GAME.days.reduce(function (n, d) { return n + d.posts.length; }, 0) + (GAME.twist ? 1 : 0);
  var need = Math.ceil(total * GAME.meta.passThreshold / all);
  return { total: total, correct: correct, need: need, pass: total > 0 && correct >= need };
}

Screens.ending = function () {
  var s = finalStats(), e = GAME.ending;
  var postN = quizCorrect(state.post, GAME.postTest), n = GAME.postTest.items.length;
  var hasPre = state.pre.length > 0;
  var preN = hasPre ? quizCorrect(state.pre, GAME.preTest) : null;
  var compare = '<div class="compare"><b style="font-size:14px">🎯 Таних чадвар: ' + (hasPre ? preN + '/' + n + ' → ' : "") + postN + '/' + n + '</b>' +
    (hasPre ? '<div class="meter"><span style="width:62px">Өмнө</span><div class="track"><div class="fill" style="width:' + (preN / n * 100) + '%"></div></div><span>' + preN + '/' + n + '</span></div>' : "") +
    '<div class="meter"><span style="width:62px">Одоо</span><div class="track"><div class="fill after" style="width:' + (postN / n * 100) + '%"></div></div><span>' + postN + '/' + n + '</span></div></div>';
  var cards = state.cards.length ? '<div class="cards">' + state.cards.map(function (c) { return '<span>🃏 ' + esc(c.title) + '</span>'; }).join("") + '</div>' : "";
  var main = s.pass
    ? '<h2 class="serif center" style="font-size:28px">' + esc(e.passTitle) + '</h2>' +
      '<div class="idcard">' +
        '<div class="top"><span>«' + esc(GAME.meta.newsroom) + '» · МӨРДӨГЧИЙН ҮНЭМЛЭХ</span><span>№2026</span></div>' +
        '<div class="row"><img class="photo" src="' + esc(GAME.meta.player.img) + '" alt="">' +
          '<div style="flex:1;min-width:0"><div class="nick">' + esc(state.nickname) + '</div>' +
          '<dl><dt>Цол</dt><dd>' + esc(e.rank) + '</dd><dt>Оноо</dt><dd>⭐ ' + state.score + '</dd><dt>Зөв</dt><dd>' + s.correct + '/' + s.total + ' шийдвэр</dd><dt>Карт</dt><dd>🃏 ' + state.cards.length + '</dd></dl></div></div>' +
        '<span class="stamp">БАТЛАВ</span>' +
      '</div>' + cards + galaaSays(esc(fill(e.passMentor)))
    : '<h2 class="serif center" style="font-size:28px">' + esc(e.failTitle) + '</h2>' +
      '<div class="news" style="box-shadow:4px 4px 0 var(--amber)"><div class="stats">' +
        '<div class="stat"><b>' + s.correct + '/' + s.total + '</b><span>зөв шийдвэр (' + s.need + ' хэрэгтэй)</span></div>' +
        '<div class="stat"><b>⭐ ' + state.score + '</b><span>нийт оноо</span></div></div>' + cards + '</div>' +
      galaaSays(esc(fill(e.failMentor)));
  return '' +
    '<section class="view paper">' +
      '<div class="hud"><span class="chip dark">ТӨГСГӨЛ</span><span class="mid">' + esc(state.nickname) + '</span><span class="chip gold">⭐ ' + state.score + '</span></div>' +
      '<div class="body" style="gap:14px">' +
        main + (state.quick ? "" : compare) +
        '<div class="spacer"></div>' +
        (s.pass ? "" : '<button class="btn" data-act="retry">🔁 Дахин оролдох</button>') +
        '<button class="btn' + (s.pass ? "" : " ghost") + '" data-act="share">📤 Найздаа сорил илгээх</button>' +
        '<button class="btn ghost" data-act="replay">↻ Дахин тоглох</button>' +
      '</div>' +
    '</section>';
};

Actions.retry = function () {
  var pre = state.pre, quick = state.quick;
  resetState(true);
  state.pre = pre;
  state.quick = quick;
  startDay(GAME.days[0].day);
  show(quick ? "investigate" : "brief");
};
Actions.replay = function () { resetState(true); show("start"); };
Actions.share = function () {
  var text = GAME.ending.shareText;
  var url = location.href.split(/[?#]/)[0];
  if (navigator.share) {
    navigator.share({ title: GAME.meta.title, text: text, url: url }).catch(function () {});
    return;
  }
  var full = text + " " + url;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(full).then(function () { toast("🔗 Линк хуулагдлаа. Найздаа илгээгээрэй!"); }, function () { copyFallback(full); });
  } else copyFallback(full);
};
function copyFallback(text) {
  var ta = document.createElement("textarea");
  ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  var ok = false;
  try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
  ta.remove();
  toast(ok ? "🔗 Линк хуулагдлаа. Найздаа илгээгээрэй!" : "Хуулж чадсангүй 😕");
}
