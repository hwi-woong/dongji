// 화면 두 곳(사장님, SM)이 함께 쓰는 도구
(function () {
  var C = window.APP_CONFIG || {};
  // 주소 끝에 /rest/v1/ 까지 붙여 넣어도 되게 정리 (2026-11-18 실제 설치에서 생긴 일)
  C.SUPABASE_URL = String(C.SUPABASE_URL || '').trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  var U = {};
  U.$ = function (id) { return document.getElementById(id); };
  U.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  U.ready = function () { return /^https?:\/\//.test(C.SUPABASE_URL || '') && (C.SUPABASE_KEY || '').length > 20; };
  // 서버 창구 부르기. 실패하면 {ok:false, reason:'net'} 을 돌려줍니다.
  U.rpc = async function (fn, args) {
    var h = { 'Content-Type': 'application/json', apikey: C.SUPABASE_KEY };
    if (/^eyJ/.test(C.SUPABASE_KEY)) h.Authorization = 'Bearer ' + C.SUPABASE_KEY;
    try {
      var r = await fetch(C.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/rpc/' + fn, { method: 'POST', headers: h, body: JSON.stringify(args || {}), cache: 'no-store' });
      if (!r.ok) return { ok: false, reason: 'net', status: r.status };
      return await r.json();
    } catch (e) { return { ok: false, reason: 'net' }; }
  };
  // Edge Function 부르기(휴대폰 알림 보내기 등). 페이지를 닫아도 요청은 끝까지 가게 keepalive
  U.fn = async function (name, body) {
    var h = { 'Content-Type': 'application/json', apikey: C.SUPABASE_KEY };
    if (/^eyJ/.test(C.SUPABASE_KEY)) h.Authorization = 'Bearer ' + C.SUPABASE_KEY;
    try { var r = await fetch(C.SUPABASE_URL.replace(/\/+$/, '') + '/functions/v1/' + name, { method: 'POST', headers: h, body: JSON.stringify(body || {}), keepalive: true }); return r.ok ? await r.json() : { ok: false, reason: 'net', status: r.status }; }
    catch (e) { return { ok: false, reason: 'net' }; }
  };
  var tt;
  U.toast = function (m) { var t = U.$('toast'); t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(function () { t.hidden = true; }, 2800); };
  U.when = function (iso) {
    var d = new Date(iso); if (isNaN(d)) return '';
    return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
  };
  U.day = function (s) { if (!s) return ''; var p = String(s).slice(0, 10).split('-'); return (+p[1]) + '월 ' + (+p[2]) + '일'; };
  U.today = function () { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  U.store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { } }
  };
  U.RES = { call: ['통화함', 't-info'], away: ['부재', 't-warn'], hot: ['관심 있음', 't-ok'], no: ['거절', 't-bad'], order: ['주문 받음', 't-ok'] };
  // 행사 날까지 남은 날 (예: D-34, 오늘 동지, 동지 지남)
  U.dday = function (day, name) {
    day = day || '2026-12-22'; name = name || '동지';
    var p = String(day).slice(0, 10).split('-'), n = new Date(), a = Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()), d = Math.round((Date.UTC(+p[0], +p[1] - 1, +p[2]) - a) / 864e5);
    return d > 0 ? 'D-' + d : d === 0 ? '오늘 ' + name : name + ' 지남';
  };
  U.won = function (n) { return Number(n || 0).toLocaleString('ko-KR'); };
  window.U = U;
})();
