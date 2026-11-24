// 2026-11-23 여러 매장 자료 한꺼번에 받기(종류별·매장별 폴더 zip)·매장 자세히 연락할 곳 종류별로 모두.
// SM 성과 화면 — 2026-11-19 최종 수정본(sm4: SM=행사 카드형, 팀장·관리자=왼쪽 메뉴형, 알림 보내기) 적용. sm-preview/v4/to_real.py 가 sm4.js 에서 만듦
// SM 성과 화면(자료실 3 디자인): 로그인 → (처음이면 비밀번호 바꾸기) → 담당 매장 성과 → 매장별 기록
(function () {
  var U = window.U, esc = U.esc, RES = { call: ['통화만 함', 't-info'], away: ['안 받음', 't-warn'], hot: ['관심 있음', 't-ok'], no: ['필요 없대요', 't-bad'], order: ['주문 받음', 't-ok'] }, KEY = 'bj_sm_token';
  var ss = { get: function () { try { return sessionStorage.getItem(KEY); } catch (e) { return null; } }, set: function (v) { try { v == null ? sessionStorage.removeItem(KEY) : sessionStorage.setItem(KEY, v); } catch (e) { } } };
  var EVK = 'bj_sm_event', S = { pk: {}, sum: {}, amap: {}, view: 'boot', token: ss.get(), me: null, rows: [], f: 'all', q: '', sel: null, det: null, err: null, busy: false, now: null, ev: U.store.get(EVK) || 'dj', evs: [], event: {}, A: null, pws: [], ed: null, aq: '', at: '', conf: null, aerr: null, tm: '', allocs: null, af: 'all', aed2: null, ares: null };
  var ROLE = { sm: 'SM', lead: '팀장', admin: '관리자' };
  var app = U.$('app');
  var STG = { '미참여': 't-bad', '접속만': 't-warn', '시작': 't-info', '실행': 't-info', '완료': 't-ok' };
  // 단계 이름은 두 화면 모두 이 말로 (사장님 앱·카드형과 같은 말)
  var STN = { '미참여': '로그인 안 함', '접속만': '기록 0건', '시작': '연락 시작', '실행': '절반 넘게 연락', '완료': '목표 다 함' };
  function stn(x) { return STN[x] || x; }

  function flags(r) {
    var f = [];
    if (!r.ready) f.push(['로그인 자료 없음', 't-bad']);
    if (r.locked) f.push(['로그인 잠김', 't-bad']);
    if (r.away > r.retried) f.push(['다시 연락 밀림 ' + (r.away - r.retried) + '곳', 't-warn']);
    if (r.hot_stale > 0) f.push(['관심 뒤 7일 지남 ' + r.hot_stale + '곳', 't-warn']);
    if (r.burst) f.push(['몰아서 입력', 't-warn']);
    if (r.orders > 0) f.push(['주문 받음', 't-ok']);
    var pd = pdays(r); if (pd != null) f.push([pdl(pd), 't-info']);
    return f;
  }
  function needs(r) { return r.stage === '미참여' || r.stage === '접속만' || flags(r).some(function (x) { return x[1] !== 't-ok'; }); }
  function pct(a, b) { return b ? Math.round(a / b * 100) + '%' : '없음'; }
  function ago(iso) { if (!iso) return '없음'; var d = Math.floor((new Date(S.now) - new Date(iso)) / 864e5); return d <= 0 ? '오늘' : d + '일 전'; }
  function sum(k, A) { return (A || S.rows).reduce(function (a, r) { return a + Number(r[k] || 0); }, 0); }
  function byKo(a, b) { return a === '팀 없음' ? 1 : b === '팀 없음' ? -1 : a.localeCompare(b, 'ko', { numeric: true }); }
  // 위 묶음표: 관리자는 팀별, 팀장은 SM별. 아래 매장표 묶음: 관리자가 팀을 안 골랐으면 팀, 그 밖에는 SM
  function topKey() { return S.me && S.me.role === 'admin' ? 'team' : S.me && S.me.role === 'lead' ? 'sm' : ''; }
  function kv(r, k) { return r[k] || (k === 'team' ? '팀 없음' : 'SM 없음'); }
  function scoped() { var k = topKey(); return k && S.tm ? S.rows.filter(function (r) { return kv(r, k) === S.tm; }) : S.rows; }
  function groups(R, k) {
    var m = {}; R.forEach(function (r) { var g = kv(r, k); (m[g] = m[g] || []).push(r); });
    return Object.keys(m).sort(byKo).map(function (g) { return [g, m[g]]; });
  }
  function gstat(A) {
    return { n: A.length, j: A.filter(function (r) { return r.stage !== '미참여'; }).length, d: A.filter(function (r) { return r.stage === '실행' || r.stage === '완료'; }).length,
      c: sum('contacted', A), o: sum('orders', A), q: sum('qty', A), v: sum('revenue', A) };
  }
  // 시안 5: 팀(SM)별 막대 · 참여 낮은 순
  function groupTable() {
    var k = topKey(); if (!k) return '';
    var G = groups(S.rows, k).map(function (x) { return [x[0], gstat(x[1])]; }), nm = k === 'team' ? '팀' : 'SM';
    G.sort(S.gsort === 'name' ? function (a, b) { return byKo(a[0], b[0]); } : function (a, b) { return a[1].j / (a[1].n || 1) - b[1].j / (b[1].n || 1); });
    var bar = function (key, label, g, i) {
      var pj = g.n ? Math.round(g.j / g.n * 100) : 0, pd = g.n ? Math.round(g.d / g.n * 100) : 0;
      return '<li><button type="button" data-act="tm" data-t="' + esc(key) + '" aria-pressed="' + (S.tm === key) + '"><span class="rk">' + (i + 1) + '</span><span class="nm">' + label + '</span>' +
        '<span class="br" aria-hidden="true"><i class="d" data-w="' + pj + '"></i></span><span class="nb"><b>' + pj + '%</b> 참여</span><span class="nb2">열심히 ' + pd + '%</span><span class="ex">' + U.won(g.n) + '곳 · 로그인 안 함 ' + U.won(g.n - g.j) + ' · 주문 ' + U.won(g.q) + '인분</span></button></li>';
    };
    return '<section class="step grp2"><div class="hd"><h2>' + nm + '별 <small>' + G.length + (k === 'team' ? '팀' : '명') + '</small></h2><div class="seg sm2" role="group" aria-label="줄 세우기"><button type="button" data-act="gsort" data-v="" aria-pressed="' + (S.gsort !== 'name') + '">참여 낮은 순</button><button type="button" data-act="gsort" data-v="name" aria-pressed="' + (S.gsort === 'name') + '">이름순</button></div></div>' +
      '<p class="lg2">막대와 % = 참여(한 번이라도 로그인한 매장) · 열심히 = 목표 절반 넘게 연락한 매장 · 누르면 그 ' + nm + '만 봅니다</p>' +
      '<ul class="bars2 v4">' + G.map(function (x, i) { return bar(x[0], esc(x[0]), x[1], i); }).join('') + '</ul></section>';
  }
  function top() {
    return '<header class="top"><div class="wrap"><div class="brand"><picture><source media="(prefers-color-scheme: dark)" srcset="img/logo-dark.svg"><img src="img/logo.svg" alt="본죽&amp;비빔밥"></picture><span>SM 성과 관리</span></div>' +
      '<div class="rt">' + (S.me ? (S.me.role !== 'sm' && (S.view === 'dash' || S.view === 'acct') ? '<button class="mini" type="button" data-act="' + (S.view === 'acct' ? 'dash' : 'acct') + '">' + (S.view === 'acct' ? '성과 보기' : '계정 관리') + '</button>' : '') + '<b>' + esc(S.me.name) + '</b><button class="mini" type="button" data-act="logout">로그아웃</button>' : '') + '</div></div></header>';
  }
  function band() {
    var e = S.event || {};
    return '<div class="band"><div class="wrap"><div class="l"><b>' + esc(e.title || e.name || '단체주문') + '</b><small>사장님이 적은 연락·주문 기록을 모아 봅니다' + (e.mode === 'hq' ? ' · 본사 진행 행사' : '') + '</small></div>' +
      '<div class="r"><span><span class="d">' + U.dday(e.day, e.name) + '</span> · ' + esc(e.dateLabel || U.day(e.day)) + '</span>' + (e.deadlineLabel ? '<span><b>' + esc(e.deadlineLabel) + '</b></span>' : '') +
      (S.now ? '<span>' + U.when(S.now) + ' 기준</span><button class="mini" type="button" data-act="reload">새로 고침</button>' : '') + '</div></div></div>';
  }


  // ── 시안 1: 챙길 매장(이유와 함께) ──
  var WHY = {
    lock: ['로그인 잠김', 't-bad', 5], stale: ['관심 뒤 7일 지남', 't-warn', 4], away: ['다시 연락 밀림', 't-warn', 3],
    idle: ['기록 0건', 't-warn', 2], none: ['로그인 안 함', 't-bad', 1], auth: ['로그인 자료 없음', 't-bad', 1]
  };
  function why(r) {
    if (r.locked) return 'lock'; if (!r.ready) return 'auth'; if (r.hot_stale > 0) return 'stale'; if (r.away > r.retried) return 'away';
    if (r.stage === '접속만') return 'idle'; if (r.stage === '미참여') return 'none'; return '';
  }
  function ownerUrl() { return location.origin + location.pathname.replace(/[^/]*$/, ''); }
  function nudge(r, w) {
    var e = S.event || {}, hd = '[본죽 ' + (e.name || '단체주문') + ' 단체주문] ' + r.name + ' 사장님, 담당 SM ' + (r.sm || '') + '입니다.\n';
    if (w === 'none' || w === 'auth') return hd + '단체주문 앱에 아직 들어오지 않으셨어요. 가맹점코드·사업자번호·휴대폰 뒷자리 4자리로 1분이면 들어가실 수 있어요.\n주소: ' + ownerUrl();
    if (w === 'idle') return hd + '앱에 들어와 주셔서 감사합니다! 오늘 화면 맨 위에 나오는 곳에 한 곳만 전화해 보세요. 끊고 나서 결과 버튼만 누르시면 됩니다.';
    if (w === 'away') return hd + '안 받았던 곳 ' + (r.away - r.retried) + '곳에 다시 한 번 전화해 보세요. 앱의 \'연락할 곳 › 다시 연락\'에 모여 있어요.';
    if (w === 'stale') return hd + '관심 있다고 한 곳에 제안서를 보내 보셨나요? 그 곳을 누르면 이름이 들어간 제안서를 바로 문자·카톡으로 보낼 수 있어요.';
    if (w === 'lock') return hd + '로그인이 잠겨 있어 풀어 드렸어요. 다시 들어가 보세요.';
    return hd + '주문 받으신 것 축하드려요! 받는 날에 맞춰 준비 부탁드립니다.';
  }
  function careList(R) {
    var A = R.map(function (r) { return { r: r, w: why(r) }; }).filter(function (x) { return x.w; });
    var L = A.filter(function (x) { return x.w !== 'none' && x.w !== 'auth'; }), N0 = A.length - L.length;
    L.sort(function (a, b) { return WHY[b.w][2] - WHY[a.w][2] || (b.r.contacted - a.r.contacted); });
    var praise = R.filter(function (r) { return r.orders > 0; }).sort(function (a, b) { return b.qty - a.qty; });
    var cnt = {}; L.forEach(function (x) { cnt[x.w] = (cnt[x.w] || 0) + 1; });
    var showSm = S.me.role !== 'sm', top = L.slice(0, S.cmore ? 30 : 10);
    return '<section class="step care"><div class="hd"><h2>오늘 챙길 매장 <small>' + L.length + '곳</small></h2>' +
      '<p class="small">' + ['lock', 'stale', 'away', 'idle'].filter(function (k) { return cnt[k]; }).map(function (k) { return WHY[k][0] + ' ' + cnt[k]; }).join(' · ') + '</p></div>' +
      (N0 ? '<div class="none0"><span><b>아직 로그인 안 한 매장 ' + U.won(N0) + '곳</b><small>한 곳씩 말고, 같은 안내를 한꺼번에 보내세요</small></span><button class="btn sm ghost" type="button" data-act="pnew" data-c="none">한꺼번에 알림</button><button class="btn sm ghost" type="button" data-act="f" data-f="미참여">목록 보기</button></div>' : '') +
      (top.length ? '<ul class="cl">' + top.map(function (x) {
        var r = x.r, w = WHY[x.w];
        return '<li><button type="button" class="tx" data-act="row" data-id="' + r.id + '"><b>' + esc(r.name) + '</b><span><span class="tag ' + w[1] + '">' + w[0] + '</span>' + (showSm ? esc(r.sm || '') + ' · ' : '') + '연락 ' + r.contacted + '/' + r.target + '</span></button>' +
          '<button class="btn sm ghost" type="button" data-act="pnew" data-id="' + r.id + '" data-w="' + x.w + '">알림 보내기</button></li>';
      }).join('') + '</ul>' : '<p class="box">챙길 매장이 없습니다. 모두 잘 하고 있어요.</p>') +
      (L.length > top.length ? '<button class="lnk2" type="button" data-act="cmore">' + (S.cmore ? '' : '챙길 매장 더 보기 ›') + '</button>' : '') +
      (praise.length ? '<div class="praise"><b>칭찬할 매장</b><span>' + praise.slice(0, 6).map(function (r) { return '<button type="button" class="chip" data-act="row" data-id="' + r.id + '">' + esc(r.name) + ' · ' + U.won(r.qty) + '인분</button>'; }).join('') + (praise.length > 6 ? '<i>외 ' + (praise.length - 6) + '곳</i>' : '') + '</span></div>' : '') + '</section>';
  }
  function tiles4(R) {
    var N = R.length, joined = R.filter(function (r) { return r.stage !== '미참여'; }).length, doing = R.filter(function (r) { return r.stage === '실행' || r.stage === '완료'; }).length;
    var t = function (k, v, u, s2) { return '<div class="t4"><span class="k">' + k + '</span><b>' + v + '<small>' + u + '</small></b><span class="s">' + s2 + '</span></div>'; };
    return '<div class="tiles4">' + t('참여', joined, '/ ' + N + '곳', pct(joined, N)) + t('열심히 하는 곳', doing, '/ ' + N + '곳', '목표 절반 넘게 연락 · ' + pct(doing, N)) + t('연락한 곳', U.won(sum('contacted', R)), '곳', '관심 ' + U.won(sum('hot', R)) + '곳') + t('주문', U.won(sum('qty', R)), '인분', '추정 ' + U.won(sum('revenue', R)) + '원') + '</div>';
  }
  // ── 시안 3: 머리줄 한 줄 ──
  function hbar() {
    var e = S.event || {}, adm = S.me && S.me.role !== 'sm';
    return '<header class="hb"><div class="wrap"><picture class="lg"><source media="(prefers-color-scheme: dark)" srcset="img/logo-dark.svg"><img src="img/logo.svg" alt="본죽&amp;비빔밥"></picture>' +
      (false ? '<button class="ab-back" type="button" data-act="dash" aria-label="성과로">‹</button><b class="evt">계정 관리</b>' :
        '<button class="evt" type="button" data-act="evm" aria-expanded="' + !!S.evm + '"><b>' + esc(e.title || e.name || '단체주문') + '</b><span aria-hidden="true">▾</span></button><span class="ab-d">' + U.dday(e.day, e.name) + '</span>') +
      '<span class="sp"></span>' + (S.view === 'dash' ? '<button class="mini ic" type="button" data-act="reload" aria-label="새로 고침" title="새로 고침">⟳</button>' : '') +
      '<button class="mini" type="button" data-act="menu" aria-expanded="' + !!S.menu + '">' + esc(S.me ? S.me.name : '') + ' ▾</button></div>' +
      (S.evm ? '<div class="wrap pop"><ul>' + S.evs.map(function (x) { return '<li><button type="button" data-act="ev" data-id="' + esc(x.id) + '" aria-current="' + (x.id === S.ev) + '"><b>' + esc(x.title || x.name) + '</b><span>' + U.dday(x.day, x.name) + (x.mode === 'hq' ? ' · 본사 진행' : '') + '</span></button></li>'; }).join('') + '</ul></div>' : '') +
      (S.menu ? '<div class="wrap pop r"><ul>' + (false ? '<li><button type="button" data-act="' + (S.view === 'acct' ? 'dash' : 'acct') + '"><b>' + (S.view === 'acct' ? '성과 보기' : '계정 관리') + '</b></button></li>' : '') + '<li><button type="button" data-act="gon"><b>처음 안내 다시 보기</b></button></li><li><button type="button" data-act="logout"><b>로그아웃</b></button></li></ul></div>' : '') + '</header>';
  }
  function asof() { var e = S.event || {}; return '<p class="asof">' + esc(e.deadlineLabel || e.dateLabel || '') + (S.now ? ' · ' + U.when(S.now) + ' 기준' : '') + '</p>'; }
  // ── 시안 2: 휴대폰은 카드 줄, 50곳씩 ──
  function narrow() { return window.innerWidth < 760; }
  function cardRow(r, showSm) {
    var fl = flags(r);
    return '<li><button type="button" class="tx" data-act="row" data-id="' + r.id + '" aria-current="' + (S.sel === r.id) + '"><span class="l1"><b>' + esc(r.name) + '</b><span class="tag ' + STG[r.stage] + '">' + stn(r.stage) + '</span></span>' +
      '<span class="l2">' + (showSm ? esc(r.sm || '') + ' · ' : '') + '연락 ' + r.contacted + '/' + r.target + (r.orders ? ' · <b>주문 ' + U.won(r.qty) + '인분</b>' : '') + ' · ' + ago(r.last_at) + '</span>' +
      (fl.length ? '<span class="l3">' + fl.map(function (x) { return '<span class="tag ' + x[1] + '">' + x[0] + '</span>'; }).join('') + '</span>' : '') + '</button></li>';
  }
  function render() {
    var h = '';
    if (!U.ready()) {
      h = top() + '<div class="wrap split one-col"><div class="steps"><h2 class="q">설치. <span>아직 끝나지 않았습니다</span></h2><p class="small">config.js 파일에 서버 주소와 공개용 키를 넣어야 합니다. 설치안내.txt 3단계를 봐 주세요.</p></div></div>';
    } else if (S.view === 'boot') {
      h = top() + '<div class="wrap split one-col"><p class="small">불러오는 중입니다.</p></div>';
    } else if (S.view === 'login') {
      h = top() + '<div class="wrap login"><form id="lf" novalidate><h2 class="q">SM. <span>본사 SM 전용입니다</span></h2>' +
        '<label class="f" for="iId">아이디<input id="iId" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="예: 홍길동 또는 230101"></label>' +
        '<label class="f" for="iPw">비밀번호<input id="iPw" type="password" autocomplete="current-password" placeholder="처음이면 00000000 (숫자 0 여덟 개)"></label>' +
        (S.err ? '<p class="err" role="alert">' + S.err + '</p>' : '') +
        '<button class="btn block" type="submit"' + (S.busy ? ' disabled' : '') + '>들어가기</button><p class="small">아이디는 계정을 만들 때 받은 그대로(이름 또는 숫자) 넣습니다. 틀려도 잠기지 않으니 다시 넣어 보세요.</p></form></div>';
    } else if (S.view === 'pw') {
      h = top() + '<div class="wrap login"><form id="pf" novalidate><h2 class="q">비밀번호. <span>새로 정해 주세요</span></h2><p class="small">처음 받은 비밀번호는 한 번만 씁니다. 8자 이상으로 바꿔 주세요.</p>' +
        '<label class="f" for="pOld">지금 비밀번호<input id="pOld" type="password" autocomplete="current-password" placeholder="처음이면 00000000"></label>' +
        '<label class="f" for="pNew">새 비밀번호 (8자 이상)<input id="pNew" type="password" autocomplete="new-password" placeholder="8자 이상, 영문·숫자 섞어서"></label>' +
        '<label class="f" for="pNew2">새 비밀번호 한 번 더<input id="pNew2" type="password" autocomplete="new-password" placeholder="위와 똑같이"></label>' +
        (S.err ? '<p class="err" role="alert">' + S.err + '</p>' : '') +
        '<button class="btn block" type="submit"' + (S.busy ? ' disabled' : '') + '>바꾸기</button></form></div>';
    } else if (S.view === 'dash' && S.me.role !== 'sm') {
      h = menuDash(); document.body.classList.toggle('mopen', !!(S.cmp || S.bulk || S.hqg));
    } else if (S.view === 'dash') {
      var PG = S.pg || 'hqs';
      if (PG === 'hqs') h = navTop() + '<div class="wrap pg3 hqp">' + hqsView() + '</div>';
      else if (PG === 'ev') h = navTop() + coach() + evView() + drawer() + (noPush() ? '' : cmpView()) + bulkView();
      else if (PG === 'sent' && !noPush()) h = navTop() + coach() + sentView() + cmpView();
      else if (PG === 'perf' && topKey()) h = navTop() + perfView();
      else if (PG === 'help') h = navTop() + helpPage();
      else h = navTop() + coach() + eventsView();
      document.body.classList.toggle('mopen', !!(S.cmp || S.bulk || S.hqg));
    } else if (S.view === 'acct') {
      h = shell(acctView());
    }
    app.innerHTML = h;
    Array.prototype.forEach.call(app.querySelectorAll('[data-w]'), function (el) { el.style.width = el.dataset.w + '%'; });
    Array.prototype.forEach.call(app.querySelectorAll('[data-ec]'), function (el) { if (el.dataset.ec) el.style.setProperty('--ec2', el.dataset.ec); });
    if (S.event && S.event.color && S.pg === 'ev') document.body.style.setProperty('--ec', S.event.color); else document.body.style.removeProperty('--ec');
    var ts = U.$('tmSel'); if (ts) ts.addEventListener('change', function () { S.tm = ts.value; S.lim = 60; render(); });
    if (S.cmp && S.cmpFocus) { S.cmpFocus = false; var md = U.$('mdl'); if (md) md.focus(); }
    if (S.bulk && S.bFocus) { S.bFocus = false; var bm = U.$('bmdl'); if (bm) bm.focus(); }
    var lf = U.$('lf'); if (lf) lf.addEventListener('submit', login);
    var pf = U.$('pf'); if (pf) pf.addEventListener('submit', changePw);
    var af = U.$('af'); if (af) af.addEventListener('submit', saveAcct);
    bindSearch('aq', 'aq');
    var at = U.$('at'); if (at) at.addEventListener('change', function () { S.at = at.value; render(); });
    bindSearch('q', 'q');
    bindSearch('hqq', 'hq');
    var hf = U.$('hqAddF'); if (hf) hf.addEventListener('submit', hqAdd);
    var hty = U.$('hqTy'); if (hty) hty.addEventListener('change', function () { S.hqty = hty.value; S.hqLim = 60; render(); });
    var hso = U.$('hqSo'); if (hso) hso.addEventListener('change', function () { S.hqsort = hso.value; S.hqLim = 60; render(); });
    pushLive(); coachPlace();
    if (S.view === 'dash' && S.me && window.FirstGuide) FirstGuide.maybe((S.me.role === 'admin' ? 'admin' : S.me.role === 'lead' ? 'lead' : 'sm'), 'bj_sm_guide2_' + S.me.role);
  }
  // 찾기 칸: 한글은 조합 중에 화면을 다시 그리면 'ㅍㅕㅇ'처럼 낱자로 갈라지므로,
  // 입력 중에는 표 줄만 숨기고, 조합이 끝난 뒤 잠시 쉬면 그때 다시 그립니다.
  var tSearch = null, composing = false;
  function quickFilter(el) {
    var q = el.value.trim(), sec = el.closest('section') || app, R = sec.querySelectorAll('tbody tr'), g = null, any = false;
    Array.prototype.forEach.call(R, function (tr) {
      if (tr.classList.contains('grp') || tr.classList.contains('edit')) return;
      var c = tr.querySelectorAll('td'); if (c.length < 2) return;
      tr.hidden = !!q && ((c[0].textContent || '') + ' ' + (c[1].textContent || '')).indexOf(q) < 0;
    });
    Array.prototype.forEach.call(R, function (tr) { if (tr.classList.contains('grp')) { if (g) g.hidden = !any; g = tr; any = false; } else if (!tr.hidden) any = true; });
    if (g) g.hidden = !any;
  }
  function bindSearch(id, key) {
    var el = U.$(id); if (!el) return;
    function redraw() {
      tSearch = null; if (composing) return;
      var cur = U.$(id); if (!cur) return;
      var had = document.activeElement === cur, p = cur.selectionStart;
      if (S[key] === cur.value && cur.dataset.drawn === cur.value) return;
      render(); var n = U.$(id); if (n) { n.dataset.drawn = n.value; if (had) { n.focus(); try { n.setSelectionRange(p, p); } catch (e) { } } }
    }
    function later(ms) { clearTimeout(tSearch); tSearch = setTimeout(redraw, ms); }
    el.dataset.drawn = el.value;
    el.addEventListener('compositionstart', function () { composing = true; clearTimeout(tSearch); });
    el.addEventListener('compositionend', function () { composing = false; S[key] = el.value; quickFilter(el); later(600); });
    el.addEventListener('input', function (e) { S[key] = el.value; quickFilter(el); if (e.isComposing || composing) { clearTimeout(tSearch); return; } later(250); });
    el.addEventListener('blur', function () { composing = false; });
  }
  // 고른 매장 자료: 인쇄해 사장님께 전달(매장 이름·전화가 들어감, 받는 곳은 빈칸)
  function dST() { var s = (S.det && S.det.store) || {}; return { s: s.name || '', tel: s.tel || '', bj: !!s.bj }; }
  function smDocs() {
    var DD = window.Docs; if (!DD || !S.det) return '';
    var o = DD.of(S.ev), rows = [];
    if (o.kit) rows.push(['dkit', '', o.kit.title, o.kit.spec + ' · 사장님께']);
    o.props.forEach(function (x) { rows.push(['dblank', x.key, x.title, (x.who ? x.who + ' · ' : '') + '받는 곳은 빈칸']); });
    (o.files || []).forEach(function (x) { rows.push(['dfile', x.src, x.title, x.spec]); });
    if (!rows.length) return '';
    return '<div class="sdocs"><h3>자료. <span>' + esc(dST().s) + ' 이름이 들어간 자료를 받아 인쇄해 전달하세요</span></h3><ul class="dl">' + rows.map(function (r) {
      var on = S.dbusy === r[0] + r[1];
      return '<li><div><b>' + esc(r[2]) + '</b><span>' + esc(r[3]) + '</span></div><button class="btn ghost sm" type="button" data-act="' + r[0] + '" data-k="' + esc(r[1]) + '"' + (S.dbusy ? ' disabled' : '') + '>' + (on ? '만드는 중…' : '받기') + '</button></li>';
    }).join('') + '</ul>' + (o.props.length ? '<p class="small">사장님은 자기 화면에서 연락할 곳을 누르면 그 곳 이름이 표지에 들어간 제안서를 바로 문자·카톡으로 보낼 수 있습니다.</p>' : '') + '</div>';
  }
  async function smDocGet(act, k) {
    var DD = window.Docs, o = DD.of(S.ev), st = dST(), ev = S.event || {}; if (S.dbusy || !S.det) return;
    S.dbusy = act + (k || ''); render();
    try {
      var bytes, title;
      if (act === 'dkit') { bytes = await DD.make(S.ev, 'kit', st, { places: S.det.places, event: ev.title || ev.name, color: ev.color }); title = o.kit.title; }
      else if (act === 'dblank') { bytes = await DD.make(S.ev, 'prop', st, { key: k }); title = o.props.find(function (x) { return x.key === k; }).title; }
      else { bytes = await DD.make(S.ev, 'file', st, { src: k }); title = o.files.find(function (x) { return x.src === k; }).title; }
      DD.save(bytes, DD.fileName(st, ev.name || '', title)); U.toast('저장했습니다. 다운로드 폴더에서 열어 인쇄하세요');
    } catch (e) { U.toast('자료를 만들지 못했습니다. 잠시 뒤 다시 눌러 주세요'); }
    S.dbusy = null; render();
  }
  // 매장 상세 창: PC는 오른쪽 고정, 휴대폰은 아래에서 올라옴
  function drawer() {
    if (!S.sel) { document.body.classList.remove('dopen'); return ''; }
    var first = !document.body.classList.contains('dopen'); document.body.classList.add('dopen');
    return '<div class="dbg" data-act="dclose" aria-hidden="true"></div><aside class="drawer' + (first ? ' ani' : '') + '" id="drw" role="dialog" aria-label="고른 매장" tabindex="-1">' +
      '<div class="dtop"><span>매장 자세히</span><button class="mini" type="button" data-act="dclose">닫기 ✕</button></div>' + detail() + '</aside>';
  }
  // 본사 진행 행사: 배정 수량 중심 화면
  function hqView(R, P) {
    var A = S.allocs, admin = S.me.role === 'admin', M = {};
    if (!A) return '<div class="wrap split one-col"><div class="steps"><section class="step"><h2 class="q">배정. <span>본사가 매장에 맡기는 수량</span></h2><p class="box warn">서버에 배정 기능이 아직 없습니다. 설치 화면에서 \'이어서 하기\'(47번째 단계)를 눌러 주세요.</p></section></div></div>';
    A.forEach(function (a) { M[a.store] = a; });
    var withA = R.filter(function (r) { return M[r.id]; }), tot = withA.reduce(function (x, r) { return x + M[r.id].qty; }, 0), ok = withA.filter(function (r) { return M[r.id].confirmed; }).length;
    var F = { all: function () { return true; }, has: function (r) { return M[r.id]; }, wait: function (r) { return M[r.id] && !M[r.id].confirmed; }, none: function (r) { return !M[r.id]; } };
    var q = S.q.trim(), V = R.filter(function (r) { return (F[S.af] || F.all)(r) && (!q || r.name.indexOf(q) >= 0 || (r.sm || '').indexOf(q) >= 0); });
    V.sort(function (a, b) { return (M[b.id] ? 1 : 0) - (M[a.id] ? 1 : 0); });
    var tabs = [['all', '전체', R.length], ['has', '배정됨', withA.length], ['wait', '확인 전', withA.length - ok], ['none', '배정 없음', R.length - withA.length]];
    var row = function (r) {
      var a = M[r.id], ed = S.aed2 === r.id;
      if (ed) return '<tr class="edit"><td class="nm">' + esc(r.name) + '</td><td class="l">' + esc(r.sm || '') + '</td><td><input id="eQ" type="number" inputmode="numeric" min="0" max="100000" value="' + (a ? a.qty : '') + '" aria-label="배정 인분"></td>' +
        '<td><input id="eD" type="date" value="' + (a && a.day ? a.day : (S.event.day || '')) + '" aria-label="보내는 날"></td><td class="l"><input id="eN" type="text" maxlength="200" value="' + esc(a && a.note || '') + '" aria-label="메모" placeholder="학교·학년 등"></td>' +
        '<td class="l" colspan="2"><button class="btn sm" type="button" data-act="hsave" data-id="' + r.id + '" data-n="' + esc(r.name) + '">저장</button> <button class="btn ghost sm" type="button" data-act="hcancel">그만두기</button></td></tr>';
      return '<tr><td class="nm">' + esc(r.name) + '</td><td class="l">' + esc(r.sm || '') + '</td><td>' + (a ? '<b>' + U.won(a.qty) + '</b>인분' : '<span class="small">없음</span>') + '</td><td>' + (a && a.day ? U.day(a.day) : '') + '</td><td class="l wrap">' + esc(a && a.note || '') + '</td>' +
        '<td class="l">' + (!a ? '' : a.confirmed ? '<span class="tag t-ok">확인함</span> <span class="small">' + U.when(a.confirmed) + '</span>' : '<span class="tag t-warn">확인 전</span>') + '</td>' +
        '<td class="l">' + (admin ? '<button class="btn ghost sm" type="button" data-act="hedit" data-id="' + r.id + '">' + (a ? '고치기' : '배정하기') + '</button>' : '') + '</td></tr>';
    };
    var t4 = function (k, v, u, s2) { return '<div class="t4"><span class="k">' + k + '</span><b>' + v + '<small>' + u + '</small></b><span class="s">' + s2 + '</span></div>'; };
    var TL = '<div class="tiles4 t3">' + t4('배정한 매장', withA.length, '/ ' + R.length + '곳', pct(withA.length, R.length)) + t4('배정 수량', U.won(tot), '인분', '매장당 평균 ' + (withA.length ? Math.round(tot / withA.length) : 0) + '인분') +
      t4('사장님 확인', ok, '/ ' + withA.length + '곳', !withA.length ? '배정을 넣으면 보입니다' : withA.length - ok ? '확인 전 ' + (withA.length - ok) + '곳은 전화로' : '모두 확인했습니다') + '</div>';
    var GD = '<aside class="side" aria-label="안내"><details class="guide"' + (S.gOpen ? ' open' : '') + '><summary>처음 쓰는 분 안내 <span>배정이 어떻게 전달되나요</span></summary><div class="after"><ul>' +
      '<li>본사가 진행하는 행사는 사장님이 직접 영업하지 않고, 본사가 정한 수량만 준비합니다.</li>' +
      '<li>관리자가 배정을 넣으면 사장님 화면 맨 위에 <b>배정 인분·보내는 날·메모</b>가 크게 나옵니다.</li>' +
      '<li>사장님이 <b>확인했습니다</b>를 누르면 여기 \'확인함\'으로 바뀝니다. 수량이나 날짜를 고치면 다시 \'확인 전\'이 됩니다.</li>' +
      '<li>인분을 0으로 저장하면 그 매장 배정이 지워집니다.</li></ul></div></details></aside>';
    var PASTE = (admin ? '<section class="step"><h2 class="q">넣기. <span>엑셀 배정표를 붙여 넣으세요</span></h2>' +
        '<p class="small">한 줄에 한 매장: <b>매장 이름</b> · <b>인분</b> · 보내는 날(2026-11-19) · 메모. 엑셀에서 칸째 복사해 붙이면 됩니다. 이미 있는 매장은 새 값으로 바뀝니다.</p>' +
        '<textarea id="hPaste" rows="5" placeholder="평택포승점&#9;40&#9;2026-11-19&#9;평택고 3학년부\n경기평택점&#9;25">' + esc(S.paste || '') + '</textarea>' +
        '<div class="ctl"><button class="btn" type="button" data-act="hpaste"' + (S.busy ? ' disabled' : '') + '>배정 넣기</button></div>' +
        (S.ares ? '<p class="box' + (S.ares.missing && S.ares.missing.length ? ' warn' : '') + '">' + S.ares.saved + '곳을 넣었습니다.' + (S.ares.missing && S.ares.missing.length ? ' 못 찾았거나 인분이 틀린 줄: ' + S.ares.missing.map(esc).join(', ') : '') + '</p>' : '') + '</section>' : '');
    var LIST = '<section class="step"><h2 class="q">배정. <span>' + (S.tm ? esc(S.tm) + ' · ' : '') + '매장별 수량과 사장님 확인</span><small>' + V.length + '곳</small></h2>' +
      '<div class="ctl"><input id="q" type="search" placeholder="매장·SM 이름 찾기" autocomplete="off" value="' + esc(S.q) + '" aria-label="매장 찾기"></div>' +
      '<div class="tabs"><div class="t" role="group" aria-label="배정으로 보기">' + tabs.map(function (t) { return '<button type="button" data-act="haf" data-f="' + t[0] + '" aria-pressed="' + (S.af === t[0]) + '">' + t[1] + '<b>' + t[2] + '</b></button>'; }).join('') + '</div></div>' +
      '<div class="tw"><table><thead><tr><th>매장</th><th class="l">SM</th><th>배정</th><th>보내는 날</th><th class="l">메모</th><th class="l">사장님 확인</th><th class="l"></th></tr></thead><tbody>' +
      (V.slice(0, S.lim || 50).map(row).join('') || '<tr><td colspan="7" class="l">해당하는 매장이 없습니다.</td></tr>') + '</tbody></table></div>' +
      (V.length > (S.lim || 50) ? '<button class="btn ghost block more50" type="button" data-act="lim">50곳 더 보기 <span>(' + Math.min(V.length, S.lim || 50) + ' / ' + V.length + ')</span></button>' : '') + '</section>';
    if (P === 'stores') return LIST;
    return asof() + TL + '<div class="duo"><div class="steps">' + PASTE + (PASTE ? '' : '<p class="box">배정은 관리자가 넣습니다. 매장별 수량은 \'매장\' 메뉴에서 봅니다.</p>') + '</div><div class="steps">' + recentPush() + '</div></div>';

  }
  function helpView() {
    return '<section class="step"><div class="hd"><h2>사용 안내</h2></div><div class="helpg">' + '<div class="after"><h3>단계는 이렇게 정합니다</h3><div class="stage">' +
        '<div><span class="tag t-bad">미참여</span><span>로그인한 적 없음</span></div><div><span class="tag t-warn">접속만</span><span>로그인했지만 기록 0건</span></div>' +
        '<div><span class="tag t-info">시작</span><span>목표의 절반 미만 연락</span></div><div><span class="tag t-info">실행</span><span>목표의 절반 이상 연락</span></div>' +
        '<div><span class="tag t-ok">완료</span><span>목표에 모두 연락하고 안 받은 곳도 다시 연락</span></div></div></div>' +
        '<div class="after"><h3>챙기는 날</h3><ul><li><b>안내 뒤 3일</b> 아직 로그인 안 한 매장에 ' + (noPush() ? '전화하거나 카톡 문구 보내기' : '안내 문구 보내기') + '</li><li><b>마감 3주 전</b> 기록 0건 매장에 첫 통화 권하기</li><li><b>마감 2주 전</b> 안 받은 곳 다시 연락·관심 곳 제안서 권하기</li><li><b>' + esc(S.event.deadlineLabel || '주문 마감') + '</b> 주문 매장 인분·받는 날 확정</li></ul></div>' +
      '<div class="after"><h3>알림은 이렇게 갑니다</h3><ul><li><b>SM</b> 알림을 보내지 않습니다. 필요하면 팀장에게 부탁하세요. 매장에는 전화나 카톡(문구 복사)으로 연락합니다.</li><li><b>팀장</b> 우리 팀 매장 모두에 보냅니다. 관리자가 허락하면 전 매장에도 보냅니다.</li><li><b>관리자</b> 전 매장에 보내고, 팀장에게 전 매장 알림 권한을 줄 수 있습니다.</li><li>사장님 앱 맨 위에 뜨고, 알림을 허용한 휴대폰에는 휴대폰 알림도 갑니다.</li></ul></div></div></section>';
  }
  // ── 화면 나누기: 왼쪽 메뉴(휴대폰은 위 가로 띠) ──
  var IC = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    stores: '<path d="M4 9h16l-1-4H5zM5 9v11h14V9M9 20v-6h6v6"/>',
    teams: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
    push: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
    acct: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M17 11l2 2 3-3"/>',
    hqs: '<path d="M4 21V5l8-3v19M12 9h8v12M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2M2 21h20"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17.5v.01"/>'
  };
  function ic(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + IC[k] + '</svg>'; }
  function navItems() {
    var role = S.me.role, R = S.rows, hq = S.event.mode === 'hq', L = [];
    L.push(['hqs', '동지 단체주문', S.hqc && S.hqU === S.me.name ? S.hqc.length : '']);
    L.push(['home', '행사 현황', '']);
    L.push(['stores', role === 'sm' ? '내 매장' : '매장', R.length]);
    if (topKey()) L.push(['teams', role === 'admin' ? '팀별 성과' : 'SM별 성과', '']);
    L.push(['push', '알림 보내기', '']);
    if (role !== 'sm') L.push(['acct', role === 'admin' ? '계정·권한' : 'SM 계정', '']);
    L.push(['help', '사용 안내', '']);
    return L;
  }
  function shell(body) {
    var cur = S.view === 'acct' ? 'acct' : (S.pg || 'hqs');
    return hbar() + '<div class="shell"><nav class="sn" aria-label="메뉴"><ul>' + navItems().map(function (x) {
      return '<li><button type="button" data-act="pg" data-p="' + x[0] + '"' + (cur === x[0] ? ' aria-current="page"' : '') + '>' + ic(x[0]) + '<span>' + x[1] + '</span>' + (x[2] !== '' ? '<b>' + U.won(x[2]) + '</b>' : '') + '</button></li>';
    }).join('') + '</ul><p class="who"><b>' + esc(S.me.name) + '</b><span>' + ROLE[S.me.role] + (S.me.team ? ' · ' + esc(S.me.team) : '') + (S.me.push_all ? ' · 전 매장 알림 권한' : '') + '</span></p></nav><main class="mn" id="main">' + body + '</main></div>';
  }
  function scopeLine() { return S.tm ? '<p class="scope">보는 범위: <b>' + esc(S.tm) + '</b> <button class="lnk" type="button" data-act="tm" data-t="">전체로</button></p>' : ''; }
  function teamNote() { return '<p class="small">막대를 누르면 그 ' + (topKey() === 'team' ? '팀' : 'SM') + '만 보는 범위가 됩니다. 홈과 매장 화면도 같이 좁혀집니다.</p>'; }
  function homeView(R) {
    var k = topKey(), nm = k === 'team' ? '팀' : 'SM';
    if (!k) return asof() + tiles4(R);
    var G = groups(S.rows, k).map(function (x) { return { k: x[0], g: gstat(x[1]), A: x[1] }; }).sort(function (a, b) { return a.g.j / (a.g.n || 1) - b.g.j / (b.g.n || 1); });
    var rows = G.map(function (x, i) {
      var pj = x.g.n ? Math.round(x.g.j / x.g.n * 100) : 0, n0 = x.A.filter(function (r) { return r.stage === '미참여'; }).length, care = x.A.filter(function (r) { return !!why(r); }).length, sent = x.A.filter(function (r) { return pdays(r) === 0; }).length, nn = x.A.filter(function (r) { return r.stage === '미참여' && pdays(r) == null; }).length;
      return '<li><span class="rk">' + (i + 1) + '</span><button type="button" class="tn" data-act="tmgo" data-t="' + esc(x.k) + '"><b>' + esc(x.k) + '</b><span>' + U.won(x.g.n) + '곳 · 주문 ' + U.won(x.g.q) + '인분</span></button>' +
        '<span class="br"><i data-w="' + pj + '"></i></span><span class="pc"><b>' + pj + '%</b> 참여</span>' +
        '<span class="st">로그인 안 함 <b>' + U.won(n0) + '</b> · 챙길 <b>' + U.won(care) + '</b>' + (sent ? ' · <em>오늘 알림 ' + U.won(sent) + '곳</em>' : '') + '</span>' +
        '<button class="btn sm ghost" type="button" data-act="galert" data-t="' + esc(x.k) + '"' + (nn ? '' : ' disabled') + '>' + (nn ? '로그인 안 한 ' + U.won(nn) + '곳에 알림' : n0 ? '최근 3일 안에 보냄' : '모두 로그인함') + '</button></li>';
    });
    return asof() + scopeLine() + tiles4(R) + '<div class="duo"><div class="steps"><section class="step card2 rank4"><div class="hd"><h2 class="q">' + nm + '. <span>참여가 낮은 ' + nm + '부터 도와주세요</span></h2></div>' +
      '<p class="small">' + nm + ' 이름을 누르면 그 ' + nm + '의 매장 목록, 버튼을 누르면 알림 쓰기 창이 열립니다.</p><ol class="r4">' + rows.join('') + '</ol></section></div><div class="steps">' + recentPush() + '</div></div>';
  }
  function recentPush() {
    var L = (S.push || []).slice(0, 3);
    return '<section class="step card2"><div class="hd"><h2>최근 보낸 알림</h2><button class="btn sm" type="button" data-act="pg" data-p="push">새 알림</button></div>' +
      (L.length ? '<ul class="rp">' + L.map(function (x) { var p = x.n ? Math.round(x.read / x.n * 100) : 0; return '<li><b>' + esc(x.title) + '</b><span>' + esc(x.by) + ' · ' + U.when(x.at) + ' · ' + esc(x.scope) + '</span><span class="rd"><i class="br"><i data-w="' + p + '"></i></i>읽음 ' + U.won(x.read) + ' / ' + U.won(x.n) + '곳</span><span class="mv">' + mvTxt(x) + '</span></li>'; }).join('') + '</ul>' : '<p class="small">아직 보낸 알림이 없습니다.</p>') +
      '<button class="lnk2" type="button" data-act="pg" data-p="push">보낸 알림 모두 보기 ›</button></section>';
  }
  // ── 알림 보내기: SM 내 매장 · 팀장 팀 매장(허락받으면 전 매장) · 관리자 전 매장 ──
  var COND = { none: ['로그인 안 함', function (r) { return r.stage === '미참여'; }], idle: ['기록 0건', function (r) { return r.stage === '접속만'; }],
    away: ['다시 연락 밀림', function (r) { return r.away > r.retried; }], stale: ['관심 뒤 7일 지남', function (r) { return r.hot_stale > 0; }], order: ['주문 받음', function (r) { return r.orders > 0; }] };
  function TPL() {
    var e = S.event || {}, nm = e.name || '단체주문';
    return {
      join: ['매장 근처 연락할 곳을 찾아 두었어요', nm + ' 단체주문을 위해 본사가 매장 근처 연락할 곳과, 이름만 넣으면 되는 제안서를 준비해 두었어요. 가맹점코드·사업자번호·휴대폰 뒷자리로 1분이면 보실 수 있어요.'],
      first: ['오늘 한 곳만 걸어 보세요', '앱을 열면 맨 위에 오늘 걸어 볼 곳 한 곳과 첫마디가 나와요. 읽고, 끊고 나서 결과만 누르시면 됩니다.'],
      away: ['안 받은 곳에 다시 전화해 주세요', '안 받았던 곳은 다른 시간에 다시 걸면 잘 받아요. 앱의 \'연락할 곳 › 다시 연락\'에 모여 있어요.'],
      prop: ['관심 있는 곳에 제안서를 보내 주세요', '관심 있다고 한 곳을 누르면 이름이 들어간 제안서를 바로 문자·카톡으로 보낼 수 있어요.'],
      dead: ['주문 마감이 다가와요', (e.deadlineLabel || '주문 마감') + ' 전까지 받은 주문의 인분과 받는 날을 앱에 적어 주세요.'],
      thanks: ['주문 받으신 것 축하드려요', '{매장} 사장님, 주문 받으신 것 축하드려요! 받는 날에 맞춰 준비 부탁드립니다.']
    };
  }
  var TPLN = { join: '앱 들어오기', first: '첫 통화', away: '다시 연락', prop: '제안서', dead: '마감', thanks: '칭찬', free: '직접 쓰기' };
  function pcReset(o) { S.pc = Object.assign({ scope: '', label: '', cond: '', tpl: 'join', title: TPL().join[0], body: TPL().join[1], phone: true, conf: false }, o || {}); }
  function scopes() {
    var role = S.me.role, k = topKey(), L = [];
    if (role === 'admin') L.push(['mine', '전 매장']);
    else if (role === 'lead') { L.push(['mine', '우리 팀 전체']); if (S.me.push_all) L.push(['all', '전 매장']); }
    else L.push(['mine', '내 매장 전체']);
    if (k) groups(S.rows, k).forEach(function (g) { L.push(['g:' + g[0], g[0]]); });
    return L;
  }
  function ptargets() {
    var c = S.pc, k = topKey(), A;
    if (c.scope === 'all') return { all: true, n: S.total || S.rows.length, ph: S.totalPush || 0, A: [] };
    if (c.scope.indexOf('re:') === 0) { var x = (S.push || []).find(function (p) { return p.id === +c.scope.slice(3); }) || { n: 0, read: 0 }; return { re: true, n: x.n - x.read, ph: x.unread_ph || 0, A: [] }; }
    if (!(c.scope === 'mine' || c.scope.indexOf('g:') === 0 || c.scope.indexOf('one:') === 0)) return { n: 0, ph: 0, A: [] };
    A = c.scope.indexOf('one:') === 0 ? S.rows.filter(function (r) { return r.id === +c.scope.slice(4); }) : c.scope.indexOf('g:') === 0 ? S.rows.filter(function (r) { return kv(r, k) === c.scope.slice(2); }) : S.rows;
    if (c.cond && COND[c.cond]) A = A.filter(COND[c.cond][1]);
    return { n: A.length, ph: A.filter(function (r) { return r.push; }).length, A: A };
  }
  function plabel() {
    var c = S.pc, sc = scopes().find(function (x) { return x[0] === c.scope; });
    if (c.scope.indexOf('one:') === 0) { var r = S.rows.find(function (x) { return x.id === +c.scope.slice(4); }); return r ? r.name : '한 곳'; }
    if (c.scope.indexOf('re:') === 0) return '지난 알림 안 읽은 곳';
    return (sc ? sc[1] : '') + (c.cond ? ' · ' + COND[c.cond][0] : '');
  }
  function fill(t, A) { return t.replace(/\{매장\}/g, A && A[0] ? A[0].name : '○○점'); }
  function pushView(R) {
    if (!S.pc) pcReset();
    var c = S.pc, T = ptargets(), sc = scopes(), every = T.n && (c.scope === 'all' || (S.me.role === 'admin' && c.scope === 'mine' && !c.cond));
    var h = asof() + '<section class="step card2 pick2"><div class="hd"><h2 class="q">알림. <span>누구에게 보낼까요?</span></h2><small>고른 다음 \'알림 쓰기\' 창에서 문구를 고릅니다</small></div>' +
      '<div class="fld"><span class="lb">받는 매장</span><div class="chipset">' + sc.map(function (x) { var w = x[0] === 'all' || (S.me.role === 'admin' && x[0] === 'mine'); return '<button type="button" class="ch' + (w ? ' wide' : '') + '" data-act="pscope" data-v="' + esc(x[0]) + '" aria-pressed="' + (c.scope === x[0]) + '">' + esc(x[1]) + '</button>'; }).join('') + '</div></div>' +
      (c.scope && c.scope !== 'all' ? '<div class="fld"><span class="lb">그중에서</span><div class="chipset"><button type="button" class="ch" data-act="pcond" data-v="" aria-pressed="' + !c.cond + '">모두</button>' +
        Object.keys(COND).map(function (k) { return '<button type="button" class="ch" data-act="pcond" data-v="' + k + '" aria-pressed="' + (c.cond === k) + '">' + COND[k][0] + '</button>'; }).join('') + '</div></div>' : '') +
      '<div class="go2"><p class="cnt">' + (T.n ? '받는 매장 <b>' + U.won(T.n) + '곳</b><span>' + esc(plabel()) + ' · 휴대폰 알림 허용 ' + U.won(T.ph) + '곳</span>' : '<span>받는 매장을 먼저 골라 주세요. 처음에는 아무 곳도 골라 두지 않습니다.</span>') + '</p>' +
      '<button class="btn" type="button" data-act="pgo"' + (T.n ? '' : ' disabled') + '>' + (T.n ? U.won(T.n) + '곳에 알림 쓰기' : '알림 쓰기') + '</button></div>' +
      (every ? '<p class="warn2">전 매장 ' + U.won(T.n) + '곳입니다. 모든 사장님 앱과 휴대폰에 알림이 갑니다.</p>' : '') + '</section>';
    var L = S.push || [];
    h += '<section class="step"><div class="hd"><h2>보낸 알림 <small>' + L.length + '건</small></h2><small>움직인 곳 = 알림을 받고 48시간 안에 앱에 들어오거나 연락 기록을 남긴 매장</small></div>' +
      '<div class="tw t7"><table><thead><tr><th class="l">보낸 때 · 사람</th><th class="l">제목</th><th class="l">받는 곳</th><th>읽음</th><th>움직인 곳</th><th class="l"></th></tr></thead><tbody>' +
      (L.map(function (x) { var p = x.n ? Math.round(x.read / x.n * 100) : 0, mine = x.by === S.me.name;
        return '<tr><td class="l">' + U.when(x.at) + '<br><small>' + esc(x.by) + '</small></td><td class="l nm" title="' + esc(x.body) + '">' + esc(x.title) + '</td><td class="l">' + esc(x.scope) + '</td><td><span class="rd"><i class="br"><i data-w="' + p + '"></i></i>' + U.won(x.read) + ' / ' + U.won(x.n) + '</span></td><td><b class="mvn">' + (mvDone(x) ? U.won(x.moved) + '곳' : '집계 중') + '</b>' + (x.moved ? ' <small>' + pct(x.moved, x.n) + '</small>' : '') + '</td>' +
          '<td class="l">' + (mine && x.n > x.read && (new Date(S.now) - new Date(x.at)) > 6 * 3600e3 ? '<button class="btn ghost sm" type="button" data-act="pre" data-id="' + x.id + '">안 읽은 ' + U.won(x.n - x.read) + '곳에 다시</button>' : '') + '</td></tr>';
      }).join('') || '<tr><td colspan="6" class="l">아직 보낸 알림이 없습니다.</td></tr>') + '</tbody></table></div></section>';
    return h;
  }
  function pushLive() {
    var t = U.$('pT'), b = U.$('pB'), ph = U.$('pPh'); if (!t) return;
    var upd = function () { S.pc.title = t.value; S.pc.body = b.value; S.pc.tpl = S.pc.tpl === 'free' ? 'free' : S.pc.tpl; S.pc.conf = false; var A = S.cmp ? picked() : ptargets().A;
      U.$('pTn').textContent = t.value.length + '/40'; U.$('pBn').textContent = b.value.length + '/300';
      ['pvT', 'pvT2'].forEach(function (id) { U.$(id).textContent = fill(t.value, A); }); ['pvB', 'pvB2'].forEach(function (id) { U.$(id).textContent = fill(b.value, A); }); };
    t.addEventListener('input', upd); b.addEventListener('input', upd);
    ph.addEventListener('change', function () { S.pc.phone = ph.checked; U.$('pvLock').hidden = !ph.checked; });
  }
  async function pushSend() {
    var c = S.pc, T = ptargets();
    if (!c.title.trim() || !c.body.trim()) return U.toast('제목과 내용을 넣어 주세요');
    if (!c.conf) { c.conf = true; render(); setTimeout(function () { if (S.pc && S.pc.conf) { S.pc.conf = false; if (S.pg === 'push') render(); } }, 5000); return; }
    S.busy = true; c.conf = false; render();
    var r = await U.rpc('sm_push_send', { p_token: S.token, p_event: S.ev, p_scope: T.all ? 'all' : c.scope, p_stores: T.A.map(function (x) { return x.id; }), p_label: plabel(), p_title: c.title.trim(), p_body: c.body.trim(), p_phone: c.phone });
    S.busy = false;
    if (!r.ok) { if (r.reason === 'auth') return drop('다시 들어와 주세요.'); render(); return U.toast(r.reason === 'role' ? '이 범위에 보낼 권한이 없습니다' : '보내지 못했습니다'); }
    if (r.push) U.fn('notice-push', { id: r.id });
    U.toast(U.won(r.n) + '곳에 알림을 보냈습니다'); pcReset(); await loadPush(); render();
  }
  async function loadPush() { var r = await U.rpc('sm_push_list', { p_token: S.token, p_event: S.ev }); S.push = r.ok ? r.items : []; }
  function permView(A) {
    if (A.me.role !== 'admin') return S.me.push_all ? '<p class="box">관리자가 <b>전 매장 알림 권한</b>을 주었습니다. 알림 보내기에서 \'전 매장\'을 고를 수 있습니다.</p>' : '';
    var L = A.users.filter(function (u) { return u.role === 'lead' && u.active; }).sort(function (a, b) { return byKo(a.team || '', b.team || ''); });
    return '<section class="step card2 perm"><div class="hd"><h2>알림 권한</h2><small>팀장은 기본으로 우리 팀 매장에만 보냅니다</small></div><ul class="pm">' +
      L.map(function (u) { return '<li><span class="w"><b>' + esc(u.name) + '</b><small>' + esc(u.team || '') + ' 팀장</small></span><span class="st">' + (u.push_all ? '전 매장에 보낼 수 있음' : '우리 팀만') + '</span><button type="button" class="tg" data-act="pgrant" data-id="' + u.id + '" data-on="' + (u.push_all ? 0 : 1) + '" role="switch" aria-checked="' + !!u.push_all + '" aria-label="' + esc(u.name) + ' 전 매장 알림 권한"><i></i></button></li>'; }).join('') +
      '</ul><p class="small">켜면 그 팀장이 알림 보내기에서 \'전 매장\'을 고를 수 있습니다. 끄면 바로 우리 팀만으로 돌아갑니다.</p></section>';
  }
  // ══ 3차 시안: 목적 = 사장님 움직이기(독려·알림). 플랫폼 화면(행사 사진 카드 → 매장 카드 고르기 → 아래 고정 줄) 스타일 ══
  var ICO = {
    school: '<path d="M3 10l9-5 9 5-9 5z"/><path d="M7 12v4c3 2 7 2 10 0v-4"/><path d="M21 10v5"/>', police: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
    care: '<path d="M4 20V9l8-5 8 5v11z"/><path d="M12 11c-1.5-1.6-4 0-2.5 2l2.5 2.5 2.5-2.5c1.5-2-1-3.6-2.5-2z"/>', heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    church: '<path d="M12 2v5M10 4h4"/><path d="M6 21V11l6-4 6 4v10z"/><path d="M10 21v-4h4v4"/>', temple: '<path d="M3 9c4 0 7-3 9-6 2 3 5 6 9 6"/><path d="M5 9v10h14V9"/><path d="M10 19v-5h4v5"/>',
    office: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>', gov: '<path d="M3 10h18L12 4z"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>', people: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M15 14.5c3 0 5 2 5 5"/>'
  };
  function icoSvg(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICO[k] || ICO.people) + '</svg>'; }
  function banner(e, small) {
    return '<div class="ph who5' + (small ? ' sm' : '') + '" data-ec="' + esc(e.color || '') + '"><div class="wh">' + (e.icons || []).map(function (x) { return '<span class="wi">' + icoSvg(x[1]) + esc(x[0]) + '</span>'; }).join('') + '</div>' +
      (e.photo ? '<img src="' + esc(e.photo) + '" alt="" loading="lazy">' : '') + '</div>';
  }
  function navTop() {
    var cur = S.view === 'acct' ? 'acct' : (S.pg === 'ev' ? 'events' : S.pg || 'hqs');
    var L = noPush() ? [['hqs', '동지 단체주문'], ['events', '매장 자료']] : [['events', '행사'], ['sent', '보낸 알림']]; if (topKey()) L.push(['perf', S.me.role === 'admin' ? '팀별 성과' : 'SM별 성과']);
    return '<header class="top t3"><div class="wrap"><nav aria-label="메뉴">' + L.map(function (x) { return '<button type="button" data-act="pg" data-p="' + x[0] + '"' + (cur === x[0] ? ' aria-current="page"' : '') + '>' + x[1] + '</button>'; }).join('') + '</nav>' +
      '<div class="brand"><picture><source media="(prefers-color-scheme: dark)" srcset="img/logo-dark.svg"><img src="img/logo.svg" alt="본죽&amp;비빔밥"></picture><span>SM 단체주문</span></div>' +
      '<div class="rt"><button class="mini" type="button" data-act="menu" aria-expanded="' + !!S.menu + '">' + esc(S.me.name) + ' ▾</button></div></div>' +
      (S.menu ? '<div class="wrap pop3"><ul>' + (S.me.role !== 'sm' ? '<li><button type="button" data-act="pg" data-p="acct"><b>' + (S.me.role === 'admin' ? '계정·알림 권한' : 'SM 계정') + '</b></button></li>' : '') +
        '<li><button type="button" data-act="gon"><b>처음 안내 다시 보기</b></button></li><li><button type="button" data-act="pg" data-p="help"><b>사용 안내</b></button></li><li><button type="button" data-act="logout"><b>로그아웃</b></button></li></ul></div>' : '') + '</header>';
  }
  // ── 첫 화면: 큰 질문 + 행사 사진 카드 ──
  function evSum(rows, e) {
    var n = rows.length, j = rows.filter(function (r) { return r.stage !== '미참여'; }).length;
    return { n: n, j: j, q: sum('qty', rows), care: rows.filter(function (r) { return !!why(r); }).length, hq: e.mode === 'hq' };
  }
  function eventsView() {
    var E = S.evs.slice().sort(function (a, b) { return (a.day || '').localeCompare(b.day || ''); });
    return '<div class="wrap pg3">' + (gOn() ? '<section class="hero3"><h1>오늘은 어느 사장님을 도와볼까요?</h1><p>' + (noPush() ? '행사를 고르면 챙길 매장이 나와요. 매장을 눌러 연락할 곳을 보고, 자료를 받아 전달하세요.' : '행사를 고르면 챙길 매장이 나오고, 골라서 바로 알림을 보낼 수 있어요.') + '</p></section>' : todayLine()) +
      '<div class="tabs"><div class="t"><button type="button" aria-selected="true">진행 중 <b>' + E.length + '</b></button></div><span class="sort">가까운 날짜순</span></div>' +
      '<ul class="grid3">' + E.map(function (e) {
        var s = S.sum[e.id], dd = U.dday(e.day, e.name), p = s && s.n ? Math.round(s.j / s.n * 100) : 0;
        return '<li><button type="button" class="card" data-act="evo" data-id="' + esc(e.id) + '">' + banner(e).replace('<div class="wh">', '<span class="bd">' + (s ? (s.hq ? '본사 진행' : '챙길 ' + U.won(s.care) + '곳') : '…') + '</span><span class="dd">' + dd + '</span><div class="wh">') +
          '<span class="k">' + esc(e.dateLabel || '') + (e.deadlineLabel ? ' · ' + esc(e.deadlineLabel.replace(/^.*?마감/, '마감')) : '') + '</span><h3>' + esc(e.title || e.name) + '</h3>' +
          '<span class="m">' + (s ? (s.hq ? '본사가 학교에 직접 영업 · 매장 ' + U.won(s.n) + '곳 배정 확인' : '사장님 참여 <b>' + U.won(s.j) + ' / ' + U.won(s.n) + '</b> · 주문 ' + U.won(s.q) + '인분') : '불러오는 중') + '</span>' +
          '<span class="bar2"><i data-w="' + p + '"></i></span></button></li>';
      }).join('') + '</ul></div>';
  }
  // ── 행사 화면: 왼쪽 행사 안내·숫자 / 오른쪽 '매장. 어느 사장님께 알릴까요?' ──
  var FL = {
    care: ['챙길 매장', function (r) { return !!why(r); }], none: ['로그인 안 함', function (r) { return r.stage === '미참여'; }], idle: ['기록 0건', function (r) { return r.stage === '접속만'; }],
    away: ['다시 연락 밀림', function (r) { return r.away > r.retried; }], stale: ['관심 뒤 7일 지남', function (r) { return r.hot_stale > 0; }], order: ['주문 받음', function (r) { return r.orders > 0; }], all: ['전체', function () { return true; }]
  };
  var FLH = { wait: ['확인 전', function (r) { var a = S.amap[r.id]; return a && !a.confirmed; }], has: ['배정됨', function (r) { return !!S.amap[r.id]; }], none: ['배정 없음', function (r) { return !S.amap[r.id]; }], all: ['전체', function () { return true; }] };
  function flt() { return S.event.mode === 'hq' ? FLH : FL; }
  function visRows() {
    var R = scoped(), q = S.q.trim(), F = flt(), f = F[S.f3] ? S.f3 : Object.keys(F)[0];
    return R.filter(function (r) { return F[f][1](r) && (!q || r.name.indexOf(q) >= 0 || (r.sm || '').indexOf(q) >= 0); });
  }
  function sCard(r, showSm) {
    var hq = S.event.mode === 'hq', a = hq ? S.amap[r.id] : null, w = why(r), tag = hq ? (a ? (a.confirmed ? ['확인함', 't-ok'] : ['확인 전', 't-warn']) : ['배정 없음', 't-idle']) : w ? WHY[w] : r.orders ? ['주문 ' + U.won(r.qty) + '인분', 't-ok'] : [stn(r.stage), STG[r.stage]];
    var sub = (showSm ? esc(r.sm || '') + ' · ' : '') + (hq ? (a ? U.won(a.qty) + '인분 · ' + U.day(a.day) : '배정 없음') : '연락 ' + r.contacted + '/' + r.target + (r.orders ? ' · 주문 ' + U.won(r.qty) + '인분' : ''));
    var pd = pdays(r);
    return '<li class="sc' + (S.pk[r.id] ? ' on' : '') + (pd != null ? ' sent' : '') + '" data-id="' + r.id + '"><label>' + (canPick() ? '<input type="checkbox" data-act="pk" data-id="' + r.id + '"' + (S.pk[r.id] ? ' checked' : '') + '>' : '') + '<span class="t"><b>' + esc(r.name) + '</b><span>' + sub + (pd != null ? ' · <em>' + pdl(pd) + '</em>' : '') + '</span></span></label>' +
      '<span class="tag ' + tag[1] + '">' + tag[0] + '</span><button class="go" type="button" data-act="row" data-id="' + r.id + '" aria-label="' + esc(r.name) + ' 자세히">›</button></li>';
  }
  function evView() {
    var e = S.event, R = scoped(), hq = e.mode === 'hq', showSm = S.me.role !== 'sm', F = flt(), f = F[S.f3] ? S.f3 : Object.keys(F)[0], V = careSort(visRows()), LIM = S.lim || 60, VP = V.slice(0, LIM), k = topKey();
    var allOn = V.length && V.every(function (r) { return S.pk[r.id]; });
    var num = function (l, v, u, s2) { return '<div class="n4"><span>' + l + '</span><b>' + v + '<small>' + u + '</small></b>' + (s2 ? '<i>' + s2 + '</i>' : '') + '</div>'; };
    var nums, M = S.amap;
    if (hq) { var wa = R.filter(function (r) { return M[r.id]; }), ok = wa.filter(function (r) { return M[r.id].confirmed; }).length;
      nums = num('배정한 매장', U.won(wa.length), '곳', pct(wa.length, R.length)) + num('배정 수량', U.won(wa.reduce(function (x, r) { return x + M[r.id].qty; }, 0)), '인분', '') + num('사장님 확인', U.won(ok), '곳', '확인 전 ' + U.won(wa.length - ok) + '곳') + num('담당 매장', U.won(R.length), '곳', ''); }
    else { var jn = R.filter(function (r) { return r.stage !== '미참여'; }).length, dn = R.filter(function (r) { return r.stage === '실행' || r.stage === '완료'; }).length;
      nums = num('참여한 사장님', U.won(jn), '/ ' + U.won(R.length), pct(jn, R.length)) + num('열심히 하는 곳', U.won(dn), '곳', '목표 절반 이상 연락') + num('연락한 곳', U.won(sum('contacted', R)), '곳', '관심 ' + U.won(sum('hot', R)) + '곳') + num('받은 주문', U.won(sum('qty', R)), '인분', U.won(sum('orders', R)) + '건'); }
    var praise = hq ? [] : R.filter(function (r) { return r.orders > 0; }).sort(function (a, b) { return b.qty - a.qty; });
    var G = k ? groups(R, k).map(function (x) { return [x[0], gstat(x[1])]; }).sort(function (a, b) { return a[1].j / (a[1].n || 1) - b[1].j / (b[1].n || 1); }) : [];
    var opt = function (v, t) { return '<option value="' + esc(v) + '"' + (S.tm === v ? ' selected' : '') + '>' + esc(t) + '</option>'; };
    var h = '<div class="phead3"><div class="wrap"><button type="button" class="back" data-act="pg" data-p="events">← 전체 행사</button><b class="tt">' + esc(e.title || e.name) + '</b><span class="sp"></span>' +
      '<span class="dl"><b class="ddc">' + U.dday(e.day, e.name) + '</b> · ' + esc(e.dateLabel || '') + '</span>' + (e.deadlineLabel ? '<span class="dl hide-s">' + esc(e.deadlineLabel) + '</span>' : '') + '<button class="mini ic" type="button" data-act="reload" aria-label="새로 고침" title="새로 고침">⟳</button></div></div>' +
      '<div class="wrap ev3"><aside class="lc">' + banner(e, true) + '<p class="lead3">' + esc(e.lead || '') + '</p>' +
      '<div class="nums">' + nums + '</div><p class="asof3">' + (S.now ? U.when(S.now) + ' 기준' : '') + (S.tm ? ' · ' + esc(S.tm) + '만 보는 중 <button class="lnk" type="button" data-act="tm" data-t="">전체로</button>' : '') + '</p>' +
      (G.length ? '<div class="sec3"><h3>' + (k === 'team' ? '팀별' : 'SM별') + ' 참여 <small>낮은 순 · 누르면 그 ' + (k === 'team' ? '팀' : 'SM') + '만</small></h3><ul class="gl3">' + G.map(function (x) { var p = x[1].n ? Math.round(x[1].j / x[1].n * 100) : 0;
        return '<li><button type="button" data-act="tm" data-t="' + esc(x[0]) + '" aria-pressed="' + (S.tm === x[0]) + '"><span class="nm">' + esc(x[0]) + '</span><span class="br"><i data-w="' + p + '"></i></span><b>' + p + '%</b></button></li>'; }).join('') + '</ul></div>' : '') +
      (praise.length ? '<div class="sec3"><h3>칭찬할 사장님 <small>주문 받은 곳</small></h3><div class="pr3">' + praise.slice(0, 5).map(function (r) { return '<button type="button" class="chip" data-act="row" data-id="' + r.id + '">' + esc(r.name) + ' · ' + U.won(r.qty) + '인분</button>'; }).join('') + (praise.length > 5 ? '<i>외 ' + (praise.length - 5) + '곳</i>' : '') + '</div></div>' : '') +
      (hq && S.me.role === 'admin' ? '<details class="sec3 dz"><summary>배정 넣기 <small>엑셀 배정표 붙여 넣기</small></summary><textarea id="hPaste" rows="4" placeholder="평택포승점&#9;40&#9;2026-11-19&#9;평택고 3학년부">' + esc(S.paste || '') + '</textarea><button class="btn sm" type="button" data-act="hpaste">배정 넣기</button>' +
        (S.ares ? '<p class="small">' + S.ares.saved + '곳을 넣었습니다.</p>' : '') + '</details>' : '') + '</aside>' +
      '<section class="rc"><h2 class="q">매장. <span>' + (noPush() ? '어느 사장님을 챙길까요?' : '어느 사장님께 알릴까요?') + '</span><small>' + U.won(V.length) + '곳</small></h2>' +
      '<div class="ctl3">' + (k ? '<select id="tmSel" aria-label="팀·SM으로 보기">' + opt('', k === 'team' ? '전체 팀' : '우리 팀 전체') + groups(S.rows, k).map(function (g) { return opt(g[0], g[0]); }).join('') + '</select>' : '') +
      '<input id="q" type="search" placeholder="매장' + (showSm ? '·SM' : '') + ' 이름 찾기" autocomplete="off" value="' + esc(S.q) + '" aria-label="매장 찾기"></div>' +
      '<div class="seg seg3" role="group" aria-label="어떤 매장">' + Object.keys(F).map(function (key) { var c = R.filter(F[key][1]).length; return '<button type="button" data-act="f3" data-f="' + key + '" aria-pressed="' + (f === key) + '">' + F[key][0] + ' <b>' + U.won(c) + '</b></button>'; }).join('') + '</div>' +
      (false ? '<p class="hint3">' + ['lock', 'stale', 'away', 'idle', 'none'].filter(function (x) { return V.some(function (r) { return why(r) === x; }); }).map(function (x) { return '<span class="tag ' + WHY[x][1] + '">' + WHY[x][0] + '</span>'; }).join('') + '<span>급한 순서로 줄 세웠어요</span></p>' : '') +
      (canPick() ? '<div class="pallbar"><label class="allp"><input type="checkbox" data-act="pall"' + (allOn ? ' checked' : '') + (V.length ? '' : ' disabled') + '> 이 ' + U.won(V.length) + '곳 모두 고르기</label><span>' + (noPush() ? (f === 'care' && !hq ? '급한 순서로 줄 세웠어요' : '') : f === 'care' && !hq ? '급한 순서 · 최근 3일 안에 알림 보낸 곳은 뒤로' : (function () { var ns = V.filter(function (r) { return pdays(r) != null; }).length; return ns ? '이 중 ' + U.won(ns) + '곳은 최근 3일 안에 알림을 받았어요' : ''; })()) + '</span></div>' : '') + '<ul class="sgrid">' + (VP.map(function (r) { return sCard(r, showSm); }).join('') || '<li class="empty">해당하는 매장이 없습니다.</li>') + '</ul>' +
      '<div class="under">' +
      (V.length > VP.length ? '<button class="btn ghost sm" type="button" data-act="lim">' + U.won(Math.min(60, V.length - VP.length)) + '곳 더 보기 <span>(' + U.won(VP.length) + ' / ' + U.won(V.length) + ')</span></button>' : '') +
      (!noPush() && (S.me.role === 'admin' || S.me.push_all) ? '<button class="lnk2" type="button" data-act="pwall">전 매장 ' + U.won(S.total || S.rows.length) + '곳에 알림 쓰기 ›</button>' : '') + '</div></section></div>';
    return h + (canPick() ? '<div class="buy" id="buy">' + buyInner() + '</div>' : '');
  }
  // 2026-11-23: SM 계정은 알림을 보내지 않음(관리자·팀장만)
  function noPush() { return !!(S.me && S.me.role === 'sm'); }
  function canPick() { return !noPush() || bulkDocs().length > 0; }
  function careSort(V) {
    if (S.event.mode === 'hq' || (S.f3 && S.f3 !== 'care')) return V;
    return V.slice().sort(function (a, b) { var x = why(a), y = why(b), sa = pdays(a) != null ? 1 : 0, sb = pdays(b) != null ? 1 : 0; return sa - sb || (WHY[y] ? WHY[y][2] : 0) - (WHY[x] ? WHY[x][2] : 0); });
  }
  function picked() { return S.rows.filter(function (r) { return S.pk[r.id]; }); }
  function buyInner() {
    var P = picked(), ph = P.filter(function (r) { return r.push; }).length;
    return '<div class="wrap"><div class="s"><b>' + (P.length ? U.won(P.length) + '곳 골랐어요' : '매장을 골라 주세요') + '</b>' +
      '<div class="bsel">' + P.slice(0, 4).map(function (r) { return '<button type="button" data-act="unpk" data-id="' + r.id + '">' + esc(r.name) + ' <i>×</i></button>'; }).join('') + (P.length > 4 ? '<span>외 ' + U.won(P.length - 4) + '곳</span>' : '') + (P.length ? '<button type="button" class="all" data-act="pclr">모두 풀기</button>' : '') + '</div>' +
      '<span>' + (noPush() ? (P.length ? '' : '카드 왼쪽 네모를 누르면 골라집니다. 고른 매장 자료를 한꺼번에 받을 수 있어요. 카드 오른쪽 › 는 매장 자세히.') : P.length ? '사장님 앱 맨 위에 알림이 뜨고, 휴대폰 알림을 허용한 ' + U.won(ph) + '곳에는 휴대폰 알림도 갑니다.' : '카드 왼쪽 네모를 누르면 골라집니다. 고른 매장에 알림을 보내거나 자료를 한꺼번에 받을 수 있어요. 카드 오른쪽 › 는 매장 자세히.') + '</span>' + bdocRow() + '</div>' +
      '<div class="r">' + (bulkDocs().length ? (function () { var on = bsel(), k = bulkDocs().filter(function (d) { return on[d.k]; }).length, f = P.length * k; return '<button class="btn' + (noPush() ? '' : ' ghost') + '" type="button" data-act="bopen" data-go="1"' + (f ? '' : ' disabled') + '>' + (!k ? '자료를 골라 주세요' : f ? '파일 ' + U.won(f) + '개 받기' : '자료 받기') + '</button>'; })() : '') + (noPush() ? '' : '<button class="btn" type="button" data-act="pwrite"' + (P.length ? '' : ' disabled') + '>알림 쓰기</button>') + '</div></div>';
  }
  function syncBuy() { var b = U.$('buy'); if (b) b.innerHTML = buyInner(); setTimeout(coachPlace, 0); Array.prototype.forEach.call(app.querySelectorAll('.sgrid .sc'), function (li) { var on = !!S.pk[li.dataset.id]; li.classList.toggle('on', on); var c = li.querySelector('input'); if (c) c.checked = on; });
    var V = visRows(), al = app.querySelector('input[data-act="pall"]'); if (al) al.checked = V.length && V.every(function (r) { return S.pk[r.id]; }); }
  // ── 자료 한꺼번에 받기(2026-11-23 사용자: 여러 매장 골라 제안서·키트를 종류별로 나눠 받기) ──
  var BULK_MAX = 300, BPART = 150 * 1024 * 1024, BSK = 'bj_sm_bsplit';
  function fsafe(t) { return String(t || '').replace(/[\\/:*?"<>|\s]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, ''); }
  function bulkDocs() {
    var DD = window.Docs; if (!DD || S.event.mode === 'hq') return [];
    var o = DD.of(S.ev), L = [];
    if (o.kit) L.push({ k: 'kit', t: o.kit.title, s: o.kit.spec, pv: o.kit.pv, w: '사장님이 보는 책' });
    o.props.forEach(function (x) { L.push({ k: x.key, t: x.title, s: (x.who ? x.who + '에 보낼 것 · ' : '') + '받는 곳 이름은 빈칸', pv: x.pv, w: x.who || '' }); });
    return L;
  }
  var BDK = 'bj_sm_bdocs';
  function bsel() { var all = {}; try { all = JSON.parse(U.store.get(BDK) || '{}') || {}; } catch (e) { all = {}; } var m = all[S.ev], D = bulkDocs(), on = {};
    D.forEach(function (d) { on[d.k] = m ? !!m[d.k] : true; }); return on; }
  function bselSet(on) { var all = {}; try { all = JSON.parse(U.store.get(BDK) || '{}') || {}; } catch (e) { all = {}; } all[S.ev] = on; U.store.set(BDK, JSON.stringify(all)); }
  function dshort(d) { return d.k === 'kit' ? '실행 키트' : String(d.t); }
  function bdocRow() {
    var D = bulkDocs(); if (!D.length) return ''; var on = bsel(), n = D.filter(function (d) { return on[d.k]; }).length, sp = U.store.get(BSK) === 'store' ? 'store' : 'type';
    return '<div class="bdoc" role="group" aria-label="받을 자료"><span class="lb">받을 자료 <b>' + n + ' / ' + D.length + '</b></span><div class="dcs">' + D.map(function (d) {
      return '<button type="button" class="dc" data-act="bdc" data-k="' + esc(d.k) + '" aria-pressed="' + !!on[d.k] + '" title="' + esc(d.t + (d.w ? ' · ' + d.w : '')) + '">' + (d.pv ? '<img src="doc/prev/th/' + esc(d.pv) + '.jpg" alt="">' : '') +
        '<span><b>' + esc(dshort(d)) + '</b><small>' + esc(d.w) + '</small></span><i aria-hidden="true">✓</i></button>'; }).join('') + '</div>' +
      '<button type="button" class="dsp" data-act="bsp" title="zip 안 폴더 나누는 방법">폴더: <b>' + (sp === 'store' ? '매장별' : '자료 종류별') + '</b></button></div>';
  }
  function bulkOpen(list, go) {
    var D = bulkDocs(); if (!D.length) return U.toast('이 행사는 매장별로 만드는 자료가 없습니다');
    if (!list.length) return U.toast('먼저 매장을 골라 주세요');
    var on = bsel();
    if (go && !D.some(function (d) { return on[d.k]; })) return U.toast('받을 자료를 하나 이상 골라 주세요');
    S.bulk = { ids: list.map(function (r) { return r.id; }).slice(0, BULK_MAX), over: Math.max(0, list.length - BULK_MAX), on: on, split: U.store.get(BSK) === 'store' ? 'store' : 'type', run: null };
    S.bFocus = true; render(); if (go) bulkRun();
  }
  function bulkRunHtml() {
    var B = S.bulk, R = B.run, n = B.ids.length, p = n ? Math.round((R.done ? R.i : R.i) / n * 100) : 0;
    var t = R.done ? (R.stop ? '중간에 멈췄습니다' : '다 만들었습니다') : '만드는 중입니다';
    return '<div class="bk-run" id="bkRun" aria-live="polite"><p class="bk-st"><b>' + t + '</b> <span>' + U.won(R.i) + ' / ' + U.won(n) + '곳' + (!R.done && R.name ? ' · ' + esc(R.name) : '') + '</span></p>' +
      '<div class="bkbar"><i data-w="' + p + '"></i></div>' +
      '<p class="small">' + (R.done ? (R.parts ? 'zip 파일 ' + R.parts + '개를 저장했습니다. 다운로드 폴더에서 압축을 풀어 인쇄하세요.' : '저장한 파일이 없습니다.') +
        (R.fail.length ? '<br>못 만든 매장 ' + R.fail.length + '곳: ' + R.fail.map(esc).join(', ') + '. 잠시 뒤 그 매장만 다시 받아 주세요.' : '')
        : '이 창을 닫지 말고 기다려 주세요. 매장 한 곳에 몇 초씩 걸립니다.' + (n * R.per > 30 ? ' 150MB마다 zip이 하나씩 저장됩니다.' : '')) + '</p>' +
      '<div class="bk-go">' + (R.done ? '<button class="btn" type="button" data-act="bx">닫기</button>' : '<button class="btn ghost" type="button" data-act="bstop">' + (R.stop ? '멈추는 중…' : '그만 받기') + '</button>') + '</div></div>';
  }
  function bulkPaint() {
    var el = U.$('bkRun'); if (!el || !S.bulk || !S.bulk.run) return;
    el.outerHTML = bulkRunHtml();
    Array.prototype.forEach.call(app.querySelectorAll('#bkRun [data-w]'), function (x) { x.style.width = x.dataset.w + '%'; });
  }
  function bulkView() {
    var B = S.bulk; if (!B) return '';
    var D = bulkDocs(), n = B.ids.length, sel = D.filter(function (d) { return B.on[d.k]; }), R = B.run, busy = R && !R.done;
    var nm = B.ids.slice(0, 5).map(function (id) { var r = S.rows.find(function (x) { return x.id === id; }); return r ? esc(r.name) : ''; }).filter(Boolean).join(', ') + (n > 5 ? ' 외 ' + U.won(n - 5) + '곳' : '');
    var h = '<div class="mbg"' + (busy ? '' : ' data-act="bx"') + '></div><div class="mdl bulk" role="dialog" aria-modal="true" aria-label="자료 한꺼번에 받기" tabindex="-1" id="bmdl">' +
      '<div class="mh"><h2 class="q">자료. <span>무엇을 받을까요?</span></h2>' + (busy ? '' : '<button class="mini" type="button" data-act="bx">닫기 ✕</button>') + '</div>' +
      '<p class="bk-to"><b>' + U.won(n) + '곳</b> ' + nm + '</p>' + (!R && n > 40 ? '<p class="box warn">매장이 많아 오래 걸립니다(매장 한 곳에 몇 초). 팀이나 SM으로 나눠 받으면 더 편합니다.</p>' : '') + (B.over ? '<p class="box warn">한 번에 ' + BULK_MAX + '곳까지 받을 수 있어 앞의 ' + BULK_MAX + '곳만 넣었습니다. 나머지는 다음에 받아 주세요.</p>' : '');
    if (R) return h + bulkRunHtml() + '</div>';
    h += '<ul class="bk-docs">' + D.map(function (d) {
      return '<li><label><input type="checkbox" data-act="bdoc" data-k="' + esc(d.k) + '"' + (B.on[d.k] ? ' checked' : '') + '>' + (d.pv ? '<img src="doc/prev/th/' + esc(d.pv) + '.jpg" alt="">' : '') + '<span><b>' + esc(d.t) + '</b><small>' + esc(d.s) + '</small></span></label></li>';
    }).join('') + '</ul>' +
      '<div class="bk-split" role="group" aria-label="파일 나누기"><p class="lg">파일 나누기</p>' +
      '<button type="button" data-act="bsplit" data-v="type" aria-pressed="' + (B.split === 'type') + '">자료 종류별 폴더<small>키트는 키트끼리, 제안서는 종류끼리 모여 있어 종류별로 인쇄하기 좋아요</small></button>' +
      '<button type="button" data-act="bsplit" data-v="store" aria-pressed="' + (B.split === 'store') + '">매장별 폴더<small>매장 한 곳의 자료가 한 폴더에 모여 있어 매장마다 전하기 좋아요</small></button></div>' +
      '<p class="small">zip 파일로 받습니다. 매장 이름·전화·로고가 들어가고, 제안서의 받는 곳 이름은 빈칸입니다. 크기가 150MB를 넘으면 zip을 여러 개로 나눠 저장합니다.</p>' +
      '<div class="bk-go"><button class="btn" type="button" data-act="bgo"' + (sel.length ? '' : ' disabled') + '>' + (sel.length ? '파일 ' + U.won(n * sel.length) + '개 받기' : '자료를 하나 이상 골라 주세요') + '</button></div>';
    return h + '</div>';
  }
  var CRCT = null;
  function crc32(u) {
    if (!CRCT) { CRCT = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRCT[n] = c >>> 0; } }
    var x = 0xFFFFFFFF; for (var i = 0; i < u.length; i++) x = CRCT[(x ^ u[i]) & 255] ^ (x >>> 8); return (x ^ 0xFFFFFFFF) >>> 0;
  }
  // 압축 없이 묶는 zip(이름은 UTF-8 표시)
  function Zip() {
    var P = [], C = [], off = 0, te = new TextEncoder(), d = new Date();
    var tm = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xffff, dt = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff;
    function blk(len) { var b = new Uint8Array(len); return [b, new DataView(b.buffer)]; }
    return {
      n: 0, size: 0,
      add: function (name, data) {
        var nm = te.encode(name), crc = crc32(data), L = blk(30 + nm.length), v = L[1], H = blk(46 + nm.length), w = H[1];
        v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(6, 0x0800, true); v.setUint16(10, tm, true); v.setUint16(12, dt, true);
        v.setUint32(14, crc, true); v.setUint32(18, data.length, true); v.setUint32(22, data.length, true); v.setUint16(26, nm.length, true); L[0].set(nm, 30);
        w.setUint32(0, 0x02014b50, true); w.setUint16(4, 20, true); w.setUint16(6, 20, true); w.setUint16(8, 0x0800, true); w.setUint16(12, tm, true); w.setUint16(14, dt, true);
        w.setUint32(16, crc, true); w.setUint32(20, data.length, true); w.setUint32(24, data.length, true); w.setUint16(28, nm.length, true); w.setUint32(42, off, true); H[0].set(nm, 46);
        P.push(L[0], data); C.push(H[0]); off += L[0].length + data.length; this.n++; this.size = off;
      },
      blob: function () {
        var cl = C.reduce(function (x, c) { return x + c.length; }, 0), E = blk(22), v = E[1];
        v.setUint32(0, 0x06054b50, true); v.setUint16(8, C.length, true); v.setUint16(10, C.length, true); v.setUint32(12, cl, true); v.setUint32(16, off, true);
        return new Blob(P.concat(C, [E[0]]), { type: 'application/zip' });
      }
    };
  }
  function saveBlob(b, name) {
    var url = URL.createObjectURL(b), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 180000);
  }
  async function bulkRun() {
    var B = S.bulk, DD = window.Docs, D = bulkDocs().filter(function (d) { return B.on[d.k]; }), ev = S.event || {};
    if (!B || B.run || !D.length || !DD) return;
    U.store.set(BSK, B.split);
    var R = B.run = { i: 0, name: '', parts: 0, fail: [], done: false, stop: false, per: D.length }; render();
    var z = Zip(), part = 1, base = fsafe((ev.name || '단체주문') + '_' + (B.split === 'type' ? '종류별' : '매장별') + '_' + B.ids.length + '곳_' + U.today());
    var flush = function (last) { if (!z.n) return; saveBlob(z.blob(), base + (part === 1 && last ? '' : '_' + part) + '.zip'); R.parts++; z = Zip(); part++; };
    for (var i = 0; i < B.ids.length; i++) {
      if (R.stop || S.bulk !== B) break;
      var row = S.rows.find(function (x) { return x.id === B.ids[i]; }); R.i = i; R.name = row ? row.name : ''; bulkPaint();
      try {
        var d = await U.rpc('sm_store', { p_token: S.token, p_store: B.ids[i], p_event: S.ev });
        if (!d || !d.ok) { if (d && d.reason === 'auth') { R.stop = true; R.done = true; S.bulk = null; return drop('다시 들어와 주세요.'); } throw new Error('store'); }
        var s = d.store || {}, st = { s: s.name || R.name, tel: s.tel || '', bj: !!s.bj };
        for (var j = 0; j < D.length; j++) {
          var x = D[j], bytes = x.k === 'kit' ? await DD.make(S.ev, 'kit', st, { places: d.places, event: ev.title || ev.name, color: ev.color }) : await DD.make(S.ev, 'prop', st, { key: x.k });
          z.add((B.split === 'type' ? fsafe(x.t) : fsafe(st.s)) + '/' + DD.fileName(st, ev.name || '', x.t), bytes);
        }
      } catch (e) { R.fail.push(R.name || String(B.ids[i])); }
      if (z.size > BPART) flush(false);
      await new Promise(function (ok) { setTimeout(ok, 0); });
    }
    R.i = R.stop ? R.i : B.ids.length; flush(true); R.done = true; R.name = ''; if (R.parts) S.smDone = true;
    if (S.bulk === B) bulkPaint();
    U.toast(R.parts ? 'zip 파일을 저장했습니다. 다운로드 폴더를 확인하세요' : '저장한 파일이 없습니다');
  }
  // 매장 자세히: 연락할 곳을 종류별로 모두
  function placeList(P) {
    var G = {}, O = [];
    P.forEach(function (p) { var k = p.custom ? '사장님이 직접 넣은 곳' : (p.kind || '그 밖'); if (!G[k]) { G[k] = []; O.push(k); } G[k].push(p); });
    O.sort(function (a, b) { var c = (a === '사장님이 직접 넣은 곳') - (b === '사장님이 직접 넣은 곳'); return c || (b === '절') - (a === '절') || G[b].length - G[a].length; });
    var done = P.filter(function (p) { return p.logs.length; }).length, far = P.filter(function (p) { return !p.custom && p.km != null && +p.km > 5; }).length;
    return '<h3 class="h3">연락할 곳 <small>' + U.won(P.length) + '곳 · 연락한 곳 ' + U.won(done) + '곳</small></h3>' +
      (P.length ? '<p class="pk2">' + O.map(function (k) { return '<span>' + esc(k) + ' <b>' + G[k].length + '</b></span>'; }).join('') + '</p>' +
        '<p class="small">본사가 찾은 곳은 매장에서 5km 안쪽만 넣었습니다' + (far ? ' (5km 밖 ' + far + '곳 남아 있음)' : '') + '. 사장님 화면과 같은 목록입니다.</p>' : '<p class="small">아직 연락할 곳이 없습니다.</p>') +
      O.map(function (k) {
        return '<h4 class="pg2">' + esc(k) + ' <small>' + G[k].length + '곳</small></h4><ul class="pl2">' + G[k].map(function (p) {
          var l = p.logs[0], x = l ? RES[l.r] : ['연락 전', 't-idle'], tl = p.tel ? String(p.tel).replace(/[^0-9+]/g, '') : '';
          var meta = [p.km != null ? p.km + 'km' : '', p.grade && p.kind === '절' ? '우선순위 ' + esc(p.grade) : '', p.purpose ? esc(p.purpose) + ' 제안서' : '', p.logs.length ? '기록 ' + p.logs.length + '건 · ' + U.when(l.at) : ''].filter(Boolean).join(' · ');
          return '<li><div class="l1"><b>' + esc(p.name) + '</b><span class="tag ' + x[1] + '">' + x[0] + '</span>' + (p.flag ? '<span class="tag t-warn">사장님 알림 · ' + ({ tel: '번호 틀림', closed: '문 닫음', moved: '옮김', dup: '중복' }[p.flag] || '확인 필요') + '</span>' : '') + '</div>' +
            (meta ? '<div class="l2">' + meta + '</div>' : '') +
            '<div class="l2 ct">' + (tl ? '<a href="tel:' + tl + '">' + esc(p.tel) + '</a>' : '<span>전화번호 없음</span>') + (p.addr ? '<span>' + esc(p.addr) + '</span>' : '') + '</div>' +
            (l && l.memo ? '<div class="l3">' + esc(l.memo) + '</div>' : '') + '</li>';
        }).join('') + '</ul>';
      }).join('');
  }
  // ── 알림 쓰기 창 ──
  function cmpView() {
    if (!S.cmp) return '';
    var c = S.pc, all = c.scope === 'all', re = c.scope.indexOf('re:') === 0, P = all || re ? [] : picked();
    var rx = re ? ((S.push || []).find(function (p) { return p.id === +c.scope.slice(3); }) || { n: 0, read: 0 }) : null;
    var n = all ? (S.total || 0) : re ? rx.n - rx.read : P.length, ph = all ? (S.totalPush || 0) : re ? (rx.unread_ph || 0) : P.filter(function (r) { return r.push; }).length;
    return '<div class="mbg" data-act="cmpx"></div><div class="mdl" role="dialog" aria-modal="true" aria-label="알림 쓰기" tabindex="-1" id="mdl"><div class="mh"><h2 class="q">알림. <span>무엇을 알릴까요?</span></h2><button class="mini" type="button" data-act="cmpx">닫기 ✕</button></div>' +
      '<div class="mb"><div class="pcomp"><p class="cnt">받는 곳 <b>' + U.won(n) + '곳</b><span>' + (all ? '전 매장' : re ? '지난 알림을 안 읽은 곳' : P.slice(0, 3).map(function (r) { return esc(r.name); }).join(', ') + (P.length > 3 ? ' 외 ' + U.won(P.length - 3) + '곳' : '')) + ' · 휴대폰 알림 ' + U.won(ph) + '곳' + (all || re ? '(추정)' : '') + '</span></p>' +
      '<div class="fld"><span class="lb">문구 고르기</span><div class="chipset">' + Object.keys(TPLN).map(function (k) { return '<button type="button" class="ch" data-act="ptpl" data-v="' + k + '" aria-pressed="' + (c.tpl === k) + '">' + TPLN[k] + '</button>'; }).join('') + '</div></div>' +
      toneTip() + '<label class="f" for="pT">제목 <span class="n" id="pTn">' + c.title.length + '/40</span><input id="pT" type="text" maxlength="40" value="' + esc(c.title) + '"></label>' +
      '<label class="f" for="pB">내용 <span class="n" id="pBn">' + c.body.length + '/300</span><textarea id="pB" maxlength="300" rows="5">' + esc(c.body) + '</textarea></label>' +
      '<p class="small">{매장}이라고 쓰면 받는 매장 이름으로 바뀝니다.</p>' +
      '<label class="sw2" for="pPh"><input type="checkbox" id="pPh"' + (c.phone ? ' checked' : '') + '><span>휴대폰 알림도 보내기</span><small>알림을 허용한 휴대폰에만 갑니다</small></label>' +
      (all ? '<p class="warn2">전 매장 ' + U.won(n) + '곳에 갑니다. 받는 곳을 한 번 더 확인해 주세요.</p>' : '') + '<div class="sendw"><button class="btn block" type="button" data-act="psend"' + (!n || S.busy ? ' disabled' : '') + '>' + (c.conf ? U.won(n) + '곳에 보냅니다. 한 번 더 누르세요' : U.won(n) + '곳에 보내기') + '</button></div></div>' +
      '<div class="pvw">' + phoneMock(c, P) + '</div></div></div>';
  }
  // 사장님이 고맙게 읽는 알림(2026-11-21): 한 행사에 3번 안팎, 재촉보다 칭찬·마감·자료 안내
  function toneTip() {
    var me = S.me && S.me.name, n = (S.push || []).filter(function (x) { return x.by === me; }).length;
    return '<p class="tone' + (n >= 3 ? ' warn2' : '') + '">' + (n >= 3 ? '이번 행사에 벌써 <b>' + n + '번</b> 보냈어요. 꼭 필요할 때만 보내 주세요. ' : '') +
      '알림은 한 행사에 <b>3번 안팎</b>이 잘 읽혀요. "왜 안 하세요"보다 칭찬, 마감 안내, 본사가 준비해 둔 것을 알려 주세요.</p>';
  }
  function phoneMock(c, A) {
    return '<div class="pvph"><div class="scr"><div class="lock" id="pvLock"' + (c.phone ? '' : ' hidden') + '><span class="tm">오후 2:14</span><div class="nt"><i>본</i><div><b>본죽 단체주문</b><strong id="pvT">' + esc(fill(c.title, A)) + '</strong><span id="pvB">' + esc(fill(c.body, A)) + '</span></div><time>지금</time></div></div>' +
      '<div class="appv"><div class="ab"><b>오늘</b><span>' + U.dday(S.event.day, S.event.name) + '</span></div><div class="nb"><span class="k">알림 · ' + (S.me.role === 'admin' ? '본사' : S.me.role === 'lead' ? '팀장 ' + esc(S.me.name) : '담당 SM ' + esc(S.me.name)) + '</span><b id="pvT2">' + esc(fill(c.title, A)) + '</b><p id="pvB2">' + esc(fill(c.body, A)) + '</p><span class="ok">확인했어요</span></div><div class="gl"><i></i><i></i></div></div></div></div><p class="small">사장님 화면에 이렇게 보여요(예시)</p>';
  }
  function bestTpl(P) {
    var c = {}; P.forEach(function (r) { var w = why(r) || (r.orders ? 'praise' : ''); c[w] = (c[w] || 0) + 1; });
    var top = Object.keys(c).sort(function (a, b) { return c[b] - c[a]; })[0];
    return { none: 'join', auth: 'join', idle: 'first', away: 'away', stale: 'prop', praise: 'thanks', lock: 'join' }[top] || 'first';
  }
  // ── 보낸 알림 ──
  function sentView() {
    var L = S.push || [];
    return '<div class="wrap pg3"><section class="hero3 l"><h1>보낸 알림.</h1><p>' + (S.me.role === 'admin' ? '모든 알림' : S.me.role === 'lead' ? '우리 팀이 보낸 알림과 본사 알림' : '내가 보낸 알림과 팀·본사 알림') + '이에요. <b>움직인 곳</b>은 알림을 받고 48시간 안에 앱에 들어오거나 연락 기록을 남긴 매장이에요.</p></section>' +
      '<ul class="sl3">' + (L.map(function (x) { var p = x.n ? Math.round(x.read / x.n * 100) : 0, mp = x.n && x.moved ? Math.round(x.moved / x.n * 100) : 0, mine = x.by === S.me.name, old = (new Date(S.now) - new Date(x.at)) > 6 * 3600e3;
        return '<li><div class="a"><span class="k">' + U.when(x.at) + ' · ' + esc(x.by) + ' · ' + esc(x.scope) + '</span><b>' + esc(x.title) + '</b><p>' + esc(x.body) + '</p></div>' +
          '<div class="b"><span class="mvk">움직인 곳</span><span class="big">' + (mvDone(x) ? U.won(x.moved) + '<small>곳 · ' + mp + '%</small>' : '<small>집계 중</small>') + '</span><span class="br"><i data-w="' + mp + '"></i></span><span class="s">읽음 ' + p + '% (' + U.won(x.read) + ' / ' + U.won(x.n) + '곳) · 휴대폰 알림 ' + U.won(x.ph) + '곳' + (mvDone(x) ? '' : ' · 보낸 뒤 48시간까지 셉니다') + '</span>' +
          (mine && x.n > x.read && old ? '<button class="btn ghost sm" type="button" data-act="pre" data-id="' + x.id + '">안 읽은 ' + U.won(x.n - x.read) + '곳에 다시</button>' : '') + '</div></li>';
      }).join('') || '<li class="empty">아직 보낸 알림이 없습니다.</li>') + '</ul></div>';
  }
  function perfView() {
    return '<div class="wrap pg3"><section class="hero3 l"><h1>' + (topKey() === 'team' ? '팀별' : 'SM별') + ' 성과.</h1><p>' + esc(S.event.title || S.event.name || '') + ' · 사장님 참여가 낮은 ' + (topKey() === 'team' ? '팀' : 'SM') + '부터 보여요. 누르면 그 범위로 행사 화면을 엽니다.</p></section>' +
      groupTable() + '<div class="ctl"><button class="btn ghost sm" type="button" data-act="csv">매장별 숫자 엑셀로 받기</button></div></div>';
  }
  function helpPage() { return '<div class="wrap pg3"><section class="hero3 l"><h1>사용 안내.</h1><p>' + (noPush() ? '첫 화면 \'동지 단체주문\'에서 본사가 고른 기업·기관에 전화하고 결과를 적어요. 주문을 받으면 인분과 맡길 매장을 적습니다. \'매장 자료\'에서는 사장님이 영업할 제안서·키트를 뽑아 전달하세요. 사장님 앱 알림은 팀장·본사가 보냅니다.' : 'SM 사이트는 사장님이 움직이도록 돕는 곳이에요. 챙길 매장을 고르고 알림을 보내면, 숫자는 따라옵니다.') + '</p></section>' + helpView() + '</div>'; }
  // ── 처음 쓰는 사람 안내(단계 띠 + 지금 누를 곳 강조 + 말풍선). '안내 끄기'는 이 기기에 기억 ──
  var GK = 'bj_sm_guide_off';
  function gOn() { return U.store.get(GK) !== '1'; }
  function gStep() {
    var PG = S.pg || 'events';
    if (noPush()) { if (S.smDone) return 4; if (PG === 'ev') return (Object.keys(S.pk).length || S.bulk) ? 3 : 2; return 1; }
    if (S.sentDone && PG === 'sent') return 5;
    if (S.sentDone) return 4;
    if (S.cmp) return 3;
    if (PG === 'ev') return Object.keys(S.pk).length ? 3 : 2;
    return 1;
  }
  var GS0 = ['행사 고르기', '챙길 사장님 고르기', '알림 쓰고 보내기', '읽었는지 보기'], GS1 = ['행사 고르기', '챙길 매장 고르기', '자료 받기'];
  function coach() {
    if (!gOn() || S.view !== 'dash' || ['events', 'ev', 'sent'].indexOf(S.pg || 'hqs') < 0) return '';
    var n = gStep(), GS = noPush() ? GS1 : GS0, fin = n > GS.length;
    return '<div class="cz" id="cz"><div class="wrap"><span class="tl">처음이세요?</span><ol>' + GS.map(function (t, i) { var k = i + 1; return '<li class="' + (k < n ? 'done' : k === n ? 'now' : '') + '"><i>' + (k < n ? '✓' : k) + '</i>' + t + '</li>'; }).join('') + '</ol><span class="sp"></span>' +
      (fin ? '<b>다 해 보셨어요! 내일도 챙길 사장님부터 보면 됩니다.</b>' : '') + '<button type="button" data-act="goff">' + (fin ? '안내 닫기' : '안내 끄기') + '</button></div></div>';
  }
  function coachPlace() {
    Array.prototype.forEach.call(document.querySelectorAll('.cz-on'), function (el) { el.classList.remove('cz-on'); });
    Array.prototype.forEach.call(document.querySelectorAll('.bub'), function (el) { el.remove(); });
    var cz = U.$('cz'); if (!gOn() || !cz) return;
    var n = gStep(), t, msg, cls = '';
    if (n === 1) { t = app.querySelector('.grid3 li:nth-child(2) .card') || app.querySelector('.grid3 .card'); msg = '먼저 행사를 누르세요. 그 행사에서 챙길 사장님이 나와요.'; cls = 'dn'; }
    else if (n === 2 && noPush()) { t = app.querySelector('.sgrid .sc'); msg = canPick() ? '급한 곳이 위에 있어요. › 를 누르면 그 매장 연락할 곳이 나오고, 왼쪽 네모로 고르면 자료를 한꺼번에 받아요.' : '급한 곳이 위에 있어요. › 를 누르면 그 매장 연락할 곳과 기록이 나와요.'; cls = 'dn'; }
    else if (n === 3 && noPush()) { t = app.querySelector('.buy [data-act="bopen"]'); msg = '받을 자료(키트·제안서)를 눌러 고른 뒤 받기를 누르세요. 인쇄해 사장님께 전달하면 됩니다.'; cls = 'rt'; }
    else if (n === 2) { t = app.querySelector('.sgrid .sc'); msg = '왼쪽 네모를 눌러 알릴 사장님을 고르세요. 급한 곳이 위에 있어요. 여러 곳을 골라도 됩니다.'; cls = 'dn'; }
    else if (n === 3 && !S.cmp) { t = app.querySelector('.buy .btn'); msg = '다 골랐으면 알림 쓰기를 누르세요.'; cls = 'rt'; }
    else if (n === 3) { t = app.querySelector('.mdl [data-act="psend"]'); msg = '문구를 고르고 보내기를 두 번 누르면 사장님 앱과 휴대폰에 갑니다.'; }
    else if (n === 4) { t = app.querySelector('.top.t3 nav [data-p="sent"]'); msg = '보낸 알림에서 누가 읽었는지 볼 수 있어요.'; cls = 'dn'; }
    if (!t) return;
    t.classList.add('cz-on');
    var host = t.closest('.sendw') || t.closest('li') || t.parentNode; if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    var b = document.createElement('div'); b.className = 'bub ' + cls; b.setAttribute('role', 'note'); b.textContent = msg; host.appendChild(b);
    var cz2 = U.$('cz'); if (cz2) cz2.outerHTML = coach();
  }
  // ── 4차(최종 점검 반영): 팀장·관리자는 왼쪽 메뉴형, SM은 행사 카드형. 알림 쓰는 창은 하나(cmpView) ──
  function pdays(r) { if (!r || !r.pushed_at) return null; var d = Math.floor((new Date(S.now || Date.now()) - new Date(r.pushed_at)) / 864e5); if (d < 0) d = 0; return d <= 2 ? d : null; }
  function pdl(d) { return d === 0 ? '오늘 알림 보냄' : d === 1 ? '어제 알림 보냄' : d + '일 전 알림'; }
  function mvDone(x) { return !!x.moved || (new Date(S.now || Date.now()) - new Date(x.at)) > 48 * 3600e3; }
  function mvTxt(x) { return mvDone(x) ? '움직인 곳 ' + U.won(x.moved) + '곳' : '움직인 곳 집계 중'; }
  // ── 동지 단체주문 · 본사 진행(2026-11-23 개편): SM 첫 화면. 본사가 고른 기업·기관·단체에 SM이 연락하고, 주문은 매장에 맡김 ──
  // SM은 담당 매장 근처 카드, 팀장은 팀 매장 근처, 관리자는 전부. 사장님 앱에는 나오지 않음.
  var HQST = ['연락 전', '통화함', '메일 보냄', '관심 있음', '주문 받음', '안 함'];
  var HQT = { '연락 전': 't-idle', '통화함': 't-info', '메일 보냄': 't-info', '관심 있음': 't-ok', '주문 받음': 't-ok', '안 함': 't-bad' };
  var HQK = { hq_org: '기업·기관', hq_route: '상위 단체 창구', sm_add: '직접 넣은 곳', hq_new: '새로 찾은 곳' };
  function hqNews(c) { return c.kind === 'hq_org' || c.kind === 'hq_route'; }
  function hqTy(c) { var H = window.HQS; return H ? H.type(c) : c.kind; }
  function hqTyL(c) { var H = window.HQS, k = hqTy(c); return H && H.T[k] ? H.T[k].label : (HQK[c.kind] || ''); }
  var HQF = { all: ['전체', function () { return true; }], todo: ['연락 전', function (c) { return c.status === '연락 전'; }],
    doing: ['진행 중', function (c) { return ['통화함', '메일 보냄', '관심 있음'].indexOf(c.status) >= 0; }], done: ['주문 받음', function (c) { return c.status === '주문 받음'; }],
    mine: ['직접 넣은 곳', function (c) { return c.kind === 'sm_add'; }] };
  HQF = { all: HQF.all, news: ['기사에 나온 곳', function (c) { return c.kind === 'hq_org' || c.kind === 'hq_route'; }], todo: HQF.todo, doing: HQF.doing, done: HQF.done, mine: HQF.mine };
  function hqOn() { return S.view === 'dash' && (S.pg || 'hqs') === 'hqs'; }
  // SM도 '우리 팀 전체'로 팀 카드를 볼 수 있음(남의 카드는 보기만)
  function hqSc() { return S.me.role === 'sm' && S.hqScope === 'team' ? 'team' : 'mine'; }
  function hqTeamView() { return S.me.role !== 'sm' || hqSc() === 'team'; }
  function hqLoad(force) {
    var key = S.me.name + '|' + hqSc();
    if (S.hqU !== key) { S.hqc = null; S.hqL = 0; S.hqU = key; }
    if (S.hqL === 1 || (S.hqL === 2 && !force)) return;
    S.hqL = 1; S.hqErr = null;
    U.rpc('sm_hq_cards', { p_token: S.token, p_scope: hqSc() }).then(function (r) {
      if (S.hqU !== key) return;
      S.hqL = 2;
      if (r && r.ok) { S.hqc = r.items || []; if (r.team) S.hqTeam = r.team; }
      else if (r && r.reason === 'auth') return drop('로그인 시간이 끝났습니다. 다시 들어와 주세요.');
      else if (r && (r.status === 404 || r.status === 400)) S.hqErr = '본사 단체주문 목록을 준비하고 있습니다. 잠시 뒤 다시 열어 주세요. 그동안 제안서·키트는 ' + (S.me.role === 'sm' ? '위 \'매장 자료\'' : '왼쪽 \'매장\'') + '에서 받을 수 있습니다.';
      else S.hqErr = r && r.reason === 'role' ? '이 계정은 볼 수 없습니다.' : '불러오지 못했습니다. 잠시 뒤 다시 눌러 주세요.';
      if (hqOn()) render();
    }, function () { S.hqL = 2; S.hqErr = '연결이 되지 않습니다. 잠시 뒤 다시 눌러 주세요.'; if (hqOn()) render(); });
  }
  function hqStore(n) { return String(n || '').replace(/^본\s*죽(&비빔밥)?\s*/, ''); }
  function hqEv() { return (S.evs || []).filter(function (e) { return e.id === 'dj'; })[0] || null; }
  function hqSum(L) { var o = { n: L.length, c: 0, hot: 0, ord: 0, q: 0 }; L.forEach(function (c) { if (c.status !== '연락 전') o.c++; if (c.status === '관심 있음') o.hot++; if (c.status === '주문 받음') { o.ord++; o.q += c.qty || 0; } }); return o; }
  // 매장 이름 → 번호. 목록에 없으면 -1
  function hqSid(n, c) {
    n = hqStore(n).trim(); if (!n) return null;
    var r = S.rows.filter(function (x) { return x.name === n; })[0]; if (r) return r.id;
    if (c && c.assign_id && hqStore(c.assign) === n) return c.assign_id;
    if (c && c.store_id && hqStore(c.store) === n) return c.store_id;
    return -1;
  }
  function hqCard(c) {
    var ed = S.hqe === c.id && c.can !== false, tel = String(c.phone || '').replace(/[^0-9]/g, ''), wide = hqTeamView(), ord = c.status === '주문 받음' || c.qty || c.assign;
    var h = '<li class="hqc' + (ed ? ' on' : '') + (c.status === '안 함' ? ' off' : '') + '"><div class="h"><span class="kd">' + esc(hqTyL(c)) + (hqNews(c) ? ' <em>기사</em>' : c.kind === 'sm_add' ? ' <em>직접</em>' : '') + '</span><span class="tag ' + (HQT[c.status] || 't-idle') + '">' + esc(c.status) + '</span></div>' +
      '<h3>' + esc(c.name) + '</h3>' + (hqNews(c) && c.place && c.place !== c.name ? '<p class="pl">' + esc(c.place) + '</p>' : '') +
      (c.why ? '<p class="why">' + esc(c.why) + '</p>' : '') + (c.via ? '<p class="via">' + esc(c.via) + '</p>' : '') +
      (ord && !ed ? '<p class="ord">' + (c.qty ? '주문 <b>' + U.won(c.qty) + '인분</b>' : '인분 아직 모름') + (c.day ? ' · ' + U.day(c.day) : '') + ' · 맡길 매장 <b>' + esc(c.assign ? hqStore(c.assign) : '아직 안 정함') + '</b></p>' : '') +
      '<dl><div><dt>전화</dt><dd>' + (tel ? '<a href="tel:' + tel + '">' + esc(c.phone) + '</a>' : '<span class="mut">없음</span>') + '</dd></div>' +
      (c.addr ? '<div><dt>주소</dt><dd>' + esc(c.addr) + '</dd></div>' : '') +
      (c.email ? '<div><dt>이메일</dt><dd><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a></dd></div>' : '') +
      (c.map ? '<div><dt>지도</dt><dd><a href="' + esc(String(c.map).replace(/^http:/, 'https:')) + '" target="_blank" rel="noopener">카카오맵에서 보기</a></dd></div>' : '') +
      (c.store ? '<div><dt>가까운 매장</dt><dd>' + esc(hqStore(c.store)) + (c.km != null ? ' · ' + c.km + 'km' : '') + '</dd></div>' : '') +
      (wide && c.sm ? '<div><dt>담당 SM</dt><dd>' + esc(c.sm) + (c.team && S.me.role === 'admin' ? ' · ' + esc(c.team) : '') + '</dd></div>' : '') + '</dl>' +
      (c.memo && !ed ? '<p class="memo">' + esc(c.memo) + '</p>' : '');
    if (ed) return h + hqEditor(c) + '</li>';
    if (c.can === false) return h + '<div class="ft">' + (tel ? '<a class="btn ghost sm" href="tel:' + tel + '">전화 걸기</a>' : '') + '<button class="btn ghost sm" type="button" data-act="hqg" data-id="' + c.id + '">대본·설명서</button>' + '<small class="ro">' + (c.sm ? esc(c.sm) + ' SM 담당' : '다른 SM 담당') + ' · 보기만</small>' +
      '<small>' + (c.at ? esc(c.by || '') + ' · ' + U.when(c.at) : '아직 적은 내용 없음') + '</small></div></li>';
    return h + '<div class="ft">' + (tel ? '<a class="btn ghost sm" href="tel:' + tel + '">전화 걸기</a>' : '') + '<button class="btn ghost sm" type="button" data-act="hqg" data-id="' + c.id + '">대본·설명서</button><button class="btn sm" type="button" data-act="hqed" data-id="' + c.id + '">결과 적기</button>' +
      '<small>' + (c.at ? esc(c.by || '') + ' · ' + U.when(c.at) : '아직 적은 내용 없음') + '</small></div></li>';
  }
  function hqEditor(c) {
    var st = c.status, show = st === '주문 받음' || st === '관심 있음', as = c.assign ? hqStore(c.assign) : st === '주문 받음' ? hqStore(c.store) : '';
    return '<div class="ed"><p class="lb">어떻게 됐나요?</p><div class="sts" role="group" aria-label="연락 결과" data-v="' + esc(st) + '">' +
      HQST.map(function (x) { return '<button type="button" data-act="hqst" data-v="' + x + '" aria-pressed="' + (x === st) + '">' + x + '</button>'; }).join('') + '</div>' +
      '<div class="ordf"' + (show ? '' : ' hidden') + '><p class="lb">주문을 받았으면 적어 주세요</p><div class="g3">' +
      '<label>주문 인분<input id="hqQ" type="number" inputmode="numeric" min="1" max="100000" value="' + (c.qty || '') + '" placeholder="예: 300"></label>' +
      '<label>받는 날<input id="hqD" type="date" value="' + esc(c.day || '') + '"></label>' +
      '<label>맡길 매장<input id="hqA" type="text" list="hqSL" autocomplete="off" value="' + esc(as) + '" placeholder="매장 이름"></label></div>' +
      '<p class="hint">맡길 매장이 그 인분을 만들어 배달합니다. 정하기 전에 그 매장 사장님께 먼저 물어 주세요.</p></div>' +
      '<label>이메일<input id="hqE" type="email" maxlength="120" autocomplete="off" value="' + esc(c.email || '') + '" placeholder="담당자 메일 (모르면 비워 두세요)"></label>' +
      '<label>메모<textarea id="hqM" rows="3" maxlength="500" placeholder="담당 부서·이름, 통화 내용, 다음에 할 일">' + esc(c.memo || '') + '</textarea></label>' +
      '<div class="row"><button class="btn sm" type="button" data-act="hqsave" data-id="' + c.id + '">저장</button><button class="btn ghost sm" type="button" data-act="hqx">닫기</button></div></div>';
  }
  // 팀 화면: SM별(관리자는 팀별) 한 줄 요약. 누르면 그 이름으로 찾기
  function hqBySm(L) {
    if (!hqTeamView()) return '';
    var k = S.me.role === 'admin' ? 'team' : 'sm', G = {};
    L.forEach(function (c) { var n = c[k] || '정해지지 않음', g = G[n] || (G[n] = { n: 0, c: 0, o: 0, q: 0 }); g.n++; if (c.status !== '연락 전') g.c++; if (c.status === '주문 받음') { g.o++; g.q += c.qty || 0; } });
    var K = Object.keys(G).sort(function (a, b) { return a.localeCompare(b, 'ko'); }); if (K.length < 2) return '';
    var q = (S.hq || '').trim();
    return '<details class="hqsm"' + (U.store.get('bj_sm_hqsm') === '0' ? '' : ' open') + '><summary>' + (k === 'team' ? '팀별' : 'SM별') + ' 진행 <small>' + K.length + (k === 'team' ? '팀' : '명') + '</small></summary><ul>' + K.map(function (n) {
      var g = G[n], me = k === 'sm' && n === S.me.name;
      return '<li><button type="button" data-act="hqsmq" data-q="' + esc(n === '정해지지 않음' ? '' : n) + '" aria-pressed="' + (!!q && q === n) + '"><b>' + esc(n) + (me ? ' <em>나</em>' : '') + '</b><span>' + g.n + '곳</span><span>연락 ' + g.c + '</span><span class="' + (g.o ? 'o' : '') + '">주문 ' + g.o + '곳' + (g.q ? ' · ' + U.won(g.q) + '인분' : '') + '</span></button></li>';
    }).join('') + '</ul></details>';
  }
  function hqAddForm() {
    var one = S.rows.length === 1 ? S.rows[0].name : '';
    return '<form class="hqadd" id="hqAddF" novalidate><h3>영업할 곳 넣기</h3><p class="small">아는 기업·기관·단체가 있으면 넣어 두세요. ' + (S.me.role === 'sm' ? '나와 팀장·본사가 같이 봅니다.' : '그 매장 담당 SM도 같이 봅니다.') + '</p><div class="g2">' +
      '<label>이름<input id="haN" type="text" maxlength="80" autocomplete="off" placeholder="예: ○○주식회사 사회공헌팀"></label>' +
      '<label>전화<input id="haP" type="tel" maxlength="30" autocomplete="off" placeholder="예: 031-000-0000"></label>' +
      '<label>주소<input id="haA" type="text" maxlength="160" autocomplete="off" placeholder="모르면 비워 두세요"></label>' +
      '<label>가까운 매장<input id="haS" type="text" list="hqSL" autocomplete="off" value="' + esc(one) + '" placeholder="매장 이름"></label></div>' +
      '<label>메모<input id="haW" type="text" maxlength="300" autocomplete="off" placeholder="왜 이곳인지, 담당 부서 등"></label>' +
      '<div class="row"><button class="btn sm" type="submit">넣기</button><button class="btn ghost sm" type="button" data-act="hqaddx">닫기</button></div></form>';
  }
  function hqsView() {
    hqLoad();
    var e = hqEv(), role = S.me.role, L = S.hqc || [], q = (S.hq || '').trim();
    var hit = function (c) { return !q || [c.name, c.place, c.addr, c.store, c.assign, c.why, c.sm, c.team, c.memo].join(' ').indexOf(q) >= 0; }, o = hqSum(L.filter(hit)); // 숫자 칸은 찾기 결과를 따름
    var h = '<section class="hqh"><p class="k"><span>동지 단체주문</span><b>본사 진행</b>' + (e ? '<em>' + U.dday(e.day, e.name) + '</em>' : '') + '</p>' +
      '<h1>' + (role === 'sm' && hqSc() === 'mine' ? '내 매장 근처 기업·기관에<br>동지 팥죽을 제안해요' : role !== 'admin' ? '우리 팀이 연락할<br>기업·기관·단체' : '전국 영업할 곳') + '</h1>' +
      '<p>본사가 고른 기업·기관·단체에 직접 연락해 단체주문을 받습니다. 주문을 받으면 인분과 맡길 매장을 적어 주세요. 만들고 배달하는 건 맡은 매장이 합니다.</p>' +
      (e && e.deadlineLabel ? '<p class="dl">' + esc(e.deadlineLabel) + ' · 동짓날 ' + esc(U.day(e.day)) + '</p>' : '') +
      '<ol class="how"><li><i>1</i>전화 걸기</li><li><i>2</i>결과 적기</li><li><i>3</i>주문이면 인분·맡길 매장</li></ol></section>';
    if (role === 'sm') h += '<div class="hqsc" role="group" aria-label="보는 범위"><button type="button" data-act="hqsc" data-v="mine" aria-pressed="' + (hqSc() === 'mine') + '">내 매장 근처</button><button type="button" data-act="hqsc" data-v="team" aria-pressed="' + (hqSc() === 'team') + '">우리 팀 전체' + (S.hqTeam ? ' <small>' + esc(S.hqTeam) + '</small>' : '') + '</button></div>';
    h += '<div class="hqn"><div><span>영업할 곳</span><b>' + U.won(o.n) + '<small>곳</small></b></div><div><span>연락함</span><b>' + U.won(o.c) + '<small>곳</small></b></div>' +
      '<div><span>관심 있음</span><b>' + U.won(o.hot) + '<small>곳</small></b></div><div class="ok"><span>주문 받음</span><b>' + U.won(o.ord) + '<small>곳</small></b><i>' + U.won(o.q) + '인분</i></div></div>';
    if (!S.hqc) return h + '<p class="small">' + esc(S.hqErr || '불러오는 중입니다.') + '</p>' + (S.hqErr ? '<button class="btn sm" type="button" data-act="hqre">다시 불러오기</button>' : '');
    var f = HQF[S.hqf] ? S.hqf : 'all';
    var ty = S.hqty || '', TY = {}; L.forEach(function (c) { var k = hqTy(c); TY[k] = (TY[k] || 0) + 1; });
    if (ty && !TY[ty]) ty = '';
    var V = L.filter(function (c) { return HQF[f][1](c) && hit(c) && (!ty || hqTy(c) === ty); });
    var near = S.hqsort === 'km', rk = function (c) { return (c.status === '안 함' ? 20 : 0) + (near ? 0 : hqNews(c) || c.kind === 'sm_add' ? 0 : 10) + (['통화함', '메일 보냄', '관심 있음', '주문 받음'].indexOf(c.status) >= 0 && !near ? -5 : 0); };
    V = V.map(function (c, i) { return [c, i]; }).sort(function (a, b) { return rk(a[0]) - rk(b[0]) || (a[0].km == null ? 99 : +a[0].km) - (b[0].km == null ? 99 : +b[0].km) || a[1] - b[1]; }).map(function (x) { return x[0]; });
    var LIM = S.hqLim || 60, VP = V.slice(0, LIM), H2 = window.HQS;
    var tySel = Object.keys(TY).length > 1 ? '<label class="hqsel"><span>종류</span><select id="hqTy"><option value="">전체 ' + U.won(L.length) + '</option>' + Object.keys(TY).sort(function (a, b) { return TY[b] - TY[a]; }).map(function (k) { return '<option value="' + esc(k) + '"' + (k === ty ? ' selected' : '') + '>' + esc(H2 && H2.T[k] ? H2.T[k].label : k) + ' ' + U.won(TY[k]) + '</option>'; }).join('') + '</select></label>' : '';
    var srt = '<label class="hqsel"><span>순서</span><select id="hqSo"><option value="">진행 중·기사에 나온 곳 먼저</option><option value="km"' + (near ? ' selected' : '') + '>가까운 순</option></select></label>';
    var keys = Object.keys(HQF).filter(function (k) { return k !== 'mine' || L.some(HQF.mine[1]); });
    h += '<div class="hqbar"><div class="ctl"><input id="hqq" type="search" placeholder="이름·지역·매장' + (role === 'sm' ? '' : '·SM') + ' 찾기" autocomplete="off" value="' + esc(S.hq || '') + '" aria-label="영업할 곳 찾기"></div>' +
      (S.hqAdd ? '' : '<button class="btn sm" type="button" data-act="hqadd">+ 영업할 곳 넣기</button>') + (L.length ? '<button class="btn ghost sm" type="button" data-act="hqcsv">엑셀로 받기</button>' : '') + '</div>' +
      (S.hqAdd ? hqAddForm() : '') + hqBySm(L) +
      '<div class="tabs"><div class="t" role="group" aria-label="골라 보기">' + keys.map(function (k) { var n = L.filter(HQF[k][1]).length; return '<button type="button" data-act="hqf" data-f="' + k + '" aria-pressed="' + (f === k) + '">' + HQF[k][0] + '<b>' + n + '</b></button>'; }).join('') + '</div></div>' +
      '<div class="hqtools">' + tySel + srt + '<span class="cnt">' + U.won(V.length) + '곳</span></div>' +
      '<ul class="hqg">' + (VP.map(hqCard).join('') || (!L.length && role === 'sm' ? '<li class="empty big">내 매장 근처에 본사가 고른 곳이 아직 없어요. 아는 기업·기관이 있으면 \'+ 영업할 곳 넣기\'로 넣어 주세요.</li>' : '<li class="empty">해당하는 곳이 없습니다.</li>')) + '</ul>' +
      (V.length > VP.length ? '<button class="btn ghost block more50" type="button" data-act="hqmore">60곳 더 보기 <span>(' + U.won(VP.length) + ' / ' + U.won(V.length) + ')</span></button>' : '') +
      '<p class="hqnote">' + (role === 'sm' && hqSc() === 'team' ? '우리 팀 매장 근처 곳입니다. 다른 SM 담당 카드는 보기만 하고, 결과는 담당 SM이 적습니다.' : role === 'sm' ? '내 담당 매장 근처 곳만 보입니다. 같은 카드를 팀장·본사도 봅니다.' : role === 'lead' ? '우리 팀 매장 근처 곳만 보입니다. SM이 적은 결과가 여기 모입니다.' : '전국 카드입니다. SM은 담당 매장 근처, 팀장은 팀 매장 근처 카드만 봅니다.') +
      ' 사장님 앱에는 나오지 않습니다. \'기사\' 표시는 2021~2025년 동지 팥죽 나눔 기사에 나온 곳이고, 나머지는 본사가 지도 검색으로 찾은 시청·경찰서·소방서·공공기관·기업·병원·대학·봉사 단체입니다(가까운 매장 15km 안). 공개된 이메일은 찾지 못해 비어 있습니다.</p>' +
      '<aside class="hqdoc"><div><b>매장 자료</b><span>사장님이 직접 영업할 때 쓰는 제안서·실행 키트는 여기서 받아요.</span></div><button class="btn ghost sm" type="button" data-act="pg" data-p="' + (role === 'sm' ? 'events' : 'stores') + '">매장 자료 ›</button></aside>' +
      '<datalist id="hqSL">' + S.rows.map(function (r) { return '<option value="' + esc(r.name) + '">'; }).join('') + '</datalist>' + (S.hqg ? hqGuideView() : '');
    return h;
  }
  function hqCsv() {
    var H = ['구분', '이름', '연락할 곳', '전화', '주소', '이메일', '상태', '주문 인분', '받는 날', '맡길 매장', '메모', '가까운 매장', '거리km', '담당 SM', '팀', '근거', '경로'];
    var cell = function (v) { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var rows = S.hqc.map(function (c) { return [hqTyL(c) + (hqNews(c) ? '(기사)' : ''), c.name, hqNews(c) ? c.place : '', c.phone, c.addr, c.email, c.status, c.qty, c.day, hqStore(c.assign), c.memo, hqStore(c.store), c.km, c.sm, c.team, c.why, c.via].map(cell).join(','); });
    var blob = new Blob(['﻿' + [H.join(',')].concat(rows).join('\r\n')], { type: 'text/csv' }), url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = '동지단체주문_본사진행_' + U.today() + '.csv'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }
  function hqStPick(b) {
    var w = b.parentNode, v = b.dataset.v;
    Array.prototype.forEach.call(w.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    w.dataset.v = v;
    var of = w.parentNode.querySelector('.ordf'); if (!of) return;
    of.hidden = ['주문 받음', '관심 있음'].indexOf(v) < 0;
    var c = (S.hqc || []).filter(function (x) { return x.id === S.hqe; })[0], ai = U.$('hqA'), qi = U.$('hqQ');
    if (v === '주문 받음' && ai && !ai.value && c && c.store) ai.value = hqStore(c.store);
    if (v === '주문 받음' && qi && !qi.value) qi.focus();
  }
  function hqSave(b) {
    var id = +b.dataset.id, c = (S.hqc || []).filter(function (x) { return x.id === id; })[0]; if (!c || S.hqBusy) return;
    var w = app.querySelector('.hqc.on .sts'), st = w ? w.dataset.v : c.status, of = app.querySelector('.hqc.on .ordf'), open = of && !of.hidden;
    var e = U.$('hqE').value.trim(), m = U.$('hqM').value.trim(), q = c.qty || null, d = c.day || null, a = c.assign_id || null, an = c.assign || null;
    if (open) {
      var qs = U.$('hqQ').value.trim(); q = qs ? Math.round(+qs) : null; d = U.$('hqD').value || null; an = U.$('hqA').value.trim(); a = an ? hqSid(an, c) : null;
      if (qs && !(q >= 1 && q <= 100000)) return U.toast('인분은 1부터 100,000 사이 숫자로 넣어 주세요');
      if (a === -1) { U.$('hqA').focus(); return U.toast('맡길 매장은 목록에 나오는 이름으로 골라 주세요'); }
      if (st === '주문 받음' && !q) { U.$('hqQ').focus(); return U.toast('주문 인분을 넣어 주세요'); }
      if (st === '주문 받음' && !a) { U.$('hqA').focus(); return U.toast('맡길 매장을 골라 주세요'); }
    }
    if (e && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return U.toast('이메일 주소를 다시 확인해 주세요');
    S.hqBusy = true; b.disabled = true;
    U.rpc('sm_hq_card_save', { p_token: S.token, p_id: id, p_email: e, p_status: st, p_memo: m, p_qty: q, p_day: d, p_assign: a }).then(function (r) {
      S.hqBusy = false;
      if (r && r.ok) {
        var ar = a ? S.rows.filter(function (x) { return x.id === a; })[0] : null;
        c.email = e || null; c.status = st; c.memo = m || null; c.qty = q; c.day = d; c.assign_id = a; c.assign = a ? (ar ? ar.name : an) : null; c.at = new Date().toISOString(); c.by = S.me.name; S.hqe = null;
        U.toast(st === '주문 받음' ? '주문을 적었습니다. 맡길 매장 사장님께도 꼭 알려 주세요' : '저장했습니다'); render();
      } else { b.disabled = false; U.toast(r && r.reason === 'email' ? '이메일 주소를 다시 확인해 주세요' : r && r.reason === 'store' ? '내가 맡은 매장 가운데서 골라 주세요' : r && r.reason === 'role' ? '이 곳을 적을 권한이 없습니다' : r && r.reason === 'input' ? '적은 내용을 다시 확인해 주세요' : '저장하지 못했습니다. 다시 눌러 주세요'); }
    }, function () { S.hqBusy = false; b.disabled = false; U.toast('연결이 되지 않습니다'); });
  }
  function hqAdd(ev) {
    ev.preventDefault(); if (S.hqBusy) return;
    var n = U.$('haN').value.trim(), sn = U.$('haS').value.trim(), sid = sn ? hqSid(sn) : null;
    if (n.length < 2) { U.$('haN').focus(); return U.toast('이름을 두 글자 이상 넣어 주세요'); }
    if (!sid || sid < 0) { U.$('haS').focus(); return U.toast('가까운 매장을 목록에서 골라 주세요'); }
    S.hqBusy = true;
    U.rpc('sm_hq_card_add', { p_token: S.token, p_name: n, p_phone: U.$('haP').value.trim(), p_addr: U.$('haA').value.trim(), p_why: U.$('haW').value.trim(), p_store: sid }).then(function (r) {
      S.hqBusy = false;
      if (r && r.ok) { S.hqAdd = false; S.hqf = 'all'; U.toast('넣었습니다. 전화한 뒤 \'결과 적기\'로 남겨 주세요'); hqLoad(true); render(); }
      else U.toast(r && r.reason === 'store' ? '내가 맡은 매장 가운데서 골라 주세요' : r && r.reason === 'many' ? '한 시간에 60곳까지 넣을 수 있습니다' : r && r.reason === 'input' ? '적은 내용을 다시 확인해 주세요' : '넣지 못했습니다. 다시 눌러 주세요');
    }, function () { S.hqBusy = false; U.toast('연결이 되지 않습니다'); });
  }
  // ── 대본·설명서 창: 카드의 '대본·설명서'를 누르면 기관 종류에 맞는 전화 대본과 SM용 설명서 ──
  function hqFill(t, c) {
    var e = hqEv() || {}, price = (e.menu || []).map(function (m) { return m[0] + ' ' + U.won(m[1]) + '원'; }).join(', ');
    return String(t || '').replace(/\{곳\}/g, c.name || '').replace(/\{근거\}/g, String(c.why || '동지 팥죽 나눔').replace(/\s*\([^)]*기사[^)]*\)/g, '').replace(/\.$/, '')).replace(/\{매장\}/g, hqStore(c.assign || c.store) || '가까운 매장')
      .replace(/\{마감\}/g, e.deadlineLabel || '주문 마감').replace(/\{나\}/g, S.me.name || '').replace(/\{가격\}/g, price || '매장 가격');
  }
  function hqKind(c) { var H = window.HQS; if (!H) return null; var k = H.type(c); return H.T[k] || H.T.other; }
  function hqFirst(c, t) { var H = window.HQS; return H && H.first ? H.first(c, H.T[H.type(c)] ? H.type(c) : 'other') : t.first; }
  function hqScriptText(c) {
    var t = hqKind(c); if (!t) return '';
    return ['[' + c.name + '] 전화 대본', '', '첫마디', hqFill(hqFirst(c, t), c), '', '물어볼 것'].concat(t.ask.map(function (x, i) { return (i + 1) + '. ' + hqFill(x, c); }),
      ['', '이런 말을 들으면'], t.faq.map(function (x) { return '- "' + hqFill(x[0], c) + '" → ' + hqFill(x[1], c); }), ['', '마무리', hqFill(t.close, c)]).join('\n');
  }
  function hqGuideView() {
    var c = (S.hqc || []).filter(function (x) { return x.id === S.hqg; })[0], t = c && hqKind(c); if (!c) return '';
    var e = hqEv() || {}, tab = S.hqgt === 'doc' ? 'doc' : 'call', H = window.HQS;
    var h = '<div class="mbg" data-act="hqgx"></div><div class="mdl hqgd" role="dialog" aria-modal="true" aria-label="전화 대본과 설명서" tabindex="-1" id="hqgm">' +
      '<div class="mh"><div><span class="kd">' + esc(t ? t.label : '') + '</span><h2>' + esc(c.name) + '</h2></div><button class="mini" type="button" data-act="hqgx">닫기 ✕</button></div>' +
      '<div class="tabs"><div class="t" role="tablist"><button type="button" role="tab" data-act="hqgt" data-v="call" aria-selected="' + (tab === 'call') + '">전화 대본</button><button type="button" role="tab" data-act="hqgt" data-v="doc" aria-selected="' + (tab === 'doc') + '">설명서</button></div></div>';
    if (!t) return h + '<p class="small">대본 파일(hqscript.js)을 불러오지 못했습니다.</p></div>';
    if (tab === 'call') {
      h += '<div class="gsec"><p class="who"><b>누구에게</b> ' + esc(t.who) + '</p>' +
        '<h3>첫마디</h3><p class="say">' + esc(hqFill(hqFirst(c, t), c)) + '</p>' +
        '<h3>물어볼 것</h3><ol class="ask">' + t.ask.map(function (x) { return '<li>' + esc(hqFill(x, c)) + '</li>'; }).join('') + '</ol>' +
        '<h3>이런 말을 들으면</h3><dl class="faq">' + t.faq.map(function (x) { return '<div><dt>"' + esc(hqFill(x[0], c)) + '"</dt><dd>' + esc(hqFill(x[1], c)) + '</dd></div>'; }).join('') + '</dl>' +
        '<h3>마무리</h3><p class="say">' + esc(hqFill(t.close, c)) + '</p>' +
        (t.tips && t.tips.length ? '<h3>알아 둘 것</h3><ul class="tip2">' + t.tips.map(function (x) { return '<li>' + esc(hqFill(x, c)) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
    } else {
      var D = window.Docs, dd = D ? D.of('dj').props.filter(function (x) { return x.key === t.doc; })[0] : null;
      h += '<div class="gsec"><h3>이 곳은</h3><dl class="kv"><div><dt>종류</dt><dd>' + esc(t.label) + '</dd></div>' + (c.why ? '<div><dt>고른 까닭</dt><dd>' + esc(c.why) + '</dd></div>' : '') +
        (c.via ? '<div><dt>경로</dt><dd>' + esc(c.via) + '</dd></div>' : '') + '<div><dt>연락할 부서</dt><dd>' + esc(t.who) + '</dd></div>' +
        (c.store ? '<div><dt>가까운 매장</dt><dd>' + esc(hqStore(c.store)) + (c.km != null ? ' · ' + c.km + 'km' : '') + '</dd></div>' : '') + '</dl>' +
        '<h3>제안할 것</h3><ul class="tip2"><li>' + esc((e.menu || []).map(function (m) { return m[0] + ' ' + U.won(m[1]) + '원'; }).join(' · ')) + ' (1인분 용기에 담아 쇼핑백으로, 매장이 배달)</li>' +
        (e.notes || []).slice(0, 3).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
        '<h3>일정</h3><ul class="tip2"><li>' + esc(e.deadlineLabel || '') + '</li><li>동짓날 ' + esc(U.day(e.day)) + (e.dateLabel && e.dateLabel.indexOf('·') > 0 ? ' · ' + esc(e.dateLabel.split('·').slice(1).join('·').trim()) : '') + '</li></ul>' +
        '<h3>이렇게 진행합니다</h3><ol class="ask">' + (H.steps || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
        '<h3>같이 보낼 자료</h3><div class="gdoc">' + (dd ? '<img src="doc/prev/th/' + esc(dd.pv) + '.jpg" alt=""><div><b>' + esc(dd.title) + '</b><span>표지에 \'' + esc(c.name) + '\' 이름이 들어갑니다 · ' + dd.n + '쪽</span></div>' +
          '<button class="btn sm" type="button" data-act="hqgp"' + (S.hqgBusy ? ' disabled' : '') + '>' + (S.hqgBusy ? '만드는 중…' : '제안서 받기') + '</button>' : '<span class="small">맞는 제안서가 없습니다. \'매장 자료\'에서 골라 주세요.</span>') + '</div>' +
        '<p class="small">기업·기관 전용 제안서는 아직 없어, 나눔 제안서 가운데 가장 가까운 것을 씁니다.</p></div>';
    }
    return h + '<div class="gft"><span class="small">' + (H.draft ? '대본은 초안입니다. 통화하며 편하게 바꿔 말하세요.' : '') + '</span>' +
      (tab === 'call' ? '<button class="btn ghost sm" type="button" data-act="hqgc">대본 복사</button>' : '') + (c.can !== false ? '<button class="btn sm" type="button" data-act="hqed" data-id="' + c.id + '">결과 적기</button>' : '') + '</div></div>';
  }
  async function hqGuidePdf() {
    var c = (S.hqc || []).filter(function (x) { return x.id === S.hqg; })[0], t = c && hqKind(c), D = window.Docs; if (!c || !t || !D || S.hqgBusy) return;
    var sid = c.assign_id || c.store_id, st = { s: hqStore(c.assign || c.store) || '', tel: '', bj: false };
    S.hqgBusy = true; render();
    try {
      if (sid) { var r = await U.rpc('sm_store', { p_token: S.token, p_store: sid, p_event: 'dj' }); if (r && r.ok && r.store) st = { s: r.store.name || st.s, tel: r.store.tel || '', bj: !!r.store.bj }; }
      var dd = D.of('dj').props.filter(function (x) { return x.key === t.doc; })[0];
      var bytes = await D.make('dj', 'prop', st, { key: t.doc, to: c.name });
      D.save(bytes, D.fileName(st, '동지', dd.title, c.name)); U.toast('저장했습니다. 메일에 붙여 보내세요');
    } catch (er) { U.toast('만들지 못했습니다. 다시 눌러 주세요'); }
    S.hqgBusy = false; render();
  }
  function menuDash() {
    var R = scoped(), showSm = S.me.role !== 'sm', P = S.pg === 'sent' ? 'push' : S.pg === 'perf' ? 'teams' : (S.pg && ['home', 'stores', 'teams', 'push', 'help', 'hqs'].indexOf(S.pg) >= 0 ? S.pg : 'hqs'), body;
    if (P === 'hqs') body = '<div class="hqp">' + hqsView() + '</div>';
    else if (P === 'push') body = pushView(R);
    else if (P === 'help') body = helpView();
    else if (P === 'teams' && topKey()) body = asof() + scopeLine() + groupTable() + teamNote();
    else if (S.event.mode === 'hq') body = hqView(R, P === 'stores' ? 'stores' : 'home');
    else if (P === 'stores') {
      var chips = [['all', '전체 ' + R.length], ['need', '챙길 ' + R.filter(function (r) { return !!why(r); }).length]].concat(Object.keys(STG).map(function (k) { return [k, stn(k) + ' ' + R.filter(function (r) { return r.stage === k; }).length]; }));
      var q = S.q.trim(), LIM = S.lim || 50;
      var gk = narrow() ? '' : topKey() === 'team' ? (S.tm ? 'sm' : 'team') : topKey() === 'sm' && !S.tm ? 'sm' : '';
      var V = R.filter(function (r) { return (S.f === 'all' || (S.f === 'need' ? !!why(r) : r.stage === S.f)) && (!q || r.name.indexOf(q) >= 0 || (r.sm || '').indexOf(q) >= 0); });
      if (gk) V = V.map(function (r, i) { return [r, i]; }).sort(function (a, b) { return byKo(kv(a[0], gk), kv(b[0], gk)) || a[1] - b[1]; }).map(function (x) { return x[0]; });
      var VP = V.slice(0, LIM), NC = showSm ? 7 : 6; S.listIds = V.map(function (r) { return r.id; });
      body = scopeLine() + '<section class="step" id="allS"><div class="hd"><h2>' + (S.tm ? esc(S.tm) + ' ' : '') + '매장 <small>' + V.length + '곳</small></h2><span class="hbt">' + (bulkDocs().length && V.length ? '<button class="btn ghost sm" type="button" data-act="bopen" data-scope="list">이 ' + U.won(V.length) + '곳 자료 받기</button>' : '') + '<button class="btn ghost sm" type="button" data-act="csv">엑셀로 받기 (모든 숫자)</button></span></div>' +
        '<div class="ctl"><input id="q" type="search" placeholder="매장' + (showSm ? '·SM' : '') + ' 이름 찾기" autocomplete="off" value="' + esc(S.q) + '" aria-label="매장 찾기"></div>' +
        '<div class="tabs"><div class="t" role="group" aria-label="단계로 보기">' + chips.map(function (c) { return '<button type="button" data-act="f" data-f="' + c[0] + '" aria-pressed="' + (S.f === c[0]) + '">' + c[1].replace(/ (\d+)$/, '<b>$1</b>') + '</button>'; }).join('') + '</div></div>' +
        (narrow() ? '<ul class="cards">' + (VP.map(function (r) { return cardRow(r, showSm); }).join('') || '<li class="empty">해당하는 매장이 없습니다.</li>') + '</ul>' :
        '<div class="tw t7"><table><thead><tr><th>매장</th>' + (showSm ? '<th class="l">SM</th>' : '') + '<th class="l">단계</th><th>연락 / 목표</th><th>주문</th><th>마지막 기록</th><th class="l">표시</th></tr></thead><tbody>' +
        ((gk ? groups(VP, gk) : [['', VP]]).map(function (G) {
          var all = V.filter(function (r) { return kv(r, gk) === G[0]; }), g = gstat(all);
          return (gk ? '<tr class="grp"><th colspan="' + NC + '" class="l"><b>' + esc(G[0]) + '</b><span>' + g.n + '곳' + (all.length > G[1].length ? '(지금 ' + G[1].length + '곳 보임)' : '') + ' · 참여 ' + g.j + ' · 연락 ' + g.c + '곳 · 주문 ' + U.won(g.q) + '인분</span></th></tr>' : '') + G[1].map(function (r) {
            return '<tr class="pick" tabindex="0" data-act="row" data-id="' + r.id + '" aria-selected="' + (S.sel === r.id) + '"><td class="nm">' + esc(r.name) + '</td>' + (showSm ? '<td class="l">' + esc(r.sm || '') + '</td>' : '') +
              '<td class="l"><span class="tag ' + STG[r.stage] + '">' + stn(r.stage) + '</span></td><td>' + r.contacted + ' / ' + r.target + '</td><td>' + (r.orders ? U.won(r.qty) + '인분' : '–') + '</td><td>' + ago(r.last_at) + '</td>' +
              '<td class="l"><span class="flags">' + flags(r).map(function (x) { return '<span class="tag ' + x[1] + '">' + x[0] + '</span>'; }).join('') + '</span></td></tr>';
          }).join(''); }).join('') || '<tr><td colspan="' + NC + '" class="l">해당하는 매장이 없습니다.</td></tr>') + '</tbody></table></div>') +
        (V.length > VP.length ? '<button class="btn ghost block more50" type="button" data-act="lim">50곳 더 보기 <span>(' + VP.length + ' / ' + V.length + ')</span></button>' : '') + '</section>';
    } else body = homeView(R);
    return shell(body) + drawer() + cmpView() + bulkView();
  }
  function todayLine() {
    var E = S.evs.filter(function (e) { return S.sum[e.id] && !S.sum[e.id].hq; }), lp = noPush() ? null : (S.push || []).find(function (x) { return x.by === S.me.name; });
    return '<section class="hero3 sm"><h1>' + esc(S.me.name) + '님, 오늘 챙길 사장님이에요</h1><p>' + E.map(function (e) { return esc(e.name) + ' <b>' + U.won(S.sum[e.id].care) + '곳</b>'; }).join(' · ') + '</p>' +
      (lp ? '<p class="lp">지난 알림 \'' + esc(lp.title) + '\' 읽음 ' + pct(lp.read, lp.n) + ' · ' + mvTxt(lp) + ' <button class="lnk" type="button" data-act="pg" data-p="sent">보낸 알림 ›</button></p>' : '') + '</section>';
  }
  function evTabs() {
    return S.evs.length > 1 ? '<section class="step"><h2 class="q">행사. <span>어느 행사를 볼까요?</span></h2><div class="tabs"><div class="t" role="tablist" aria-label="행사">' +
      S.evs.map(function (e) { return '<button type="button" role="tab" data-act="ev" data-id="' + esc(e.id) + '" aria-selected="' + (S.ev === e.id) + '">' + esc(e.name) + (e.mode === 'hq' ? ' <b>본사</b>' : '') + '</button>'; }).join('') + '</div></div></section>' : '';
  }
  async function allocSave(rows) {
    S.busy = true; render();
    var r = await U.rpc('sm_alloc_save', { p_token: S.token, p_event: S.ev, p_rows: rows });
    S.busy = false;
    if (!r.ok) { if (r.reason === 'auth') return drop('다시 들어와 주세요.'); render(); return U.toast(r.reason === 'role' ? '배정은 관리자만 넣을 수 있습니다' : '넣지 못했습니다'); }
    S.ares = r; S.aed2 = null; if (!(r.missing && r.missing.length)) S.paste = ''; await load(); U.toast(r.saved + '곳 배정을 저장했습니다');
  }
  function detail() {
    if (!S.sel) return '';
    var r = S.rows.find(function (x) { return x.id === S.sel; }); if (!r) return '';
    if (!S.det) return '<section class="one"><p class="eb">고른 매장</p><h2 class="nm">' + esc(r.name) + '</h2><p class="small">불러오는 중입니다.</p></section>';
    var st = S.det.store || {}, w = why(r) || (r.orders ? 'praise' : 'idle'), tel = st.tel ? 'tel:' + String(st.tel).replace(/[^0-9+]/g, '') : '';
    return '<section class="one v2" id="det" aria-label="고른 매장"><div><p class="eb"><span class="tag ' + STG[r.stage] + '">' + stn(r.stage) + '</span>' + (why(r) && WHY[why(r)][0] !== stn(r.stage) ? ' <span class="tag ' + WHY[why(r)][1] + '">' + WHY[why(r)][0] + '</span>' : '') + '</p><h2 class="nm">' + esc(r.name) + '</h2>' +
      '<p class="meta">' + esc(r.sm || '') + ' · 연락 ' + r.contacted + '/' + r.target + ' · 주문 ' + U.won(r.qty) + '인분 · 마지막 로그인 ' + (r.last_login ? U.when(r.last_login) : '없음') + '</p></div>' +
      '<div class="acts2">' + (tel ? '<a class="btn" href="' + tel + '">매장에 전화</a>' : '') + '' + (noPush() ? '' : '<button class="btn ghost" type="button" data-act="pnew" data-id="' + r.id + '" data-w="' + w + '">이 매장에 알림</button>') + '<button class="btn ghost" type="button" data-act="nudge" data-id="' + r.id + '" data-w="' + w + '">문구 복사(카톡용)</button></div>' +
      '<details class="nfold"><summary>보낼 문구 미리 보기</summary><p class="pre">' + esc(nudge(r, w)) + '</p></details>' + smDocs() +
      placeList(S.det.places) +
      '<details class="mgmt"' + (S.rv === r.id || S.mgo ? ' open' : '') + '><summary>관리 <span>로그인 잠금 · 로그인 끊기</span></summary><p class="small">첫 로그인 ' + (r.first_login ? U.when(r.first_login) : '없음') + ' · 기록 ' + r.logs + '건 · 직접 추가한 곳 ' + r.added + '곳</p><div class="ctl">' + (r.locked ? '<button class="btn sm" type="button" data-act="unlock">로그인 잠금 풀기</button>' : '') +
      '<button class="btn ghost sm" type="button" data-act="revoke">' + (S.rv === r.id ? '한 번 더 누르면 끊습니다' : '이 매장 로그인 모두 끊기') + '</button></div><p class="small">휴대폰을 잃어버렸을 때만 씁니다. 사장님은 다시 로그인해야 합니다.</p></details></section>';
  }

  // ── 계정 관리(관리자: 전체 / 팀장: 자기 팀 SM) ──
  function stat(u) {
    if (!u.active) return ['사용 중지', 't-idle'];
    if (u.locked) return ['잠김', 't-bad'];
    if (u.must_change) return ['처음 비밀번호 대기', 't-warn'];
    return ['사용 중', 't-ok'];
  }
  function siteUrl() { return location.origin + location.pathname; }
  function note(x) { return '[본죽 단체주문 SM 성과 관리]\n주소: ' + siteUrl() + '\n아이디: ' + x.login + '\n처음 비밀번호: ' + x.pw + '\n처음 들어가면 새 비밀번호(8자 이상)로 바꿔 주세요.'; }
  function acctView() {
    var A = S.A; if (!A) return '<div class="wrap split one-col"><p class="small">계정 목록을 불러오는 중입니다.</p></div>';
    var admin = A.me.role === 'admin', q = S.aq.trim();
    var V = A.users.filter(function (u) { return (!S.at || u.team === S.at) && (!q || u.name.indexOf(q) >= 0 || u.login.indexOf(q.toLowerCase()) >= 0); });
    var opt = function (v, t, cur) { return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(t) + '</option>'; };
    var h = '<div class="wrap split one-col acct"><div class="steps">' + permView(A);
    if (S.pws.length) {
      h += '<section class="step" aria-label="처음 비밀번호"><h2 class="q">비밀번호. <span>지금만 보입니다</span></h2>' +
        '<p class="small">각자에게 문자나 메신저로 따로 보내 주세요. 이 칸을 닫거나 다른 화면으로 가면 다시 볼 수 없습니다. 잊었으면 \'비밀번호 새로 주기\'를 다시 누르면 됩니다.</p>' +
        '<div class="tw"><table class="narrow"><thead><tr><th>이름</th><th class="l">아이디</th><th class="l">처음 비밀번호</th><th class="l">보낼 안내</th></tr></thead><tbody>' +
        S.pws.map(function (x, i) { return '<tr><td class="nm">' + esc(x.name) + '</td><td class="l">' + esc(x.login) + '</td><td class="l"><b>' + esc(x.pw) + '</b></td><td class="l"><button class="btn ghost sm" type="button" data-act="acopy" data-i="' + i + '">안내 문구 복사</button></td></tr>'; }).join('') +
        '</tbody></table></div><div class="ctl">' + (S.pws.length > 1 ? '<button class="btn ghost sm" type="button" data-act="acopyall">모두 복사(엑셀에 붙이기)</button>' : '') +
        '<button class="btn sm" type="button" data-act="apwclose">다 보냈습니다, 닫기</button></div></section>';
    }
    if (admin && S.ed) {
      var e = S.ed && S.ed !== 'new' ? A.users.find(function (u) { return u.id === S.ed; }) : null, nw = !e;
      h += '<section class="step"><h2 class="q">' + (nw ? '새 계정. <span>누구를 넣을까요?</span>' : '고치기. <span>' + esc(e.name) + '</span>') + '</h2>' +
        '<form id="af" novalidate><div class="row2">' +
        '<label class="f" for="aNm">이름<input id="aNm" type="text" maxlength="30" value="' + esc(e ? e.name : '') + '"></label>' +
        '<label class="f" for="aLg">아이디<input id="aLg" type="text" maxlength="30" autocapitalize="none" spellcheck="false" placeholder="비우면 이름으로" value="' + esc(e ? e.login : '') + '"></label>' +
        '<label class="f" for="aRl">역할<select id="aRl">' + ['sm', 'lead', 'admin'].map(function (r) { return opt(r, ROLE[r] + (r === 'sm' ? ' (담당 매장만)' : r === 'lead' ? ' (자기 팀 매장 전부)' : ' (전체, 계정 관리)'), e ? e.role : 'sm'); }).join('') + '</select></label>' +
        '<label class="f" for="aTm">팀<select id="aTm">' + opt('', '팀 없음', e ? (e.team || '') : (S.at || '')) + A.teams.map(function (t) { return opt(t, t, e ? (e.team || '') : (S.at || '')); }).join('') + '</select></label></div><p class="small">이름은 매장 목록의 담당자 이름과 똑같아야 그 SM의 담당 매장이 보입니다.</p>' +
        (S.aerr ? '<p class="err" role="alert">' + esc(S.aerr) + '</p>' : '') +
        '<div class="ctl"><button class="btn" type="submit"' + (S.busy ? ' disabled' : '') + '>' + (nw ? '계정 만들기' : '고친 내용 저장') + '</button><button class="btn ghost" type="button" data-act="aedx">닫기</button></div>' +
        (nw ? '<p class="small">만들면 처음 비밀번호가 위에 한 번 나옵니다. 받은 사람은 처음 들어갈 때 비밀번호를 바꿉니다.</p>' : '') + '</form></section>';
      if (A.missing.length) {
        h += '<section class="step"><h2 class="q">계정 없는 SM. <span>' + A.missing.length + '명</span></h2>' +
          '<p class="small">매장 목록에 담당자로 적혀 있는데 아직 계정이 없는 사람입니다. 아이디는 이름으로 만들고, 역할은 SM입니다. 팀장은 만든 뒤 \'고치기\'에서 역할을 바꿔 주세요.</p>' +
          '<div class="ctl"><button class="btn" type="button" data-act="afill"' + (S.busy ? ' disabled' : '') + '>' + A.missing.length + '명 모두 만들기</button></div>' +
          '<div class="chips">' + A.missing.map(function (m) { return '<button class="btn ghost sm" type="button" data-act="afill1" data-n="' + esc(m.name) + '" title="' + esc((m.team || '') + ' · 담당 ' + m.stores + '곳') + '">' + esc(m.name) + ' 만들기</button>'; }).join('') + '</div></section>';
      }
    }
    h += '<section class="step"><div class="hd"><h2>' + (admin ? '계정' : esc(A.me.team || '') + ' SM 계정') + ' <small>' + V.length + '명</small></h2>' + (admin ? '<button class="btn sm" type="button" data-act="anew">+ 새 계정</button>' : '') + '</div>' +
      '<div class="ctl"><input id="aq" type="search" placeholder="이름·아이디 찾기" autocomplete="off" value="' + esc(S.aq) + '" aria-label="계정 찾기">' +
      (admin ? '<select id="at" aria-label="팀으로 보기">' + opt('', '모든 팀', S.at) + A.teams.map(function (t) { return opt(t, t, S.at); }).join('') + '</select>' : '') + '</div>' +
      '<div class="tw"><table><thead><tr><th>이름</th><th class="l">아이디</th><th class="l">역할</th><th class="l">팀</th><th>담당 매장</th><th class="l">상태</th><th>마지막 로그인</th><th class="l">할 일</th></tr></thead><tbody>' +
      (groups(V, 'team').map(function (G) {
        return (S.at ? '' : '<tr class="grp"><th colspan="8" class="l"><b>' + esc(G[0]) + '</b><span>' + G[1].length + '명' + (G[1].filter(function (u) { return u.must_change && u.active; }).length ? ' · 처음 비밀번호 대기 ' + G[1].filter(function (u) { return u.must_change && u.active; }).length + '명' : '') + '</span></th></tr>') + G[1].map(function (u) {
        var st = stat(u), mine = u.id === A.me.id, can = !mine && (admin || u.role === 'sm');
        return '<tr' + (S.asel === u.id ? ' class="on"' : '') + '><td class="nm">' + esc(u.name) + (mine ? ' <span class="small">(나)</span>' : '') + '</td><td class="l">' + esc(u.login) + '</td><td class="l">' + ROLE[u.role] + '</td><td class="l">' + esc(u.team || '') + '</td><td>' + (u.role === 'sm' ? u.stores + '곳' : '') + '</td>' +
          '<td class="l"><span class="tag ' + st[1] + '">' + st[0] + '</span></td><td>' + (u.last_login ? U.when(u.last_login) : '없음') + '</td><td class="l"><span class="flags">' + (S.asel !== u.id ? ((can || admin) ? '<button class="btn ghost sm" type="button" data-act="usel" data-id="' + u.id + '">관리 ›</button>' : '') : 
          (can && u.active ? '<button class="btn ghost sm" type="button" data-act="areset" data-id="' + u.id + '">비밀번호 새로 주기</button>' : '') +
          (can && u.locked ? '<button class="btn ghost sm" type="button" data-act="aunlock" data-id="' + u.id + '">잠금 풀기</button>' : '') +
          (admin ? '<button class="btn ghost sm" type="button" data-act="aed" data-id="' + u.id + '">고치기</button>' : '') +
          (admin && !mine ? '<button class="btn ghost sm" type="button" data-act="aact" data-id="' + u.id + '" data-on="' + (u.active ? 0 : 1) + '">' + (u.active ? (S.conf === u.id ? '한 번 더 누르면 중지' : '사용 중지') : '다시 사용') + '</button>' : '') +
          '<button class="lnk" type="button" data-act="usel" data-id="0">접기</button>') + '</span></td></tr>';
      }).join(''); }).join('') || '<tr><td colspan="8" class="l">해당하는 계정이 없습니다.</td></tr>') + '</tbody></table></div>' +
      '<p class="small">비밀번호 새로 주기를 누르면 그 사람은 지금 로그인이 끊기고, 새 처음 비밀번호로 들어가 다시 바꿉니다.' + (admin ? ' 사용 중지한 계정은 들어올 수 없고, 기록은 남습니다.' : ' 팀장은 자기 팀 SM의 비밀번호와 잠금만 다룹니다.') + '</p></section>';
    return h + '</div></div>';
  }
  async function loadAcct() {
    var r = await U.rpc('sm_accounts', { p_token: S.token });
    if (!r.ok) { if (r.reason === 'auth') return drop('다시 들어와 주세요.'); S.view = 'dash'; render(); return U.toast(r.reason === 'role' ? '계정 관리는 관리자·팀장만 할 수 있습니다' : '불러오지 못했습니다'); }
    S.A = r; render();
  }
  var AERR = { login: '아이디는 2~30자로, 한글·영문 소문자·숫자와 . _ - 만 쓸 수 있습니다.', dup: '이미 있는 아이디입니다. 다른 아이디를 넣어 주세요.', name: '이름을 넣어 주세요.', self: '자기 역할은 바꿀 수 없습니다.', role: '이 일은 관리자만 할 수 있습니다.', none: '그 계정을 찾지 못했습니다.', net: '연결이 되지 않습니다. 잠시 뒤 다시 해 주세요.' };
  async function saveAcct(ev) {
    ev.preventDefault(); if (S.busy) return;
    var nm = U.$('aNm').value.trim(), lg = U.$('aLg').value.trim() || nm, rl = U.$('aRl').value, tm = U.$('aTm').value, id = S.ed && S.ed !== 'new' ? S.ed : null;
    if (!nm) { S.aerr = AERR.name; return render(); }
    S.busy = true; S.aerr = null; render();
    var r = await U.rpc('sm_account_save', { p_token: S.token, p_id: id, p_login: lg, p_name: nm, p_role: rl, p_team: tm });
    S.busy = false;
    if (!r.ok) { if (r.reason === 'auth') return drop('다시 들어와 주세요.'); S.aerr = AERR[r.reason] || '저장하지 못했습니다.'; render(); if (U.$('aNm')) { U.$('aNm').value = nm; U.$('aLg').value = lg === nm ? '' : lg; U.$('aRl').value = rl; U.$('aTm').value = tm; } return; }
    if (r.pw) S.pws.unshift({ name: r.name, login: r.login, pw: r.pw });
    S.ed = null; U.toast(id ? '고쳤습니다' : '계정을 만들었습니다'); await loadAcct();
  }
  function copyText(t, done) {
    var ok = function () { U.toast(done); };
    try { navigator.clipboard.writeText(t).then(ok, fb); } catch (e) { fb(); }
    function fb() { var x = document.createElement('textarea'); x.value = t; document.body.appendChild(x); x.select(); try { document.execCommand('copy'); ok(); } catch (e) { U.toast('복사하지 못했습니다. 직접 골라 복사해 주세요'); } x.remove(); }
  }
  async function acctAct(act, b) {
    var id = +b.dataset.id;
    if (act === 'aed') { S.ed = id; S.aerr = null; render(); var f = U.$('af'); if (f && f.scrollIntoView) f.scrollIntoView({ block: 'center' }); return; }
    if (act === 'aedx') { S.ed = null; S.aerr = null; return render(); }
    if (act === 'acopy') { var x = S.pws[+b.dataset.i]; return copyText(note(x), x.name + ' 안내 문구를 복사했습니다'); }
    if (act === 'acopyall') return copyText(['이름\t아이디\t처음 비밀번호'].concat(S.pws.map(function (x) { return x.name + '\t' + x.login + '\t' + x.pw; })).join('\n'), '모두 복사했습니다');
    if (act === 'apwclose') { S.pws = []; return render(); }
    if (act === 'aact' && b.dataset.on === '0' && S.conf !== id) { S.conf = id; render(); setTimeout(function () { if (S.conf === id) { S.conf = null; if (S.view === 'acct') render(); } }, 4000); return; }
    if (S.busy) return; S.busy = true; var r;
    if (act === 'areset') r = await U.rpc('sm_account_reset', { p_token: S.token, p_id: id });
    else if (act === 'aunlock') r = await U.rpc('sm_account_unlock', { p_token: S.token, p_id: id });
    else if (act === 'aact') { S.conf = null; r = await U.rpc('sm_account_active', { p_token: S.token, p_id: id, p_active: b.dataset.on === '1' }); }
    else if (act === 'afill' || act === 'afill1') r = await U.rpc('sm_account_fill', { p_token: S.token, p_names: act === 'afill1' ? [b.dataset.n] : null });
    S.busy = false;
    if (!r || !r.ok) { if (r && r.reason === 'auth') return drop('다시 들어와 주세요.'); return U.toast(r && AERR[r.reason] || '하지 못했습니다'); }
    if (r.pw) S.pws.unshift({ name: r.name, login: r.login, pw: r.pw });
    if (r.made) S.pws = r.made.concat(S.pws);
    U.toast(act === 'areset' ? '새 처음 비밀번호를 만들었습니다' : act === 'aunlock' ? '잠금을 풀었습니다' : act === 'aact' ? (b.dataset.on === '1' ? '다시 쓸 수 있게 했습니다' : '사용을 중지했습니다') : (r.made ? r.made.length : 0) + '명의 계정을 만들었습니다');
    await loadAcct(); if (S.pws.length) window.scrollTo(0, 0);
  }
  function drop(msg) { S.pg = null; S.hqe = null; S.hqAdd = false; S.cmp = false; S.pk = {}; S.token = null; ss.set(null); S.me = null; S.A = null; S.pws = []; S.ed = null; S.view = 'login'; S.err = msg || null; S.busy = false; S.det = null; S.sel = null; S.tm = ''; render(); }
  async function load() {
    var r = await U.rpc('sm_dashboard', { p_token: S.token, p_event: S.ev }); S.busy = false;
    if (!r.ok) {
      if (r.reason === 'must_change') { S.view = 'pw'; S.err = null; return render(); }
      if (r.reason === 'auth') return drop(S.view === 'boot' ? null : '로그인 시간이 끝났습니다. 다시 들어와 주세요.');
      if (S.view === 'boot') return drop('연결이 되지 않습니다. 잠시 뒤 다시 해 주세요.');
      return U.toast('연결이 되지 않습니다');
    }
    S.amap = {}; (r.allocs || []).forEach(function (a) { S.amap[a.store] = a; }); S.sum = S.sum || {};
    S.me = r.me; S.total = r.total; S.totalPush = r.total_push; S.rows = r.stores; S.allocs = r.allocs || null; S.now = r.now; S.evs = r.events || []; S.event = r.event || {};
    if (!r.event && S.evs.length) { S.ev = S.evs[0].id; U.store.set(EVK, S.ev); return load(); }
    S.sum[S.ev] = evSum(S.rows, S.event || {});
    await loadPush(); if (S.view !== 'acct') S.view = 'dash'; render(); if (!S.sumDone) { S.sumDone = true; loadSums(); }
  }
  async function loadSums() {
    for (var i = 0; i < S.evs.length; i++) { var e = S.evs[i]; if (S.sum[e.id]) continue;
      var r = await U.rpc('sm_dashboard', { p_token: S.token, p_event: e.id }); if (r.ok) S.sum[e.id] = evSum(r.stores, r.event || e); }
    if (S.view === 'dash' && (S.pg || 'events') === 'events') render();
  }
  async function pushSend3() {
    var c = S.pc, all = c.scope === 'all', re = c.scope.indexOf('re:') === 0, P = all || re ? [] : picked();
    if (!c.title.trim() || !c.body.trim()) return U.toast('제목과 내용을 넣어 주세요');
    if (!c.conf) { c.conf = true; render(); setTimeout(function () { if (S.pc && S.pc.conf) { S.pc.conf = false; if (S.cmp) render(); } }, 5000); return; }
    var rx = re ? (S.push || []).find(function (p) { return p.id === +c.scope.slice(3); }) : null;
    S.busy = true; c.conf = false; render();
    var r = await U.rpc('sm_push_send', { p_token: S.token, p_event: S.ev, p_scope: all ? 'all' : re ? c.scope : 'pick', p_stores: P.map(function (x) { return x.id; }), p_n: rx ? rx.n - rx.read : null,
      p_label: all ? '전 매장' : re ? '지난 알림 안 읽은 곳' : c.label ? c.label : P.length === 1 ? P[0].name : (S.tm ? S.tm + ' · ' : '') + '고른 ' + P.length + '곳', p_title: c.title.trim(), p_body: c.body.trim(), p_phone: c.phone });
    S.busy = false;
    if (!r.ok) { if (r.reason === 'auth') return drop('다시 들어와 주세요.'); render(); return U.toast(r.reason === 'role' ? '이 범위에 보낼 권한이 없습니다' : '보내지 못했습니다'); }
    if (r.push) U.fn('notice-push', { id: r.id });
    if (!all && !re) P.forEach(function (x) { x.pushed_at = S.now || new Date().toISOString(); });
    S.cmp = false; S.pk = {}; S.sentDone = true; pcReset(); await loadPush(); render(); U.toast(U.won(r.n) + '곳에 알림을 보냈습니다. 보낸 알림에서 읽음을 볼 수 있어요');
  }
  function openCmp(o) { if (noPush()) return; var TP = TPL(), k = o.tpl || 'first'; pcReset(Object.assign({ tpl: k, title: TP[k] ? TP[k][0] : '', body: TP[k] ? TP[k][1] : '' }, o)); S.cmp = true; S.cmpFocus = true; render(); }
  async function login(e) {
    e.preventDefault(); if (S.busy) return;
    var a = { p_login: U.$('iId').value, p_pw: U.$('iPw').value };
    if (!a.p_login.trim() || !a.p_pw) { S.err = '아이디와 비밀번호를 넣어 주세요.'; render(); return keepId(a); }
    S.busy = true; S.err = null; render(); keepId(a);
    var r = await U.rpc('sm_login', a); S.busy = false;
    if (r.ok) { S.token = r.token; ss.set(r.token); S.me = { name: r.name, role: r.role }; if (r.must_change) { S.view = 'pw'; return render(); } S.view = 'boot'; render(); return load(); }
    S.err = r.reason === 'locked' ? '여러 번 틀려서 30분 동안 들어갈 수 없습니다.' : r.reason === 'net' ? '연결이 되지 않습니다. 잠시 뒤 다시 해 주세요.'
      : '아이디나 비밀번호가 맞지 않습니다. 다시 넣어 주세요. (잠기지 않습니다)';
    render(); keepId(a);
  }
  // 틀렸을 때 아이디는 그대로 두고 비밀번호만 다시 넣게 함
  function keepId(a) { var el = U.$('iId'); if (el) el.value = a.p_login; var p = U.$('iPw'); if (p && a.p_login.trim()) p.focus(); }
  async function changePw(e) {
    e.preventDefault(); if (S.busy) return;
    var o = U.$('pOld').value, n = U.$('pNew').value, n2 = U.$('pNew2').value;
    if (n.length < 8) { S.err = '새 비밀번호는 8자 이상이어야 합니다.'; return render(); }
    if (n !== n2) { S.err = '새 비밀번호 두 칸이 서로 다릅니다.'; return render(); }
    S.busy = true; S.err = null; render();
    var r = await U.rpc('sm_change_pw', { p_token: S.token, p_old: o, p_new: n }); S.busy = false;
    if (!r.ok) { if (r.reason === 'auth') return drop('다시 들어와 주세요.'); S.err = r.reason === 'bad' ? '지금 비밀번호가 맞지 않습니다.' : r.reason === 'net' ? '연결이 되지 않습니다.' : '새 비밀번호를 다시 정해 주세요. 지금 것과 달라야 하고 8자 이상이어야 합니다.'; return render(); }
    U.toast('비밀번호를 바꿨습니다'); S.view = 'boot'; render(); load();
  }
  async function pick(id) { S.mgo = false;
    S.sel = id; S.last = id; S.det = null; render();
    var r = await U.rpc('sm_store', { p_token: S.token, p_store: id, p_event: S.ev });
    if (!r.ok) { if (r.reason === 'auth') return drop('다시 들어와 주세요.'); return U.toast('불러오지 못했습니다'); }
    if (S.sel === id) { S.det = r; render(); var d = U.$('drw'); if (d) d.focus({ preventScroll: true }); }
  }
  function csv() {
    var head = ['매장', 'SM', '팀', '단계', '첫 로그인', '배정된 곳', '직접 추가', '목표', '연락한 곳', '부재였던 곳', '부재 재연락', '대화된 곳', '관심', '거절', '주문 건수', '주문한 곳', '인분', '추정 매출', '기록 수', '마지막 기록', '몰아서 입력'];
    var q = function (v) { v = v == null ? '' : String(v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
    var lines = [head.map(q).join(',')].concat(scoped().map(function (r) {
      return [r.name, r.sm, r.team, stn(r.stage), r.first_login ? r.first_login.slice(0, 10) : '', r.assigned, r.added, r.target, r.contacted, r.away, r.retried, r.talked, r.hot, r.refused, r.orders, r.order_places, r.qty, r.revenue, r.logs, r.last_at ? r.last_at.slice(0, 10) : '', r.burst ? '예' : ''].map(q).join(',');
    }));
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    a.download = (S.event.name || '단체주문') + '_' + (S.tm ? S.tm + '_' : '') + '매장성과_' + U.today() + '.csv'; document.body.appendChild(a); a.click(); a.remove();
  }
  app.addEventListener('click', async function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return; var act = b.dataset.act;
    if (noPush() && ['pnew', 'pwrite', 'pwall', 'psend', 'pre', 'galert', 'pgo'].indexOf(act) >= 0) return;
    if (noPush() && act === 'pg' && (b.dataset.p === 'sent' || b.dataset.p === 'push')) return;
    if (act === 'acct') { S.menu = false; S.sel = null; S.det = null; document.body.classList.remove('dopen'); S.view = 'acct'; S.A = null; S.aerr = null; render(); return loadAcct(); }
    if (act === 'dash') { S.menu = false; if (S.pws.length && !b.dataset.sure) { b.dataset.sure = '1'; b.textContent = '비밀번호 칸이 닫힙니다. 한 번 더'; return; } S.pws = []; S.view = 'dash'; return render(); }
    if (act === 'evo') { S.ev = b.dataset.id; U.store.set(EVK, S.ev); S.pg = 'ev'; S.pk = {}; S.f3 = ''; S.tm = ''; S.q = ''; S.lim = 60; S.sel = null; S.det = null; await load(); window.scrollTo(0, 0); return; }
    if (act === 'usel') { S.asel = +b.dataset.id || null; S.conf = null; return render(); }
    if (act === 'tmgo') { S.tm = b.dataset.t || ''; S.pg = 'stores'; S.f = 'all'; S.lim = 50; S.sel = null; S.det = null; render(); window.scrollTo(0, 0); return; }
    if (act === 'galert') { var gt = b.dataset.t, GA = S.rows.filter(function (r) { return kv(r, topKey()) === gt && r.stage === '미참여' && pdays(r) == null; }); if (!GA.length) return; S.pk = {}; GA.forEach(function (r) { S.pk[r.id] = true; }); return openCmp({ scope: 'pick', tpl: 'join', label: gt + ' · 로그인 안 함' }); }
    if (act === 'pgo') { var T2 = ptargets(); if (!T2.n) return; if (S.pc.scope === 'all' || (S.me.role === 'admin' && S.pc.scope === 'mine' && !S.pc.cond)) return openCmp({ scope: 'all', tpl: 'first' });
      var lb = plabel(); S.pk = {}; T2.A.forEach(function (r) { S.pk[r.id] = true; }); return openCmp({ scope: 'pick', tpl: bestTpl(T2.A), label: lb }); }
    if (act === 'goff') { U.store.set(GK, '1'); return render(); }
    if (act === 'gon') { U.store.set(GK, ''); S.sentDone = false; S.smDone = false; S.menu = false; S.pg = null; S.view = 'dash'; render(); if (window.FirstGuide) FirstGuide.open((S.me.role === 'admin' ? 'admin' : S.me.role === 'lead' ? 'lead' : 'sm'), 'bj_sm_guide2_' + S.me.role); return; }
    if (act === 'f3') { S.f3 = b.dataset.f; S.lim = 60; return render(); }
    if (act === 'pk') { var pid = +b.dataset.id; if (b.checked) S.pk[pid] = true; else delete S.pk[pid]; return syncBuy(); }
    if (act === 'pall') { var VV = visRows(); VV.forEach(function (r) { if (b.checked) S.pk[r.id] = true; else delete S.pk[r.id]; }); return syncBuy(); }
    if (act === 'unpk') { delete S.pk[+b.dataset.id]; return syncBuy(); }
    if (act === 'pclr') { S.pk = {}; return syncBuy(); }
    if (act === 'pwrite') { var PP = picked(); if (!PP.length) return; return openCmp({ scope: 'pick', tpl: bestTpl(PP) }); }
    if (act === 'pwall') return openCmp({ scope: 'all', tpl: 'first' });
    if (act === 'cmpx') { S.cmp = false; return render(); }
    if (act === 'pg') { var pp = b.dataset.p; S.menu = false; S.evm = false; S.cmp = false;
      if (pp === 'push') pcReset();
      if (pp === 'acct') { S.sel = null; S.det = null; document.body.classList.remove('dopen'); S.view = 'acct'; S.A = null; S.aerr = null; render(); return loadAcct(); }
      if (S.view === 'acct' && S.pws.length && !b.dataset.sure) { b.dataset.sure = '1'; return U.toast('처음 비밀번호 칸이 닫힙니다. 한 번 더 누르세요'); }
      S.pws = []; S.view = 'dash'; S.pg = pp; S.lim = 50; render(); window.scrollTo(0, 0); return; }
    if (act === 'pnew') { var nid = +b.dataset.id; if (!nid) return; S.pk = {}; S.pk[nid] = true; S.sel = null; S.det = null; var nr0 = S.rows.find(function (x) { return x.id === nid; }); return openCmp({ scope: 'pick', tpl: bestTpl(nr0 ? [nr0] : []) }); }
    if (act === 'pscope') { S.pc.scope = b.dataset.v; S.pc.conf = false; if (b.dataset.v === 'all') S.pc.cond = ''; return render(); }
    if (act === 'pcond') { S.pc.cond = b.dataset.v; S.pc.conf = false; if (!S.pc.scope || S.pc.scope.indexOf('one:') === 0 || S.pc.scope.indexOf('re:') === 0 || S.pc.scope === 'pick') S.pc.scope = 'mine'; return render(); }
    if (act === 'ptpl') { var T2 = TPL()[b.dataset.v]; S.pc.tpl = b.dataset.v; S.pc.conf = false; if (T2) { S.pc.title = T2[0]; S.pc.body = T2[1]; } else { S.pc.title = ''; S.pc.body = ''; } render(); var tf = U.$(T2 ? 'pB' : 'pT'); if (tf) tf.focus(); return; }
    if (act === 'psend') { if (S.busy) return; return S.cmp ? pushSend3() : pushSend(); }
    if (act === 'pre') { var px = (S.push || []).find(function (x) { return x.id === +b.dataset.id; }); if (!px) return; return openCmp({ scope: 're:' + px.id, tpl: 'free', title: px.title, body: px.body }); }
    if (act === 'pgrant') { if (S.busy) return; S.busy = true; var gr = await U.rpc('sm_push_grant', { p_token: S.token, p_id: +b.dataset.id, p_on: b.dataset.on === '1' }); S.busy = false;
      if (!gr.ok) return U.toast('바꾸지 못했습니다'); U.toast(b.dataset.on === '1' ? '전 매장 알림 권한을 주었습니다' : '우리 팀만 보내도록 바꿨습니다'); return loadAcct(); }
    if (act === 'anew') { S.ed = 'new'; S.aerr = null; render(); window.scrollTo(0, 0); return; }
    if (act === 'hqf') { S.hqf = b.dataset.f; S.hqe = null; S.hqLim = 60; return render(); }
    if (act === 'hqg') { S.hqg = +b.dataset.id; S.hqgt = 'call'; render(); var gm = U.$('hqgm'); if (gm) gm.focus(); return; }
    if (act === 'hqgx') { S.hqg = null; return render(); }
    if (act === 'hqgt') { S.hqgt = b.dataset.v; render(); var gm2 = U.$('hqgm'); if (gm2) gm2.focus(); return; }
    if (act === 'hqgp') return hqGuidePdf();
    if (act === 'hqgc') { var gc = (S.hqc || []).filter(function (x) { return x.id === S.hqg; })[0]; if (!gc) return; var tx = hqScriptText(gc); try { navigator.clipboard.writeText(tx).then(function () { U.toast('대본을 복사했습니다'); }, function () { U.toast('복사하지 못했습니다'); }); } catch (er) { U.toast('복사하지 못했습니다'); } return; }
    if (act === 'hqed') { S.hqg = null; S.hqe = +b.dataset.id; render(); var he = U.$('hqE'); if (he) he.focus(); return; }
    if (act === 'hqx') { S.hqe = null; return render(); }
    if (act === 'hqst') return hqStPick(b);
    if (act === 'hqsc') { S.hqScope = b.dataset.v; S.hqe = null; S.hq = ''; S.hqLim = 60; render(); return; }
    if (act === 'hqmore') { S.hqLim = (S.hqLim || 60) + 60; return render(); }
    if (act === 'hqsmq') { S.hq = S.hq === b.dataset.q ? '' : b.dataset.q; S.hqe = null; return render(); }
    if (act === 'hqadd') { S.hqAdd = true; S.hqe = null; render(); var hn = U.$('haN'); if (hn) hn.focus(); return; }
    if (act === 'hqaddx') { S.hqAdd = false; return render(); }
    if (act === 'hqsave') return hqSave(b);
    if (act === 'hqcsv') return hqCsv();
    if (act === 'hqre') { hqLoad(true); return render(); }
    if (act === 'bopen') { S.sel = null; S.det = null; return bulkOpen(b.dataset.scope === 'list' ? S.rows.filter(function (r) { return (S.listIds || []).indexOf(r.id) >= 0; }) : picked(), b.dataset.go === '1'); }
    if (act === 'bdc') { var on2 = bsel(); on2[b.dataset.k] = !on2[b.dataset.k]; bselSet(on2); return syncBuy(); }
    if (act === 'bsp') { U.store.set(BSK, U.store.get(BSK) === 'store' ? 'type' : 'store'); return syncBuy(); }
    if (act === 'bx') { if (S.bulk && S.bulk.run && !S.bulk.run.done) return; S.bulk = null; return render(); }
    if (act === 'bdoc') { if (S.bulk && !S.bulk.run) { S.bulk.on[b.dataset.k] = b.checked; bselSet(Object.assign({}, S.bulk.on)); render(); } return; }
    if (act === 'bsplit') { if (S.bulk && !S.bulk.run) { S.bulk.split = b.dataset.v; U.store.set(BSK, b.dataset.v); render(); } return; }
    if (act === 'bgo') return bulkRun();
    if (act === 'bstop') { if (S.bulk && S.bulk.run) { S.bulk.run.stop = true; bulkPaint(); } return; }
    if (act.charAt(0) === 'a' && act !== 'acct') return acctAct(act, b);
    if (act === 'dkit' || act === 'dblank' || act === 'dfile') return smDocGet(act, b.dataset.k);
    if (act === 'dclose') { S.sel = null; S.det = null; render(); var rw = app.querySelector('tr[data-act="row"][data-id="' + S.last + '"]'); if (rw) rw.focus({ preventScroll: true }); return; }
    if (act === 'haf') { S.af = b.dataset.f; S.lim = 50; return render(); }
    if (act === 'hedit') { S.aed2 = +b.dataset.id; render(); var eq = U.$('eQ'); if (eq) eq.focus(); return; }
    if (act === 'hcancel') { S.aed2 = null; return render(); }
    if (act === 'hsave') { if (S.busy) return; return allocSave([{ store: b.dataset.n, qty: U.$('eQ').value || '0', day: U.$('eD').value || '', note: U.$('eN').value || '' }]); }
    if (act === 'hpaste') {
      if (S.busy) return; S.paste = U.$('hPaste').value || ''; var raw = S.paste.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
      var rows = raw.map(function (l) { var c = l.split(/\t|,/).map(function (x) { return x.trim(); }); return { store: c[0] || '', qty: (c[1] || '').replace(/[^0-9]/g, ''), day: (c[2] || '').replace(/\./g, '-').replace(/\s/g, ''), note: c.slice(3).join(' ') }; })
        .filter(function (x) { return x.store && x.store !== '매장' && x.store !== '매장명'; });
      if (!rows.length) return U.toast('붙여 넣은 줄이 없습니다');
      return allocSave(rows);
    }
    if (act === 'f') { if (b.closest('.none0')) { S.pg = 'stores'; window.scrollTo(0, 0); } S.f = b.dataset.f; S.lim = 50; return render(); }
    if (act === 'nudgeall') { var e0 = S.event || {}; copyText('[본죽 ' + (e0.name || '단체주문') + ' 단체주문] 사장님, 담당 SM입니다.\n단체주문 앱에 아직 들어오지 않으셨어요. 가맹점코드·사업자번호·휴대폰 뒷자리 4자리로 1분이면 들어가실 수 있어요.\n주소: ' + ownerUrl(), '여러 매장에 함께 보낼 문구를 복사했습니다. 단체 문자에 붙여 넣으세요'); return; }
    if (act === 'lim') { S.lim = (S.lim || 50) + 50; return render(); }
    if (act === 'cmore') { S.cmore = true; return render(); }
    if (act === 'gsort') { S.gsort = b.dataset.v; return render(); }
    if (act === 'evm') { S.evm = !S.evm; S.menu = false; return render(); }
    if (act === 'menu') { S.menu = !S.menu; S.evm = false; return render(); }
    if (act === 'nudge') { var nr = S.rows.find(function (x) { return x.id === +b.dataset.id; }); if (nr) copyText(nudge(nr, b.dataset.w), nr.name + ' 사장님께 보낼 문구를 복사했습니다. 카톡·문자에 붙여 넣으세요'); return; }
    if (act === 'tm') { if (S.pg === 'perf') S.pg = 'ev'; S.tm = b.dataset.t || ''; S.sel = null; S.det = null; S.lim = 50; S.cmore = false; render(); return; }
    if (act === 'ev') { S.evm = false; S.lim = 50; S.cmore = false; S.aed2 = null; S.ares = null; S.ev = b.dataset.id; U.store.set(EVK, S.ev); S.sel = null; S.det = null; await load(); return; }
    if (act === 'row') return pick(+b.dataset.id);
    if (act === 'csv') return csv();
    if (act === 'reload') { await load(); if (S.sel) pick(S.sel); return U.toast('새로 불러왔습니다'); }
    if (act === 'logout') { U.rpc('sm_logout', { p_token: S.token }); return drop(); }
    if (act === 'revoke' && S.rv !== S.sel) { S.rv = S.sel; S.mgo = true; render(); setTimeout(function () { if (S.rv) { S.rv = null; render(); } }, 4000); return; }
    if (act === 'unlock' || act === 'revoke') { S.rv = null;
      var r = await U.rpc(act === 'unlock' ? 'sm_unlock' : 'sm_revoke', { p_token: S.token, p_store: S.sel });
      if (!r.ok) return U.toast('하지 못했습니다');
      U.toast(act === 'unlock' ? '잠금을 풀었습니다' : '이 매장의 로그인을 모두 끊었습니다'); await load(); if (S.sel) pick(S.sel);
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.hqg) { S.hqg = null; return render(); } if (e.key === 'Escape' && S.bulk) { if (!(S.bulk.run && !S.bulk.run.done)) { S.bulk = null; render(); } return; } if (e.key === 'Escape' && S.cmp) { S.cmp = false; return render(); } if (e.key === 'Escape' && S.sel && S.view === 'dash') { S.sel = null; S.det = null; render(); } });
  app.addEventListener('toggle', function (e) { if (e.target.classList && e.target.classList.contains('guide')) S.gOpen = e.target.open; }, true);
  app.addEventListener('keydown', function (e) { var b = e.target.closest('tr[data-act="row"],tr[data-act="tm"]'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); b.click(); } });

  if (!U.ready()) return render();
  if (S.token) { render(); load(); } else { S.view = 'login'; render(); }
})();
