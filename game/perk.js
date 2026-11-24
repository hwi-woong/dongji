/* 동지 게임 '매장 혜택' 칸 (사장님 앱 사이트 game/ 폴더용, 2026-11-18)
   · 주소 끝 ?s=<매장 열쇠> 가 있으면 서버(game_perk)에 그 매장 혜택을 물어 켜져 있을 때만 보여 줌
   · 본사가 전체 스위치를 끄거나 사장님이 끄면 칸이 사라짐. 열쇠가 없어도 숨김
   · 열쇠는 같은 창에서 다른 게임으로 넘어가도 이어짐(주소에 붙이고 이 탭에 기억) */
(function () {
  var KEY = 'dj_store_s', s = null, data = null, wait = [];
  var m = /[?&]s=([a-z0-9]{8,32})(?:&|$)/.exec(location.search);
  try { if (m) { s = m[1]; sessionStorage.setItem(KEY, s); } else s = sessionStorage.getItem(KEY); } catch (e) { s = m ? m[1] : null; }

  var st = document.createElement('style');
  st.textContent = '.perk.on{border-style:solid;color:var(--ink,inherit)}.perk .pk-s{display:block;font-size:12px;font-weight:600;opacity:.8;margin-bottom:2px}.perk .pk-t{display:block;font-size:15px;font-weight:700;line-height:1.45;word-break:keep-all}.perk .pk-n{display:block;margin-top:6px;font-size:12px;opacity:.75}';
  document.head.appendChild(st);

  function show(el) {
    if (!el) return;
    if (!data || !data.on) { el.hidden = true; return; }
    el.textContent = '';
    var a = document.createElement('b'); a.textContent = '오늘의 혜택';
    var b = document.createElement('span'); b.className = 'pk-s'; b.textContent = data.store || '';
    var c = document.createElement('span'); c.className = 'pk-t'; c.textContent = data.text || '';
    var d = document.createElement('span'); d.className = 'pk-n'; d.textContent = '계산할 때 이 화면을 보여 주세요.';
    el.append(a, b, c, d); el.classList.add('on'); el.hidden = false;
  }
  window.GPERK = { fill: function (el) { if (!el) return; if (data) show(el); else { el.hidden = true; wait.push(el); } }, key: function () { return s; } };
  // perk.js보다 먼저 결과 칸을 채우려 한 게임(사주 등)은 줄 세워 둔 칸을 이어받음
  (window.GPERK_Q || []).forEach(function (el) { wait.push(el); }); window.GPERK_Q = null;
  function done(r) {
    data = r && r.on ? r : { on: false };
    wait.splice(0).forEach(show);
    var auto = document.querySelector('[data-perk-auto]'); if (auto) show(auto);
  }

  // 같은 폴더 게임 링크에 열쇠 붙이기
  function carry() {
    if (!s) return;
    var as = document.querySelectorAll('a[href]');
    for (var i = 0; i < as.length; i++) {
      var h = as[i].getAttribute('href');
      if (/^[a-z]+\.html$/.test(h)) as[i].setAttribute('href', h + '?s=' + s);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', carry); else carry();

  var C = window.APP_CONFIG || {}, url = String(C.SUPABASE_URL || '').trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, ''), key = C.SUPABASE_KEY || '';
  if (!s) return done(null);
  if (!/^https?:\/\//.test(url) || key.length < 20) {
    // 미리보기(서버 없음): demoon 으로 시작하는 열쇠만 예시 혜택을 보여 줌
    return done(/^demoon/.test(s) ? { on: true, store: '본죽&비빔밥 예시점', text: '이 화면을 보여 주시면 단호박식혜 1개를 드려요 (예시)' } : null);
  }
  var h = { 'Content-Type': 'application/json', apikey: key };
  if (/^eyJ/.test(key)) h.Authorization = 'Bearer ' + key;
  var ctl = window.AbortController ? new AbortController() : null;
  setTimeout(function () { if (ctl) ctl.abort(); }, 8000);
  fetch(url + '/rest/v1/rpc/game_perk', { method: 'POST', headers: h, body: JSON.stringify({ p_s: s }), cache: 'no-store', signal: ctl ? ctl.signal : undefined })
    .then(function (r) { return r.ok ? r.json() : null; }).then(done, function () { done(null); });
})();
