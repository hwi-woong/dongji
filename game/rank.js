/* 동지 게임 '이번 달 매장 대항전' (사장님 앱 사이트 game/ 폴더용, 2026-11-23)
   · 손님은 QR을 받은 매장의 일원. 한 판 할 때마다 그 매장 점수가 올라가고(10~100점, 서버가 계산), 전국 등수는 매장끼리 겨룸
   · GRANK.submit(판, 기록) 기록 있는 판 / GRANK.play(게임) 기록 없는 판(사주·팥 키우기·진 판) / GRANK.team() 보기만
   · '우리 매장 손님' 탭: 같은 매장 손님끼리 이 게임 최고 기록(별명만)
   · 한국 시각 매달 1일 0시에 새로 시작. 서버 설정이 없으면(미리보기) 이 휴대폰 안에서만 예시를 보여 줌 */
(function () {
  var BOARDS = {
    patal: { name: '팥알 받기', f: function (v) { return v + '알'; } },
    saealsim: { name: '새알심 공방', f: function (v) { return v + '점'; } },
    stir: { name: '팥죽 젓기', f: function (v) { return v + '점'; } },
    cards6: { name: '짝 맞추기 6쌍', f: function (v) { return v + '초'; }, asc: 1 },
    cards8: { name: '짝 맞추기 8쌍', f: function (v) { return v + '초'; }, asc: 1 },
    royale1: { name: '배틀로얄 1단계', f: rf, asc: 1 },
    royale2: { name: '배틀로얄 2단계', f: rf, asc: 1 },
    royale3: { name: '배틀로얄 3단계', f: rf, asc: 1 },
    boss: { name: '새알심 기사와 역귀', f: function (v) { return v + '초'; }, asc: 1 },
    defense: { name: '역귀 막기', f: function (v) { return v + '점'; } }
  };
  function rf(v) { return Math.floor(v / 1000) + '등 · ' + (999 - v % 1000) + '처치'; }
  function nf(v) { return Number(v || 0).toLocaleString('ko-KR'); }

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var dev = ls('dj_dev');
  if (!/^[a-z0-9]{16,40}$/.test(dev || '')) {
    dev = ''; var a = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 24; i++) dev += a[Math.floor(Math.random() * 36)];
    ls('dj_dev', dev);
  }
  function skey() { var m = /[?&]s=([a-z0-9]{8,32})(?:&|$)/.exec(location.search); if (m) return m[1]; try { return sessionStorage.getItem('dj_store_s'); } catch (e) { return null; } }

  var C = window.APP_CONFIG || {}, url = String(C.SUPABASE_URL || '').trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, ''), key = C.SUPABASE_KEY || '';
  var LIVE = /^https?:\/\//.test(url) && key.length >= 20;
  function rpc(fn, body) {
    var h = { 'Content-Type': 'application/json', apikey: key };
    if (/^eyJ/.test(key)) h.Authorization = 'Bearer ' + key;
    var ctl = window.AbortController ? new AbortController() : null;
    setTimeout(function () { if (ctl) ctl.abort(); }, 8000);
    return fetch(url + '/rest/v1/rpc/' + fn, { method: 'POST', headers: h, body: JSON.stringify(body), cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; }, function () { return null; });
  }

  /* ---------- 미리보기(서버 없음): 예시 매장·손님 + 이 휴대폰 기록 ---------- */
  var DEMO_ST = ['평택포승점', '안중점', '이천점', '안성공도점', '여주점', '양평점', '평택역점', '송탄점', '장호원점', '평택비전점', '안성점'];
  var DEMO_N = ['팥죽 사랑', '새알심왕', '동지 밤', '팥알 #3127', '찹쌀이'];
  function ptsOf(g, v) {
    var c = function (x) { return Math.max(0, Math.min(1, x)); };
    var t = { patal: c(v / 150), saealsim: c(v / 200), stir: c(v / 200), defense: c(v / 2000), cards6: c(25 / v), cards8: c(40 / v), boss: c(90 / v) }[g];
    if (v != null && t != null) return 10 + Math.round(t * 90);
    if (v != null && /^royale/.test(g)) return Math.min(100, 10 + Math.round(Math.max(0, 41 - Math.floor(v / 1000)) / 40 * 80) + Math.min(10, 999 - v % 1000));
    return { fortune: 30, grow: 30, boss_try: 20 }[g] || 10;
  }
  function demo(b, val, nick, game) {
    var mm = new Date().toISOString().slice(0, 7), M = JSON.parse(ls('dj_rank_demo2') || '{}'), mystore = skey() ? DEMO_ST[0] : null, gain = null;
    if (M.m !== mm) M = { m: mm, nick: M.nick || '팥알 #' + String(Math.floor(Math.random() * 10000)).padStart(4, '0'), pts: 0, best: {} };
    if (nick) M.nick = nick;
    if (b && val != null && (M.best[b] == null || (BOARDS[b].asc ? val < M.best[b] : val > M.best[b]))) M.best[b] = val;
    if (game && mystore) { gain = ptsOf(game, val); M.pts += gain; }
    ls('dj_rank_demo2', JSON.stringify(M));
    var rows = DEMO_ST.map(function (n, i) { return { n: n, v: (i === 0 ? 3480 + M.pts : 5200 - i * 430), me: n === mystore }; });
    rows.sort(function (x, y) { return y.v - x.v; }); rows.forEach(function (x, i) { x.r = i + 1; });
    var mine = rows.filter(function (x) { return x.me; })[0];
    var team = { store: mystore, rank: mine ? mine.r : null, total: rows.length, pts: mine ? mine.v : 0, gain: gain, mine: M.pts, people: mystore ? 34 + (M.pts ? 1 : 0) : 0, top: rows.slice(0, 10) };
    var stv = null;
    if (b && mystore) {
      var asc = BOARDS[b].asc, base = { patal: 210, saealsim: 260, stir: 330, cards6: 21, cards8: 33, boss: 64, defense: 2600 }[b], ry = /^royale/.test(b);
      var pr = DEMO_N.map(function (n, i) { return { n: n, v: ry ? (1 + i * 3) * 1000 + 999 - Math.max(0, 8 - i * 2) : asc ? base + i * 9 : base - i * 37 }; });
      if (M.best[b] != null) pr.push({ n: M.nick, v: M.best[b], me: true });
      pr.sort(function (x, y) { return asc ? x.v - y.v : y.v - x.v; }); var r = null; pr.forEach(function (x, i) { x.r = i + 1; if (x.me) r = i + 1; });
      stv = { rank: r, total: pr.length, mine: M.best[b], top: pr.slice(0, 10) };
    }
    var nx = new Date(); nx.setMonth(nx.getMonth() + 1);
    return Promise.resolve({ ok: true, demo: true, board: b, nick: M.nick, reset: String(nx.getMonth() + 1), team: team, store: stv });
  }

  /* ---------- 그리기 ---------- */
  var st = document.createElement('style');
  st.textContent = '.grank{margin-top:16px;width:100%;border:1.5px solid var(--acc,#b0472f);border-radius:16px;padding:14px 14px 12px;text-align:left;color:var(--ink,inherit);background:rgba(127,127,127,.07)}'
    + '.grank .gr-h{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}'
    + '.grank .gr-h b{color:var(--acc,inherit);font-size:13px;font-weight:700}'
    + '.grank .gr-tab{display:inline-flex;border:1px solid var(--line,rgba(127,127,127,.35));border-radius:999px;overflow:hidden;flex:none}'
    + '.grank .gr-tab button{border:0;background:transparent;color:inherit;font:inherit;font-size:12px;padding:5px 10px;cursor:pointer;opacity:.75}'
    + '.grank .gr-tab button[aria-pressed=true]{background:var(--btn-bg,var(--acc,#b0472f));color:var(--btn-fg,#fff);opacity:1;font-weight:700}'
    + '.grank .gr-gain{display:inline-block;margin:2px 0 6px;padding:4px 10px;border-radius:999px;background:var(--btn-bg,var(--acc,#b0472f));color:var(--btn-fg,#fff);font-size:13px;font-weight:700}'
    + '.grank .gr-me{font-size:20px;font-weight:800;line-height:1.3;margin:2px 0 8px;word-break:keep-all}'
    + '.grank .gr-me small{display:block;font-size:13px;font-weight:500;opacity:.8}'
    + '.grank ol{display:block;list-style:none;margin:0;padding:0;font-size:14px}'
    + '.grank li{display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:8px;align-items:center;padding:6px 4px;border-top:1px solid var(--line,rgba(127,127,127,.25))}'
    + '.grank li .gr-r{font-weight:800;text-align:center;opacity:.85}'
    + '.grank li .gr-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    + '.grank li .gr-v{font-weight:700;font-variant-numeric:tabular-nums}'
    + '.grank li.me{background:rgba(127,127,127,.16);border-radius:10px;font-weight:700}'
    + '.grank li.gap{display:block;text-align:center;padding:2px;border:0;opacity:.6}'
    + '.grank .gr-note{font-size:13px;line-height:1.5;margin:4px 0 8px;opacity:.9;word-break:keep-all}'
    + '.grank .gr-f{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 10px;margin-top:8px;font-size:12px;opacity:.85}'
    + '.grank .gr-f button{border:1px solid var(--line,rgba(127,127,127,.4));background:transparent;color:inherit;font:inherit;font-size:12px;border-radius:999px;padding:4px 10px;cursor:pointer}'
    + '.grank form{display:flex;gap:6px;margin-top:8px}'
    + '.grank input{flex:1;min-width:0;font:inherit;font-size:16px;padding:8px 10px;border-radius:10px;border:1px solid var(--line,rgba(127,127,127,.4));background:rgba(255,255,255,.9);color:#222}'
    + '.grank form button{border:0;border-radius:10px;padding:8px 14px;font:inherit;font-weight:700;background:var(--btn-bg,var(--acc,#b0472f));color:var(--btn-fg,#fff);cursor:pointer}'
    + '.grank .gr-msg{font-size:12px;margin-top:4px;min-height:1em}'
    + '.grank .gr-wait{font-size:13px;opacity:.7;padding:6px 0}';
  document.head.appendChild(st);

  function E(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function row(ol, r, name, val, me) { var li = E('li', me ? 'me' : ''); li.append(E('span', 'gr-r', String(r)), E('span', 'gr-n', name), E('span', 'gr-v', val)); ol.append(li); }

  var tab = 'team';
  function draw(el, d, b) {
    el.textContent = ''; el.hidden = false;
    var T = d.team || { top: [], total: 0 }, B = b && BOARDS[b], hasStore = !!T.store, canP = !!(hasStore && B && d.store);
    if (!canP) tab = 'team';
    var h = E('div', 'gr-h'); h.append(E('b', null, '이번 달 매장 대항전'));
    if (canP) {
      var tb = E('div', 'gr-tab'); tb.setAttribute('role', 'group');
      [['team', '매장 순위'], ['me', '우리 매장 손님']].forEach(function (x) {
        var bt = E('button', null, x[1]); bt.type = 'button'; bt.setAttribute('aria-pressed', String(tab === x[0]));
        bt.onclick = function () { tab = x[0]; draw(el, d, b); }; tb.append(bt);
      });
      h.append(tb);
    }
    el.append(h);

    if (tab === 'team') {
      if (hasStore && T.gain > 0) el.append(E('div', 'gr-gain', '이번 판 +' + nf(T.gain) + '점을 ' + T.store + '에 보탰어요'));
      else if (hasStore && T.gain === 0) el.append(E('div', 'gr-note', '오늘 보탤 수 있는 점수를 다 채웠어요. 내일 또 함께해 주세요!'));
      var me = E('div', 'gr-me');
      if (hasStore) {
        me.textContent = T.store + ' 전국 ' + (T.rank ? T.rank + '등' : '도전 중');
        me.append(E('small', null, (T.rank ? '참여 매장 ' + nf(T.total) + '곳 중 · ' : '') + '매장 점수 ' + nf(T.pts) + '점 · 함께한 손님 ' + nf(T.people) + '명'));
        el.append(me);
      } else {
        me.textContent = '전국 매장 순위'; el.append(me);
        el.append(E('div', 'gr-note', '매장에서 받은 QR로 게임을 하면 내 점수가 그 매장 점수에 더해져요. 손님들이 다 같이 올린 점수로 매장끼리 겨뤄요.'));
      }
      var ol = E('ol'), meIn = false;
      (T.top || []).slice(0, 5).forEach(function (r) { row(ol, r.r, r.n, nf(r.v) + '점', r.me); if (r.me) meIn = true; });
      if (T.rank && !meIn) { if (T.rank > 6) ol.append(E('li', 'gap', '⋮')); row(ol, T.rank, T.store, nf(T.pts) + '점', true); }
      if ((T.top || []).length) el.append(ol); else el.append(E('div', 'gr-wait', '이번 달 첫 점수를 올려 보세요!'));
    } else {
      var v = d.store, m2 = E('div', 'gr-me');
      if (v.rank) { m2.textContent = T.store + ' 손님 중 ' + v.rank + '등'; m2.append(E('small', null, B.name + ' 내 최고 ' + B.f(v.mine) + ' · ' + nf(v.total) + '명 중')); }
      else m2.textContent = B.name + ' · 우리 매장 손님 순위';
      el.append(m2);
      var ol2 = E('ol'), in2 = false;
      v.top.slice(0, 5).forEach(function (r) { row(ol2, r.r, r.n + (r.me ? ' (나)' : ''), B.f(r.v), r.me); if (r.me) in2 = true; });
      if (v.rank && !in2) { if (v.rank > 6) ol2.append(E('li', 'gap', '⋮')); row(ol2, v.rank, (d.nick || '나') + ' (나)', B.f(v.mine), true); }
      if (v.top.length) el.append(ol2);
    }
    var f = E('div', 'gr-f');
    f.append(E('span', null, (hasStore && T.mine ? '이번 달 내가 보탠 점수 ' + nf(T.mine) + '점 · ' : '') + (+d.reset) + '월 1일 0시에 새로 시작' + (d.demo ? ' · 미리보기 예시' : '')));
    if (d.nick && canP) { var nb = E('button', null, '내 별명 ' + d.nick + ' 바꾸기'); nb.type = 'button'; nb.onclick = function () { nameForm(el, d, b); }; f.append(nb); }
    el.append(f);
  }
  function nameForm(el, d, b) {
    if (el.querySelector('form')) return;
    var fm = E('form'), inp = E('input'), ok = E('button', null, '저장'), msg = E('div', 'gr-msg');
    inp.maxLength = 10; inp.value = d.nick || ''; inp.placeholder = '2~10자 (한글·영문·숫자)'; inp.setAttribute('aria-label', '순위에 보일 별명'); ok.type = 'submit';
    fm.append(inp, ok); el.append(fm, msg); inp.focus();
    fm.onsubmit = function (e) {
      e.preventDefault(); var n = inp.value.trim();
      if (n.length < 2) { msg.textContent = '두 글자 이상 써 주세요.'; return; }
      ok.disabled = true; msg.textContent = '저장 중…';
      var p = LIVE ? rpc('game_rank_nick', { p_dev: dev, p_nick: n }) : demo(null, null, n).then(function (x) { return { ok: true, nick: x.nick }; });
      p.then(function (r) {
        ok.disabled = false;
        if (!r || !r.ok) { msg.textContent = r && r.reason === 'nick' ? '이 별명은 쓸 수 없어요. 다른 별명을 써 주세요.' : r && r.reason === 'many' ? '잠시 뒤에 다시 바꿔 주세요.' : '저장하지 못했어요. 잠시 뒤 다시 해 주세요.'; return; }
        d.nick = r.nick; if (d.store) d.store.top.forEach(function (x) { if (x.me) x.n = r.nick; });
        draw(el, d, b);
      });
    };
  }

  function nextMonth(d) { if (d && d.ok && !d.reset) { var nx = new Date(); nx.setMonth(nx.getMonth() + 1); d.reset = String(nx.getMonth() + 1); } return d; }
  function show(b, p) {
    var el = document.getElementById('grank'); if (!el) return;
    el.hidden = false; el.textContent = ''; el.append(E('div', 'gr-wait', '이번 달 매장 대항전을 불러오는 중…'));
    p.then(function (d) { if (d && d.ok) draw(el, d, b); else el.hidden = true; });
  }
  window.GRANK = {
    submit: function (b, val) {
      if (!BOARDS[b]) return;
      show(b, !LIVE ? demo(b, val, null, b) : rpc('game_rank_submit', { p_board: b, p_score: Math.round(val), p_dev: dev, p_s: skey() }).then(function (d) {
        return d && !d.ok && d.reason === 'score' ? rpc('game_play', { p_game: 'zero', p_dev: dev, p_s: skey() }) : d; }));
    },
    play: function (g) {
      var b = BOARDS[g] ? g : null;
      show(b, !LIVE ? demo(b, null, null, g) : rpc('game_play', { p_game: g, p_dev: dev, p_s: skey() }).then(function (d) {
        if (!d || !d.ok || !b) return d;
        return rpc('game_rank_get', { p_board: b, p_dev: dev, p_s: skey() }).then(function (x) { if (x && x.ok) { x.team = d.team; return x; } return d; }); }));
    },
    team: function () { show(null, !LIVE ? demo(null) : rpc('game_rank_all', { p_s: skey() }).then(nextMonth)); },
    /* 9종 모음 화면: 매장 순위 */
    all: function (el) {
      if (!el) return;
      (!LIVE ? demo(null) : rpc('game_rank_all', { p_s: skey() }).then(nextMonth)).then(function (d) { if (d && d.ok) { el.className = 'grank'; tab = 'team'; draw(el, d, null); } });
    }
  };
})();
