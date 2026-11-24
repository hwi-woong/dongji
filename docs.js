// 제안서·키트 만들기(사장님 앱·SM 화면 같이 씀, 2026-11-18)
// 빈 PDF(doc/) 위에 매장 이름·전화와 받는 곳 이름을 브라우저 안에서 찍습니다. 서버로 보내는 것은 없습니다.
(function () {
  var U = window.U;
  var EV = {
    dj: { // 동지 하나로(2026-11-21): 절 + 연말 팥죽 나눔(트랙 A) 3종
      props: [
        { key: 'dongji', src: 'base_prop.pdf', title: '절 제안서', who: '절', pv: 'dj_prop', n: 9 },
        { key: 'na_어르신나눔', src: 'na_elder.pdf', title: '어르신 나눔 제안서', purpose: '어르신 나눔', who: '노인복지관·복지관·노인회', pv: 'na_elder', n: 9 },
        { key: 'na_이웃나눔', src: 'na_local.pdf', title: '동네 나눔 제안서', purpose: '동네 나눔', who: '주민센터 단체·봉사센터·봉사 클럽', pv: 'na_local', n: 9 },
        { key: 'na_조합나눔', src: 'na_coop.pdf', title: '조합 나눔 제안서', purpose: '조합 나눔', who: '농협·축협·새마을금고·신협', pv: 'na_coop', n: 9 }],
      kit: { t: 'kit', src: 'dj_kit.pdf', title: '동지 실행 키트', spec: 'A4 세로 · 맨 앞에 우리 매장 절 목록과 나눔 단체 연락할 곳', pv: 'dj_kit', n: 13 }
    },
    xm: {
      props: [
        { key: 'xm_근무자식사', src: 'xm_staff.pdf', title: '근무자 식사 제안서', purpose: '근무자 식사', who: '경찰·소방·병원 등', pv: 'xm_staff', n: 9 },
        { key: 'xm_성탄나눔', src: 'xm_share.pdf', title: '성탄 나눔 제안서', purpose: '성탄 나눔', who: '교회·성당·복지관', pv: 'xm_share', n: 9 },
        { key: 'xm_연말모임', src: 'xm_party.pdf', title: '연말 모임 제안서', purpose: '연말 모임', who: '회사·사무실·학원', pv: 'xm_party', n: 9 }],
      kit: { t: 'tkit', src: 'xm_kit.pdf', title: '크리스마스 실행 키트', spec: 'A4 세로 · 맨 앞에 우리 매장 연락할 곳', pv: 'xm_kit', n: 11 }
    },
    sl: {
      props: [
        { key: 'sl_근무자식사', src: 'sl_staff.pdf', title: '근무자 식사 제안서', purpose: '근무자 식사', who: '연휴 근무 기관', pv: 'sl_staff', n: 9 },
        { key: 'sl_명절나눔', src: 'sl_share.pdf', title: '명절 나눔 제안서', purpose: '명절 나눔', who: '복지관·경로당·교회', pv: 'sl_share', n: 9 },
        { key: 'sl_연휴전점심', src: 'sl_lunch.pdf', title: '연휴 전 점심 제안서', purpose: '연휴 전 점심', who: '회사·사무실', pv: 'sl_lunch', n: 9 }],
      kit: { t: 'tkit', src: 'sl_kit.pdf', title: '설 명절 실행 키트', spec: 'A4 세로 · 맨 앞에 우리 매장 연락할 곳', pv: 'sl_kit', n: 11 }
    },
    su: { props: [], files: [{ src: 'su_guide.pdf', title: '매장 준비 안내', spec: 'A4 · 배정표 포함', pv: 'su_guide', n: 2 }, { src: 'su_school.pdf', title: '학교 제안서 (본사가 보내는 것)', spec: 'A4 가로 · 참고용', pv: 'su_school', n: 6 }] }
  };
  var A = null, gen = null, loading = null;
  function file(src) { return fetch('doc/' + src).then(function (r) { if (!r.ok) throw new Error('file'); return r.arrayBuffer(); }); }
  function script(src) {
    return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { no(new Error('lib')); }; document.head.appendChild(s); });
  }
  function base() {
    if (loading) return loading;
    loading = (async function () {
      if (!window.PDFLib) await script('lib/pdf-lib.min.js');
      if (!window.fontkit) await script('lib/fontkit.umd.min.js');
      if (!window.HubGen) await script('gen.js');
      var W = [400, 500, 600, 700, 800], got = await Promise.all(W.map(function (w) { return file('font/' + w + '.ttf'); }).concat([file('font/sym.ttf'), file('layout.json'), file('logo_bjbb.png'), file('logo_bonjuk.png')]));
      // got: 글꼴 400~800(0~4), sym(5), layout(6), 로고 본죽&비빔밥(7), 본죽(8)
      A = { fonts: { sym: got[5] }, props: {}, logos: { bjbb: got[7], bonjuk: got[8] }, layout: JSON.parse(new TextDecoder().decode(got[6])) };
      W.forEach(function (w, i) { A.fonts[w] = got[i]; });
      return A;
    })();
    loading.catch(function () { loading = null; });
    return loading;
  }
  function brand(st) { return st.bj ? '본죽&비빔밥' : '본죽'; }
  function safe(t) { return String(t || '').replace(/[\\/:*?"<>|\s]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, ''); }
  var GRADE = { A: 0, B: 1, C: 2 };
  // places → 키트 첫 장 자료
  function kitRows(places) {
    return (places || []).filter(function (p) { return !p.custom; });
  }
  var D = {
    of: function (ev) { return EV[ev] || { props: [] }; },
    // 이 곳에 권할 제안서(목적이 맞는 것, 없으면 첫 번째)
    pick: function (ev, place) {
      var P = D.of(ev).props; if (!P.length) return null;
      var m = place && place.purpose ? P.find(function (x) { return x.purpose === place.purpose; }) : null;
      return m || P[0];
    },
    suffix: function (ev, place, key) { return ev === 'dj' && (!key || key === 'dongji') && place && place.kind && place.kind !== '절' ? '귀중' : ''; }, // 절 제안서를 절 아닌 곳에 보낼 때만
    fileName: function (st, evName, title, to) { return safe(st.s + '_' + (title.indexOf(evName) === 0 ? '' : evName + '_') + title + (to ? '_' + to : '')) + '.pdf'; },
    // kind: prop(opt.key, opt.to) · kit(opt.places, opt.event) · file(opt.src)
    make: async function (ev, kind, st, opt) {
      opt = opt || {};
      if (kind === 'file') return new Uint8Array(await file(opt.src));
      await base();
      gen = gen || window.HubGen(window.PDFLib, window.fontkit, A);
      if (kind === 'prop') {
        var d = D.of(ev).props.find(function (x) { return x.key === opt.key; }); if (!d) throw new Error('doc');
        if (!A.props[d.key]) A.props[d.key] = await file(d.src);
        if (opt.to && !A.nfont) A.nfont = await file('font/n700.ttf'); // 받는 곳 이름은 아무 글자나 올 수 있어 한글 전체 글꼴
        return gen.proposal(st, d.key, { to: opt.to, suffix: opt.suffix, font: opt.to ? A.nfont : null });
      }
      var k = D.of(ev).kit; if (!k) throw new Error('doc');
      var rows = kitRows(opt.places);
      if (!A.tfonts && (k.t === 'tkit' || rows.some(function (p) { return p.kind !== '절'; }))) { var t2 = await Promise.all([file('font/t400.ttf'), file('font/t700.ttf')]); A.tfonts = { 400: t2[0], 700: t2[1] }; }
      var tr = function (p) { return [p.kind || '', p.name, p.tel || '', +p.km || 0, p.addr || '', p.purpose || '']; };
      if (k.t === 'kit') { // 동지: 절 목록 + (있으면) 나눔 단체 연락할 곳 + 본문
        if (!A.list) { var two = await Promise.all([file('base_list.pdf'), file(k.src || 'booklet.pdf')]); A.list = two[0]; A.booklet = two[1]; }
        var T = rows.filter(function (p) { return p.kind === '절'; }).sort(function (a, b) { return (GRADE[a.grade] == null ? 3 : GRADE[a.grade]) - (GRADE[b.grade] == null ? 3 : GRADE[b.grade]) || (+a.km || 99) - (+b.km || 99); })
          .map(function (p) { return { p: p.grade || 'C', name: p.name, addr: p.addr || '', tel: p.tel || '', d: +p.km || 0, ov: '', ev: p.grade === 'A' && p.note ? p.note.replace(/^참고:\s*/, '') : '' }; });
        var O = rows.filter(function (p) { return p.kind !== '절'; }).sort(function (a, b) { return (+a.km || 99) - (+b.km || 99); }).map(tr);
        return gen.kit(st, T, O.length ? { rows: O, meta: { event: opt.event || '', color: opt.color || '#6E0E00', asof: '2026년 11월' } } : undefined);
      }
      A.kits = A.kits || {}; if (!A.kits[k.src]) A.kits[k.src] = await file(k.src);
      var R = rows.map(tr);
      return gen.tkit(st, R, A.kits[k.src], { event: opt.event || '', color: opt.color || '#6E0E00', asof: '2026년 11월' });
    },
    save: function (bytes, name) {
      var url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      var a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    },
    // 휴대폰 공유 창(문자·카카오톡 …). 못 쓰면 저장으로 대신하고 'saved'
    canShare: function () {
      try { return !!(navigator.canShare && navigator.canShare({ files: [new File([new Uint8Array(1)], 'a.pdf', { type: 'application/pdf' })] })); } catch (e) { return false; }
    },
    share: async function (bytes, name, text) {
      var f = new File([bytes], name, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) {
        try { await navigator.share({ files: [f], text: text, title: name.replace(/\.pdf$/, '') }); return 'shared'; }
        catch (e) { if (e && e.name === 'AbortError') return 'cancel'; }
      }
      D.save(bytes, name); return 'saved';
    },
    copy: function (t) {
      if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(function () { return true; }, function () { return fb(); });
      return Promise.resolve(fb());
      function fb() { var x = document.createElement('textarea'); x.value = t; document.body.appendChild(x); x.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) { } x.remove(); return ok; }
    },
    // 제안서와 같이 보낼 문구
    text: function (e, st, to) {
      var b = brand(st), dl = e.deadline ? U.day(e.deadline) : '';
      return '안녕하세요' + (to ? ', ' + to + ' 담당자님' : '') + '. ' + b + ' ' + st.s + '입니다.\n' +
        '말씀드린 ' + (e.name || '') + ' 단체주문 제안서를 보내 드립니다.' + (dl ? ' 주문은 ' + dl + '까지 받습니다.' : '') + '\n' +
        '1인분씩 담아 정하신 시각에 배달해 드립니다.' + (st.tel ? ' 궁금하신 점은 ' + st.tel + '로 연락 주세요.' : '') + '\n감사합니다.';
    },
    brand: brand,
    // 제안서 칸이 보이면 글꼴·바탕 자료를 미리 받아 둠(처음 만들 때 10초쯤 걸리던 것, 2026-11-21)
    warm: function () {
      if (D._w) return; D._w = true;
      base().then(function () { if (!A.nfont) return file('font/n700.ttf').then(function (b) { A.nfont = A.nfont || b; }); }).catch(function () { D._w = false; });
    }
  };
  window.Docs = D;
})();
