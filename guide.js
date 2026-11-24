// 처음 실행 가이드(2026-11-23): 화면 사진 + 단계별 설명. 처음 한 번 저절로 뜨고, 메뉴의 '처음 안내 다시 보기'로 언제든 다시 봅니다.
// 쓰는 곳: SM 사이트(sm.html, 역할별 sm·lead·admin) / 사장님 앱(index.html, owner). #app 밖(body)에 붙어 화면을 다시 그려도 닫히지 않습니다.
(function () {
  var STEPS = {
    sm: [
      { img: 'img/guide/smh_1.jpg', t: '첫 화면은 동지 단체주문입니다', b: ['본사가 고른 기업·기관·단체 가운데 내 담당 매장 근처 곳이 카드로 나옵니다.', '\'대본·설명서\'에서 할 말과 보낼 제안서를 보고, \'전화 걸기\'로 연락한 뒤 \'결과 적기\'를 누르세요.', '아는 곳이 있으면 \'+ 영업할 곳 넣기\'로 직접 넣을 수 있어요.', '\'우리 팀 전체\'를 누르면 팀 카드와 SM별 진행이 보입니다. 다른 SM 카드는 보기만 해요.'] },
      { img: 'img/guide/smh_2.jpg', t: '결과 적기: 주문이면 인분과 맡길 매장', b: ['통화함·관심 있음·주문 받음 가운데 하나를 누릅니다.', '주문을 받았으면 인분, 받는 날, 맡길 매장(만들고 배달할 매장)을 적고 저장하세요.', '맡길 매장 사장님께는 꼭 먼저 물어보고 정합니다.'] },
      { img: 'img/guide/smn_3.jpg', t: '매장 자료: 매장 왼쪽 네모를 눌러 고릅니다', b: ['위 메뉴 \'매장 자료\'에서 행사를 고른 뒤, 자료를 뽑을 매장의 왼쪽 네모를 누르세요. 여러 곳을 골라도 됩니다.', '고르면 화면 아래 줄에 고른 매장 이름이 나옵니다.', '아래 줄 오른쪽 \'파일 N개 받기\'를 누르면 zip 파일로 바로 받아집니다. PC의 다운로드 폴더에서 열면 됩니다.'] },
      { img: 'img/guide/smn_4.jpg', t: '받을 자료 고르기', b: ['아래 줄 \'받을 자료\'에서 필요한 것만 누르세요. 색이 칠해지고 ✓ 표시가 된 자료만 받습니다.', '실행 키트는 사장님이 보는 책, 제안서는 사장님이 절·복지관 등에 보낼 것입니다. 한 번 고르면 이 PC가 기억합니다.', '\'폴더\'를 누르면 zip 안을 자료 종류별 또는 매장별로 나눕니다.'] },
      { img: 'img/guide/smn_5.jpg', t: '매장 자세히 보기', b: ['매장 줄 오른쪽 › 를 누르면 그 매장의 자세한 내용이 열립니다.', '\'매장에 전화\', \'문구 복사(카톡용)\'로 사장님께 바로 연락합니다. 연락할 곳이 종류별로 묶여 있고 전화·주소·거리가 나옵니다.', '이 안내는 오른쪽 위 이름 ▾ → \'처음 안내 다시 보기\'로 언제든 다시 볼 수 있어요.'] }
    ],
    lead: [
      { img: 'img/guide/ld_1.jpg', t: '팀장 화면은 이렇게 씁니다', b: ['왼쪽 메뉴로 움직입니다. 동지 단체주문·행사 현황·매장·SM별 성과·알림 보내기·SM 계정·사용 안내.', '위쪽 행사 이름(▾)을 누르면 다른 행사로 바꿉니다.', '홈에는 오늘 챙길 매장과 우리 팀 숫자가 요약돼 있습니다.'] },
      { img: 'img/guide/smh_l.jpg', t: '동지 단체주문 (본사 진행)', b: ['왼쪽 메뉴 맨 위입니다. 우리 팀 매장 근처 기업·기관·단체 카드가 나옵니다.', 'SM이 적은 연락 결과와 주문(인분·맡길 매장)이 여기 모입니다. 팀장도 직접 적을 수 있어요.', '\'엑셀로 받기\'로 목록 전체를 받습니다.'] },
      { img: 'img/guide/ld_2.jpg', t: '매장 표', b: ['우리 팀 매장이 SM별로 묶여 나옵니다. 위 칸(챙길·로그인 안 함·기록 0건 …)으로 골라 봅니다.', '\'이 N곳 자료 받기\'를 누르면 지금 보이는 매장의 제안서·키트를 zip 하나로 받습니다.', '줄을 누르면 오른쪽에 매장 자세히가 열립니다.'] },
      { img: 'img/guide/ld_3.jpg', t: '매장 자세히', b: ['연락할 곳이 종류별로 묶여 있고 전화·주소·거리·권할 제안서가 나옵니다.', '\'작년 나눔\'이 붙은 곳은 작년 동지 팥죽 나눔 기사에 나온 곳입니다.', '사장님이 남긴 연락 기록과 주문도 여기서 봅니다.'] },
      { img: 'img/guide/ld_4.jpg', t: '알림 보내기', b: ['받는 매장(우리 팀 전체 또는 SM별)을 고르고 \'알림 쓰기\'를 누른 뒤 문구를 고릅니다.', '\'보내기\'를 누르고 한 번 더 확인하면 사장님 앱과 휴대폰에 갑니다.', '아래 \'최근 보낸 알림\'에서 읽은 수를 봅니다.'] },
      { img: 'img/guide/ld_5.jpg', t: 'SM별 성과', b: ['SM마다 참여 매장·연락·주문 숫자를 비교합니다.', 'SM 이름을 누르면 그 SM 매장만 모아 봅니다.', '이 안내는 오른쪽 위 이름 ▾ → \'처음 안내 다시 보기\'로 다시 볼 수 있어요.'] }
    ],
    admin: [
      { img: 'img/guide/ad_1.jpg', t: '본사 관리자 화면은 이렇게 씁니다', b: ['왼쪽 메뉴: 동지 단체주문·행사 현황·매장·팀별 성과·알림 보내기·계정·권한·사용 안내.', '위쪽 행사 이름(▾)을 누르면 다른 행사로 바꿉니다.', '홈에는 전국 숫자와 오늘 챙길 매장이 요약돼 있습니다.'] },
      { img: 'img/guide/ad_2.jpg', t: '매장 표와 자료 받기', b: ['전 매장을 팀별로 묶어 봅니다. 찾기 칸에 매장·SM 이름을 넣어도 됩니다.', '\'이 N곳 자료 받기\'로 지금 보이는 매장 자료를 zip으로 받습니다(한 번에 300곳까지).', '줄을 누르면 매장 자세히(연락할 곳 종류별·기록·주문)가 열립니다.'] },
      { img: 'img/guide/ad_3.jpg', t: '알림 보내기', b: ['관리자는 전 매장 또는 팀을 골라 보낼 수 있습니다.', '보내기 전 오른쪽에서 사장님 앱에 보일 모습을 확인하세요.'] },
      { img: 'img/guide/smh_a.jpg', t: '동지 단체주문 (본사 진행)', b: ['기사에 나온 기업·기관과 라이온스·로타리 지구, 적십자 지사 같은 상위 단체 창구입니다.', '관리자는 전부, 팀장은 팀 매장 근처, SM은 담당 매장 근처 카드만 봅니다. 사장님 앱에는 나오지 않습니다.', '\'결과 적기\'로 상태·주문 인분·맡길 매장을 남기고, \'엑셀로 받기\'로 목록을 받습니다.'] },
      { img: 'img/guide/ad_5.jpg', t: '계정 관리와 안내 다시 보기', b: ['왼쪽 \'계정·권한\'에서 SM·팀장 계정을 만들고, 비밀번호를 처음 값으로 되돌립니다. 팀장에게 전 매장 알림 권한도 줄 수 있습니다.', '이 안내는 오른쪽 위 이름 ▾ → \'처음 안내 다시 보기\'로 언제든 다시 볼 수 있어요.'] }
    ],
    owner: [
      { img: 'img/guide8/ow_1.jpg', t: '사장님, 반갑습니다', b: ['이 앱은 근처 절·복지관·주민센터·농협에 전화해 단체 주문을 받도록 돕습니다.', '맨 위 한 줄에 행사 이름, 남은 날(D-○○), 지금까지 받은 단체 매출이 늘 보여요.', '하루에 세 곳만 전화해도 충분합니다.'] },
      { img: 'img/guide8/ow_2.jpg', t: '오늘 할 일에서 [전화] 누르기', b: ['\'오늘 할 일\'에 본사가 골라 둔 곳이 세 줄 있어요.', '맨 위 줄 오른쪽 [전화]를 누르면 바로 전화가 걸려요.', '무슨 말을 할지 먼저 보려면 곳 이름을 누르세요.'] },
      { img: 'img/guide8/ow_3.jpg', t: '첫마디를 보고 전화 걸기', b: ['곳 이름을 누르면 이 화면이 열려요. 노란 칸에 전화할 때 할 첫마디가 있어요. 읽기만 하시면 돼요.', '아래 \'전화 걸기\'를 누르면 휴대폰 전화가 걸려요.', '맨 위 ① 전화 → ② 결과 → ③ 제안서 표시가 지금 어디까지 왔는지 알려 줘요.'] },
      { img: 'img/guide8/ow_4.jpg', t: '끊으면 결과 하나만 누르기', b: ['통화가 끝나면 \'결과 적기\'를 누르세요. 이 창이 떠요.', '관심 있음 · 안 받음 · 통화만 함 · 필요 없대요 · 주문 받음 가운데 하나만 누르면 바로 저장돼요.', '\'안 받음\'은 다시 연락할 곳으로 올라와요. 직접 찾아갔다면 위에서 \'직접 들렀어요\'를 고르세요.'] },
      { img: 'img/guide8/ow_5.jpg', t: '관심 있으면 제안서 보내기', b: ['\'관심 있음\'을 고른 곳은 오늘 할 일에 \'제안서 보내기\'로 올라와요.', '받는 곳 이름을 확인하고 \'제안서 만들기\'를 누르면 우리 매장 이름·전화가 들어간 제안서가 완성돼요.', '만든 제안서는 문자나 카톡으로 보낼 수 있어요.'] },
      { img: 'img/guide8/ow_6.jpg', t: '아래 칸 네 개', b: ['오늘: 오늘 할 일과 새 소식.  연락할 곳: 근처 연락할 곳 전부. 빨간 숫자는 다시 연락할 곳이에요.', '매출: 단체 매출, 받은 주문, 우리 매장 단계.  더보기: 제안서·키트 받기, 받은 알림, 글자 크기.', '이 안내는 더보기 › \'사용 안내 다시 보기\'로 언제든 다시 볼 수 있어요.'] }
    ]
  };
  var cur = null, opened = {};
  function seen(k) { try { return localStorage.getItem(k) === '1'; } catch (e) { return false; } }
  function mark(k) { try { localStorage.setItem(k, '1'); } catch (e) { } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function paint() {
    var g = cur, s = g.steps[g.i], n = g.steps.length, last = g.i === n - 1;
    g.el.innerHTML = '<div class="fg-box" role="dialog" aria-modal="true" aria-labelledby="fgT" tabindex="-1">' +
      '<div class="fg-hd"><span class="fg-k">처음 사용 안내 <b>' + (g.i + 1) + '</b> / ' + n + '</span><button type="button" class="fg-x" data-fg="close" aria-label="안내 닫기">닫기 ×</button></div>' +
      '<div class="fg-body"><figure class="fg-fig"><img src="' + esc(s.img) + '" alt="' + esc(s.t) + ' 화면 예시"></figure>' +
      '<div class="fg-txt"><h2 id="fgT">' + esc(s.t) + '</h2><ol>' + s.b.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
      '<p class="fg-note">사진은 예시 화면입니다. 주황 테두리가 누를 곳이에요.</p></div></div>' +
      '<div class="fg-ft"><span class="fg-dots" aria-hidden="true">' + g.steps.map(function (x, i) { return '<i class="' + (i === g.i ? 'on' : i < g.i ? 'done' : '') + '"></i>'; }).join('') + '</span>' +
      (g.i > 0 ? '<button type="button" class="fg-b gh" data-fg="prev">이전</button>' : '<button type="button" class="fg-b gh" data-fg="close">건너뛰기</button>') +
      '<button type="button" class="fg-b" data-fg="' + (last ? 'close' : 'next') + '">' + (last ? '시작하기' : '다음') + '</button></div></div>';
    if (g.steps[g.i + 1]) { var im = new Image(); im.src = g.steps[g.i + 1].img; }
    var bx = g.el.querySelector('.fg-box'); if (bx) bx.focus();
  }
  function close() {
    if (!cur) return; mark(cur.key); cur.el.remove(); document.body.classList.remove('fg-open');
    var f = cur.focus; cur = null; if (f && f.focus) try { f.focus(); } catch (e) { }
  }
  function open(kind, key) {
    var steps = STEPS[kind]; if (!steps || cur) return;
    var el = document.createElement('div'); el.className = 'fg'; document.body.appendChild(el); document.body.classList.add('fg-open');
    cur = { steps: steps, i: 0, key: key || ('bj_guide2_' + kind), el: el, focus: document.activeElement };
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-fg]'); if (!b) { if (e.target === el) close(); return; }
      var a = b.dataset.fg; if (a === 'close') return close();
      if (a === 'next' && cur.i < cur.steps.length - 1) cur.i++; else if (a === 'prev' && cur.i > 0) cur.i--;
      paint();
    });
    paint();
  }
  document.addEventListener('keydown', function (e) {
    if (!cur) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight' && cur.i < cur.steps.length - 1) { cur.i++; paint(); }
    else if (e.key === 'ArrowLeft' && cur.i > 0) { cur.i--; paint(); }
    else if (e.key === 'Tab') { var f = cur.el.querySelectorAll('button'); if (!f.length) return; var a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
  });
  window.FirstGuide = {
    open: open,
    // 처음 한 번만 저절로 열기(이 기기에서 이미 봤으면 열지 않음)
    maybe: function (kind, key) { key = key || ('bj_guide2_' + kind); if (opened[key] || seen(key)) return; opened[key] = 1; setTimeout(function () { open(kind, key); }, 300); },
    reset: function (kind, key) { try { localStorage.removeItem(key || ('bj_guide2_' + kind)); } catch (e) { } }
  };
})();
