// 2026-11-23 한눈에 구성 v8(preview/v8/tools/build_v8.py). 그 전 새 구성 v7(preview/v7/tools/build_v7.py, 40·50대 기준 구성 재검토). 그 전 v6: 참고 앱 기능 모음(FX 켜고 끄기, preview/v6/tools/build_v6.py). 2026-11-19 받은 알림·휴대폰 알림(웹 푸시) 추가. 2026-11-19 최종 점검 6가지+앱 색+동지 게임 적용, 2026-11-19 게임 매장 혜택(우리 매장 혜택·매장별 게임 링크·QR) 추가(preview/v2/build2.py로 만든 것을 옮김). 사장님 화면(자료실 3 디자인): 로그인 → 처음 동의 → 행사 고르기 → 그 행사의 우리 매장 연락할 곳 → 통화·주문 기록
// 2판(2026-11-18): 동지만이 아니라 단체주문 플랫폼의 모든 행사(크리스마스·설·수능 …). 행사 내용은 서버(app.events)에서 받습니다.
(function () {
  var U = window.U, C = window.APP_CONFIG || {}, esc = U.esc, RES = { call: ['통화만 함', 't-info'], away: ['안 받음', 't-warn'], hot: ['관심 있음', 't-ok'], no: ['필요 없대요', 't-bad'], order: ['주문 받음', 't-ok'] }, KEY = 'bj_owner_token', EVK = 'bj_owner_event';
  var S = { view: 'boot', token: U.store.get(KEY), ev: U.store.get(EVK), evs: null, data: null, pid: null, pick: null, method: '전화', err: null, busy: false, del: null, form: {}, name: '', f: 'all', pf: '', tab: 'today', demo: U.store.get('bj_owner_demo'), dshow: false, derr: null };
  var GK = 'bj_owner_guide_off', BK = 'bj_owner_big';
  function applyBig() { var v = fsLv(); document.documentElement.classList.toggle('big', v === '1'); document.documentElement.classList.toggle('big2', v === '2'); }
  applyBig();
  var app = U.$('app');

  // ── 공통 조각 ──
  function E() { return (S.data && S.data.event) || (S.evs || []).find(function (e) { return e.id === S.ev; }) || {}; }
  function places() { return (S.data && S.data.places) || []; }
  function live() { return places().filter(function (p) { return !p.flag; }); } // 번호 틀림·문 닫음으로 알려 주신 곳은 할 일에서 뺌
  function last(p) { return p.logs[0]; }
  function target() { return Math.min(places().filter(function (p) { return !p.custom && !p.flag; }).length, C.TARGET || 10); }
  function needAgain(p) { var l = last(p), td = U.today(); return !p.flag && !!l && (l.r === 'away' || (l.back && l.back <= td && l.r !== 'no' && l.r !== 'order')); }
  function sc() { return E().script || {}; }
  function won(n) { return U.won(n) + '원'; }
  function top() {
    return '<header class="top"><div class="wrap"><div class="brand"><picture><source media="(prefers-color-scheme: dark)" srcset="img/logo-dark.svg"><img src="img/logo.svg" alt="본죽&amp;비빔밥"></picture><span>사장님 단체주문</span></div>' +
      '<div class="rt"><button class="mini big" type="button" data-act="big" aria-pressed="' + (fsLv() === '2') + '" aria-label="글자 크기 바꾸기">가<span>+</span></button>' + (S.store ? '<b>' + esc(S.store.name) + '</b><button class="mini" type="button" data-act="logout">로그아웃</button>' : '') + '</div></div></header>' +
      (S.demo && S.token ? '<div class="demo"><div class="wrap"><b>예시 매장</b><span>' + esc(S.demo) + ' 님이 사장님 화면을 미리 보는 중입니다. 여기 적은 기록은 실제 집계에 들어가지 않습니다.</span><button class="mini" type="button" data-act="dreset">예시 기록 비우기</button></div></div>' : '');
  }
  // ── 머리줄 한 줄(2026-11-18 UX 제안 1): [←] [행사 이름 ▾] [D-34] [가+] ──
  function demoBar() { return S.demo && S.token ? '<div class="demo"><div class="wrap"><b>예시 매장</b><span>' + esc(S.demo) + ' 님이 사장님 화면을 미리 보는 중입니다. 여기 적은 기록은 실제 집계에 들어가지 않습니다.</span><button class="mini" type="button" data-act="dreset">예시 기록 비우기</button></div></div>' : ''; }
  var SV = { back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>', down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>' };
  function appbar(o) {
    var e = E(), sw = !o.plain && !o.back && !o.backAct && S.evs && S.evs.length > 1;
    var t = o.title != null ? o.title : v8Short(e);
    return '<header class="abar"><div class="wrap">' + (o.back || o.backAct ? '<button class="ab-back" type="button" data-act="' + (o.backAct || 'go') + '" data-v="' + (o.back || '') + '" aria-label="뒤로">' + SV.back + '</button>' : '') +
      (sw ? '<button class="ab-t" type="button" data-act="events" aria-label="다른 행사 고르기"><b>' + esc(t) + '</b>' + SV.down + '</button>' : '<b class="ab-t">' + esc(t) + '</b>') +
      (!o.plain && !o.back && !o.backAct && e.id ? '<span class="ab-d">' + U.dday(e.day, e.name) + '</span>' : '') + (!o.plain && !o.back && !o.backAct && e.id ? v8Pill() : '') +
      '<button class="mini big" type="button" data-act="big" aria-pressed="' + (fsLv() === '2') + '" aria-label="글자 크기 바꾸기">가<span>+</span></button></div>' + (o.strip ? '<div class="wrap sbar">' + o.strip + '</div>' : '') + '</header>' + demoBar();
  }
  // ── 아래 탭(UX 제안 2): 오늘 · 연락할 곳 · 매출 · 더보기. 한 곳 화면에 들어가면 탭은 숨김 ──
  var TI = {
    today: '<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>',
    list: '<path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11 11 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11 11 0 0 0 .6 3.6 1 1 0 0 1-.25 1z"/>',
    docs: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.5"/>',
    sales: '<path d="M4 20V11M10 20V5M16 20v-6M21 20H3"/>',
    more: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>'
  };
  function tabs() { return E().mode === 'hq' ? [['today', '오늘'], ['more', '더보기']] : [['today', '오늘'], ['list', '연락할 곳'], ['sales', '매출'], ['more', '더보기']]; }
  function curTab() { var T = tabs(); return T.some(function (t) { return t[0] === S.tab; }) ? S.tab : 'today'; }
  function tabbar() {
    var cur = curTab(), again = E().mode === 'hq' ? 0 : places().filter(needAgain).length;
    return '<nav class="tabbar" aria-label="화면 바꾸기"><div class="wrap">' + tabs().map(function (t) {
      return '<button type="button" data-act="tab" data-t="' + t[0] + '"' + (cur === t[0] ? ' aria-current="page"' : '') + '><svg viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + TI[t[0]] + '</svg><span>' + t[1] + '</span>' +
        (t[0] === 'list' && again ? '<b class="nb" aria-label="다시 연락 ' + again + '곳">' + again + '</b>' : '') + (t[0] === 'more' && ntUnread().length ? '<b class="nb" aria-label="안 읽은 알림 ' + ntUnread().length + '개">' + ntUnread().length + '</b>' : '') + '</button>' + (t[0] === 'list' ? centerBtn() : '') + (t[0] === 'sales' ? newTip() : '');
    }).join('') + '</div></nav>';
  }
  // ── 처음 쓰는 분 단계 안내(SM 자료실처럼 '지금 할 일 n/3'(행사 고르기는 번호 없이)와 번호 말풍선) ──
  function gOff() { return U.store.get(GK) === '1'; }
  // 처음 다섯 번 열 때까지만 말풍선(2026-11-18 UX 3차)
  (function () { var n = +(U.store.get('bj_owner_guide_n') || 0) + 1; U.store.set('bj_owner_guide_n', String(n)); if (n > 5 && !gOff()) U.store.set(GK, '1'); })();
  function gStep() {
    return null; // v7: 예전 말풍선 대신 처음 안내(tourView)
    if (gOff() || !S.token) return null;
    var hq = E().mode === 'hq';
    if (S.view === 'events') return [0, 3, '진행 중인 행사 고르기'];
    if (S.view === 'home' && hq) return S.data && S.data.alloc && !S.data.alloc.confirmed ? [1, 1, '배정 수량 확인하기'] : null;
    if (S.view === 'home') return [1, 3, '연락할 곳 고르기'];
    if (S.view === 'place') { var p = places().find(function (x) { return x.id === S.pid; }); return p && p.logs.length ? [3, 3, '관심 있으면 제안서 보내기'] : [2, 3, '전화하고 결과 저장하기']; }
    return null;
  }
  function gPill() {
    return '';
    var g = gStep(); if (!g) return '';
    return '<div class="gpill" role="status"><b>지금 할 일</b><span>' + (g[0] && g[1] > 1 ? g[0] + ' / ' + g[1] + ' ' : '') + g[2] + '</span><button type="button" data-act="goff">안내 끄기</button></div>';
  }
  function tip(n, text) { var g = gStep(); return g && g[0] === n ? '<div class="tip" role="note"><span>' + text + '</span><button type="button" data-act="goff" aria-label="안내 닫기">×</button></div>' : ''; }
  function band(now) {
    var e = E();
    if (!e.id) return '<div class="band"><div class="wrap"><div class="l"><b>본죽 단체주문</b></div></div></div>';
    return '<div class="band"><div class="wrap"><div class="l">' + (S.evs && S.evs.length > 1 ? '<button class="back" type="button" data-act="events">← 행사</button>' : '') + '<b>' + esc(e.title || e.name) + '</b>' + (e.mode === 'hq' ? '<small>본사가 진행하는 행사입니다</small>' : '') + '</div>' +
      '<div class="r"><span><span class="d">' + U.dday(e.day, e.name) + '</span> · ' + esc(e.dateLabel || U.day(e.day)) + '</span>' + (e.deadlineLabel ? '<span><b>' + esc(e.deadlineLabel) + '</b></span>' : '') +
      (now ? '<div class="now"><span>고른 곳</span><b>' + esc(now) + '</b><button type="button" data-act="go" data-v="home">목록으로</button></div>' : '') + '</div></div></div>';
  }
  var SVG = {
    temple: '<path d="M3 9c4 0 7-3 9-6 2 3 5 6 9 6"/><path d="M5 9v10h14V9"/><path d="M10 19v-5h4v5"/>',
    care: '<path d="M4 20V9l8-5 8 5v11z"/><path d="M12 11c-1.5-1.6-4 0-2.5 2l2.5 2.5 2.5-2.5c1.5-2-1-3.6-2.5-2z"/>',
    heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    police: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9.5 12l2 2 3.5-4"/>',
    church: '<path d="M12 3v5M10 5h4"/><path d="M6 21V12l6-4 6 4v9z"/><path d="M10 21v-4h4v4"/>',
    office: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
    school: '<path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/>',
    gov: '<path d="M3 10h18L12 4z"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
    coin: '<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7"/><path d="M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
    plus: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>',
    pin: '<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>',
    doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h6"/>',
    talk: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
    people: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.5 3-6 6-6s6 2.5 6 6M15 20c0-2.5 1.5-4.5 4-4.5"/>'
  };
  // 받는 곳 묶음: 절은 절, 나머지는 권할 제안서(어르신·동네·조합 나눔 등)
  function who(p) { return p.kind === '절' ? '절' : p.purpose || ''; }
  var WHO_I = { '절': 'temple', '어르신 나눔': 'care', '동네 나눔': 'gov', '조합 나눔': 'coin', '근무자 식사': 'police', '성탄 나눔': 'church', '명절 나눔': 'care', '연말 모임': 'office', '연휴 전 점심': 'office' };
  function kindIc(p) { var k = p.custom ? 'plus' : WHO_I[who(p)] || (p.kind === '절' ? 'temple' : 'heart'); return '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (SVG[k] || SVG.heart) + '</svg>'; }
  function icons(e) {
    var I = e.icons || [['절', 'temple'], ['복지관', 'care'], ['나눔', 'heart']];
    return '<span class="wh">' + I.map(function (x) {
      return '<span class="wi"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (SVG[x[1]] || SVG.heart) + '</svg>' + esc(x[0]) + '</span>';
    }).join('') + '</span>';
  }
  function ST() { var s = (S.data && S.data.store) || S.store || {}; return { s: s.name || '', tel: s.tel || '', bj: !!s.bj }; }
  function evName(e) { return e.name || ''; }
  // 연락할 곳 화면: 그 곳 이름이 표지에 들어간 제안서를 만들어 문자·카톡으로 보냄
  function docSec(p) {
    var ev = E(), DD = window.Docs; if (!DD || ev.mode !== 'store') return '';
    var props = DD.of(ev.id).props; if (!props.length) return '';
    var d = S.doc && S.doc.pid === p.id ? S.doc : (S.doc = { pid: p.id, key: DD.pick(ev.id, p).key, to: p.name, bytes: null, busy: false });
    var cur = props.find(function (x) { return x.key === d.key; }) || props[0], share = DD.canShare();
    return '<section class="step doc" aria-label="제안서 보내기"><h2 class="q">제안서. <span>이 곳 이름을 넣어 바로 보냅니다</span></h2>' +
      '<div class="dabout"><p>' + esc(p.name) + '에 보내는 ' + cur.n + '쪽 소개서예요. 표지에 「' + esc(d.to) + '」와 우리 매장 이름·전화가 들어가요.</p>' + pvStrip(cur, 2) + '</div>' +
      (props.length > 1 ? '<div class="seg" role="group" aria-label="제안서 종류">' + props.map(function (x) {
        return '<button type="button" data-act="dkey" data-k="' + esc(x.key) + '" aria-pressed="' + (x.key === cur.key) + '">' + esc(x.title.replace(' 제안서', '')) + (p.purpose === x.purpose ? ' <i class="rec">권함</i>' : '') + '</button>';
      }).join('') + '</div>' : '') +
      '<label class="f" for="dTo">표지에 들어갈 이름 <span class="small">(고쳐 써도 됩니다)</span><input id="dTo" type="text" maxlength="30" value="' + esc(d.to) + '" autocomplete="off"></label>' +
      (d.bytes ? '<div class="ready"><p><b>준비됐습니다.</b> 표지에 「' + esc(d.to) + '」와 우리 매장 이름·전화가 들어간 ' + esc(cur.title) + '입니다.</p>' +
          '<div class="ctl">' + (share ? '<button class="btn" type="button" data-act="dshare">문자·카톡으로 보내기</button><button class="btn ghost" type="button" data-act="dsave">휴대폰에 저장</button>'
            : '<button class="btn" type="button" data-act="dsave">PDF 저장</button><button class="btn ghost" type="button" data-act="dcopy">같이 보낼 문구 복사</button>') + '</div></div>'
        : '<button class="btn block" type="button" data-act="dmake"' + (d.busy ? ' disabled' : '') + '>' + (d.busy ? (window.HubGen ? '만드는 중입니다…' : '만드는 중이에요 · 처음 한 번만 10초쯤 걸려요') : esc(cur.title) + ' 만들기') + '</button>') +
      (d.busy && !window.HubGen ? '<p class="small wait">글꼴과 바탕 자료를 이 휴대폰에 한 번 받아 두는 중이에요. 다음부터는 바로 만들어져요.</p>' : '') +
      (d.err ? '<p class="err" role="alert">' + esc(d.err) + '</p>' : '') +
      '<details class="msg"><summary>같이 보낼 문구 보기</summary><p class="pre">' + esc(DD.text(ev, ST(), d.to)) + '</p><button class="btn ghost sm" type="button" data-act="dcopy">문구 복사</button></details>' +
      '<p class="small">' + (share ? '보내기를 누르면 휴대폰 공유 창이 열립니다. 문자나 카카오톡을 고르고 받는 사람을 고르세요. ' : '휴대폰에서 열면 문자·카톡으로 바로 보낼 수 있습니다. ') +
      '통화에서 받아 보겠다고 한 곳에만 보내 주세요.</p></section>';
  }
  // ── 제안서·키트가 무엇인지 + 쪽 미리보기(2026-11-18 사용자: 처음 보는 사장님은 모름) ──
  function pvBtn(d, label, i) { return d && d.pv ? '<button class="btn ghost sm" type="button" data-act="pv" data-pv="' + esc(d.pv) + '" data-n="' + d.n + '" data-t="' + esc(d.title) + '" data-i="' + (i || 1) + '">' + (label || '미리보기') + '</button>' : ''; }
  function pvStrip(d, k) {
    if (!d || !d.pv) return '';
    var m = Math.min(k || 3, d.n), h = '';
    for (var i = 1; i <= m; i++) h += '<button type="button" class="pvt" data-act="pv" data-pv="' + esc(d.pv) + '" data-n="' + d.n + '" data-t="' + esc(d.title) + '" data-i="' + i + '" aria-label="' + esc(d.title) + ' ' + i + '쪽 크게 보기"><img src="doc/prev/' + esc(d.pv) + '_' + i + '.jpg" alt="" loading="lazy"></button>';
    return '<div class="pvs">' + h + '<button type="button" class="pvt more" data-act="pv" data-pv="' + esc(d.pv) + '" data-n="' + d.n + '" data-t="' + esc(d.title) + '" data-i="1"><b>' + d.n + '쪽</b><span>전체 보기</span></button></div>';
  }
  function pvView() {
    var v = S.pv; if (!v) return '';
    var imgs = ''; for (var i = 1; i <= v.n; i++) imgs += '<figure id="pv' + i + '"><img src="doc/prev/' + esc(v.id) + '_' + i + '.jpg" alt="' + esc(v.t) + ' ' + i + '쪽" loading="' + (Math.abs(i - v.i) < 3 ? 'eager' : 'lazy') + '"><figcaption>' + i + ' / ' + v.n + '</figcaption></figure>';
    return '<div class="pvv" role="dialog" aria-modal="true" aria-labelledby="pvT"><div class="pvh"><div><b id="pvT">' + esc(v.t) + '</b><span>' + v.n + '쪽 · 예시 화면</span></div><button class="btn sm" type="button" data-act="pvclose">닫기</button></div>' +
      '<p class="pvn">실제로 받으면 우리 매장 이름·전화' + (/제안서/.test(v.t) && !/학교/.test(v.t) ? '와 받는 곳 이름' : '') + '이 들어갑니다. 여기 이름은 예시예요.</p><div class="pvb">' + imgs + '</div></div>';
  }
  // 무엇인지 한 줄 설명
  function aboutProp(n) { return '받는 곳(절·교회·기관 등)에 보내는 ' + (n || 9) + '쪽 소개서예요. 본죽 소개, 메뉴와 값, 주문 방법이 들어 있고, 표지에 받는 곳 이름과 우리 매장 이름·전화가 자동으로 들어가요.'; }
  function aboutKit(k) { return '사장님이 보는 ' + (k && k.n || 11) + '쪽 진행 설명서예요. 맨 앞에 우리 매장 근처 연락할 곳 목록, 그다음 할 일 순서, 전화할 때 읽을 말, 금액표, 문자 보기, 견적·주문서가 있어요. 받는 곳에는 보내지 않아요.'; }
  // 더보기 › 자료 받기
  function docsBox() {
    var ev = E(), DD = window.Docs; if (!DD) return '';
    var o = DD.of(ev.id), h = '';
    if (o.props.length || o.kit) {
      h += '<section class="dintro" aria-label="자료 설명"><h2 class="q">자료는 두 가지예요</h2>';
      if (o.props.length) h += '<div class="dcard"><p class="dk"><span class="dtag out">받는 곳에 보내요</span></p><h3>제안서</h3><p>' + aboutProp(o.props[0].n) + '</p>' +
        '<p class="when"><b>언제 쓰나요?</b> 전화에서 "자료 보내 주세요"라고 하거나 관심 있다고 하면, 그 곳 화면에서 이름을 넣어 문자·카톡으로 보내요.</p>' + pvStrip(o.props[0]) + '</div>';
      if (o.kit) h += '<div class="dcard"><p class="dk"><span class="dtag in">사장님이 봐요</span></p><h3>실행 키트</h3><p>' + aboutKit(o.kit) + '</p>' +
        '<p class="when"><b>언제 쓰나요?</b> 시작하기 전에 한 번 훑어보고, 인쇄해서 매장에 두고 전화할 때 옆에 펴 두세요.</p>' + pvStrip(o.kit) + '</div>';
      h += '</section>';
    }
    var rows = [];
    if (o.kit) rows.push(['dkit', '', o.kit.title, '사장님용 · ' + o.kit.spec, o.kit]);
    o.props.forEach(function (x) { rows.push(['dblank', x.key, '빈 ' + x.title, (x.who ? x.who + '에 · ' : '') + '받는 곳 이름 칸이 비어 있어 손으로 적어 직접 건넬 때', x]); });
    (o.files || []).forEach(function (x) { rows.push(['dfile', x.src, x.title, x.spec, x]); });
    if (!rows.length) return h;
    return h + '<section class="step"><h2 class="q">받기. <span>우리 매장 이름이 들어간 자료</span></h2><ul class="dl">' + rows.map(function (r) {
      var on = S.dbusy === r[0] + r[1];
      return '<li><div><b>' + esc(r[2]) + '</b><span>' + esc(r[3]) + '</span></div><div class="dbt">' + pvBtn(r[4]) + '<button class="btn sm" type="button" data-act="' + r[0] + '" data-k="' + esc(r[1]) + '"' + (S.dbusy ? ' disabled' : '') + '>' + (on ? '만드는 중…' : '받기') + '</button></div></li>';
    }).join('') + '</ul>' + (o.props.length && ev.mode === 'store' ? '<p class="small">특정 곳에 보낼 제안서는 연락할 곳 목록에서 그 곳을 누르면 이름을 넣어 바로 보낼 수 있습니다.</p>' : '') + '</section>';
  }
  // 다음 차례: 다시 연락할 곳 → 아직 연락 안 한 곳(목록 순서, 전화번호 있는 곳 먼저)
  function nextUp(P, again) {
    var todo = P.filter(function (p) { return !p.logs.length; });
    var n = again[0] || todo.filter(function (p) { return p.tel; })[0] || todo[0]; if (!n) return '';
    return '<button class="next" type="button" data-act="open" data-id="' + n.id + '"><span class="k">' + (again[0] ? '다시 연락할 차례' : '다음 차례') + '</span><b>' + esc(n.name) + '</b><span class="m">' + (n.tel ? esc(n.tel) : '전화번호 없음 · 들러 보기') + (n.km != null ? ' · ' + n.km + 'km' : '') + '</span><span class="go">열기</span></button>';
  }
  function mapUrl(p) { var a = String(p.addr || '').split(' ').slice(0, 3).join(' '); return 'https://map.kakao.com/link/search/' + encodeURIComponent((a ? a + ' ' : '') + p.name); }
  function resName(l) { return l.m === '방문' && l.r === 'call' ? '들렀음' : RES[l.r][0]; }
  // 본사 진행 행사: 배정 수량 카드
  function allocCard() {
    var a = S.data && S.data.alloc, sm = S.store && S.store.sm ? '담당 SM ' + esc(S.store.sm) : '담당 SM';
    if (!a) return '<div class="alloc none"><b>아직 배정 전입니다</b><span>본사가 수량을 정하면 여기에 바로 나오고, ' + sm + '이 알려 드립니다.</span></div>';
    return '<div class="alloc"><span class="k">우리 매장 배정</span><b class="q">' + U.won(a.qty) + '<i>인분</i></b>' +
      '<dl>' + (a.day ? '<div><dt>보내는 날</dt><dd>' + U.day(a.day) + '</dd></div>' : '') + (a.note ? '<div><dt>메모</dt><dd>' + esc(a.note) + '</dd></div>' : '') +
      '<div><dt>정한 때</dt><dd>' + U.when(a.updated) + '</dd></div></dl>' +
      (a.confirmed ? '<p class="ok">' + U.when(a.confirmed) + '에 확인했습니다. 수량이 바뀌면 다시 확인을 받습니다.</p>'
        : '<div class="tipw">' + tip(1, '수량과 보내는 날을 보고 <b>확인했습니다</b>를 누르세요') + '<button class="btn block" type="button" data-act="aok"' + (S.busy ? ' disabled' : '') + '>확인했습니다</button></div><p class="small">누르면 ' + sm + ' 화면에 "확인함"으로 보입니다. 수량이 어려우면 누르기 전에 ' + sm + '에게 전화해 주세요.</p>') + '</div>';
  }
  function photo(e) { return /^img\/m_[a-z_]+\.jpg$/.test(e.photo || '') ? e.photo : 'img/bowl.jpg'; }
  function sideInfo() {
    var e = E(), s = sc();
    var wide = window.matchMedia && window.matchMedia('(min-width: 900px)').matches;
    return '<aside class="side" aria-label="행사 안내"><details class="evinfo"' + (wide || S.infoOpen ? ' open' : '') + '><summary>행사 안내 보기 <span>누구에게 · 일정 · 메뉴 · 주의할 점</span></summary><div class="ph">' + icons(e) + '<img src="' + photo(e) + '" alt=""></div>' +
      '<p class="lead">' + esc(e.lead || '') + '</p>' +
      '<div class="facts">' + (e.targets && e.targets.length ? '<div><h3>누구에게</h3><ul>' + e.targets.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' : '') +
      (e.schedule && e.schedule.length ? '<div><h3>일정</h3><ul>' + e.schedule.map(function (t) { return '<li><b>' + esc(t[0]) + '</b>' + esc(t[1]) + '</li>'; }).join('') + '</ul></div>' : '') +
      (e.menu && e.menu.length ? '<div class="fm"><h3>메뉴 (1인분' + (e.side ? ', 절 공양용은 반찬 없이 죽만' : '') + ')</h3><table>' + e.menu.map(function (m) {
        return '<tr><td>' + esc(m[0]) + '</td><td>' + (e.side ? won(m[1] - 1000) : won(m[1])) + '</td></tr>';
      }).join('') + (e.side ? '<tr><td>기본 반찬을 넣으면</td><td>1,000원 더</td></tr>' : '') + '</table></div>' : '') + '</div>' +
      (e.notes && e.notes.length ? '<div class="after"><h3>꼭 알아 두세요</h3><ul>' + e.notes.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' : '') +
      (e.mode === 'store' && s.how ? '<div class="after"><h3>이렇게 적어 주세요</h3><ol>' + s.how.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol></div>' : '') + '</details></aside>';
  }
  function infoSec() {
    var e = E(), s = sc();
    return '<section class="step"><h2 class="q">안내. <span>이번 행사 알아 두기</span></h2><div class="ph">' + icons(e) + '<img src="' + photo(e) + '" alt=""></div>' +
      '<p class="lead">' + esc(e.lead || '') + '</p>' +
      '<div class="facts">' + (e.targets && e.targets.length ? '<div><h3>누구에게</h3><ul>' + e.targets.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' : '') +
      (e.schedule && e.schedule.length ? '<div><h3>일정</h3><ul>' + e.schedule.map(function (t) { return '<li><b>' + esc(t[0]) + '</b>' + esc(t[1]) + '</li>'; }).join('') + '</ul></div>' : '') +
      (e.menu && e.menu.length ? '<div class="fm"><h3>메뉴 (1인분' + (e.side ? ', 절 공양용은 반찬 없이 죽만' : '') + ')</h3><table>' + e.menu.map(function (m) {
        return '<tr><td>' + esc(m[0]) + '</td><td>' + (e.side ? won(m[1] - 1000) : won(m[1])) + '</td></tr>';
      }).join('') + (e.side ? '<tr><td>기본 반찬을 넣으면</td><td>1,000원 더</td></tr>' : '') + '</table></div>' : '') + '</div>' +
      (e.notes && e.notes.length ? '<div class="after"><h3>꼭 알아 두세요</h3><ul>' + e.notes.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' : '') +
      (e.mode === 'store' && s.how ? '<div class="after"><h3>이렇게 적어 주세요</h3><ol>' + s.how.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol></div>' : '') + '</section>';
  }
  var CHV = '<i class="cv" aria-hidden="true">›</i>';
  function mbar() { var t = curTab(); return t === 'more' && S.more ? appbar({ backAct: 'mback', title: S.more === 'docs' ? '제안서·키트 받기' : S.more === 'notice' ? '받은 알림' : '행사 안내' }) : appbar({}); }
  function moreTab() {
    if (S.more === 'docs') return docsBox() || '<p class="small">이 행사에는 받을 자료가 없습니다.</p>';
    if (S.more === 'info') return infoSec();
    if (S.more === 'notice') return ntList();
    return v8More();
    var big = U.store.get(BK) === '1';
    var hasP = window.Docs && window.Docs.of(E().id).props.length;
    return '<section class="menu" aria-label="더보기">' + (hasP ? '<button class="intro1" type="button" data-act="more" data-m="docs"><span class="ic" aria-hidden="true">?</span><span><b>제안서와 키트가 뭔가요?</b><small>처음이시면 1분만 보세요 · 쪽 미리보기</small></span><i aria-hidden="true">›</i></button>' : '') + '<div class="mg">' + ntRow() +
      '<button type="button" data-act="more" data-m="docs"><span><b>자료 받기</b><small>실행 키트 · 빈 제안서</small></span>' + CHV + '</button>' +
      '<button type="button" data-act="more" data-m="info"><span><b>행사 안내</b><small>누구에게 · 일정 · 메뉴 · 주의할 점</small></span>' + CHV + '</button>' +
      (S.evs && S.evs.length > 1 ? '<button type="button" data-act="events"><span><b>다른 행사 보기</b><small>' + S.evs.length + '개 행사</small></span>' + CHV + '</button>' : '') + '</div>' +
      '<div class="mg">' + v7Fs() +
      '<button type="button" data-act="gon"><span><b>사용 안내 다시 보기</b><small>처음 쓰는 분 안내를 다시 봅니다</small></span>' + CHV + '</button></div>' +
      '<div class="mg"><div class="mi"><span><b>' + esc(S.store ? S.store.name : '') + '</b><small>' + (S.store && S.store.sm ? '담당 SM ' + esc(S.store.sm) + ' · 궁금한 점은 담당 SM에게 물어 주세요' : '궁금한 점은 담당 SM에게 물어 주세요') + '</small></span></div>' +
      '<button type="button" data-act="logout"><span><b>로그아웃</b></span></button></div></section>';
  }
  // 오늘 탭 맨 위: 이번 주 칭찬 한 줄 · 단체 매출 · 활동 단계(다른 매장 이름·점수는 보여 주지 않음)
  var LV = [[0, '새싹'], [50, '잎새'], [150, '꽃'], [300, '열매'], [600, '풍년']];
  function weekCard() {
    var w = S.week; if (!w || !w.ok) return '';
    var c = w.week.contacts, line, sub = '';
    if (w.pct != null && w.pct <= 10) line = '이번 주 연락 <b>상위 10%</b>예요. 정말 잘하고 계세요!';
    else if (w.pct != null && w.pct <= 30) line = '이번 주 연락 <b>상위 30%</b>예요. 좋은 흐름이에요.';
    else if (w.pct != null && w.pct <= 50) line = '이번 주 연락 <b>상위 50%</b>예요. 꾸준히 하고 계세요.';
    else if (c > 0) line = '이번 주 <b>' + c + '곳</b>에 연락했어요. 한 걸음씩 가고 있어요.';
    else line = '이번 주 첫 연락을 해 보세요. <b>한 곳</b>이면 시작입니다.';
    var nx = w.pct == null || w.pct > 50 ? w.need.t50 : w.pct > 30 ? w.need.t30 : w.pct > 10 ? w.need.t10 : null;
    if (nx && nx > w.pts) sub = '연락 ' + Math.ceil((nx - w.pts) / 10) + '곳이면 다음 단계(' + (w.pct == null || w.pct > 50 ? '상위 50%' : w.pct > 30 ? '상위 30%' : '상위 10%') + ')에 닿아요.';
    var lv = LV.filter(function (x) { return w.pts_all >= x[0]; }).pop(), nl = LV.find(function (x) { return x[0] > w.pts_all; });
    var lp = nl ? Math.round((w.pts_all - lv[0]) / (nl[0] - lv[0]) * 100) : 100;
    return '<section class="week" aria-label="이번 주"><p class="praise">' + line + '</p>' + (sub ? '<p class="sub">' + sub + '</p>' : '') +
      '<div class="wk"><div><span>우리 매장 단체 매출</span><b>' + won(w.sales.won) + '</b><small>' + U.won(w.sales.qty) + '인분</small></div>' +
      '<div><span>이번 주 연락</span><b>' + c + '<i>곳</i></b><small>관심 ' + w.week.hot + ' · 주문 ' + w.week.orders + '건</small></div></div>' +
      '<div class="lv"><span class="st">' + lv[1] + '</span><span class="bar"><i data-w="' + lp + '"></i></span><small>' + (nl ? nl[1] + '까지 ' + (nl[0] - w.pts_all) + '점' : '가장 높은 단계') + '</small></div>' +
      (w.team ? '<p class="team">' + esc(w.team.name) + ' 매장들이 이번 주 함께 <b>' + w.team.contacts + '곳</b>에 연락했어요' + (w.nation && w.nation.qty ? ' · 전국 단체 주문 <b>' + U.won(w.nation.qty) + '인분</b>' : '') + '</p>'
        : (w.nation && w.nation.qty ? '<p class="team">전국 단체 주문 <b>' + U.won(w.nation.qty) + '인분</b></p>' : '')) + '</section>';
  }
  async function loadWeek() {
    if (!S.token || !S.ev || E().mode !== 'store') { S.week = null; return; }
    var ev = S.ev, r = await U.rpc('owner_week', { p_token: S.token, p_event: ev });
    if (ev !== S.ev) return; S.week = r && r.ok ? r : null; if (S.view === 'home') render();
  }
  // 본사가 미리 해 둔 일(2026-11-21 사용자: 본사가 신경 써 줬다고 느끼게). 첫 연락 전까지, 또는 '알겠어요' 누르기 전까지
  function hqOff() { return U.store.get('bj_owner_hq_' + (E().id || '')) === '1'; }
  function hqCard(P) {
    var mine = P.filter(function (p) { return !p.custom; }), DD = window.Docs, np = DD ? DD.of(E().id).props.length : 0;
    if (hqOff() || P.some(function (p) { return p.logs.length; })) return '';
    var grp = {}; mine.forEach(function (p) { var w = who(p) || String(p.kind || '').split('·')[0]; if (w) grp[w] = (grp[w] || 0) + 1; });
    var gs = Object.keys(grp).slice(0, 4).map(function (k) { return k + ' ' + grp[k]; }).join(' · ');
    var sm = S.store && S.store.sm ? esc(S.store.sm) : '';
    return '<section class="hqc" aria-label="본사가 준비해 둔 것"><p class="k">본사가 ' + (S.store ? esc(S.store.name) + eul(S.store.name) + ' 위해 ' : '') + '준비해 두었어요</p><ul>' +
      (mine.length ? '<li>' + kic('pin') + '<span><b>근처 연락할 곳 ' + mine.length + '곳</b>을 전화번호까지 찾아 두었어요' + (gs ? '<small>' + esc(gs) + '</small>' : '') + '</span></li>'
        : '<li>' + kic('pin') + '<span><b>근처 연락할 곳</b>은 지도에서 찾은 곳이 적었어요<small>' + (sm ? '담당 SM ' + sm + ' 님께 물어보시면 함께 찾아 드려요' : '담당 SM께 물어보시면 함께 찾아 드려요') + '</small></span></li>') +
      (np ? '<li>' + kic('doc') + '<span><b>제안서 ' + np + '종</b>은 받는 곳 이름만 넣으면 완성돼요<small>우리 매장 이름·전화가 자동으로 들어가요</small></span></li>' : '') +
      (mine.length ? '<li>' + kic('talk') + '<span><b>전화 첫마디</b>를 곳마다 적어 두었어요<small>읽기만 하시면 돼요</small></span></li>' : '') +
      '</ul><button class="lnk" type="button" data-act="hqoff">알겠어요, 접기</button></section>';
  }
  function eul(w) { var c = String(w || '').charCodeAt(String(w || '').length - 1) - 0xAC00; return c < 0 || c > 11171 ? '을(를)' : c % 28 ? '을' : '를'; }
  function kic(k) { return '<i class="ki"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + SVG[k] + '</svg></i>'; }
  // ── 오늘 탭(2026-11-18 사용자 선택: 첫 화면 1안 '오늘은 ○○에 전화해 볼까요?' + 4안 오늘 할 일 목록) ──
  var GOAL = Math.max(1, Math.min(10, +C.GOAL || 3));
  function dayOf(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function hm(iso) { var d = new Date(iso); return isNaN(d) ? '' : String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function plan(P) {
    var td = U.today(), done = [], todo = [], seen = {};
    P.forEach(function (p) { var l = p.logs.filter(function (x) { return dayOf(x.at) === td; })[0]; if (l) { done.push({ p: p, l: l }); seen[p.id] = 1; } });
    P.forEach(function (p) { if (needAgain(p) && !seen[p.id]) todo.push({ p: p, k: 'again' }); });
    P.forEach(function (p) { var l = last(p); if (l && l.r === 'hot') todo.push({ p: p, k: 'doc' }); });
    P.filter(function (p) { return !p.logs.length && p.tel; }).concat(P.filter(function (p) { return !p.logs.length && !p.tel; })).forEach(function (p) { todo.push({ p: p, k: 'new' }); });
    return { done: done, todo: todo };
  }
  function telOf(p) { return p.tel ? 'tel:' + esc(p.tel.replace(/[^0-9+]/g, '')) : ''; }
  function km(p) { return p.km != null ? p.km + 'km' : ''; }
  function why(t) { var l = last(t.p); return t.k === 'again' ? (l && l.r === 'away' ? '지난번에 안 받았어요' : '다시 연락하기로 한 날이에요') : t.k === 'doc' ? '관심 있다고 했어요' : word(t.p); }
  function todoTitle(t) { return '<b>' + esc(t.p.name) + '</b>' + (t.k === 'again' ? '에 다시 전화하기' : t.k === 'doc' ? '에 제안서 보내기' : t.p.tel ? '에 전화하기' : '에 들러 보기'); }
  function todoAct(t, big) {
    var cls = big ? 'btn block' : 'btn sm';
    if (t.k === 'doc') return '<button class="' + cls + (big ? '' : ' ghost') + '" type="button" data-act="open" data-id="' + t.p.id + '" data-doc="1">' + (big ? '제안서 보내러 가기' : '보내기') + '</button>';
    if (t.p.tel) return '<a class="' + cls + '" href="' + telOf(t.p) + '" data-act="tcall" data-id="' + t.p.id + '">' + (big ? PH + esc(t.p.name) + '에 전화 걸기' : '전화') + '</a>';
    return '<button class="' + cls + (big ? '' : ' ghost') + '" type="button" data-act="open" data-id="' + t.p.id + '">' + (big ? '어디인지 보기' : '보기') + '</button>';
  }
  var PH = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2"/></svg>';
  function todayView(P) {
    P = P.filter(function (p) { return !p.flag; }); var pl = plan(P), n = pl.done.length, need = Math.max(GOAL - n, 0), dt = {}; pl.done.forEach(function (d) { dt[d.p.id] = 1; });
    // 오늘 '관심'이 된 곳의 제안서 보내기는 목표 개수와 상관없이 늘 할 일에 넣음
    var pend = pl.todo.filter(function (t) { return t.k === 'doc' && dt[t.p.id]; }).concat(pl.todo.filter(function (t) { return !(t.k === 'doc' && dt[t.p.id]); }).slice(0, need)), h0 = pend[0] || pl.todo[0], nm = S.store ? S.store.name : '';
    var e = E(), hero, ey2 = e.deadlineLabel ? '<p class="ey2">' + esc(e.deadlineLabel) + '</p>' : '';
    var tot0 = n + pend.length;
    var sm0 = S.store && S.store.sm ? esc(S.store.sm) + ' 님' : '';
    if (!h0) hero = '<section class="hero1">' + ey2 + '<p class="ey">' + (P.length ? '정말 잘하셨어요' : '아는 곳부터 시작해요') + '</p><h1>' + (P.length ? '목록의 모든 곳에<br>연락했어요' : '단골 손님 모임이나<br>근처 아는 곳을 넣어 보세요') + '</h1>' +
      (P.length ? '' : '<p class="m">지도에서 찾은 곳이 적은 매장이에요. 담당 SM ' + sm0 + '께 물어보시면 함께 찾아 드려요.</p><p class="chips"><span>단골 손님 회사</span><span>근처 경로당</span><span>교회·성당</span><span>동네 모임</span></p>') +
      '<button class="btn block" type="button" data-act="' + (P.length ? 'tab" data-t="list' : 'go" data-v="add') + '">' + (P.length ? '연락할 곳 모두 보기' : '+ 아는 곳 직접 넣기') + '</button></section>';
    else hero = '<section class="hero1">' + ey2 + (pend.length ? '' : '<p class="ey">') + (pend.length ? '' : '오늘 할 일은 끝! 한 곳 더 해 볼까요?') + (pend.length ? '' : '</p>') + '<h1>' + (pend.length ? '사장님, 오늘은<br>' : '') + '<em>' + esc(h0.p.name) + '</em>' + (h0.k === 'doc' ? '에<br>제안서를 보내 볼까요?' : h0.k === 'again' ? '에<br>다시 전화해 볼까요?' : h0.p.tel ? '에<br>전화해 볼까요?' : '에<br>들러 볼까요?') + '</h1>' +
      '<p class="m">' + [km(h0.p) ? '매장에서 ' + km(h0.p) : '', why(h0)].filter(Boolean).map(esc).join(' · ') + '</p>' + todoAct(h0, true) + (h0.k !== 'doc' && h0.p.tel && sayOf(h0.p) ? '<button class="lnk4" type="button" data-act="open" data-id="' + h0.p.id + '">전화하기 전에 첫마디 보기 ›</button>' : '') + '</section>';
    var tot = n + pend.length, r = 26, c = 2 * Math.PI * r, f = tot ? n / tot : 1;
    var ring = '<svg class="ring" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="' + r + '" class="bg"/><circle cx="32" cy="32" r="' + r + '" class="fg" stroke-dasharray="' + (c * f).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 32 32)"/><text x="32" y="37" text-anchor="middle">' + n + '/' + tot + '</text></svg>';
    var rows = pl.done.map(function (d) {
      return '<li class="dn"><span class="cb" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span><button type="button" class="tx" data-act="open" data-id="' + d.p.id + '"><span class="t"><b>' + esc(d.p.name) + '</b>' + (d.l.m === '방문' ? '에 들르기' : '에 연락하기') + '</span><span class="s">' + esc(resName(d.l)) + ' · ' + hm(d.l.at) + '</span></button></li>';
    });
    var rest = pend.filter(function (t) { return t !== h0; });
    if (pend.length && h0) rows.push('<li class="now"><span class="cb" aria-hidden="true"><i></i></span><button type="button" class="tx" data-act="open" data-id="' + h0.p.id + '"' + (h0.k === 'doc' ? ' data-doc="1"' : '') + '><span class="t">' + todoTitle(h0) + '</span><span class="s">' + esc([why(h0), km(h0.p)].filter(Boolean).join(' · ')) + '</span></button><span class="nowt">지금</span></li>');
    if (rest.length) rows.push('<li class="lh" aria-hidden="true">그다음 할 일</li>');
    rows = rows.concat(rest.map(function (t) {
      return '<li><span class="cb" aria-hidden="true"></span><button type="button" class="tx" data-act="open" data-id="' + t.p.id + '"' + (t.k === 'doc' ? ' data-doc="1"' : '') + '><span class="t">' + todoTitle(t) + '</span><span class="s">' + esc([why(t), km(t.p)].filter(Boolean).join(' · ')) + '</span></button>' + todoAct(t) + '</li>';
    }));
    var dn = pl.done.length ? '<li class="dn1"><span class="cb" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span><span class="t">오늘 <b>' + n + '곳</b> 연락했어요 <small>' + pl.done.slice(0, 3).map(function (d) { return esc(d.p.name); }).join(', ') + (n > 3 ? ' 외' : '') + '</small></span></li>' : '';
    var nx3 = rest.slice(0, 3).map(function (t) {
      return '<li><span class="ic" aria-hidden="true">' + kindIc(t.p) + '</span><button type="button" class="tx" data-act="open" data-id="' + t.p.id + '"' + (t.k === 'doc' ? ' data-doc="1"' : '') + '><span class="t">' + todoTitle(t) + '</span><span class="s">' + esc([why(t), km(t.p)].filter(Boolean).join(' · ')) + '</span>' + (FX('mission') ? '<span class="fx-rw">' + rwOf(t) + '</span>' : '') + '</button>' + todoAct(t) + '</li>';
    });
    var list = '<section class="todo t3' + (FX('mission') ? ' fx-msn' : '') + '" aria-label="오늘 할 일">' + (h0 && pend.length ? '<p class="prog"><b>오늘 ' + n + ' / ' + tot0 + '</b><span class="pb"><i data-w="' + Math.round(n / Math.max(tot0, 1) * 100) + '"></i></span></p>' : '') +
      ((dn || nx3.length) ? '<ul>' + dn + (nx3.length ? '<li class="lh" aria-hidden="true">' + (FX('mission') ? '오늘의 미션' : '그다음') + '</li>' + nx3.join('') : '') + '</ul>' : '') + '<button class="lnk2 l" type="button" data-act="tab" data-t="list">연락할 곳 모두 보기 ›</button></section>';
    if (easyOn()) return modeSw() + greet() + easyView(P, pl, h0);
    return v8Today(P, pend, h0, n, hero);
  }
  // 매출 띠(사용자 2026-11-18: 매출이 위에 늘 보이게) — 오늘·연락할 곳 탭 머리줄 바로 아래 고정
  function salesStrip(P) {
    var w = S.week, cw = w && w.ok ? w.week.contacts : weekCount(P), parts = ['이번 주 연락 <b>' + cw + '곳</b>'], sold = w && w.ok ? w.sales.won > 0 : qtyAll() > 0;
    if (w && w.ok && w.pct != null && w.pct <= 50) parts.push('<em>상위 ' + (w.pct <= 10 ? 10 : w.pct <= 30 ? 30 : 50) + '%</em>');
    return '<button class="sstrip s1" type="button" data-act="tab" data-t="sales" aria-label="매출 탭 열기"><span class="l">단체 매출</span><b class="v">' + (sold ? (w && w.ok ? won(w.sales.won) : U.won(qtyAll()) + '인분') : '첫 주문을 기다려요') + '</b><span class="r">' + parts.join(' · ') + '</span><i aria-hidden="true">›</i></button>';
  }
  function qtyAll() { return ((S.data && S.data.orders) || []).reduce(function (a, o) { return a + o.qty; }, 0); }
  function monday() { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; }
  function weekCount(P) { var m = monday(), n = 0; P.forEach(function (p) { if (p.logs.some(function (l) { return new Date(l.at) >= m; })) n++; }); return n; }
  // ── 매출 탭(수정 후): 합계가 맨 위 → 받은 주문 → 연락·관심·주문 흐름 → 이번 주 그래프 → 다음 목표 하나 ──
  var LVI = { '새싹': '🌱', '잎새': '🌿', '꽃': '🌸', '열매': '🍎', '풍년': '🌾' };
  function salesView(P) {
    return v8Sales(P);
    var e = E(), w = S.week && S.week.ok ? S.week : null, O = (S.data && S.data.orders) || [], tg = target();
    var called = P.filter(function (p) { return p.logs.length; }).length, hot = P.filter(function (p) { return p.logs.some(function (l) { return l.r === 'hot' || l.r === 'order'; }); }).length;
    var op = {}; O.forEach(function (o) { op[o.place] = 1; });
    var m = monday(), D = ['월', '화', '수', '목', '금', '토', '일'], cnt = D.map(function () { return {}; });
    P.forEach(function (p) { p.logs.forEach(function (l) { var t = new Date(l.at), i = Math.floor((t - m) / 864e5); if (i >= 0 && i < 7) cnt[i][p.id] = 1; }); });
    var N = cnt.map(function (x) { return Object.keys(x).length; }), mx = Math.max.apply(null, N.concat([1])), ti = (new Date().getDay() + 6) % 7;
    var h = '<section class="tot t2"><p>' + esc(e.name || '') + ' 단체 매출</p><b>' + (w ? won(w.sales.won) : U.won(qtyAll()) + '인분') + '</b><span>' + U.won(qtyAll()) + '인분 · 주문한 곳 ' + Object.keys(op).length + '곳</span></section>' + todayOrders(true);
    h += '<section class="card2 fun" aria-label="지금까지"><h3>지금까지</h3><ol class="fnl">' +
      '<li><b>' + called + '<i>/' + tg + '</i></b><span>연락한 곳</span></li>' +
      '<li><b>' + hot + '</b><span>관심 있음</span></li>' +
      '<li class="on"><b>' + Object.keys(op).length + '</b><span>주문한 곳</span></li></ol></section>';
    h += '<section class="card2"><h3>이번 주 연락 <small>' + N.reduce(function (a, b) { return a + b; }, 0) + '곳</small></h3><div class="bars">' + D.map(function (d, i) {
      return '<div' + (i === ti ? ' class="on"' : '') + '><span class="n">' + (N[i] || '') + '</span><i data-h="' + Math.max(4, Math.round(N[i] / mx * 100)) + '"></i><small>' + d + '</small></div>';
    }).join('') + '</div></section>';
    if (w) {
      var line = w.pct != null && w.pct <= 10 ? '이번 주 <b>상위 10%</b>' : w.pct != null && w.pct <= 30 ? '이번 주 <b>상위 30%</b>' : w.pct != null && w.pct <= 50 ? '이번 주 <b>상위 50%</b>' : w.week.contacts ? '이번 주 <b>' + w.week.contacts + '곳</b>에 연락' : '이번 주 첫 연락을 기다려요';
      var nx = w.pct == null || w.pct > 50 ? w.need.t50 : w.pct > 30 ? w.need.t30 : w.pct > 10 ? w.need.t10 : null;
      var lv = LV.filter(function (x) { return w.pts_all >= x[0]; }).pop(), nl = LV.find(function (x) { return x[0] > w.pts_all; });
      // 목표 카드는 수정 전 그대로(사용자 2026-11-21 '이 부분은 수정 전으로'): 상위 %와 단계 중 더 가까운 것 하나
      var gA = nx && nx > w.pts ? [Math.ceil((nx - w.pts) / 10), w.pct == null || w.pct > 50 ? '상위 50%' : w.pct > 30 ? '상위 30%' : '상위 10%'] : null;
      var gB = nl ? [Math.ceil((nl[0] - w.pts_all) / 10), nl[1] + ' 단계'] : null;
      var g = gA && gB ? (gA[0] <= gB[0] ? gA : gB) : gA || gB;
      h += '<section class="card2 goal"><span class="em" aria-hidden="true">' + LVI[lv[1]] + '</span><div><p>' + line + '</p><span class="gl">' + (g ? '다음 목표 · <b>' + g[0] + '곳</b> 더 연락하면 ' + g[1] : '정말 잘하고 계세요!') + '</span></div><span class="lvb">' + lv[1] + ' 단계</span></section>' + lvCard();
    }
    var tl = []; if (w && w.team) tl.push(esc(w.team.name) + ' 이번 주 연락 ' + U.won(w.team.contacts) + '곳'); if (w && w.nation && w.nation.qty) tl.push('전국 ' + U.won(w.nation.qty) + '인분');
    if (tl.length) h += '<p class="team1">' + tl.join(' · ') + '</p>';
    return h + badgeBox() + '<p class="small">다른 매장 이름이나 점수는 보이지 않습니다. 상위 몇 %인지는 이번 주 우리 매장 연락만으로 계산합니다.</p>';
  }
  // 받은 주문 요약
  function todayOrders(top) {
    var O = ((S.data && S.data.orders) || []).slice(), td = U.today();
    if (!O.length) return top ? '<section class="ord0"><b>받은 주문</b><span>아직 없어요. 주문을 받으면 배달 날짜순으로 여기 맨 위에 모입니다.</span></section>' : '';
    var nm = {}; places().forEach(function (p) { nm[p.id] = p.name; });
    O.sort(function (a, b) { var x = a.day || '9999', y = b.day || '9999'; var ax = x < td ? 1 : 0, by = y < td ? 1 : 0; return ax - by || x.localeCompare(y); });
    function dd(d) { if (!d) return ''; var n = Math.round((new Date(d + 'T00:00:00') - new Date(td + 'T00:00:00')) / 864e5); return n < 0 ? '지남' : n === 0 ? '오늘' : n === 1 ? '내일' : 'D-' + n; }
    return '<section class="ord1"><h2 class="q">받은 주문 <small>' + O.length + '건 · ' + U.won(O.reduce(function (a, o) { return a + o.qty; }, 0)) + '인분</small></h2><ul>' + O.slice(0, 20).map(function (o) {
      var d = dd(o.day);
      return '<li><span class="dd' + (d === '오늘' || d === '내일' ? ' on' : '') + '">' + (d || '날짜 미정') + '</span><span class="t"><b>' + esc(nm[o.place] || '') + '</b><span>' + (o.day ? U.day(o.day) + ' 배달 · ' : '') + esc(o.menu || '') + '</span></span><b class="q2">' + U.won(o.qty) + '인분</b></li>';
    }).join('') + '</ul></section>';
  }
  function sayOf(p) {
    var s = sc(), nm = S.store ? S.store.name : '[매장 이름]', o = s.open || {}, say = o[p.kind || ''] || o[p.purpose || ''] || o[''] || o[Object.keys(o)[0]] || '';
    return say.replace(/\{S\}/g, nm).replace(/\[절 이름\]/g, p.name);
  }
  // 한 곳 화면 맨 위 단계 표시(4안): ① 전화 → ② 결과 → ③ 제안서
  function pstep(p) {
    var l = last(p), cur = l && l.r === 'order' ? 4 : l && l.r === 'hot' ? 3 : S.dialed === p.id ? 2 : 1;
    return '<ol class="pst" aria-label="진행 단계">' + [[p.tel ? '전화' : '들르기', 1], ['결과', 2], ['제안서', 3]].map(function (x, i) {
      var st = x[1] < cur ? 'ok' : x[1] === cur ? 'on' : '';
      return (i ? '<li class="ln' + (x[1] <= cur ? ' ok' : '') + '" aria-hidden="true"></li>' : '') + '<li class="' + st + '"' + (st === 'on' ? ' aria-current="step"' : '') + '><i>' + (st === 'ok' ? '✓' : x[1]) + '</i>' + x[0] + '</li>';
    }).join('') + '</ol>' + (cur === 4 ? '<p class="pdone">주문을 받았어요. 받는 날에 맞춰 준비해 주세요.</p>' : '');
  }
  function tipsBox(p) {
    var s = sc(), b = (s.ask ? '<h3>세 가지만 묻습니다</h3><ol>' + s.ask.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>' : '') +
      (s.close ? '<h3>끊기 전에</h3><ul>' + s.close.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '') +
      '<h3>개인 연락처는 적지 않습니다</h3><p>담당자 휴대폰 번호는 <b>사장님 휴대폰에만</b> 저장하고 메모에는 적지 마세요.</p>' + (s.kit ? '<p>' + esc(s.kit) + '</p>' : '');
    return '<details class="fold tips"><summary>통화 요령 <span>무엇을 묻고, 끊기 전에 무엇을 할지</span></summary><div class="fb">' + b + '</div></details>';
  }
  function histList(p) {
    return '<ul class="hist hist2">' + p.logs.map(function (l) {
      return '<li><span class="tag ' + RES[l.r][1] + '">' + resName(l) + '</span><span>' + esc(l.m) + (l.memo ? ' · ' + esc(l.memo) : '') + (l.back ? ' · 다시 연락할 날 <b>' + U.day(l.back) + '</b>' : '') + '</span>' +
        '<span class="w">' + U.when(l.at) + ' · ' + (S.del === l.id ? '<button class="lnk" type="button" data-act="delYes" data-id="' + l.id + '">정말 지우기</button> · <button class="lnk" type="button" data-act="delNo">그만두기</button>'
          : '<button class="lnk" type="button" data-act="del" data-id="' + l.id + '">잘못 적었으면 지우기</button>') + '</span></li>';
    }).join('') + '</ul>';
  }
  // 결과 창(수정 후): 연락 방법·메모를 결과 버튼 '위'로(누르면 바로 저장이라 아래 칸은 쓸 틈이 없었음), 다섯 결과는 같은 무게
  function sheet(p) {
    if (!S.sheet) return '';
    var ev = E(), menu = ev.menu || [], body, vis = S.method === '방문';
    if (S.sheet === 'next') {
      var nx = S.nx || {}, nxt = plan(places()).todo.filter(function (t) { return t.p.id !== p.id; })[0];
      var lab = nx.r === 'call' && nx.m === '방문' ? '들렀음' : RES[nx.r][0];
      if (nx.first) body = '<div class="okc cel"><span class="cf" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span><span class="okm" aria-hidden="true">✓</span><h2 id="shT">첫 주문 축하해요!</h2><p>' + esc(p.name) + ' ' + U.won(nx.qty || 0) + '인분. 받는 날에 맞춰 준비해 주세요.</p></div>';
      else body = '<div class="okc"><span class="okm" aria-hidden="true">✓</span><h2 id="shT">‘' + lab + '’' + ro(lab) + ' 저장했어요</h2>' + (nx.lid && nx.r !== 'order' ? '<button class="lnk" type="button" data-act="undo">되돌리기</button>' : '') + '</div>';
      if (nx.r === 'hot') {
        body += '<button class="btn block" type="button" data-act="shdoc">' + esc(p.name) + '에 제안서 보내기</button>' +
          (nxt ? '<button class="nxr" type="button" data-act="open" data-id="' + nxt.p.id + '"' + (nxt.k === 'doc' ? ' data-doc="1"' : '') + '><span class="k">다음 할 일</span><span class="t">' + todoTitle(nxt) + '</span><i aria-hidden="true">›</i></button>' : '');
      } else {
        body += nxt ? '<div class="nxc"><span class="k">다음 할 일</span><b>' + todoTitle(nxt) + '</b><small>' + esc([why(nxt), km(nxt.p)].filter(Boolean).join(' · ')) + '</small></div>' + todoAct(nxt, true)
          : '<p class="small">오늘 할 일을 모두 끝냈어요. 정말 잘하셨어요.</p>';
      }
      body += '<button class="btn ghost block" type="button" data-act="shclose">닫기</button>';
    } else if (S.sheet === 'flag') {
      body = '<h2 id="shT">무엇이 달랐나요? <span>' + esc(p.name) + '</span></h2><p class="small">누르면 이 곳은 할 일에서 빠지고, 본사 목록 정리에 쓰여요.</p>' +
        '<div class="fgrid">' + Object.keys(FLAG).map(function (k) { return '<button type="button" data-act="flagset" data-y="' + k + '"' + (S.busy ? ' disabled' : '') + '><b>' + FLAG[k] + '</b></button>'; }).join('') + '</div>' +
        (S.err ? '<p class="err" role="alert">' + S.err + '</p>' : '') + '<button class="btn ghost block" type="button" data-act="shclose">그만두기</button>';
    } else if (S.sheet === 'flagok') {
      body = '<div class="okc"><span class="okm" aria-hidden="true">✓</span><h2 id="shT">알려 주셔서 고마워요</h2></div><p class="small c">본사 목록 정리에 바로 쓰여요. 이 곳은 할 일에서 빼고, 목록 맨 아래 \'알려 주신 곳\'에 두었어요.</p>' +
        '<button class="btn block" type="button" data-act="home2">다음 곳으로</button><button class="btn ghost block" type="button" data-act="shclose">닫기</button>';
    } else if (S.sheet === 'order') {
      body = '<h2 id="shT">주문 적기 <span>' + esc(p.name) + '</span></h2>' +
        '<div class="row2"><label class="f" for="oMenu">메뉴<select id="oMenu">' + menu.map(function (m) {
          return '<option value="' + esc(m[0]) + '"' + (val('oMenu', menu[0] && menu[0][0]) === m[0] ? ' selected' : '') + '>' + esc(m[0]) + ' · ' + (ev.side ? won(m[1]) + ' (죽만 ' + won(m[1] - 1000) + ')' : won(m[1])) + '</option>';
        }).join('') + '</select></label>' +
        '<label class="f" for="oQty">인분<input id="oQty" type="number" inputmode="numeric" min="1" max="5000" value="' + esc(val('oQty')) + '"></label></div>' +
        '<div class="row2"><label class="f" for="oDay">받는 날<input id="oDay" type="date" value="' + esc(val('oDay')) + '"></label>' +
        (ev.side ? '<label class="f" for="oSide">반찬<select id="oSide"><option value="0"' + (val('oSide') !== '1' ? ' selected' : '') + '>없이 죽만' + (p.kind === '절' ? ' (절 공양용)' : '') + '</option><option value="1"' + (val('oSide') === '1' ? ' selected' : '') + '>기본 반찬 포함 (+1,000원)</option></select></label>' : '<span></span>') + '</div>' +
        '<label class="f" for="oMemo">메모 (안 적어도 됩니다)<input id="oMemo" type="text" maxlength="300" placeholder="예: 오전 10시까지, 숟가락 빼고" value="' + esc(val('oMemo')) + '"></label>' +
        (S.err ? '<p class="err" role="alert">' + S.err + '</p>' : '') +
        '<div class="ctl"><button class="btn ghost" type="button" data-act="sheet">뒤로</button><button class="btn" type="button" data-act="saveOrder"' + (S.busy ? ' disabled' : '') + '>주문 저장</button></div>';
    } else {
      var hasMemo = !!(S.form.memo || S.form.back);
      body = '<h2 id="shT">' + (S.sheetCall ? '통화 어떠셨나요?' : vis ? '들러 보니 어떠셨나요?' : '결과를 골라 주세요') + ' <span>' + esc(p.name) + '</span></h2>' +
        '<div class="seg m2" role="group" aria-label="연락 방법">' + ['전화', '방문'].map(function (m) { return '<button type="button" data-act="method" data-m="' + m + '" aria-pressed="' + (S.method === m) + '">' + (m === '전화' ? '전화했어요' : '직접 들렀어요') + '</button>'; }).join('') + '</div>' +
        '<details class="fold memo-f"' + (S.memoOpen ? ' open' : '') + '><summary>메모·다시 연락할 날' + (hasMemo ? ' <em>적음</em>' : '') + ' <span>남길 게 있으면 먼저 적어 주세요</span></summary><div class="fb">' +
        '<label class="f" for="memo">메모<input id="memo" type="text" maxlength="300" placeholder="예: 담당자 다음 주 월요일 출근" value="' + esc(val('memo')) + '"></label>' +
        '<label class="f" for="back">다시 연락할 날<input id="back" type="date" value="' + esc(val('back')) + '"></label></div></details>' +
        '<p class="rhint">결과를 누르면 바로 저장돼요' + (hasMemo ? ' · 적은 메모도 함께 저장' : '') + '</p>' +
        '<div class="rgrid r2">' + [['hot', '관심 있음', '제안서 보내기로'], ['away', vis ? '못 만남' : '안 받음', '다시 연락할 곳에'], ['call', vis ? '만나기만 함' : '통화만 함', '기록만 남겨요'], ['no', '필요 없대요', '목록 아래로']].map(function (x) {
          return '<button type="button" class="r-' + x[0] + '" data-act="rs" data-r="' + x[0] + '"' + (S.busy ? ' disabled' : '') + '><b>' + x[1] + '</b><small>' + x[2] + '</small></button>';
        }).join('') + '<button type="button" class="r-order" data-act="rs" data-r="order"' + (S.busy ? ' disabled' : '') + '><b>주문 받음</b><small>메뉴와 인분 적기</small></button></div>' +
        (S.err ? '<p class="err" role="alert">' + S.err + '</p>' : '') + '<button class="btn ghost block" type="button" data-act="shclose">닫기</button>';
    }
    return '<div class="shdim" data-act="shclose"></div><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="shT"><div class="grab" aria-hidden="true"></div>' + body + '</section>';
  }
  // 되돌리기 알림(UX 제안 3): 저장 직후 5초 동안 '되돌리기'
  var snackT;
  function snack(msg, undo) {
    var el = document.getElementById('snack');
    if (!el) { el = document.createElement('div'); el.id = 'snack'; el.className = 'snack'; el.setAttribute('role', 'status'); el.innerHTML = '<span></span><button type="button">되돌리기</button>'; document.body.appendChild(el); }
    el.querySelector('span').textContent = msg; var bt = el.querySelector('button'); bt.hidden = !undo;
    bt.onclick = async function () { el.hidden = true; if (undo) await undo(); };
    el.hidden = false; clearTimeout(snackT); snackT = setTimeout(function () { el.hidden = true; }, 5000);
  }
  function sideCall(p) {
    var e = E(), s = sc(), say = sayOf(p);
    return '<aside class="side" aria-label="전화할 때"><div class="ph">' + icons(e) + '<img src="' + photo(e) + '" alt=""></div>' +
      (say ? '<div class="after say-side"><h3>전화할 때 이렇게 말하세요' + (p.purpose ? ' · ' + esc(p.purpose) : '') + '</h3><p class="small">' + esc(say) + '</p></div>' : '') +
      (s.ask ? '<div class="after"><h3>세 가지만 묻습니다</h3><ol>' + s.ask.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol></div>' : '') +
      (s.close ? '<div class="after"><h3>끊기 전에</h3><ul>' + s.close.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' : '') +
      '<div class="after"><h3>개인 연락처는 적지 않습니다</h3><p class="small">담당자 휴대폰 번호는 <b>사장님 휴대폰에만</b> 저장하고 메모에는 적지 마세요.</p></div>' +
      (s.kit ? '<p class="small">' + esc(s.kit) + '</p>' : '') + '</aside>';
  }
  var GW = { A: '작년 나눔', B: '큰 절', C: '작은 절' }, FLAG = { tel: '번호가 틀려요', closed: '문을 닫았어요', moved: '다른 곳으로 옮겼어요', dup: '목록에 두 번 있어요' };
  function word(p) { return p.custom ? '직접 추가' : p.grade ? (GW[p.grade] || p.grade) : String(p.kind || '').split('·')[0]; }
  function badge(p) {
    var c = p.custom ? '<span class="g X" aria-hidden="true">+</span>' : p.grade ? '<span class="g ' + p.grade + '" aria-hidden="true">' + p.grade + '</span>' : '<span class="g K" aria-hidden="true">' + esc((p.kind || '·').charAt(0)) + '</span>';
    return '<span class="gb">' + c + '<small>' + esc(word(p)) + '</small></span>';
  }
  function keep() {
    ['memo', 'back', 'oMenu', 'oQty', 'oDay', 'oSide', 'oMemo', 'nName', 'nTel', 'nKind'].forEach(function (id) { var e = U.$(id); if (e) S.form[id] = e.value; });
  }
  function val(id, d) { return S.form[id] != null ? S.form[id] : (d == null ? '' : d); }
  function buy(title, sub, btn) {
    return '<div class="buy"><div class="wrap"><div class="s"><b>' + title + '</b><span>' + sub + '</span></div>' + btn + '</div></div>';
  }
  function evState(e) {
    var td = U.today();
    if (e.mode === 'hq') return ['본사 진행', 't-info'];
    if (e.day && e.day < td) return ['지난 행사', 't-idle'];
    if (e.deadline && e.deadline < td) return ['주문 마감 지남', 't-warn'];
    return ['진행 중', 't-ok'];
  }

  // ── 수정 후(2026-11-18 최종 점검) 공용 조각 ──
  // 받침에 따라 '으로/로'
  function ro(w) { var c = String(w || '').charCodeAt(String(w || '').length - 1) - 0xAC00; if (c < 0 || c > 11171) return '(으)로'; var j = c % 28; return j === 0 || j === 8 ? '로' : '으로'; }
  // 안내 말풍선: 화면을 밀어내지 않고 누를 곳 옆에 겹쳐 띄움
  function tipO(n, text, cls) { var g = gStep(); return g && g[0] === n ? '<div class="tip ov' + (cls ? ' ' + cls : '') + '" role="note"><span>' + text + '</span><button type="button" data-act="goff" aria-label="안내 닫기">×</button></div>' : ''; }
  // 연락할 곳 '전체'는 다시 연락 → 연락 전 → 연락함 묶음으로
  function grp(V) {
    if (S.f !== 'all') return V;
    var L0 = V.filter(function (p) { return !p.flag; });
    var G = [['다시 연락할 곳', L0.filter(needAgain)], ['연락 전', L0.filter(function (p) { return !p.logs.length; })], ['연락함', L0.filter(function (p) { return p.logs.length && !needAgain(p); })], ['알려 주신 곳', V.filter(function (p) { return p.flag; })]], out = [];
    G.forEach(function (g) { if (!g[1].length) return; out.push({ __h: '<li class="lgh' + (g[0] === '다시 연락할 곳' ? ' ag' : g[0] === '알려 주신 곳' ? ' fl' : '') + '">' + g[0] + ' <b>' + g[1].length + '</b></li>' }); out = out.concat(g[1]); });
    return out;
  }
  // 한 곳 화면: 첫마디와 통화 요령을 한 카드로
  function callCard(p, say) {
    return '<section class="say2" aria-label="' + (p.tel ? '전화할 때' : '들를 때') + '"><b>' + (p.tel ? '전화하면 이렇게 시작해요' : '처음에 이렇게 말해 보세요') + '</b><p>“' + esc(say) + '”</p>' +
      tipsBox(p).replace('class="fold tips"', 'class="fold tips in"').replace('통화 요령 <span>무엇을 묻고, 끊기 전에 무엇을 할지</span>', '묻고 확인할 것 <span>끊기 전에 할 일까지</span>') + '</section>';
  }
  // 앱 색(사용자 2026-11-18: 더보기에서 사장님이 고름, 이 휴대폰에만 저장). 비우면 행사 색
  var TK = 'bj_owner_theme';
  var THEMES = [['', '행사 색'], ['#6E0E00', '팥색'], ['#B3261E', '빨강'], ['#B04A12', '주황'], ['#1E6B47', '초록'], ['#1F5FAD', '파랑'], ['#5E3A87', '보라'], ['#3D3A36', '먹색']];
  function myTheme() { var t = U.store.get(TK) || ''; return /^#[0-9a-fA-F]{6}$/.test(t) ? t : ''; }
  function themeRow() {
    var th = myTheme(), ev = E().color || '#6E0E00';
    return '<div class="thm"><span class="thh"><b>앱 색</b><small>버튼과 강조 글자 색 · 이 휴대폰에만 저장돼요</small></span><div class="thg" role="group" aria-label="앱 색 고르기">' + THEMES.map(function (t) {
      return '<button type="button" class="tc" data-act="theme" data-c="' + t[0] + '" data-ec="' + esc(t[0] || ev) + '" aria-pressed="' + (t[0] === th) + '"><i aria-hidden="true"></i>' + t[1] + '</button>';
    }).join('') + '</div></div>';
  }
  // 버튼 글자색: 그 색 위에서 흰 글자가 잘 안 읽히면(어두운 화면에서 밝아진 초록 등) 검은 글자
  function ink(hex) {
    var h = hex.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
    var r = parseInt(h.substr(0, 2), 16) / 255, g = parseInt(h.substr(2, 2), 16) / 255, b = parseInt(h.substr(4, 2), 16) / 255;
    if (DARK && DARK.matches) {
      var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, hh = 0, ss = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
      if (d) hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      hh = ((hh * 60 + 360) % 360) / 360; l = Math.max(l, .5); ss = Math.min(ss, .6);
      var q = l < .5 ? l * (1 + ss) : l + ss - l * ss, p = 2 * l - q, f = function (t) { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
      r = f(hh + 1 / 3); g = f(hh); b = f(hh - 1 / 3);
    }
    var lin = function (c) { return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); }, L = .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b);
    return 1.05 / (L + .05) >= 4.5 ? '#ffffff' : '#161618';
  }
  // ── 받은 알림(2026-11-19 사용자: SM 사이트 알림 기능) ──
  // 담당 SM·팀장·본사가 보낸 알림. 오늘 맨 위 카드 + 더보기 '받은 알림' + '휴대폰 알림 받기'(웹 푸시)
  function ntBusy() { return S.sheet || S.view !== 'home'; }
  function ntLoad(force) {
    if (!S.token) return; var now = Date.now();
    if (!force && S.ntL && now - S.ntL < 60000) return; S.ntL = now;
    U.rpc('owner_notices', { p_token: S.token }).then(function (r) {
      if (r && r.reason === 'auth') return drop('다시 들어와 주세요.');
      if (!r || !r.ok) return;
      var a = JSON.stringify(S.nt && S.nt.items), seen = {}; ((S.nt && S.nt.items) || []).forEach(function (x) { if (x.fresh) seen[x.id] = 1; });
      r.items.forEach(function (x) { if (seen[x.id]) { x.fresh = true; x.read = true; } }); if (Object.keys(seen).length) r.unread = r.items.filter(function (x) { return !x.read; }).length;
      S.nt = r; if (a !== JSON.stringify(r.items) && !ntBusy()) render();
    });
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && S.token && S.view === 'home') ntLoad(true); });
  if (navigator.serviceWorker && navigator.serviceWorker.addEventListener) navigator.serviceWorker.addEventListener('message', function () { if (S.token) ntLoad(true); });
  function ntUnread() { return S.nt && S.nt.items ? S.nt.items.filter(function (x) { return !x.read; }) : []; }
  var BELL = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0"/></svg>';
  function ntCard() {
    ntLoad();
    var L = ntUnread(); if (!L.length) return '';
    var x = L[0];
    return '<section class="ntc" aria-label="받은 알림"><p class="k">' + BELL + '<span>알림 · ' + esc(x.from) + '</span><time>' + esc(U.when(x.at)) + '</time></p>' +
      '<b class="t">' + esc(x.title) + '</b><p class="bd">' + esc(x.body) + '</p>' +
      '<div class="na"><button class="btn sm" type="button" data-act="nread" data-id="' + x.id + '"' + (S.busy ? ' disabled' : '') + '>확인했어요</button>' +
      (L.length > 1 ? '<button class="lnk" type="button" data-act="more" data-tab="more" data-m="notice">안 읽은 알림 ' + (L.length - 1) + '개 더 ›</button>' : '') + '</div></section>';
  }
  function ntRow() {
    ntLoad();
    var n = ntUnread().length;
    return '<button type="button" data-act="more" data-m="notice"><span><b>받은 알림</b><small>' + (n ? '안 읽은 알림 ' + n + '개' : '담당 SM·본사가 보낸 알림 · 휴대폰 알림 켜기') + '</small></span>' + (n ? '<b class="nbm">' + n + '</b>' : '') + CHV + '</button>';
  }
  function ntList() {
    ntLoad();
    var n = S.nt;
    var L = n ? n.items : null;
    return '<section class="step ntl"><h2 class="q">받은 알림. <span>담당 SM·본사가 보낸 알림</span></h2>' + pushBox() +
      (!L ? '<p class="small">불러오는 중입니다.</p>' : (FX('ntfmt') ? '<p class="fx-nh"><b>새 알림 ' + L.filter(function (x) { return x.fresh || !x.read; }).length + '개</b><span>전체 ' + L.length + '개</span></p>' : '') + '<ul class="ntlist">' + (L.map(function (x) {
        return '<li' + (x.fresh || !x.read ? ' class="new"' : '') + '><p class="k">' + (FX('ntfmt') ? '<span class="fx-nk ' + ntKind(x)[1] + '">' + ntKind(x)[0] + '</span>' : '') + '<span>' + esc(x.from) + '</span><time>' + esc(U.when(x.at)) + '</time>' + (x.fresh || !x.read ? (FX('ntfmt') ? '<b class="fx-nN" aria-label="새 알림">N</b>' : '<span class="tag t-info">새 알림</span>') : '') + '</p><b class="t">' + esc(x.title) + '</b><p class="bd">' + esc(x.body) + '</p></li>';
      }).join('') || '<li class="empty">아직 받은 알림이 없습니다.</li>') + '</ul>') +
      '<p class="small">알림은 이 매장 담당 SM, 팀장, 본사만 보낼 수 있습니다. 다른 매장에는 보이지 않습니다.</p></section>';
  }
  // 받은 알림 화면을 열면 모두 읽음으로(이 화면에서는 '새 알림' 표시를 그대로 둠)
  function ntSeen() {
    var L = ntUnread(); if (!L.length) return;
    L.forEach(function (x) { x.read = true; x.fresh = true; }); S.nt.unread = 0;
    U.rpc('owner_notice_read', { p_token: S.token, p_id: null });
  }
  // 휴대폰 알림(웹 푸시)
  function isIOS() { return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
  function standalone() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
  function pushSupport() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return isIOS() && !standalone() ? 'ios' : 'no';
    if (Notification.permission === 'denied') return 'denied';
    return 'ok';
  }
  async function pushCheck() {
    if (S.pchk || pushSupport() !== 'ok') return; S.pchk = 1;
    try { var reg = await navigator.serviceWorker.getRegistration(); var sub = reg && await reg.pushManager.getSubscription(); S.pushOn = !!sub && Notification.permission === 'granted'; } catch (e) { S.pushOn = false; }
    if (S.pushOn && !ntBusy()) render();
  }
  function pushBox() {
    var st = S.nt && !S.nt.vapid ? 'wait' : pushSupport(); pushCheck();
    var sub = st === 'wait' ? '본사 준비가 끝나면 켤 수 있어요' : st === 'ios' ? '아이폰은 먼저 홈 화면에 추가해야 켤 수 있어요' : st === 'no' ? '이 휴대폰(브라우저)에서는 쓸 수 없어요' : st === 'denied' ? '알림이 막혀 있어요. 휴대폰 설정에서 허용해 주세요' : S.pushOn ? '켜짐 · 새 알림이 오면 휴대폰에 바로 떠요' : '새 알림이 오면 휴대폰에 바로 띄워 드려요';
    return '<div class="menu"><div class="mg pushb"><label class="sw" for="swPush"><span><b>휴대폰 알림 받기</b><small>' + sub + '</small></span><input type="checkbox" id="swPush" data-act="pushsw"' + (S.pushOn ? ' checked' : '') + (st !== 'ok' || S.pbusy ? ' disabled' : '') + '><i aria-hidden="true"></i></label>' +
      (st === 'ios' ? '<ol class="ios"><li>사파리 아래쪽 <b>공유</b> 버튼(네모에 위 화살표)을 누르세요.</li><li><b>홈 화면에 추가</b>를 누르세요.</li><li>홈 화면에 생긴 <b>본죽 단체주문</b>으로 열고, 여기에서 다시 켜 주세요.</li></ol>' : '') + '</div></div>';
  }
  function b64u(s) { var p = '='.repeat((4 - s.length % 4) % 4), b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  async function pushOn() {
    var vk = S.nt && S.nt.vapid; if (!vk) { U.toast('지금은 휴대폰 알림을 켤 수 없어요. 잠시 뒤 다시 해 주세요'); return false; }
    try {
      var p = await Notification.requestPermission();
      if (p !== 'granted') { U.toast(p === 'denied' ? '알림이 막혀 있어요. 휴대폰 설정에서 이 사이트 알림을 허용해 주세요' : '알림을 허용해야 켤 수 있어요'); return false; }
      var reg = await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready;
      var sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await Promise.race([reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(vk) }), new Promise(function (_, no) { setTimeout(function () { no(new Error('timeout')); }, 20000); })]);
      var r = await U.rpc('owner_push_sub', { p_token: S.token, p_sub: sub.toJSON() });
      if (!r.ok) { if (r.reason === 'auth') { drop('다시 들어와 주세요.'); return false; } U.toast('켜지 못했습니다. 잠시 뒤 다시 해 주세요'); return false; }
      S.pushOn = true; U.toast('휴대폰 알림을 켰습니다'); return true;
    } catch (e) { U.toast('이 휴대폰에서는 켜지 못했습니다'); return false; }
  }
  async function pushOff(quiet, tok) {
    tok = tok || S.token;
    try {
      var reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); var sub = reg && await reg.pushManager.getSubscription();
      if (sub) { if (tok) await U.rpc('owner_push_unsub', { p_token: tok, p_endpoint: sub.endpoint }); await sub.unsubscribe(); }
    } catch (e) { }
    S.pushOn = false; if (!quiet) U.toast('휴대폰 알림을 껐습니다'); return true;
  }

  // ── 2026-11-23 최종 미리보기: 참고 앱에서 가져온 기능 모음 ──
  // 켜고 끄기: window.OWNER_FX = { 키: false }면 그 기능을 끔(없으면 모두 켬). 사용자 방침: '필요해 보이는 건 다 넣고 빼는 방식'
  function FX(k) { var f = window.OWNER_FX; return !f || f[k] !== false; }
  function eun(w) { var c = String(w || '').charCodeAt(String(w || '').length - 1) - 0xAC00; return c < 0 || c > 11171 ? '은(는)' : c % 28 ? '은' : '는'; }
  function hotP(p) { var l = last(p); return !!l && (l.r === 'hot' || l.r === 'order'); }

  // 1) 쉬운 보기 전환(FC다움 '쉬운/홈')
  function easyOn() { return FX('easy') && U.store.get('bj_owner_easy') === '1'; }
  function modeSw() {
    if (!FX('easy')) return '';
    var on = easyOn();
    return '<div class="fx-msw" role="group" aria-label="화면 보기 방식"><button type="button" data-act="easy" data-v="0" aria-pressed="' + !on + '">기본</button><button type="button" data-act="easy" data-v="1" aria-pressed="' + on + '">쉬운 보기</button></div>';
  }
  // 2) 인사 + 함께한 기간(GS 'WELCOME', 스타벅스 '20XX년부터 멤버')
  function greet() {
    if (!FX('greet')) return '';
    var h = new Date().getHours(), hi = h < 11 ? '좋은 아침이에요' : h < 17 ? '오늘도 고생 많으세요' : '오늘 하루 수고 많으셨어요';
    var s = S.store || {}, y = +(s.since || 0), nm = s.name || '';
    return '<section class="fx-greet"><p class="hi">' + hi + ', <b>' + esc(nm) + ' 사장님</b></p>' +
      (y > 1990 && FX('since') ? '<p class="since"><span class="hrt" aria-hidden="true">♥</span><span>' + esc(nm) + eun(nm) + ' <b>' + y + '년</b>부터 본죽 가족이에요. 늘 고맙습니다.</span></p>' : '') + '</section>';
  }
  // 3) 숫자 타일(리마인더 앱: 오늘·예정·완료)
  function tiles(P) {
    if (!FX('tiles')) return '';
    var td = U.today(), n0 = P.filter(function (p) { return p.logs.some(function (l) { return dayOf(l.at) === td; }); }).length;
    var ag = P.filter(needAgain).length, ht = P.filter(hotP).length;
    var T = [['오늘 연락', n0, 'tab" data-t="list', 'ok'], ['다시 연락', ag, 'fagain', ag ? 'warn' : ''], ['관심·주문', ht, 'fhot', ht ? 'good' : '']];
    return '<section class="fx-tiles" aria-label="한눈에 보기">' + T.map(function (t) {
      return '<button type="button" class="t ' + t[3] + '" data-act="' + t[2] + '"><span class="k">' + t[0] + '</span><b>' + t[1] + '<i>곳</i></b></button>';
    }).join('') + '</section>';
  }
  // 4) 행사 도장 카드(스타벅스 e-프리퀀시: 기간 + 도장)
  function evCard(P) {
    if (!FX('evcard')) return '';
    var e = E(), tg = target(); if (!tg) return '';
    var called = P.filter(function (p) { return p.logs.length; }).length, q = qtyAll(), st = [];
    for (var i = 0; i < tg; i++) st.push('<i' + (i < called ? ' class="on"' : '') + '>' + (i < called ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>' : i + 1) + '</i>');
    return '<section class="fx-ev" aria-label="도장 카드"><div class="h"><b>' + esc(e.name || '') + ' 도장 카드</b><span>' + esc(e.deadlineLabel || e.dateLabel || '') + '</span></div><div class="stamps">' + st.join('') + '</div>' +
      '<p class="s">연락할 때마다 도장 하나 · <b>' + Math.min(called, tg) + '/' + tg + '</b>' + (called >= tg ? ' · 다 모았어요!' : ' · ' + (tg - called) + '개 남았어요') + (q ? ' · 주문 <b>' + U.won(q) + '인분</b>' : '') + '</p></section>';
  }
  // 5) 단계 막대(스타벅스 등급 막대 '조금만 더!') + 표정(당근 매너온도)
  var FACE = ['🙂', '😊', '😄', '🤩', '🥳'];
  function lvCard() {
    if (!FX('levelbar')) return '';
    var w = S.week && S.week.ok ? S.week : null; if (!w) return '';
    var i = LV.filter(function (x) { return w.pts_all >= x[0]; }).length - 1, lv = LV[i], nl = LV[i + 1];
    var lp = nl ? Math.max(3, Math.round((w.pts_all - lv[0]) / (nl[0] - lv[0]) * 100)) : 100, need = nl ? Math.ceil((nl[0] - w.pts_all) / 10) : 0;
    return '<section class="fx-lv" aria-label="우리 매장 단계"><div class="top"><span class="fc" aria-hidden="true">' + (FX('face') ? FACE[i] : LVI[lv[1]]) + '</span><div class="nm"><span class="k">지금 단계</span><b>' + LVI[lv[1]] + ' ' + lv[1] + '</b></div><span class="pt">' + w.pts_all + '<i> / ' + (nl ? nl[0] : w.pts_all) + '점</i></span></div>' +
      '<span class="bar"><i data-w="' + lp + '"></i></span><div class="s5">' + LV.map(function (x, j) { return '<span' + (j <= i ? ' class="on"' : '') + '>' + x[1] + '</span>'; }).join('') + '</div>' +
      '<p class="go">' + (nl ? '조금만 더! <b>' + need + '곳</b> 더 연락하면 <b>' + nl[1] + '</b> 단계에 도전해 볼 수 있어요.' : '가장 높은 단계예요. 정말 대단하세요!') + '</p>' +
      (FX('face') ? '<p class="ev">이번 주 연락 ' + w.week.contacts + '곳 · 관심 ' + w.week.hot + '곳 · 주문 ' + w.week.orders + '건</p>' : '') + '</section>';
  }
  // 6) 오늘의 미션 보상 글(티맵 '오늘의 미션')
  function rwOf(t) { return t.k === 'doc' ? '주문 받으면 +30점' : '연락하면 +10점'; }
  // 7) 쉬운 보기 화면(FC다움 쉬운 홈: 큰 칸)
  function easyView(P, pl, h0) {
    var ag = P.filter(needAgain).length, dc = pl.todo.filter(function (t) { return t.k === 'doc'; }).length, nw = pl.todo.filter(function (t) { return t.k === 'new'; }).length;
    var w = S.week && S.week.ok ? S.week : null, sold = w ? w.sales.won : 0;
    function tile(cls, ic, k, v, act) { return '<button type="button" class="et ' + cls + '" ' + act + '><span class="i" aria-hidden="true">' + ic + '</span><span class="k">' + k + '</span><b>' + v + '</b></button>'; }
    var call = h0 && h0.p.tel && h0.k !== 'doc' ? '<a class="btn block fx-ecall" href="' + telOf(h0.p) + '" data-act="tcall" data-id="' + h0.p.id + '">' + PH + esc(h0.p.name) + '에 전화 걸기</a>' : '';
    return '<section class="fx-easy" aria-label="쉬운 보기"><h1>무엇을 할까요?</h1>' + call + '<div class="eg">' +
      tile('', '📞', '새로 전화할 곳', nw + '곳', 'data-act="tab" data-t="list"') +
      tile(ag ? 'warn' : '', '🔁', '다시 걸 곳', ag + '곳', 'data-act="fagain"') +
      tile(dc ? 'good' : '', '📄', '제안서 보낼 곳', dc + '곳', 'data-act="fhot"') +
      tile('', '💰', '우리 단체 매출', sold ? won(sold) : '아직 없어요', 'data-act="tab" data-t="sales"') +
      tile('', '📚', '자료 받기', '키트·제안서', 'data-act="more" data-tab="more" data-m="docs"') +
      tile('', '🔔', '받은 알림', (ntUnread().length ? '새 알림 ' + ntUnread().length + '개' : '모두 봤어요'), 'data-act="more" data-tab="more" data-m="notice"') +
      '</div><p class="small">기본 화면으로 돌아가려면 위의 <b>기본</b>을 누르세요.</p></section>';
  }
  // 8) 아래 줄 가운데 큰 전화 버튼(우리동네GS 가운데 QR 버튼)
  function centerBtn() {
    if (!FX('center') || E().mode === 'hq' || !S.data) return '';
    var t = plan(live()).todo.filter(function (x) { return x.p.tel && x.k !== 'doc'; })[0];
    return t ? '<a class="fx-cb" href="' + telOf(t.p) + '" data-act="tcall" data-id="' + t.p.id + '" aria-label="' + esc(t.p.name) + '에 전화"><span class="o">' + PH + '</span><span class="l">지금 전화</span></a>'
      : '<button class="fx-cb" type="button" data-act="tab" data-t="list"><span class="o">' + PH + '</span><span class="l">전화</span></button>';
  }
  // 9) 새 기능 말풍선(티맵 '포인트샵이 오픈했어요 ×')
  function newTip() {
    if (!FX('newtip') || !FX('badges') || U.store.get('bj_owner_ntip') === '1' || E().mode === 'hq') return '';
    return '<div class="fx-ntip' + (FX('center') ? ' c5' : '') + '" role="note"><span>새로 생겼어요! <b>내 배지</b>를 모아 보세요</span><button type="button" data-act="ntipx" aria-label="닫기">×</button></div>';
  }
  // 10) 목록 상태 한 줄(네이버지도 '영업 종료 · 09:00에 영업 시작')
  function nextOf(p) {
    var l = last(p);
    if (!l) return p.tel ? '지금 걸어 보기' : '들러 보기';
    if (l.r === 'away') return l.back ? U.day(l.back) + ' 다시 걸기' : '다시 걸어 보기';
    if (l.r === 'hot') return '제안서 보내기';
    if (l.r === 'order') return '배달 준비';
    if (l.r === 'no') return '다음 행사 때';
    return l.back ? U.day(l.back) + ' 다시 연락' : '필요하면 다시 연락';
  }
  // 11) 지도로 보기(당근 동네지도 · 새 디자인 B). 지금 자료에는 좌표가 없어 거리만 실제, 방향은 예시
  function ang(id) { return ((+id * 137.508) % 360) * Math.PI / 180; }
  function mapView(V) {
    var M = V.filter(function (p) { return p.km != null; }), mx = Math.max(5, Math.ceil(Math.max.apply(null, M.map(function (p) { return p.km; }).concat([1]))));
    var pins = M.map(function (p) {
      var r = Math.sqrt(p.km / mx) * 44, a = ang(p.id), x = 50 + r * Math.cos(a), y = 50 + r * Math.sin(a), l = last(p);
      var c = p.flag ? 'off' : !l ? 'todo' : needAgain(p) ? 'again' : (l.r === 'hot' || l.r === 'order') ? 'good' : l.r === 'no' ? 'no' : 'done';
      return '<button type="button" class="pin ' + c + '" data-act="open" data-id="' + p.id + '" data-x="' + x.toFixed(1) + '" data-y="' + y.toFixed(1) + '" aria-label="' + esc(p.name) + ' ' + p.km + 'km"><span class="d" aria-hidden="true">' + kindIc(p) + '</span><span class="n">' + esc(p.name) + '</span></button>';
    }).join('');
    var rings = [1, 3, 5].filter(function (k) { return k <= mx; }).map(function (k) { var r = Math.sqrt(k / mx) * 44; return '<circle cx="50" cy="50" r="' + r.toFixed(1) + '"/><text x="50" y="' + (50 - r + 3).toFixed(1) + '">' + k + 'km</text>'; }).join('');
    return '<div class="fx-map"><svg viewBox="0 0 100 100" aria-hidden="true">' + rings + '</svg><span class="me" data-x="50" data-y="50">우리 매장</span>' + pins + '</div>' +
      '<p class="fx-leg"><span class="todo">연락 전</span><span class="again">다시 연락</span><span class="good">관심·주문</span><span class="done">연락함</span></p>' +
      '<p class="small">거리는 실제와 같고, 방향은 예시예요. 실제 앱에 넣을 때는 주소 좌표를 연결해 방향까지 맞춥니다.</p>';
  }
  function lvSeg() {
    if (!FX('map')) return '';
    var m = S.lv === 'map';
    return '<div class="fx-lvs" role="group" aria-label="보기 방식"><button type="button" data-act="lv" data-v="list" aria-pressed="' + !m + '">목록</button><button type="button" data-act="lv" data-v="map" aria-pressed="' + m + '">지도</button></div>';
  }
  // 12) 배지(캐치테이블 배지 받는 창 · 배지 모음)
  var BADGES = [
    ['first', '📞', '첫걸음', '첫 연락을 한 용기 있는 사장님', function (s) { return [s.called, 1]; }],
    ['hot', '💡', '첫 관심', '관심 있다는 곳을 처음 만든 사장님', function (s) { return [s.hot, 1]; }],
    ['order', '🎉', '첫 주문', '첫 단체 주문을 받은 사장님', function (s) { return [s.orders, 1]; }],
    ['again', '🔁', '끈기왕', '안 받은 곳에 다시 걸어 본 끈기 있는 사장님', function (s) { return [s.again, 3]; }],
    ['days', '🔥', '사흘 연속', '3일 이어서 연락한 꾸준한 사장님', function (s) { return [s.streak, 3]; }],
    ['ten', '🏃', '열 곳 달인', '10곳에 연락한 부지런한 사장님', function (s) { return [s.called, 10]; }],
    ['hund', '🍲', '백 인분', '단체 주문 100인분을 넘긴 사장님', function (s) { return [s.qty, 100]; }]
  ];
  function bStats() {
    var P = places(), D = {}, td = U.today();
    P.forEach(function (p) { p.logs.forEach(function (l) { D[dayOf(l.at)] = 1; }); });
    var k = 0, d = new Date(); if (!D[td]) d.setDate(d.getDate() - 1);
    for (; k < 60; k++) { var s = dayOf(d.toISOString()); if (!D[s]) break; d.setDate(d.getDate() - 1); }
    return { called: P.filter(function (p) { return p.logs.length; }).length, hot: P.filter(function (p) { return p.logs.some(function (l) { return l.r === 'hot' || l.r === 'order'; }); }).length,
      orders: ((S.data && S.data.orders) || []).length, qty: qtyAll(), again: P.filter(function (p) { return p.logs.length > 1 && p.logs.slice(1).some(function (l) { return l.r === 'away'; }); }).length, streak: k };
  }
  function bList() { var s = bStats(); return BADGES.map(function (b) { var v = b[4](s); return { k: b[0], ic: b[1], nm: b[2], d: b[3], n: Math.min(v[0], v[1]), of: v[1], got: v[0] >= v[1] }; }); }
  function coin(b, big) { return '<span class="fx-coin' + (b.got ? '' : ' lock') + (big ? ' big' : '') + '" aria-hidden="true">' + (b.got ? b.ic : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>') + '</span>'; }
  function badgeBox() {
    if (!FX('badges') || E().mode === 'hq' || !S.data) return '';
    var L = bList(), g = L.filter(function (b) { return b.got; }).length;
    return '<section class="fx-bx" id="fxBadges" aria-label="내 배지"><h3>내 배지 <b>' + g + '</b><small>' + L.length + '개 중</small></h3><div class="bg">' + L.map(function (b) {
      return '<button type="button" data-act="bshow" data-k="' + b.k + '">' + coin(b) + '<span class="nm">' + b.nm + '</span><span class="n">' + (b.got ? '받았어요' : b.n + '/' + b.of) + '</span></button>';
    }).join('') + '</div><p class="small">배지는 우리 매장 기록으로만 정해져요. 다른 매장에는 보이지 않아요.</p></section>';
  }
  function bKey() { return 'bj_owner_bseen_' + (E().id || ''); }
  function obOpen() { return typeof S.ob === 'number' && S.ob >= 0; }
  function bCheck() {
    return;
    if (!FX('badges') || !FX('bpop') || !S.data || E().mode === 'hq' || S.bp || S.sheet || S.pv || obOpen() || (S.view !== 'home' && S.view !== 'place')) return;
    var L = bList().filter(function (b) { return b.got; }).map(function (b) { return b.k; }), raw = U.store.get(bKey());
    if (raw == null && !window.OWNER_FX_BDEMO) { U.store.set(bKey(), L.join(',')); return; }
    var seen = String(raw || '').split(','), nw = L.filter(function (k) { return seen.indexOf(k) < 0; });
    if (!nw.length) return; S.bp = nw[nw.length - 1]; U.store.set(bKey(), L.join(','));
  }
  function bpView() {
    if (!S.bp) return '';
    var b = bList().find(function (x) { return x.k === S.bp; }); if (!b) return '';
    var nm = S.store ? S.store.name : '';
    return '<div class="fx-bp" role="dialog" aria-modal="true" aria-label="배지"><div class="cd">' +
      (b.got ? '<p class="k">대단해요, ' + esc(nm) + ' 사장님!</p><h2>' + esc(b.d) + '</h2>' : '<p class="k gr">아직 받지 않은 배지</p><h2>' + esc(b.d) + '</h2>') + coin(b, true) +
      '<p class="nm"><span class="lv">' + (b.got ? '새 배지' : b.n + ' / ' + b.of) + '</span>' + esc(b.nm) + '</p>' +
      (b.got ? '<button class="btn block" type="button" data-act="bmy">내 배지 모두 보기</button>' : '') + '<button class="lnk" type="button" data-act="bx">닫기</button></div></div>';
  }
  // 13) 알림 허락 받기 전 설명(숨고)
  function pushAsk() {
    if (!FX('pushpre') || S.pushOn || U.store.get('bj_owner_pask') === '1' || E().mode === 'hq') return '';
    return '<section class="fx-pa" aria-label="휴대폰 알림"><span class="ill" aria-hidden="true">' + BELL + '</span><h3>휴대폰 알림을 켜고<br><em>중요한 소식</em>을 받아 보세요</h3><p>담당 SM·본사 안내, 행사 마감 소식 등</p>' +
      '<div class="pv" aria-hidden="true"><span>본죽 단체주문 알림</span><i>ON</i></div><button class="btn block" type="button" data-act="paon">알림 받기</button><button class="lnk" type="button" data-act="paoff">나중에 받기</button></section>';
  }
  // 14) 본사 공지 창 + '오늘 하루 보지 않기'(올리브영·캐치테이블)
  function pnPick() {
    if (!FX('popnote') || S.pnDone || S.view !== 'home' || obOpen() || S.bp) return null;
    var td = U.today(), x = ntUnread().filter(function (n) { return /본사/.test(n.from || '') && (n.urgent || /긴급|꼭 확인/.test(n.title || '')) && U.store.get('bj_owner_pn_' + n.id) !== td; })[0];
    return x || null;
  }
  function pnView() {
    var x = pnPick(); if (!x) return '';
    S.pnId = x.id;
    return '<div class="fx-pn" role="dialog" aria-modal="true" aria-label="본사 안내"><div class="cd"><p class="k">' + BELL + '<span>' + esc(x.from) + '</span><time>' + esc(U.when(x.at)) + '</time></p><h2>' + esc(x.title) + '</h2><p class="bd">' + esc(x.body) + '</p>' +
      '<div class="ft"><button type="button" class="lnk" data-act="pnday">오늘 하루 보지 않기</button><button type="button" class="cl" data-act="pnx">닫기</button></div></div></div>';
  }
  // 15) 첫 안내 4장(스마트플레이스: 장마다 좋은 점 하나, 마지막만 '시작하기')
  var OB = [
    ['📍', '본사가 미리 찾아 두었어요', '우리 매장 근처 절·복지관 같은 연락할 곳을 전화번호까지 찾아 두었어요.'],
    ['📞', '전화하고, 결과만 누르세요', '통화가 끝나면 ‘관심 있음’, ‘안 받음’ 같은 버튼 하나만 누르면 기록돼요.'],
    ['📄', '관심 있으면 제안서를 보내요', '받는 곳 이름만 넣으면 우리 매장 이름과 전화가 들어간 제안서가 완성돼요.'],
    ['🌱', '할수록 단계가 올라가요', '연락하고 주문을 받을수록 새싹에서 풍년까지 단계가 올라가요. 매출 탭에서 볼 수 있어요.']
  ];
  function obCheck() { return; if (FX('onboard') && S.ob == null && S.view === 'home' && E().mode !== 'hq' && U.store.get('bj_owner_ob') !== '1') S.ob = 0; }
  function obView() {
    if (!obOpen()) return '';
    var i = S.ob, o = OB[i], end = i === OB.length - 1;
    return '<div class="fx-ob" role="dialog" aria-modal="true" aria-label="처음 쓰는 분 안내"><div class="cd"><button class="sk" type="button" data-act="obskip">건너뛰기</button>' +
      '<span class="art" aria-hidden="true"><span>' + o[0] + '</span></span><p class="n">' + (i + 1) + ' / ' + OB.length + '</p><h2>' + o[1] + '</h2><p class="bd">' + (i === 0 ? obFirst() : o[2]) + '</p>' +
      '<p class="dots" aria-hidden="true">' + OB.map(function (x, j) { return '<i' + (j === i ? ' class="on"' : '') + '></i>'; }).join('') + '</p>' +
      (end ? '<button class="btn block" type="button" data-act="obtour">화면 둘러보기 (30초)</button><button class="lnk obgo" type="button" data-act="obskip">바로 시작하기</button>' : '<button class="btn block" type="button" data-act="obnext">다음</button>') + '</div></div>';
  }
  // 받은 알림 목록 머리(FC다움: 새 알림 수 · 종류 표시)
  function ntKind(x) { return /본사/.test(x.from || '') ? ['본사 안내', 'hq'] : /팀장/.test(x.from || '') ? ['팀장', 'tm'] : ['담당 SM', 'sm']; }

  // ── v7 새 구성(2026-11-23 구성 재검토: 40·50대가 가장 오래 쓰는 앱 기준) ──
  // 뺀 기능: 함께한 기간·쉬운 보기·숫자 칸·도장 카드·표정·가운데 지금 전화
  window.OWNER_FX = window.OWNER_FX || {};
  ['since', 'easy', 'tiles', 'evcard', 'face', 'center', 'newtip', 'map'].forEach(function (k) { window.OWNER_FX[k] = false; });
  document.documentElement.classList.add('v7');
  // 글자 크기 3단계: 0 보통 · 1 크게(처음 값) · 2 아주 크게
  function fsLv() { var v = U.store.get(BK); return v === '0' || v === '2' ? v : '1'; }
  // 오늘 맨 위: 인사 + 다음 단계까지 한 줄(누르면 매출 탭)
  function v7Greet() {
    var h = new Date().getHours(), hi = h < 11 ? '좋은 아침이에요' : h < 17 ? '오늘도 고생 많으세요' : '오늘 하루 수고 많으셨어요';
    var nm = S.store ? S.store.name : '';
    return '<section class="v7g"><p class="hi">' + hi + ',<br><b>' + esc(nm) + ' 사장님</b></p>' + (E().deadlineLabel ? '<p class="dl">' + esc(E().deadlineLabel) + '</p>' : '') + '</section>';
  }
  // 새 소식 한 줄(본사·담당 SM 알림). 창으로 띄우는 건 급한 공지만
  function v7News() {
    ntLoad(); var L = ntUnread(); if (!L.length) return '';
    var x = L[0];
    return '<button type="button" class="v7n" data-act="more" data-tab="more" data-m="notice"><span class="k">' + BELL + '새 소식 <b>' + L.length + '</b></span><span class="t"><b>' + esc(x.title) + '</b><small>' + esc(x.from) + '</small></span><i aria-hidden="true">›</i></button>';
  }
  // 오늘의 미션(티맵): 줄마다 오른쪽 [전화]·[보내기]. 큰 전화 버튼·'그다음 할 일' 묶음을 대신함
  function v7Msn(pend, h0, n) {
    var items = pend.length ? pend : [h0], tot = n + pend.length;
    var rows = items.map(function (t, i) {
      return '<li' + (i === 0 ? ' class="now"' : '') + '><span class="ic" aria-hidden="true">' + kindIc(t.p) + '</span><button type="button" class="tx" data-act="open" data-id="' + t.p.id + '"' + (t.k === 'doc' ? ' data-doc="1"' : '') + '><span class="t">' + todoTitle(t) + '</span><span class="s">' + esc([why(t), km(t.p)].filter(Boolean).join(' · ')) + '</span>' + '</button>' + todoAct(t) + '</li>';
    });
    var dn = n ? '<li class="dn1"><span class="cb" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span><span class="t">오늘 <b>' + n + '곳</b> 연락했어요</span></li>' : '';
    return '<section class="todo t3 fx-msn v7m" aria-label="오늘의 미션"><div class="v7mh"><h2>' + (pend.length ? '오늘의 미션' : '오늘 할 일은 끝! 한 곳 더 해 볼까요?') + '</h2>' + (pend.length ? '<span class="c"><b>' + n + '</b> / ' + tot + '</span>' : '') + '</div>' +
      (pend.length ? '<span class="pb"><i data-w="' + Math.round(n / Math.max(tot, 1) * 100) + '"></i></span>' : '') +
      '<ul>' + dn + rows.join('') + '</ul>' + '<button class="lnk2 l" type="button" data-act="tab" data-t="list">연락할 곳 모두 보기 ›</button></section>';
  }
  // 받은 주문 한 줄
  function v7Ord() {
    var O = (S.data && S.data.orders) || []; if (!O.length) return '';
    return '<button type="button" class="v7n o" data-act="tab" data-t="sales"><span class="k">받은 주문 <b>' + O.length + '</b>건</span><span class="t"><b>모두 ' + U.won(qtyAll()) + '인분</b><small>배달 날짜순으로 보기</small></span><i aria-hidden="true">›</i></button>';
  }
  // 연락할 곳 위: 찾기 칸 + 받는 곳 고르기 + 칩 한 줄(카카오톡 채팅 위 '전체·안읽음'처럼)
  function v7Flt(P, F, purposes) {
    var CH = [['all', '전체'], ['again', '다시 연락'], ['hot', '관심·주문'], ['todo', '연락 전'], ['done', '연락함']], f0 = F[S.f] ? S.f : 'all';
    return '<div class="v7s"><input id="q7" type="search" enterkeyhint="search" placeholder="이름으로 찾기" aria-label="이름으로 찾기" autocomplete="off" value="' + esc(S.q || '') + '">' +
      (purposes.length > 1 ? '<select id="pf7" aria-label="받는 곳 종류">' + [['', '모든 곳']].concat(purposes.map(function (x) { return [x, x]; })).map(function (x) { return '<option value="' + esc(x[0]) + '"' + (S.pf === x[0] ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select>' : '') + '</div>' +
      '<div class="v7c" role="group" aria-label="연락 여부로 보기">' + CH.map(function (x) {
        var cn = P.filter(F[x[0]]).length;
        return '<button type="button" data-act="f" data-f="' + x[0] + '" aria-pressed="' + (f0 === x[0]) + '">' + x[1] + ' <b' + (x[0] === 'again' && cn ? ' class="red"' : '') + '>' + cn + '</b></button>';
      }).join('') + '</div><p id="q7n" class="small" hidden>찾는 이름이 없어요. 아래 「목록에 없는 곳 추가」로 넣을 수 있어요.</p>';
  }
  function qApply() {
    var q = String(S.q || '').replace(/\s/g, ''), n = 0;
    Array.prototype.forEach.call(document.querySelectorAll('.list.l2 li[data-nm]'), function (li) { var hit = !q || li.dataset.nm.replace(/\s/g, '').indexOf(q) >= 0; li.hidden = !hit; if (hit) n++; });
    Array.prototype.forEach.call(document.querySelectorAll('.list.l2 li.lgh'), function (h) { h.hidden = !!q; });
    var m = document.getElementById('q7n'); if (m) m.hidden = !q || n > 0;
  }
  document.addEventListener('input', function (ev) { if (ev.target && ev.target.id === 'q7') { S.q = ev.target.value; qApply(); } });
  document.addEventListener('change', function (ev) { if (ev.target && ev.target.id === 'pf7') { S.pf = ev.target.value; render(); } });
  // 더보기: 글자 크기 3단계
  function v7Fs() {
    var v = fsLv();
    return '<div class="v7fs"><span><b>글자 크기</b><small>지금: ' + (v === '0' ? '보통' : v === '1' ? '크게' : '아주 크게') + '</small></span><div role="group" aria-label="글자 크기">' + [['0', '보통'], ['1', '크게'], ['2', '아주 크게']].map(function (x) {
      return '<button type="button" data-act="fs" data-v="' + x[0] + '" aria-pressed="' + (v === x[0]) + '">' + x[1] + '</button>';
    }).join('') + '</div></div>';
  }
  // ── 처음 쓰는 분 안내(2026-11-23): 환영 창 → 실제 화면 위에서 한 곳씩 밝게 짚어 줌(SM 자료실 3에서 고른 방식) ──
  var TOUR = [
    ['.v7m li.now', '오늘 연락할 곳', '본사가 골라 둔 곳이에요. 오른쪽 <b>[전화]</b>를 누르면 바로 전화가 걸려요.'],
    ['.v7m li.now .btn', '통화가 끝나면', '전화를 끊고 앱으로 돌아오면 결과 고르는 창이 저절로 떠요. <b>관심 있음 · 안 받음</b>처럼 하나만 누르면 끝이에요.'],
    ['.tabbar [data-t=list]', '다른 곳은 여기에', '근처 연락할 곳이 모두 있어요. <b>빨간 숫자</b>는 다시 연락할 곳이에요.'],
    ['.sstrip', '주문이 들어오면', '단체 매출이 여기에 쌓여요. 누르면 우리 매장 단계도 볼 수 있어요.'],
    ['.tabbar [data-t=more]', '더보기', '제안서·키트 받기, 글자 크기, 담당 SM 연락처가 있어요.']
  ];
  // 처음 안내 = 첫 안내 4장(obView) → 마지막 장에서 '화면 둘러보기'를 누르면 실제 화면 짚기(사용자 2026-11-23 '2개 전부 넣기')
  function tourCheck() {}
  function obFirst() { var n = places().filter(function (p) { return !p.custom; }).length; return '우리 매장 근처 절·복지관 같은 연락할 곳' + (n ? ' <b>' + n + '곳</b>' : '') + '을 전화번호까지 찾아 두었어요.'; }
  function tourEnd() { U.store.set('bj_owner_ob', '1'); S.tour = -1; render(); }
  function tourView() {
    if (S.tour == null || S.tour < 0 || S.view !== 'home') return '';
    if (S.tour === 0) {
      var n = places().filter(function (p) { return !p.custom; }).length, np = window.Docs ? window.Docs.of(E().id).props.length : 0;
      return '<div class="v7w" role="dialog" aria-modal="true" aria-label="처음 쓰는 분 안내"><div class="cd"><span class="art" aria-hidden="true">🙌</span><h2>' + esc(S.store ? S.store.name : '') + ' 사장님,<br>반가워요</h2>' +
        '<ul><li><b>근처 연락할 곳 ' + n + '곳</b>을 본사가 전화번호까지 찾아 두었어요</li>' + (np ? '<li><b>제안서</b>는 받는 곳 이름만 넣으면 완성돼요</li>' : '') + '<li>할 일은 <b>전화 → 결과 누르기</b> 두 가지예요</li></ul>' +
        '<button class="btn block" type="button" data-act="tgo">30초 둘러보기</button><button class="lnk" type="button" data-act="tskip">괜찮아요, 바로 시작할게요</button></div></div>';
    }
    var t = TOUR[S.tour - 1], last = S.tour === TOUR.length;
    return '<div class="v7t" role="dialog" aria-modal="true" aria-label="사용 안내 ' + S.tour + ' / ' + TOUR.length + '"><div class="hl" id="v7hl"></div><div class="bb" id="v7bb"><p class="n">' + S.tour + ' / ' + TOUR.length + '</p><h3>' + t[1] + '</h3><p>' + t[2] + '</p>' +
      '<div class="ft"><button class="lnk" type="button" data-act="tskip">그만 보기</button><button class="btn sm" type="button" data-act="tnext">' + (last ? '시작하기' : '다음') + '</button></div></div></div>';
  }
  function tourPos() {
    var hl = document.getElementById('v7hl'), bb = document.getElementById('v7bb'); if (!hl || !bb) return;
    var t = TOUR[S.tour - 1], el = t && document.querySelector(t[0]);
    if (!el) { S.tour = S.tour < TOUR.length ? S.tour + 1 : -1; if (S.tour < 0) U.store.set('bj_owner_ob', '1'); return render(); }
    var fixed = !!el.closest('.tabbar, .abar, .pbar');
    if (!fixed) { var r0 = el.getBoundingClientRect(); if (r0.top < 90 || r0.bottom > window.innerHeight - 230) window.scrollTo({ top: window.scrollY + r0.top - Math.max(110, window.innerHeight * .28), behavior: 'instant' }); }
    // 글자 크기(zoom) 때문에 화면 좌표와 CSS 좌표가 다를 수 있어 직접 재서 맞춤
    hl.style.left = '0px'; hl.style.top = '0px'; hl.style.width = '100px'; hl.style.height = '100px';
    var k = hl.getBoundingClientRect().width / 100 || 1, r = el.getBoundingClientRect(), pd = 6;
    hl.style.left = (r.left / k - pd) + 'px'; hl.style.top = (r.top / k - pd) + 'px'; hl.style.width = (r.width / k + pd * 2) + 'px'; hl.style.height = (r.height / k + pd * 2) + 'px';
    var bh = bb.getBoundingClientRect().height, vh = window.innerHeight, below = r.bottom + 14 + bh < vh - 8;
    bb.style.top = ((below ? r.bottom + 14 : Math.max(8, r.top - 14 - bh)) / k) + 'px';
    bb.className = 'bb ' + (below ? 'dn' : 'up');
  }
  window.addEventListener('resize', function () { if (S.tour > 0) tourPos(); });
  // 한 곳 화면: 결과를 처음 적기 전까지 아래 버튼 위에 짧은 말풍선
  function placeHint() { return U.store.get('bj_owner_t_sheet') === '1' ? '' : '<div class="v7ph" role="note">전화를 걸고, 통화가 끝나면 <b>결과 적기</b>를 누르세요</div>'; }

  // ── v8 한눈에 구성(2026-11-23 사용자 '아직도 한눈에 보기 어렵다 → 원점에서') ──
  // 규칙: ① 탭마다 첫 화면(스크롤 전)에 답이 다 보인다 ② 줄 하나 = 한 가지(이름·상태·버튼) ③ 숫자는 화면마다 3개까지 ④ 카드 안에 카드 없음 ⑤ 늘 보이는 건 머리줄 한 줄(행사·D-day·매출)
  document.documentElement.classList.add('v8');
  function v8Won(n) { n = +n || 0; if (n >= 10000) { var m = n / 10000; return (m >= 100 ? Math.round(m) : Math.round(m * 10) / 10) + '만원'; } return U.won(n) + '원'; }
  function v8Short(e) { return String(e.title || e.name || '').replace(/\s*단체\s*주문$/, ''); }
  // 머리줄 오른쪽 매출(배민사장님 '오늘 매출'처럼 늘 보임, 누르면 매출 탭)
  function v8Pill() {
    if (E().mode !== 'store' || !S.data) return '';
    var w = S.week && S.week.ok ? S.week : null, v = w ? w.sales.won : 0, q = qtyAll();
    return '<button class="v8sp" type="button" data-act="tab" data-t="sales" aria-label="단체 매출 보기"><span>매출</span><b>' + (v ? v8Won(v) : q ? U.won(q) + '인분' : '첫 주문 전') + '</b></button>';
  }
  function v8Cnt(P) {
    var O = (S.data && S.data.orders) || [], op = {}; O.forEach(function (o) { op[o.place] = 1; });
    return { called: P.filter(function (p) { return p.logs.length; }).length, hot: P.filter(hotP).length, ord: Object.keys(op).length, tg: target() };
  }
  // ── 오늘: 인사 한 줄 → 지금까지(숫자 3개) → 오늘 할 일(3줄) → 소식(줄 목록) ──
  function v8Today(P, pend, h0, n, hero) {
    var e = E(), hr = new Date().getHours(), hi = hr < 11 ? '좋은 아침이에요' : hr < 17 ? '오늘도 힘내세요' : '오늘도 수고하셨어요', c = v8Cnt(P);
    var any = P.some(function (p) { return p.logs.length; });
    var head = '<section class="v8h"><p><b>' + esc(S.store ? S.store.name : '') + ' 사장님</b>, ' + hi + '</p>' + (e.deadlineLabel ? '<span>' + esc(e.deadlineLabel) + '</span>' : '') + '</section>';
    var mine = P.filter(function (p) { return !p.custom; }).length, np = window.Docs ? window.Docs.of(e.id).props.length : 0;
    var board = any ? '' : '<section class="v8hq"><span aria-hidden="true">🎁</span><p>본사가 근처 <b>연락할 곳 ' + mine + '곳</b>' + (np ? '과 <b>제안서 ' + np + '종</b>' : '') + '을 준비해 두었어요.</p></section>';
    return head + board + (h0 ? v8Msn(pend, h0, n, !any) : hero) + v8Feed(any);
  }
  function v8Msn(pend, h0, n, first) {
    var items = (pend.length ? pend : [h0]).slice(0, 3), tot = n + pend.length;
    var rows = items.map(function (t, i) {
      return '<li' + (i === 0 ? ' class="cur"' : '') + '><span class="ic" aria-hidden="true">' + kindIc(t.p) + '</span><button type="button" class="tx" data-act="open" data-id="' + t.p.id + '"' + (t.k === 'doc' ? ' data-doc="1"' : '') + '><span class="t">' + todoTitle(t) + '</span><span class="s">' + esc([why(t), km(t.p)].filter(Boolean).join(' · ')) + '</span></button>' + todoAct(t) + '</li>';
    });
    var dn = !pend.length && n ? '<li class="dn"><span class="ok" aria-hidden="true">✓</span><span class="t">오늘 <b>' + n + '곳</b> 연락했어요</span></li>' : '';
    return '<section class="v8m" aria-label="오늘 할 일"><div class="hd"><h2>' + (pend.length ? '오늘 할 일' : '한 곳 더 해 볼까요?') + '</h2>' + (pend.length ? '<span class="c"><b>' + n + '</b> / ' + tot + ' 끝</span>' : '') + '</div>' +
      (first ? '<p class="v8co" role="note"><b>처음이시면 여기부터!</b> 맨 위 줄 <b>[전화]</b>를 누르세요. 통화가 끝나면 결과 하나만 고르면 돼요.</p>' : '') + '<ul>' + dn + rows.join('') + '</ul></section>';
  }
  // 소식: 새 알림·받은 주문·알림 켜기를 같은 줄 모양으로(토스 홈처럼 왼쪽 그림·가운데 글·오른쪽 값)
  function v8Feed(any) {
    ntLoad(); var L = ntUnread(), O = (S.data && S.data.orders) || [], r = [];
    if (L.length) r.push('<button type="button" data-act="more" data-tab="more" data-m="notice"><span class="ic n" aria-hidden="true">' + BELL + '</span><span class="t"><b>' + esc(L[0].title) + '</b><small>' + esc(L[0].from) + '</small></span><span class="v red">' + L.length + '</span></button>');
    if (O.length) r.push('<button type="button" data-act="tab" data-t="sales"><span class="ic o" aria-hidden="true">📦</span><span class="t"><b>받은 주문 ' + O.length + '건</b><small>모두 ' + U.won(qtyAll()) + '인분 · 배달 날짜순 보기</small></span><span class="v">›</span></button>');
    if (any && FX('pushpre') && !S.pushOn && U.store.get('bj_owner_pask') !== '1') r.push('<div class="pa"><span class="ic n" aria-hidden="true">' + BELL + '</span><span class="t"><b>휴대폰 알림 받기</b><small>담당 SM·본사 소식을 바로 받아요</small></span><button class="btn sm" type="button" data-act="paon">켜기</button></div>');
    return r.length ? '<section class="v8f" aria-label="소식"><div class="rows">' + r.join('') + '</div></section>' : '';
  }
  // ── 연락할 곳: 찾기 칸 + 칩 한 줄(받는 곳 고르기 칸은 뺌, 이름 찾기로 충분) ──
  function v8Flt(P, F) {
    var CH = [['all', '전체'], ['again', '다시 연락'], ['todo', '연락 전']], f0 = F[S.f] ? S.f : 'all';
    return '<div class="v7s v8s"><input id="q7" type="search" enterkeyhint="search" placeholder="🔍  이름으로 찾기" aria-label="이름으로 찾기" autocomplete="off" value="' + esc(S.q || '') + '"></div>' +
      '<div class="v7c" role="group" aria-label="연락 여부로 보기">' + CH.map(function (x) {
        var cn = P.filter(F[x[0]]).length; if (!cn && x[0] !== 'all' && f0 !== x[0]) return '';
        return '<button type="button" data-act="f" data-f="' + x[0] + '" aria-pressed="' + (f0 === x[0]) + '">' + x[1] + ' <b' + (x[0] === 'again' && cn ? ' class="red"' : '') + '>' + cn + '</b></button>';
      }).join('') + '</div><p id="q7n" class="small" hidden>찾는 이름이 없어요. 맨 아래 「목록에 없는 곳 추가」로 넣을 수 있어요.</p>';
  }
  // ── 매출: 큰 숫자 하나 → 우리 매장 단계(상위 %·단계·다음 목표를 한 칸에) → 받은 주문 → 배지 한 줄 ──
  function v8Sales(P) {
    var e = E(), w = S.week && S.week.ok ? S.week : null, c = v8Cnt(P);
    var h = '<section class="v8t"><p>' + esc(v8Short(e)) + ' 단체 매출</p><b>' + (w ? won(w.sales.won) : U.won(qtyAll()) + '인분') + '</b><span>' + U.won(qtyAll()) + '인분 · 연락 ' + c.called + '곳 · 관심 ' + c.hot + '곳 · 주문 ' + c.ord + '곳</span></section>';
    if (w) {
      var i = LV.filter(function (x) { return w.pts_all >= x[0]; }).length - 1, lv = LV[i], nl = LV[i + 1];
      var lp = nl ? Math.max(3, Math.round((w.pts_all - lv[0]) / (nl[0] - lv[0]) * 100)) : 100, need = nl ? Math.ceil((nl[0] - w.pts_all) / 10) : 0;
      var pc = w.pct != null && w.pct <= 10 ? 10 : w.pct != null && w.pct <= 30 ? 30 : w.pct != null && w.pct <= 50 ? 50 : 0;
      h += '<section class="v8l" aria-label="우리 매장 단계"><div class="top"><span class="em" aria-hidden="true">' + LVI[lv[1]] + '</span><div><b>' + lv[1] + ' 단계</b><small>' + (pc ? '이번 주 연락 <em>상위 ' + pc + '%</em>' : '이번 주 연락 ' + w.week.contacts + '곳') + '</small></div></div>' +
        '<span class="bar"><i data-w="' + lp + '"></i></span><div class="s5">' + LV.map(function (x, j) { return '<span' + (j <= i ? ' class="on"' : '') + '>' + x[1] + '</span>'; }).join('') + '</div>' +
        '<p class="go">' + (nl ? '<b>' + need + '곳</b> 더 연락하면 <b>' + nl[1] + '</b> 단계예요' : '가장 높은 단계예요. 정말 대단하세요!') + '</p></section>';
    }
    h += todayOrders(true);
    return h + '<p class="small v8nt">다른 매장 이름·점수는 보이지 않아요.</p>';
  }
  // ── 더보기: 토스 '전체'처럼 묶음 2개(이번 행사 · 설정) ──
  function v8More() {
    var hasP = window.Docs && window.Docs.of(E().id).props.length;
    var nu = ntUnread().length;
    return '<section class="menu v8mn" aria-label="더보기">' +
      '<h2 class="mh">이번 행사</h2><div class="mg">' +
      '<button type="button" data-act="more" data-m="notice"><span class="mic" aria-hidden="true">🔔</span><span><b>받은 알림</b><small>' + (nu ? '안 읽은 알림 ' + nu + '개' : '모두 읽었어요') + '</small></span>' + (nu ? '<em class="nb2">' + nu + '</em>' : '') + CHV + '</button>' +
      '<button type="button" data-act="more" data-m="docs"><span class="mic" aria-hidden="true">📄</span><span><b>제안서·키트 받기</b><small>' + (hasP ? '처음이시면 1분 설명부터' : '실행 키트 · 빈 제안서') + '</small></span>' + CHV + '</button>' +
      '<button type="button" data-act="more" data-m="info"><span class="mic" aria-hidden="true">📋</span><span><b>행사 안내</b><small>누구에게 · 일정 · 메뉴</small></span>' + CHV + '</button>' +
      (S.evs && S.evs.length > 1 ? '<button type="button" data-act="events"><span class="mic" aria-hidden="true">🗓️</span><span><b>다른 행사 보기</b><small>' + S.evs.length + '개 행사</small></span>' + CHV + '</button>' : '') + '</div>' +
      '<h2 class="mh">설정</h2><div class="mg">' + v7Fs() +
      (FX('pushpre') && !S.pushOn ? '<button type="button" data-act="paon"><span class="mic" aria-hidden="true">📳</span><span><b>휴대폰 알림 받기</b><small>담당 SM·본사 소식을 바로 받아요</small></span>' + CHV + '</button>' : '') +
      '<button type="button" data-act="gon"><span class="mic" aria-hidden="true">💡</span><span><b>사용 안내 다시 보기</b><small>처음 쓰는 분 안내를 다시 봅니다</small></span>' + CHV + '</button></div>' +
      '<div class="mg"><div class="mi"><span class="mic" aria-hidden="true">🏠</span><span><b>' + esc(S.store ? S.store.name : '') + '</b><small>' + (S.store && S.store.sm ? '담당 SM ' + esc(S.store.sm) + ' · 궁금한 점은 담당 SM에게' : '궁금한 점은 담당 SM에게 물어 주세요') + '</small></span></div>' +
      '<button type="button" data-act="logout"><span><b>로그아웃</b></span></button></div></section>';
  }
  // 처음 안내: 실제 사이트에 들어간 사진 안내 창(guide.js FirstGuide)과 같은 창. 예전 첫 안내 4장·화면 짚기는 뺌(사용자 2026-11-23 '가이드 확실히, 훨씬 쉽게')
  function v8Guide() {
    if (S.view !== 'home' || !S.data || E().mode === 'hq' || !window.FirstGuide) return;
    if (window.OWNER_FX_PREVIEW) { if (/[?&]ob=1/.test(location.search) && !S.fgOnce) { S.fgOnce = 1; FirstGuide.open('owner', 'bj_owner_guide3'); } return; }
    FirstGuide.maybe('owner', 'bj_owner_guide3');
  }

  // ── 화면 ──
  function render() {
    var h = ''; S._tp = 0; obCheck(); bCheck(); tourCheck();
    if (!U.ready()) {
      h = top() + '<div class="wrap split one-col"><div class="steps"><h2 class="q">설치. <span>아직 끝나지 않았습니다</span></h2><p class="small">config.js 파일에 서버 주소와 공개용 키를 넣어야 합니다. 설치안내.txt 를 봐 주세요.</p></div></div>';
    } else if (S.view === 'boot') {
      h = top() + band() + '<div class="wrap split one-col"><p class="small">불러오는 중입니다.</p></div>';
    } else if (S.view === 'login') {
      h = top() + '<div class="wrap split one-col"><div class="steps"><form class="step login1" id="lf" novalidate>' +
        '<h2 class="q">확인. <span>우리 매장이 맞나요?</span></h2><p class="small">세 가지가 모두 맞아야 들어갑니다. 우리 매장의 연락할 곳과 기록만 보입니다.</p>' +
        '<label class="f" for="iCode">가맹점코드<span class="hint h2">포스 화면 오른쪽 위에 있습니다</span><input id="iCode" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false"></label>' +
        '<label class="f" for="iBiz">사업자번호 (숫자 10자리)<input id="iBiz" type="text" inputmode="numeric" autocomplete="off" placeholder="000-00-00000"></label>' +
        '<label class="f" for="iTel">사장님 휴대폰 뒷자리 4자리<input id="iTel" type="tel" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="0000"></label>' +
        (S.err ? '<p class="err" role="alert">' + S.err + '</p>' : '') +
        '<button class="btn block" type="submit"' + (S.busy ? ' disabled' : '') + '>' + (S.busy ? '확인하는 중' : '들어가기') + '</button>' +
        '<p class="small">한 번 들어오면 이 휴대폰에서는 1년 동안 다시 넣지 않아도 됩니다. 5번 틀리면 30분 동안 잠기니, 모르시면 담당 SM에게 물어 주세요.</p></form></div></div>';
    } else if (S.view === 'consent') {
      h = top() + '<div class="wrap split one-col"><div class="steps"><section class="step">' +
        '<h2 class="q">처음 한 번. <span>확인해 주세요</span></h2><p class="small">' + esc(S.name) + ' 사장님으로 확인되었습니다.</p>' +
        '<div class="facts"><div><h3>모으는 내용</h3><ul><li>연락한 날짜와 결과</li><li>사장님이 적은 메모</li><li>주문 메뉴와 인분</li></ul></div>' +
        '<div><h3>쓰는 곳</h3><ul><li>담당 SM이 필요한 자료와 도움을 제때 드리는 데 씁니다</li><li>본사가 행사 결과를 모아 다음 행사 자료(연락할 곳·제안서)를 더 잘 만드는 데 씁니다</li></ul></div>' +
        '<div class="fm"><h3>보관 기간</h3><ul><li>' + esc(C.RETENTION || '') + '</li></ul></div></div>' +
        '<label class="ck" for="agree"><input type="checkbox" id="agree"><span>위 내용을 확인했고 동의합니다. 상대 담당자의 휴대폰 번호 같은 개인 연락처는 메모에 적지 않겠습니다.</span></label>' +
        '<button class="btn block" type="button" data-act="consent" id="agreeGo" disabled>동의하고 시작</button></section></div></div>';
    } else if (S.view === 'events') {
      // 행사 고르기(UX 3차): 머리줄은 다른 화면과 같게, 카드는 이름 · 날짜 · 진행 막대 세 줄, 본사 진행·지난 행사는 아래에 따로
      var td = U.today();
      var EV = (S.evs || []).slice().sort(function (a, b) { return String(a.day || '').localeCompare(String(b.day || '')); });
      var past = function (e) { return e.day && e.day < td; };
      var G = [['진행 중', EV.filter(function (e) { return e.mode !== 'hq' && !past(e); })], ['본사가 진행하는 행사', EV.filter(function (e) { return e.mode === 'hq' && !past(e); })], ['지난 행사', EV.filter(past)]];
      var card = function (e) {
        var tg = Math.min(e.places || 0, C.TARGET || 10), pc = tg ? Math.min(100, Math.round((e.contacted || 0) / tg * 100)) : 0, hq = e.mode === 'hq';
        var c = '<button class="card c3' + (past(e) ? ' past' : '') + (hq ? ' hq' : '') + '" type="button" data-act="ev" data-id="' + esc(e.id) + '" data-ec="' + esc(e.color || '#6E0E00') + '">' +
          '<span class="ph who5">' + icons(e) + '<img src="' + photo(e) + '" alt="" loading="lazy"><span class="dd">' + U.dday(e.day, e.name) + '</span></span>' +
          '<h3>' + esc(e.title || e.name) + '</h3>' +
          '<span class="k">' + esc(e.deadlineLabel || e.dateLabel || U.day(e.day)) + '</span>' +
          (hq ? '<span class="m">본사가 영업해요 · 우리 매장은 배정 수량만 확인</span>' : '<span class="m3"><span class="bar2"><i data-w="' + pc + '"></i></span><span>연락 <b>' + (e.contacted || 0) + '/' + tg + '</b> · 주문 <b>' + U.won(e.qty) + '</b>인분</span></span>') + '</button>';
        return c;
      };
      h = appbar({ plain: true, title: '행사 고르기' }) + '<main class="wrap evs"><section class="hero"><h1>어떤 단체주문을 준비할까요?</h1>' +
        '<p class="fnote">' + (S.store ? esc(S.store.name) + ' · ' : '') + '행사마다 연락할 곳과 기록이 따로 모입니다.</p></section>' +
        G.filter(function (g) { return g[1].length; }).map(function (g) {
          return '<section class="shelf"><h2 class="gh">' + g[0] + ' <small>' + g[1].length + '</small></h2>' + (g[0] === '진행 중' ? tipO(0, '진행 중인 행사를 누르세요', 'dn') : '') + '<div class="grid">' + g[1].map(card).join('') + '</div></section>';
        }).join('') + (EV.length ? '' : '<p class="small">지금 열린 행사가 없습니다.</p>') +
        '<p class="evfoot">' + (S.store ? esc(S.store.name) + ' · ' : '') + '<button class="lnk" type="button" data-act="logout">로그아웃</button></p></main>';
    } else if (S.view === 'home' && E().mode === 'hq') {
      var ht = curTab();
      h = mbar() + '<div class="wrap split one-col tabbed"><div class="steps">' + (ht === 'today' ? gPill() : '') +
        (ht === 'more' ? moreTab() : ntCard() +
          '<section class="step">' + (E().dateLabel ? '<p class="ey2">' + esc(E().dateLabel) + '</p>' : '') + '<h2 class="q">배정. <span>본사가 우리 매장에 맡긴 수량</span></h2>' + allocCard() +
          '<p class="box">이번 행사는 본사가 직접 영업합니다. 사장님이 따로 전화하실 곳은 없습니다. 손님이 매장으로 주문을 물어보면 담당 SM' + (S.store && S.store.sm ? ' ' + esc(S.store.sm) : '') + '에게 연결해 주세요.</p></section>') +
        '</div></div>' + tabbar();
    } else if (S.view === 'home') {
      var e = E(), P = places(), tg = target();
      var called = P.filter(function (p) { return p.logs.length; }).length;
      var hot = P.filter(function (p) { return p.logs.some(function (l) { return l.r === 'hot' || l.r === 'order'; }); }).length;
      var qty = S.data.orders.reduce(function (a, o) { return a + o.qty; }, 0);
      var again = P.filter(needAgain);
      var pct = tg ? Math.min(100, Math.round(called / tg * 10) * 10) : 0;
      var F = { all: function () { return true; }, hot: hotP, todo: function (p) { return !p.flag && !p.logs.length; }, again: needAgain, done: function (p) { return !p.flag && p.logs.length && !needAgain(p); } };
      var purposes = []; P.forEach(function (p) { var w = who(p); if (w && purposes.indexOf(w) < 0) purposes.push(w); });
      S.pf = '';
      var V = P.filter(function (p) { return (F[S.f] || F.all)(p) && (!S.pf || who(p) === S.pf); });
      var gl = sc().gradeLegend;
      var tb = curTab();
      h = mbar() + '<div class="wrap split one-col tabbed"><div class="steps' + (tb === 'today' ? ' today' : '') + '">' + (tb === 'list' ? gPill() : '') + (tb === 'more' ? moreTab() : tb === 'today' ? todayView(P) : tb === 'sales' ? salesView(P) :
        '<section class="step"><h2 class="q">연락할 곳. <span>어디부터 연락할까요?</span><small>' + P.length + '곳</small></h2>' +
        v8Flt(P, F) +
        
        lvSeg() + (FX('map') && S.lv === 'map' ? mapView(V) : '<ul class="list l2">' + (grp(V).map(function (p) {
          if (p.__h) return p.__h; var tp = S._tp ? '' : (S._tp = 1, tipO(1, '연락할 곳을 누르세요', S.f === 'all' ? 'up' : ''));
          var l = last(p), r = p.flag ? [FLAG[p.flag] || '알려 줌', 't-idle'] : l ? [resName(l), RES[l.r][1]] : ['연락 전', 't-idle'];
          var sub = [p.custom ? '직접 추가 · ' + p.kind : word(p), p.km != null ? p.km + 'km' : '', p.tel ? '' : '전화번호 없음'].filter(Boolean).join(' · ');
          return '<li data-nm="' + esc(p.name) + '" class="row2 ri' + (needAgain(p) ? ' ag' : '') + (p.flag ? ' fl' : '') + '"><span class="ic" aria-hidden="true">' + kindIc(p) + '</span><button type="button" class="tx" data-act="open" data-id="' + p.id + '"><span class="nm">' + esc(p.name) + '</span><span class="rg"><span class="st tag ' + r[1] + '">' + r[0] + (FX('stline') && !p.flag ? '<span class="nx"> · ' + esc(nextOf(p)) + '</span>' : '') + '</span><span class="sb">' + esc(sub) + '</span></span></button>' +
            (p.tel ? '<a class="btn sm" href="' + telOf(p) + '" data-act="tcall" data-id="' + p.id + '" aria-label="' + esc(p.name) + '에 전화">' + PH + '전화</a>' : FX('nogrey') ? '<span class="btn sm fx-off" aria-disabled="true">' + PH + '번호 없음</span>' : '<button class="btn sm ghost" type="button" data-act="open" data-id="' + p.id + '">보기</button>') + tp + '</li>';
        }).join('') || '<li class="empty">' + (P.length ? '여기에 해당하는 곳이 없습니다.' : '지도에서 찾은 곳이 적은 매장이에요. 아는 곳을 아래에서 넣어 주세요. 담당 SM' + (S.store && S.store.sm ? ' ' + esc(S.store.sm) + ' 님' : '') + '께 물어보시면 함께 찾아 드려요.') + '</li>') + '</ul>') +
        '<button class="addrow' + (P.length ? '' : ' big') + '" type="button" data-act="go" data-v="add">+ ' + (P.length ? '목록에 없는 곳 추가' : '아는 곳 직접 넣기') + '</button>' +
        '</section>') + '</div></div>' + tabbar();
    } else if (S.view === 'add') {
      var kinds = sc().kinds || ['그 밖'];
      h = appbar({ back: 'home', title: '연락할 곳 추가' }) + '<div class="wrap split one-col tabbed"><div class="steps"><form class="step" id="af" novalidate>' +
        '<h2 class="q">추가. <span>어디를 추가할까요?</span></h2><p class="small">목록에 없지만 ' + esc(E().name || '') + ' 단체주문을 권해 볼 만한 곳을 적어 주세요.</p>' +
        '<label class="f" for="nName">이름<input id="nName" type="text" maxlength="40" value="' + esc(val('nName')) + '"></label>' +
        '<label class="f" for="nKind">종류<select id="nKind">' + kinds.map(function (k) { return '<option' + (val('nKind') === k ? ' selected' : '') + '>' + esc(k) + '</option>'; }).join('') + '</select></label>' +
        '<label class="f" for="nTel">대표 전화 (모르면 비워 두세요)<input id="nTel" type="tel" inputmode="tel" maxlength="20" value="' + esc(val('nTel')) + '"></label>' +
        (S.err ? '<p class="err" role="alert">' + S.err + '</p>' : '') +
        '<div class="ctl"><button class="btn ghost" type="button" data-act="go" data-v="home">그만두기</button><button class="btn" type="submit"' + (S.busy ? ' disabled' : '') + '>추가</button></div></form></div></div>';
    } else if (S.view === 'place') {
      // 한 곳 화면(UX 제안 3): 한 화면 안에 이름·첫마디, 맨 아래 고정 [결과 적기][전화 걸기], 결과는 아래에서 올라오는 창
      var p = places().find(function (x) { return x.id === S.pid; });
      if (!p) { S.view = 'home'; S.sheet = null; return render(); }
      var GL = {}; (sc().gradeLegend || []).forEach(function (g) { GL[g[0]] = g[1]; });
      var lab = p.custom ? '직접 추가한 곳 · ' + p.kind : (String(p.kind || '').split('·')[0] || '연락할 곳') + (p.purpose ? ' · 권할 제안서: ' + p.purpose : '');
      var lp = last(p), hotNow = lp && (lp.r === 'hot' || lp.r === 'order'), say = sayOf(p);
      h = appbar({ back: 'home', title: '연락할 곳' }) + '<div class="wrap split one-col tabbed place"><div class="steps">' + pstep(p) +
        '<section class="ph1" aria-label="고른 곳"><p class="eb">' + esc(lab) + '</p><h1 tabindex="-1" id="pName">' + esc(p.name) + '</h1>' +
        '<p class="meta">' + [p.tel ? esc(p.tel) : '전화번호 없음', p.km != null ? '매장에서 ' + p.km + 'km' : ''].filter(Boolean).join(' · ') + '</p><p class="meta">' + (p.addr ? esc(p.addr) + ' ' : '') + '<a class="lnk3 mapc" href="' + mapUrl(p) + '" target="_blank" rel="noopener noreferrer">지도</a></p>' +
        (p.note ? '<p class="meta">참고: ' + esc(p.note) + '</p>' : '') +
        (lp ? '<button class="lastr" type="button" data-act="hist" aria-expanded="' + (S.hOpen === p.id) + '"><span>마지막 기록</span><span class="tag ' + RES[lp.r][1] + '">' + resName(lp) + '</span><span>' + U.when(lp.at) + '</span><span class="lk">기록 ' + p.logs.length + '건 ' + (S.hOpen === p.id ? '접기' : '보기') + '</span></button>' + (S.hOpen === p.id ? histList(p) : '') : '') + '</section>' +
        (say && !hotNow ? callCard(p, say) : '') +
        (hotNow ? docSec(p) : docSec(p) ? '<details class="docfold"' + (S.docOpen === p.id ? ' open' : '') + '><summary>제안서 보내기 <span>이 곳에 보내는 소개서 · 미리보기</span></summary>' + docSec(p) + '</details>' : '') +
        (say && !hotNow ? '' : tipsBox(p)) + (p.custom ? '' : p.flag ? '<p class="flg on">' + esc(FLAG[p.flag] || '알려 주신 곳') + '으로 본사에 알려 주셨어요. <button class="lnk" type="button" data-act="flagx">다시 목록에 넣기</button></p>'
          : '<button class="flg" type="button" data-act="flag">번호가 틀렸거나 문을 닫았나요? <b>본사에 알려 주기</b></button>') + '</div></div>' +
        '<div class="pbar"><div class="wrap">' + placeHint() + (p.tel ? '<button class="btn ghost" type="button" data-act="sheet">결과 적기</button><a class="btn" data-act="tel" href="' + telOf(p) + '">' + PH + '전화 걸기</a>'
          : '<a class="btn ghost" href="' + mapUrl(p) + '" target="_blank" rel="noopener noreferrer">지도에서 보기</a><button class="btn" type="button" data-act="sheet">결과 적기</button>') + '</div></div>' + sheet(p);
    }
    app.innerHTML = h + pvView() + obView() + tourView() + (obOpen() || S.tour >= 0 ? '' : bpView() + pnView());
    // 행사 색 띠(보안 설정상 style 속성 대신 여기서 넣음)
    Array.prototype.forEach.call(app.querySelectorAll('[data-ec]'), function (el) { if (/^#[0-9a-fA-F]{3,8}$/.test(el.dataset.ec)) el.style.setProperty('--ec', tone(el.dataset.ec)); });
    Array.prototype.forEach.call(app.querySelectorAll('[data-w]'), function (el) { el.style.width = (+el.dataset.w || 0) + '%'; });
    Array.prototype.forEach.call(app.querySelectorAll('[data-h]'), function (el) { el.style.height = (+el.dataset.h || 0) + '%'; });
    qApply(); if (S.tour > 0) tourPos(); v8Guide();
    var pc8 = app.querySelector('.v7c [aria-pressed=true]'); if (pc8 && pc8.offsetLeft > pc8.parentNode.clientWidth - pc8.offsetWidth - 16) pc8.parentNode.scrollLeft = pc8.offsetLeft - 16;
    Array.prototype.forEach.call(app.querySelectorAll('[data-x]'), function (el) { el.style.left = (+el.dataset.x || 0) + '%'; el.style.top = (+el.dataset.y || 0) + '%'; });
    var ec = myTheme() || (S.view !== 'events' ? E().color : ''); if (/^#[0-9a-fA-F]{3,8}$/.test(ec || '')) { document.documentElement.style.setProperty('--ec', tone(ec)); document.documentElement.style.setProperty('--on', ink(ec)); } else { document.documentElement.style.removeProperty('--ec'); document.documentElement.style.removeProperty('--on'); }
    var a = U.$('agree'); if (a) a.addEventListener('change', function () { U.$('agreeGo').disabled = !a.checked; });
    var lf = U.$('lf'); if (lf) lf.addEventListener('submit', login);
    var af = U.$('af'); if (af) af.addEventListener('submit', addPlace);
    Array.prototype.forEach.call(app.querySelectorAll('details.hist-f'), function (d) { d.addEventListener('toggle', function () { S.hOpen = d.open ? S.pid : null; }); });
    Array.prototype.forEach.call(app.querySelectorAll('details.memo-f'), function (d) { d.addEventListener('toggle', function () { S.memoOpen = d.open; }); });
    var shd = app.querySelector('.sheet, .pvv, .fx-ob, .fx-bp, .fx-pn, .v7w'); document.body.classList.toggle('shopen', !!shd);
    Array.prototype.forEach.call(app.querySelectorAll('details.docfold'), function (d) { d.addEventListener('toggle', function () { S.docOpen = d.open ? S.pid : null; if (d.open && window.Docs && window.Docs.warm) window.Docs.warm(); }); });
    if (app.querySelector('.step.doc') && window.Docs && window.Docs.warm) setTimeout(window.Docs.warm, 600); // 제안서 칸이 보이면 글꼴을 미리 받아 둠
    Array.prototype.forEach.call(app.querySelectorAll('details.evinfo'), function (d) { d.addEventListener('toggle', function () { S.infoOpen = d.open; }); });
    var dt = U.$('dTo'); if (dt) {
      // 한글 조합 중에는 다시 그리지 않음(낱자로 갈라짐). 조합이 끝나면 그때 '다시 만들기'로 바꿈.
      var redo = function () { if (!S.doc || !S.doc.bytes) return; S.doc.bytes = null; keep(); var at = dt.selectionStart; render(); var n = U.$('dTo'); if (n) { n.focus(); try { n.setSelectionRange(at, at); } catch (e) { } } };
      dt.addEventListener('input', function (e) { if (!S.doc) return; S.doc.to = dt.value; S.doc.err = null; if (!e.isComposing) redo(); });
      dt.addEventListener('compositionend', function () { if (!S.doc) return; S.doc.to = dt.value; setTimeout(redo, 0); });
    }
  }
  // 어두운 모드에서는 행사 색을 밝게(어두운 바탕에서 글자·버튼이 보이게)
  var DARK = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  if (DARK && DARK.addEventListener) DARK.addEventListener('change', function () { render(); });
  function tone(hex) {
    if (!DARK || !DARK.matches) return hex;
    var h = hex.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
    var r = parseInt(h.substr(0, 2), 16) / 255, g = parseInt(h.substr(2, 2), 16) / 255, b = parseInt(h.substr(4, 2), 16) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, hh = 0, ss = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
    if (d) hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    hh = (hh * 60 + 360) % 360; l = Math.max(l, .5); ss = Math.min(ss, .6);
    return 'hsl(' + Math.round(hh) + ' ' + Math.round(ss * 100) + '% ' + Math.round(l * 100) + '%)';
  }
  async function docMake() {
    var d = S.doc, ev = E(); if (!d || d.busy) return;
    var dt = U.$('dTo'); if (dt) d.to = dt.value.trim();
    if (!d.to) { d.err = '표지에 들어갈 이름을 적어 주세요.'; return render(); }
    keep(); d.busy = true; d.err = null; render();
    try {
      var p = places().find(function (x) { return x.id === d.pid; });
      d.bytes = await window.Docs.make(ev.id, 'prop', ST(), { key: d.key, to: d.to, suffix: window.Docs.suffix(ev.id, p, d.key) });
    } catch (e) { d.err = '제안서를 만들지 못했습니다. 인터넷 연결을 확인하고 다시 눌러 주세요.'; }
    d.busy = false; if (S.view === 'place') render();
  }
  async function docGet(act, k) {
    var ev = E(), DD = window.Docs, o = DD.of(ev.id); if (S.dbusy) return;
    S.dbusy = act + (k || ''); render();
    try {
      var bytes, title;
      if (act === 'dkit') { bytes = await DD.make(ev.id, 'kit', ST(), { places: places(), event: ev.title || ev.name, color: ev.color }); title = o.kit.title; }
      else if (act === 'dblank') { bytes = await DD.make(ev.id, 'prop', ST(), { key: k }); title = o.props.find(function (x) { return x.key === k; }).title; }
      else { bytes = await DD.make(ev.id, 'file', ST(), { src: k }); title = o.files.find(function (x) { return x.src === k; }).title; }
      DD.save(bytes, DD.fileName(ST(), evName(ev), title)); U.toast('저장했습니다. 다운로드 폴더(파일 앱)에서 찾을 수 있습니다');
    } catch (e) { U.toast('자료를 만들지 못했습니다. 인터넷 연결을 확인하고 다시 눌러 주세요'); }
    S.dbusy = null; render();
  }
  function go(v) { S.pv = null; S.sheet = null; S.sheetCall = false; S.memoOpen = false; S.view = v; S.pick = null; S.err = null; S.del = null; S.form = {}; S.method = '전화'; S.mset = false; render(); window.scrollTo(0, 0); }
  function drop(msg) { S.nt = null; S.ntL = 0; S.pchk = 0; S.pushOn = false; S.demo = null; U.store.set('bj_owner_demo', null); S.token = null; S.data = null; S.evs = null; S.store = null; U.store.set(KEY, null); S.view = 'login'; S.err = msg || null; S.busy = false; render(); }
  function fail(r) {
    if (r.reason === 'auth') return drop('로그인 시간이 끝났습니다. 다시 들어와 주세요.');
    S.busy = false;
    S.err = r.reason === 'net' ? '연결이 되지 않습니다. 잠시 뒤 다시 해 주세요.' : r.reason === 'limit' ? '적을 수 있는 횟수를 넘었습니다. 담당 SM에게 알려 주세요.' : '입력한 내용을 다시 확인해 주세요.';
    render();
  }
  function netErr() { S.busy = false; if (S.view === 'boot') { S.view = 'login'; S.err = '연결이 되지 않습니다. 잠시 뒤 다시 해 주세요.'; render(); } else U.toast('연결이 되지 않습니다'); }
  // 첫 화면: 행사 목록. 지난번에 고른 행사가 아직 열려 있으면 바로 그 행사로
  async function boot() {
    var r = await U.rpc('owner_events', { p_token: S.token });
    if (!r.ok) { if (r.reason === 'auth') return drop(S.view === 'boot' ? null : '로그인 시간이 끝났습니다. 다시 들어와 주세요.'); return netErr(); }
    S.busy = false;
    if (r.need_consent) { S.name = r.store.name; S.view = 'consent'; return render(); }
    S.store = r.store; S.evs = r.events;
    var keepEv = S.evs.find(function (e) { return e.id === S.ev; });
    if (keepEv) return load();
    var td0 = U.today(), cand = S.evs.filter(function (e) { return !(e.day && e.day < td0); }).sort(function (a, b) { return (a.mode === 'hq') - (b.mode === 'hq') || String(a.day || '').localeCompare(String(b.day || '')); })[0];
    if (cand && !S.pickEv) { S.ev = cand.id; U.store.set(EVK, S.ev); S.tab = 'today'; S.f = 'all'; S.pf = ''; return load(); }
    S.view = 'events'; S.data = null; render();
  }
  async function load(stay) {
    var r = await U.rpc('owner_state', { p_token: S.token, p_event: S.ev });
    if (!r.ok) {
      if (r.reason === 'auth') return drop(S.view === 'boot' ? null : '로그인 시간이 끝났습니다. 다시 들어와 주세요.');
      if (r.reason === 'event') { S.ev = null; U.store.set(EVK, null); S.view = 'events'; S.data = null; return render(); }
      return netErr();
    }
    S.busy = false;
    if (r.need_consent) { S.name = r.store.name; S.data = null; S.view = 'consent'; return render(); }
    S.data = r; if (r.store) S.store = r.store; if (!stay) { S.view = 'home'; S.week = null; loadWeek(); } render();
  }
  async function login(e) {
    e.preventDefault(); if (S.busy) return;
    var a = { p_code: U.$('iCode').value, p_biz: U.$('iBiz').value, p_tel: U.$('iTel').value };
    // SM·본사 직원: 가맹점코드 칸에 SM 아이디, 사업자번호 칸에 SM 비밀번호(휴대폰 칸은 비움) → 예시 매장
    if (a.p_code.trim() && a.p_biz && !a.p_tel.trim() && (/[^0-9\-\s]/.test(a.p_biz) || a.p_biz.replace(/\D/g, '').length !== 10)) return demoLogin(a);
    if (!a.p_code.trim() || a.p_biz.replace(/\D/g, '').length !== 10 || a.p_tel.replace(/\D/g, '').length !== 4) { S.err = '가맹점코드, 사업자번호 10자리, 휴대폰 뒷자리 4자리를 모두 넣어 주세요.'; render(); return refill(a); }
    S.busy = true; S.err = null; render(); refill(a);
    var r = await U.rpc('owner_login', a); S.busy = false;
    if (r.ok) { S.token = r.token; U.store.set(KEY, r.token); S.name = r.name; if (r.need_consent) { S.view = 'consent'; return render(); } S.view = 'boot'; render(); return boot(); }
    S.err = r.reason === 'locked' ? '여러 번 틀려서 30분 동안 들어갈 수 없습니다. 본인이 맞으시면 담당 SM에게 연락해 주세요.'
      : r.reason === 'net' ? '연결이 되지 않습니다. 잠시 뒤 다시 해 주세요.'
        : '입력한 내용이 맞지 않습니다.' + (r.left != null ? ' 앞으로 ' + r.left + '번 더 틀리면 30분 동안 잠깁니다.' : '');
    render(); refill(a);
  }
  async function demoLogin(a) {
    S.busy = true; S.err = null; render(); refill({ p_code: a.p_code, p_biz: '', p_tel: '' });
    var r = await U.rpc('owner_demo_login', { p_login: a.p_code, p_pw: a.p_biz }); S.busy = false;
    if (r.ok) { S.token = r.token; U.store.set(KEY, r.token); S.demo = r.who || 'SM'; U.store.set('bj_owner_demo', S.demo); S.view = 'boot'; render(); return boot(); }
    S.err = r.reason === 'net' ? '연결이 되지 않습니다. 잠시 뒤 다시 해 주세요.' : r.reason === 'locked' ? '여러 번 틀려서 잠시 뒤 다시 해 주세요.' : '입력한 내용이 맞지 않습니다. 가맹점코드, 사업자번호 10자리, 휴대폰 뒷자리 4자리를 확인해 주세요.';
    render(); refill({ p_code: a.p_code, p_biz: '', p_tel: '' });
  }
  // 틀렸을 때 처음부터 다시 치지 않도록 넣었던 값을 그대로 둠
  function refill(a) { var m = { iCode: a.p_code, iBiz: a.p_biz, iTel: a.p_tel }; for (var k in m) { var el = U.$(k); if (el) el.value = m[k]; } }
  async function addPlace(e) {
    e.preventDefault(); if (S.busy) return; keep();
    if ((S.form.nName || '').trim().length < 2) { S.err = '이름을 두 글자 이상 적어 주세요.'; return render(); }
    S.busy = true; S.err = null; render();
    var r = await U.rpc('owner_add_place', { p_token: S.token, p_name: S.form.nName, p_tel: S.form.nTel || '', p_kind: S.form.nKind || '그 밖', p_event: S.ev });
    if (!r.ok) return fail(r);
    S.pid = r.id; S.form = {}; S.pick = null; S.view = 'place'; await load(true); window.scrollTo(0, 0); U.toast('추가했습니다');
  }
  app.addEventListener('click', async function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return; var act = b.dataset.act;
    if (act === 'go') return go(b.dataset.v);
    if (act === 'easy') { U.store.set('bj_owner_easy', b.dataset.v === '1' ? '1' : null); render(); window.scrollTo(0, 0); return; }
    if (act === 'fhot') { S.tab = 'list'; S.f = 'hot'; S.more = null; render(); window.scrollTo(0, 0); return; }
    if (act === 'lv') { S.lv = b.dataset.v; return render(); }
    if (act === 'ntipx') { U.store.set('bj_owner_ntip', '1'); return render(); }
    if (act === 'bshow') { S.bp = b.dataset.k; return render(); }
    if (act === 'bx') { S.bp = null; return render(); }
    if (act === 'bmy') { S.bp = null; U.store.set('bj_owner_ntip', '1'); S.tab = 'sales'; S.more = null; go('home'); var bx0 = U.$('fxBadges'); if (bx0) bx0.scrollIntoView({ block: 'start' }); return; }
    if (act === 'paoff') { U.store.set('bj_owner_pask', '1'); render(); return U.toast('더보기 › 받은 알림에서 언제든 켤 수 있어요'); }
    if (act === 'paon') {
      if (window.OWNER_FX_PREVIEW) return U.toast('미리보기에서는 알림이 실제로 켜지지 않아요');
      var ps = S.nt && !S.nt.vapid ? 'wait' : pushSupport();
      if (ps !== 'ok') { S.tab = 'more'; S.more = 'notice'; ntSeen(); render(); window.scrollTo(0, 0); return; }
      S.pbusy = true; render(); var pok = await pushOn(); S.pbusy = false; if (pok) U.store.set('bj_owner_pask', '1'); return render();
    }
    if (act === 'pnday') { if (S.pnId) U.store.set('bj_owner_pn_' + S.pnId, U.today()); S.pnDone = true; render(); return U.toast('오늘은 다시 띄우지 않을게요'); }
    if (act === 'pnx') { S.pnDone = true; return render(); }
    if (act === 'lf') { S.more = null; S.tab = 'list'; S.f = b.dataset.f; S.q = ''; render(); window.scrollTo(0, 0); return; }
    if (act === 'bopen') { S.bOpen = true; return render(); }
    if (act === 'tgo') { S.tour = 1; window.scrollTo(0, 0); return render(); }
    if (act === 'tnext') { if (S.tour >= TOUR.length) { window.scrollTo(0, 0); return tourEnd(); } S.tour++; return render(); }
    if (act === 'tskip') { window.scrollTo(0, 0); return tourEnd(); }
    if (act === 'obtour') { U.store.set('bj_owner_ob', '1'); S.ob = -1; S.more = null; S.tab = 'today'; S.tour = 1; window.scrollTo(0, 0); return render(); }
    if (act === 'obnext') { S.ob = Math.min(S.ob + 1, OB.length - 1); return render(); }
    if (act === 'obskip') { U.store.set('bj_owner_ob', '1'); S.ob = -1; return render(); }
    if (act === 'tel') { S.called = S.pid; S.dialed = S.pid; setTimeout(render, 400); return; }
    // 오늘 화면에서 바로 전화: 전화 앱이 열리고, 돌아오면 그 곳 화면의 결과 버튼으로
    if (act === 'tcall') { var tid = +b.dataset.id; S.pid = tid; S.called = tid; S.dialed = tid; S.doc = null; setTimeout(function () { go('place'); }, 400); return; }
    if (act === 'sheet') { U.store.set('bj_owner_t_sheet', '1'); keep(); if (!S.mset) { var pz = places().find(function (x) { return x.id === S.pid; }); S.method = pz && !pz.tel ? '방문' : '전화'; } S.sheet = true; S.err = null; return render(); }
    if (act === 'shclose') { keep(); S.sheet = null; S.sheetCall = false; S.err = null; return render(); }
    if (act === 'rs') {
      if (S.busy) return; keep(); var rr0 = b.dataset.r, ev0 = E();
      if (rr0 === 'order') { S.sheet = 'order'; S.err = null; var pz0 = places().find(function (x) { return x.id === S.pid; }); if (ev0.side && S.form.oSide == null) S.form.oSide = pz0 && pz0.kind !== '절' ? '1' : '0'; if (!S.form.oQty) S.form.oQty = ev0.side ? '50' : '20'; if (!S.form.oDay && ev0.day) S.form.oDay = ev0.day; return render(); }
      var pid0 = S.pid; S.busy = true; render();
      var rl = await U.rpc('owner_add_log', { p_token: S.token, p_place: pid0, p_result: rr0, p_method: S.method, p_memo: S.form.memo || '', p_callback: S.form.back || null });
      if (!rl.ok) return fail(rl);
      var m0 = S.method; S.sheetCall = false; S.memoOpen = false; S.form = {}; S.dialed = null; S.sheet = null; await load(true); loadWeek();
      var pp = places().find(function (x) { return x.id === pid0; });
      S.nx = { r: rr0, m: m0, lid: pp && pp.logs[0] && pp.logs[0].id }; S.sheet = 'next'; return render();
    }
    if (act === 'undo') {
      var lu = S.nx && S.nx.lid; if (!lu || S.busy) return; S.busy = true; render();
      var du = await U.rpc('owner_delete_log', { p_token: S.token, p_log: lu }); if (!du.ok) return fail(du);
      S.sheet = null; S.nx = null; await load(true); loadWeek(); return U.toast('되돌렸습니다');
    }
    if (act === 'shdoc') { S.sheet = null; S.docOpen = S.pid; render(); var ds1 = document.querySelector('.step.doc'); if (ds1) ds1.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
    if (act === 'home2') { S.tab = 'today'; S.more = null; go('home'); return; }
    if (act === 'hist') { S.hOpen = S.hOpen === S.pid ? null : S.pid; S.del = null; return render(); }
    if (act === 'more') { if (b.dataset.tab) S.tab = b.dataset.tab; S.more = b.dataset.m; if (S.more === 'notice') { ntSeen(); ntLoad(true); } render(); window.scrollTo(0, 0); return; }
    if (act === 'pv') { S.pv = { id: b.dataset.pv, n: +b.dataset.n, t: b.dataset.t, i: +b.dataset.i || 1, from: b }; render(); var tg = U.$('pv' + S.pv.i), bx = app.querySelector('.pvb'); if (tg && bx && S.pv.i > 1) bx.scrollTop = tg.offsetTop - bx.offsetTop; var cb = app.querySelector('[data-act=pvclose]'); if (cb) cb.focus(); return; }
    if (act === 'pvclose') { S.pv = null; render(); return; }
    if (act === 'mback') { S.more = null; render(); window.scrollTo(0, 0); return; }
    if (act === 'fagain') { S.tab = 'list'; S.f = 'again'; render(); window.scrollTo(0, 0); return; }
    if (act === 'theme') { var tc = /^#[0-9a-fA-F]{6}$/.test(b.dataset.c || '') ? b.dataset.c : null; U.store.set(TK, tc); render(); return U.toast(tc ? '앱 색을 바꿨습니다' : '행사 색으로 되돌렸습니다'); }
    if (act === 'big') { var fv = fsLv(), nv = fv === '0' ? '1' : fv === '1' ? '2' : '0'; U.store.set(BK, nv); applyBig(); render(); return U.toast(nv === '0' ? '글자를 보통 크기로 했습니다' : nv === '1' ? '글자를 크게 했습니다' : '글자를 아주 크게 했습니다'); }
    if (act === 'fs') { U.store.set(BK, b.dataset.v); applyBig(); return render(); }
    if (act === 'tab') { S.more = null; S.tab = b.dataset.t; S.f = 'all'; render(); window.scrollTo(0, 0); return; }
    if (act === 'goff') { U.store.set(GK, '1'); render(); return U.toast('안내를 껐습니다. 더보기에서 다시 볼 수 있습니다'); }
    if (act === 'gon') { U.store.set('bj_owner_t_sheet', null); S.tour = null; S.ob = -1; S.more = null; S.tab = 'today'; render(); window.scrollTo(0, 0); if (window.FirstGuide) FirstGuide.open('owner', 'bj_owner_guide3'); return; }
    if (act === 'dreset') {
      if (S.busy) return; S.busy = true; var rr = await U.rpc('owner_demo_reset', { p_token: S.token }); S.busy = false;
      if (!rr.ok) return fail(rr);
      if (S.ev) await load(true); else render(); return U.toast('예시 기록을 비웠습니다');
    }
    if (act === 'f') { S.f = b.dataset.f; return render(); }
    if (act === 'hqoff') { U.store.set('bj_owner_hq_' + (E().id || ''), '1'); return render(); }
    if (act === 'flag') { keep(); S.sheet = 'flag'; S.err = null; return render(); }
    if (act === 'flagset' || act === 'flagx') {
      if (S.busy) return; var fw = act === 'flagx' ? '' : b.dataset.y; // data-w는 막대 폭에 쓰여서 data-y S.busy = true; S.err = null; render();
      var rf = await U.rpc('owner_flag_place', { p_token: S.token, p_place: S.pid, p_why: fw });
      S.busy = false; if (rf && rf.reason === 'auth') return fail(rf);
      if (!rf || !rf.ok) { S.err = '지금은 보내지 못했어요. 잠시 뒤 다시 눌러 주세요.'; return render(); }
      await load(true); loadWeek(); S.sheet = fw ? 'flagok' : null; render(); if (!fw) U.toast('다시 목록에 넣었습니다'); return;
    }
    if (act === 'pf') { S.pf = b.dataset.f; return render(); }
    if (act === 'open') {
      S.pid = +b.dataset.id; S.doc = null; if (b.dataset.doc) S.docOpen = S.pid; go('place'); var n = U.$('pName'); if (n) n.focus({ preventScroll: true });
      if (b.dataset.doc) { var ds = document.querySelector('.step.doc'); if (ds) ds.scrollIntoView({ block: 'start' }); }
      return;
    }
    if (act === 'method') { keep(); S.mset = true; S.method = b.dataset.m; return render(); }
    if (act === 'pick') {
      keep(); S.pick = b.dataset.r; S.err = null;
      if (S.pick === 'order') { var ev = E(); if (!S.form.oQty) S.form.oQty = ev.side ? '50' : '20'; if (!S.form.oDay && ev.day) S.form.oDay = ev.day; }
      return render();
    }
    if (act === 'dkey') { keep(); S.doc.key = b.dataset.k; S.doc.bytes = null; S.doc.err = null; return render(); }
    if (act === 'dmake') return docMake();
    if (act === 'dshare' || act === 'dsave') {
      var D0 = S.doc, cur = window.Docs.of(E().id).props.find(function (x) { return x.key === D0.key; });
      var fn = window.Docs.fileName(ST(), evName(E()), cur ? cur.title : '제안서', D0.to);
      if (act === 'dsave') { window.Docs.save(D0.bytes, fn); return U.toast('저장했습니다. 다운로드 폴더(파일 앱)에서 찾을 수 있습니다'); }
      var how = await window.Docs.share(D0.bytes, fn, window.Docs.text(E(), ST(), D0.to));
      return U.toast(how === 'shared' ? '보냈습니다' : how === 'saved' ? '공유 창을 열 수 없어 저장했습니다' : '보내기를 그만두었습니다');
    }
    if (act === 'dcopy') { var ok = await window.Docs.copy(window.Docs.text(E(), ST(), S.doc ? S.doc.to : '')); return U.toast(ok ? '문구를 복사했습니다. 문자 칸에 붙여 넣으세요' : '복사하지 못했습니다'); }
    if (act === 'dkit' || act === 'dblank' || act === 'dfile') return docGet(act, b.dataset.k);
    if (act === 'aok') {
      if (S.busy) return; S.busy = true; render();
      var ra = await U.rpc('owner_alloc_confirm', { p_token: S.token, p_event: E().id });
      if (!ra.ok) return fail(ra);
      S.busy = false; S.data.alloc = ra.alloc; render(); return U.toast('확인했습니다');
    }
    if (act === 'quick') {
      if (S.busy) return; S.busy = true; render();
      var rq = await U.rpc('owner_add_log', { p_token: S.token, p_place: S.pid, p_result: b.dataset.r, p_method: '전화', p_memo: '', p_callback: null });
      if (!rq.ok) return fail(rq);
      S.pick = null; S.form = {}; S.dialed = null; await load(true); loadWeek();
      return U.toast(RES[b.dataset.r][0] + '(으)로 저장했습니다' + (b.dataset.r === 'hot' ? '. 아래에서 제안서를 보내 보세요' : ''));
    }
    if (act === 'visit') {
      if (S.busy) return; keep(); S.busy = true; render();
      var rv = await U.rpc('owner_add_log', { p_token: S.token, p_place: S.pid, p_result: 'call', p_method: '방문', p_memo: '들렀음', p_callback: null });
      if (!rv.ok) return fail(rv);
      await load(true); return U.toast('들렀음으로 적었습니다. 관심이 있었으면 결과를 하나 더 적어 주세요');
    }
    if (act === 'del') { keep(); S.del = +b.dataset.id; return render(); }
    if (act === 'delNo') { keep(); S.del = null; return render(); }
    if (S.busy) return;
    if (act === 'et') { S.et = b.dataset.t; return render(); }
    if (act === 'events') { S.pickEv = true; S.ev = null; U.store.set(EVK, null); S.data = null; S.view = 'boot'; render(); window.scrollTo(0, 0); return boot(); }
    if (act === 'ev') { S.pickEv = false; S.ev = b.dataset.id; U.store.set(EVK, S.ev); S.tab = 'today'; S.f = 'all'; S.pf = ''; S.view = 'boot'; S.data = null; render(); window.scrollTo(0, 0); return load(); }
    if (act === 'nread') { var nid = +b.dataset.id, nx = S.nt && S.nt.items.find(function (x) { return x.id === nid; }); if (nx) nx.read = true; if (S.nt) S.nt.unread = ntUnread().length; render(); U.rpc('owner_notice_read', { p_token: S.token, p_id: nid }); return U.toast('확인했습니다'); }
    if (act === 'pushsw') { if (S.pbusy) return; S.pbusy = true; render(); if (S.pushOn) await pushOff(); else await pushOn(); S.pbusy = false; return render(); }
    if (act === 'logout') { if (S.pushOn) pushOff(true, S.token); U.rpc('owner_logout', { p_token: S.token }); drop(); return U.toast('로그아웃했습니다'); }
    if (act === 'consent') { S.busy = true; var c = await U.rpc('owner_consent', { p_token: S.token }); if (!c.ok) return fail(c); S.view = 'boot'; render(); return boot(); }
    if (act === 'save') {
      keep(); S.busy = true; S.err = null; render();
      var r = await U.rpc('owner_add_log', { p_token: S.token, p_place: S.pid, p_result: S.pick, p_method: S.method, p_memo: S.form.memo || '', p_callback: S.form.back || null });
      if (!r.ok) return fail(r);
      S.pick = null; S.form = {}; S.dialed = null; await load(true); loadWeek(); return U.toast('기록을 저장했습니다');
    }
    if (act === 'saveOrder') {
      keep(); var n = parseInt(S.form.oQty, 10), m0 = (E().menu || [])[0], first = !((S.data && S.data.orders) || []).length;
      if (!(n >= 1 && n <= 5000)) { S.err = '인분을 1에서 5000 사이로 적어 주세요.'; return render(); }
      S.busy = true; S.err = null; render();
      var o = await U.rpc('owner_add_order', { p_token: S.token, p_place: S.pid, p_menu: S.form.oMenu || (m0 && m0[0]), p_qty: n, p_side: E().side ? S.form.oSide === '1' : true, p_day: S.form.oDay || null, p_memo: S.form.oMemo || '', p_method: S.method });
      if (!o.ok) return fail(o);
      S.pick = null; S.sheet = null; S.form = {}; S.dialed = null; await load(true); loadWeek();
      if (S.view === 'place') { S.nx = { r: 'order', first: first, qty: n }; S.sheet = 'next'; return render(); }
      return U.toast('주문을 저장했습니다');
    }
    if (act === 'delYes') {
      S.busy = true; var d = await U.rpc('owner_delete_log', { p_token: S.token, p_log: +b.dataset.id });
      if (!d.ok) return fail(d);
      S.del = null; await load(true); loadWeek(); return U.toast('지웠습니다');
    }
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.pv) { S.pv = null; render(); return; } if (e.key === 'Escape' && S.sheet) { keep(); S.sheet = null; S.sheetCall = false; render(); } });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible' || !S.called || S.view !== 'place' || S.pid !== S.called) return;
    S.called = null; keep(); S.sheet = true; S.sheetCall = true; S.err = null; render();
  });
  if (!U.ready()) return render();
  if (S.token) { render(); boot(); } else { S.view = 'login'; render(); }
})();
