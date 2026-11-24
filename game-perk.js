// 본사·SM: 동지 게임 '매장 혜택' 칸 관리 (2026-11-18)
//  · 관리자: 모든 매장 혜택 한꺼번에 켜기·끄기(본사 스위치)
//  · 관리자·팀장·SM: 담당 범위 매장이 정한 혜택 문구 보기, 알맞지 않으면 그 매장만 끄기
//  · SM 성과 화면(sm.html)과 같은 아이디·비밀번호. 같은 탭에서 sm.html에 들어가 있었다면 다시 묻지 않음
(function () {
  var U = window.U, esc = U.esc, KEY = 'bj_sm_token';
  var ss = { get: function () { try { return sessionStorage.getItem(KEY); } catch (e) { return null; } }, set: function (v) { try { v == null ? sessionStorage.removeItem(KEY) : sessionStorage.setItem(KEY, v); } catch (e) { } } };
  var S = { token: ss.get(), view: 'boot', r: null, err: null, busy: false, q: '', f: 'on', conf: null };
  var app = U.$('app');
  function top() {
    return '<header class="top"><div class="wrap"><div class="brand"><picture><source media="(prefers-color-scheme: dark)" srcset="img/logo-dark.svg"><img src="img/logo.svg" alt="본죽&amp;비빔밥"></picture><span>게임 혜택 관리</span></div>' +
      '<div class="rt">' + (S.r ? '<a class="mini lnk-m" href="sm.html">SM 성과 화면</a><b>' + esc(S.r.name) + '</b><button class="mini" type="button" data-act="logout">로그아웃</button>' : '') + '</div></div></header>';
  }
  function render() {
    var h = top();
    if (!U.ready()) h += '<div class="wrap split one-col"><p class="small">config.js에 서버 주소와 공개용 키가 아직 없습니다.</p></div>';
    else if (S.view === 'boot') h += '<div class="wrap split one-col"><p class="small">불러오는 중입니다.</p></div>';
    else if (S.view === 'login') {
      h += '<div class="wrap login"><form id="lf" novalidate><h2 class="q">게임 혜택. <span>본사·SM 전용입니다</span></h2>' +
        '<p class="small">SM 성과 화면과 같은 아이디·비밀번호로 들어갑니다.</p>' +
        '<label class="f" for="iId">아이디<input id="iId" type="text" autocomplete="username" autocapitalize="none" spellcheck="false"></label>' +
        '<label class="f" for="iPw">비밀번호<input id="iPw" type="password" autocomplete="current-password"></label>' +
        (S.err ? '<p class="err" role="alert">' + S.err + '</p>' : '') +
        '<button class="btn block" type="submit"' + (S.busy ? ' disabled' : '') + '>들어가기</button></form></div>';
    } else {
      var r = S.r, admin = r.role === 'admin', rows = r.rows || [], on = rows.filter(function (x) { return x.on; }), q = S.q.trim();
      var V = rows.filter(function (x) { return (S.f === 'all' || x.on) && (!q || (x.name + ' ' + (x.sm || '') + ' ' + (x.team || '') + ' ' + x.text).indexOf(q) >= 0); });
      h += '<div class="wrap split one-col gpa"><div class="steps">' +
        '<section class="step"><h2 class="q">본사 스위치. <span>모든 매장 게임의 혜택 칸</span></h2>' +
        '<div class="gpa-sw ' + (r.global ? 'is-on' : 'is-off') + '"><div><b>' + (r.global ? '켜져 있습니다' : '꺼져 있습니다') + '</b><p class="small">' +
        (r.global ? '사장님이 켠 매장만 게임 결과 화면에 그 매장 혜택이 보입니다.' : '어느 매장 게임에도 혜택 칸이 보이지 않습니다. 사장님 앱에는 \'본사가 잠시 멈춤\'으로 보입니다.') + '</p></div>' +
        (admin ? (S.conf === 'sw' ? '<div class="ctl"><button class="btn" type="button" data-act="sw" data-on="' + (r.global ? '0' : '1') + '"' + (S.busy ? ' disabled' : '') + '>' + (r.global ? '정말 모두 끄기' : '정말 모두 켜기') + '</button><button class="btn ghost" type="button" data-act="cancel">그만두기</button></div>'
          : '<button class="btn' + (r.global ? ' ghost' : '') + '" type="button" data-act="ask">' + (r.global ? '모든 매장 혜택 끄기' : '다시 켜기') + '</button>')
          : '<p class="small">켜고 끄는 것은 본사 관리자만 할 수 있습니다.</p>') + '</div></section>' +
        '<section class="step"><h2 class="q">매장 혜택. <span>' + (admin ? '전체' : r.role === 'lead' ? '우리 팀' : '담당 매장') + '</span><small>켠 매장 ' + on.length + ' / ' + r.stores + '곳</small></h2>' +
        '<div class="gpa-f"><input id="gq" type="search" placeholder="매장·SM·문구로 찾기" aria-label="찾기" value="' + esc(S.q) + '">' +
        '<button class="mini" type="button" data-act="f" data-f="on" aria-pressed="' + (S.f === 'on') + '">켠 매장</button><button class="mini" type="button" data-act="f" data-f="all" aria-pressed="' + (S.f === 'all') + '">한 번이라도 정한 매장</button></div>' +
        (V.length ? '<div class="tw"><table class="narrow"><thead><tr><th>매장</th><th class="l">담당</th><th class="l">혜택 문구</th><th class="l">상태</th></tr></thead><tbody>' +
          V.map(function (x) {
            return '<tr><td class="nm">' + esc(x.name) + '</td><td class="l">' + esc((x.team || '') + ' ' + (x.sm || '')) + '</td><td class="l wrap">' + esc(x.text) + '</td>' +
              '<td class="l"><span class="tag ' + (x.on ? 't-ok' : 't-idle') + '">' + (x.on ? '켜짐' : x.by_sm ? '본사가 끔' : '꺼짐') + '</span><br><span class="small">' + (x.at ? U.when(x.at) : '') + '</span>' +
              (x.on ? '<br>' + ( (S.conf === 'off' + x.id ? '<button class="btn sm" type="button" data-act="off" data-id="' + x.id + '">끄기 확인</button>' : '<button class="btn ghost sm" type="button" data-act="askoff" data-id="' + x.id + '">이 매장만 끄기</button>')) : '') + '</td></tr>';
          }).join('') + '</tbody></table></div>'
          : '<p class="small">' + (rows.length ? '조건에 맞는 매장이 없습니다.' : '아직 혜택을 정한 매장이 없습니다. 사장님 앱 \'더보기 > 우리 매장 혜택\'에서 정합니다.') + '</p>') +
        '<p class="small">이 매장만 끄면 사장님 앱에 \'본사가 껐어요\'로 보이고, 사장님이 문구를 고쳐 다시 켤 수 있습니다.</p></section>' +
        '</div></div>';
    }
    app.innerHTML = h;
    var lf = U.$('lf'); if (lf) lf.addEventListener('submit', login);
    var gq = U.$('gq'); if (gq) gq.addEventListener('input', function () { S.q = gq.value; var p = gq.selectionStart; render(); var n = U.$('gq'); n.focus(); try { n.setSelectionRange(p, p); } catch (e) { } });
  }
  function fail(r) {
    if (r.reason === 'auth') { S.token = null; ss.set(null); S.r = null; S.view = 'login'; S.err = '다시 들어와 주세요.'; return render(); }
    if (r.reason === 'pw') { S.view = 'login'; S.err = '처음 비밀번호를 아직 안 바꿨습니다. SM 성과 화면에서 먼저 바꿔 주세요.'; S.token = null; ss.set(null); return render(); }
    U.toast(r.reason === 'role' ? '권한이 없습니다' : r.reason === 'net' ? '연결이 되지 않습니다. 서버에 13번 설치를 했는지 확인해 주세요.' : '다시 해 주세요');
  }
  async function load(on) {
    var a = { p_token: S.token }; if (on != null) a.p_on = on;
    var r = await U.rpc('sm_game_perks', a); S.busy = false;
    if (!r.ok) return fail(r);
    S.r = r; S.view = 'main'; render();
  }
  async function login(e) {
    e.preventDefault(); if (S.busy) return;
    var a = { p_login: U.$('iId').value, p_pw: U.$('iPw').value };
    if (!a.p_login.trim() || !a.p_pw) { S.err = '아이디와 비밀번호를 넣어 주세요.'; return render(); }
    S.busy = true; S.err = null; render();
    var r = await U.rpc('sm_login', a); S.busy = false;
    if (!r.ok) { S.err = r.reason === 'net' ? '연결이 되지 않습니다.' : '아이디나 비밀번호가 맞지 않습니다.'; render(); U.$('iId').value = a.p_login; return; }
    S.token = r.token; ss.set(r.token);
    if (r.must_change) return fail({ reason: 'pw' });
    load();
  }
  app.addEventListener('click', async function (e) {
    var b = e.target.closest('[data-act]'); if (!b || S.busy) return;
    var act = b.dataset.act;
    if (act === 'logout') { U.rpc('sm_logout', { p_token: S.token }); S.token = null; ss.set(null); S.r = null; S.view = 'login'; S.err = null; return render(); }
    if (act === 'ask') { S.conf = 'sw'; return render(); }
    if (act === 'cancel') { S.conf = null; return render(); }
    if (act === 'f') { S.f = b.dataset.f; return render(); }
    if (act === 'askoff') { S.conf = 'off' + b.dataset.id; return render(); }
    if (act === 'sw') { S.conf = null; S.busy = true; render(); await load(b.dataset.on === '1'); return U.toast(S.r && S.r.global ? '모든 매장 혜택을 다시 켰습니다' : '모든 매장 혜택을 껐습니다'); }
    if (act === 'off') {
      S.conf = null; S.busy = true; render();
      var r = await U.rpc('sm_game_perk_off', { p_token: S.token, p_store: +b.dataset.id });
      if (!r.ok) { S.busy = false; render(); return fail(r); }
      await load(); return U.toast('그 매장 혜택을 껐습니다');
    }
  });
  if (!U.ready()) render(); else if (S.token) { render(); load(); } else { S.view = 'login'; render(); }
})();
