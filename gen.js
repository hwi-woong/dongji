// 사장님 앱용 사본(2026-11-18): 원본 hub/tools/gen.js + 제안서 표지 '받는 곳' 이름 넣기(opt.to).
// 통합 자료실: 매장별 제안서(동지 절 제안서 + 수능 제안서 3종)·동지 실행 키트 PDF를 브라우저 안에서 만듭니다.
// 원본: temple-supply/national/smsite/gen.js. proposal(store, key)의 key로 어느 제안서인지 고릅니다.
// 빈칸으로 만든 PDF(base_prop.pdf, base_list.pdf) 위에, layout.json이 알려 주는 자리에 매장 정보를 씁니다.
// 브라우저에서는 window.SMGen, node에서는 module.exports로 씁니다(PDFLib, fontkit을 넘겨 받음).
(function (root) {
  const PX = 0.75; // CSS px → pt
  const ASC = 1950 / 2048; // Pretendard ascender
  const LIST_OFF = { x: 12 / 25.4 * 96, y: 11 / 25.4 * 96 }; // 사찰 목록 @page 여백(12mm, 11mm)
  const GRADE = { A: [110, 14, 0], B: [176, 141, 87], C: [155, 145, 132] };

  function Gen(PDFLib, fontkit, assets) {
    // assets: {prop, list, booklet, layout, fonts:{400..800, sym}, logos:{bjbb, bonjuk}} (ArrayBuffer, layout은 객체)
    const L = assets.layout;
    const col = (c) => { const m = c.match(/[\d.]+/g).map(Number); return PDFLib.rgb(m[0] / 255, m[1] / 255, m[2] / 255); };
    const C3 = (a) => PDFLib.rgb(a[0] / 255, a[1] / 255, a[2] / 255);

    async function fontsFor(doc) {
      doc.registerFontkit(fontkit);
      const F = {};
      for (const w of [400, 500, 600, 700, 800]) F[w] = await doc.embedFont(assets.fonts[w], { subset: false });
      for (const w of [100, 200, 300]) F[w] = F[400];
      for (const w of [900, 950, 1000]) F[w] = F[800];
      F.sym = await doc.embedFont(assets.fonts.sym, { subset: false });
      return F;
    }
    // ☎만 다른 글꼴로 나눕니다
    const segs = (t) => t.split(/(☎)/).filter(Boolean);
    function width(F, st, text) {
      let w = 0;
      for (const s of segs(text)) w += (s === '☎' ? F.sym : F[st.fw]).widthOfTextAtSize(s, st.fs * PX) + st.ls * PX * [...s].length;
      return w / PX; // px
    }
    // x: 왼쪽(px), base: 기준선(px). 둘 다 페이지 왼쪽 위 기준
    function draw(page, F, st, text, x, base, off) {
      off = off || { x: 0, y: 0 };
      const H = page.getHeight();
      let cx = (x + off.x) * PX; const y = H - (base + off.y) * PX;
      page.pushOperators(PDFLib.setCharacterSpacing(st.ls * PX));
      for (const s of segs(text)) {
        const f = s === '☎' ? F.sym : F[st.fw];
        page.drawText(s, { x: cx, y, size: st.fs * PX, font: f, color: col(st.c) });
        cx += f.widthOfTextAtSize(s, st.fs * PX) + st.ls * PX * [...s].length;
      }
      page.pushOperators(PDFLib.setCharacterSpacing(0));
      return cx / PX - off.x;
    }
    const baseOf = (r) => r.y + Math.round(r.fs * ASC);
    function fit(F, st, text, max) {
      if (width(F, st, text) <= max) return text;
      const a = [...text];
      while (a.length > 1 && width(F, st, a.join('') + '…') > max) a.pop();
      return a.join('') + '…';
    }
    function blank(page, st, x, base, wmm, off) {
      off = off || { x: 0, y: 0 };
      const H = page.getHeight(); const y = H - (base + off.y + 3) * PX;
      page.drawLine({ start: { x: (x + off.x) * PX, y }, end: { x: (x + off.x) * PX + wmm / 25.4 * 72, y }, thickness: 0.7, color: col(st.c) });
    }

    async function proposal(store, key, opt) {
      key = key || 'dongji';
      const doc = await PDFLib.PDFDocument.load(assets.props[key]);
      const LP = key === 'dongji' ? L.prop : L.su[key];
      const F = await fontsFor(doc);
      const brand = store.bj ? '본죽&비빔밥' : '본죽';
      const logo = await doc.embedPng(store.bj ? assets.logos.bjbb : assets.logos.bonjuk);
      const pages = doc.getPages();
      const byPage = {};
      for (const m of LP) (byPage[m.page] = byPage[m.page] || []).push(m);
      for (const [pn, items] of Object.entries(byPage)) {
        const page = pages[pn - 1];
        for (const m of items) {
          if (!m.runs.length) { // 로고
            const h = m.h, w = h * logo.width / logo.height;
            const x = pn == 1 ? m.x + m.w - w : m.x; // 표지는 오른쪽 맞춤
            page.drawImage(logo, { x: x * PX, y: page.getHeight() - (m.y + h) * PX, width: w * PX, height: h * PX });
            continue;
          }
          const r0 = m.runs[0], b0 = baseOf(r0);
          const telLine = (st, x, base, pre) => {
            const end = draw(page, F, st, pre || '☎ ', x, base);
            if (store.tel) draw(page, F, st, store.tel, end, base); else blank(page, st, end + 4, base, 36);
          };
          if (m.runs.length === 3) { // 표지: 브랜드 + 매장(굵게) + 드림
            let x = draw(page, F, r0, brand + ' ', r0.x, b0);
            x = draw(page, F, m.runs[1], store.s, x, b0);
            draw(page, F, m.runs[2], ' 드림', x, b0);
          } else if (r0.t.startsWith('☎')) telLine(r0, r0.x, b0);
          else {
            draw(page, F, r0, brand + ' ' + store.s, r0.x, b0);
            if (m.runs[1]) telLine(m.runs[1], m.runs[1].x, baseOf(m.runs[1]));
          }
        }
      }
      if (opt && opt.to) { // 표지 '____ 스님께 / 귀중 / 께' 줄 위에 받는 곳 이름
        const pg = pages[0], H = pg.getHeight(), f = opt.font ? await doc.embedFont(opt.font, { subset: false }) : F[700]; // opt.font: 한글 전체 글꼴(드문 글자도 나오게). subset: true는 이 fontkit에서 글자가 빠짐(2026-11-18 확인)
        const R = key === 'dongji' ? { x0: 468.0, x1: 603.7, sx: 609.5, fs: 12.49, c: [47, 38, 34] } : { x0: 428.2, x1: 564.0, sx: 569.9, fs: 13, c: [26, 26, 26] };
        const ink = C3(R.c), max = R.x1 - R.x0 - 4;
        let t = String(opt.to).trim(), size = 15;
        while (size > 9 && f.widthOfTextAtSize(t, size) > max) size -= 0.5;
        if (f.widthOfTextAtSize(t, size) > max) { const a = [...t]; while (a.length > 1 && f.widthOfTextAtSize(a.join('') + '…', size) > max) a.pop(); t = a.join('') + '…'; }
        const w = f.widthOfTextAtSize(t, size);
        pg.drawText(t, { x: (R.x0 + R.x1) / 2 - w / 2, y: H - 456.6, size, font: f, color: ink });
        if (opt.suffix) { // 절이 아닌 곳: '스님께'를 지우고 다른 말로
          pg.drawRectangle({ x: R.sx - 1, y: H - 462, width: 40, height: 18, color: C3([254, 241, 225]) });
          pg.drawText(opt.suffix, { x: R.sx, y: H - (446.5 + R.fs * ASC), size: R.fs, font: F[400], color: ink });
        }
      }
      doc.setTitle(store.s + ' ' + (key === 'dongji' ? '동지' : key.replace('_', ' ')) + ' 제안서' + (opt && opt.to ? ' · ' + opt.to : ''));
      return doc.save();
    }

    async function kit(store, temples, opt) { // opt.rows: 절 목록 뒤에 붙일 '연락할 곳' 쪽(tkit 줄 형식), opt.meta: {event,color,asof}
      const doc = await PDFLib.PDFDocument.load(assets.list);
      const F = await fontsFor(doc);
      const page = doc.getPages()[0], O = LIST_OFF;
      const get = (k) => L.list.filter((m) => m.key === k);
      const h1 = get('H1')[0].runs[0];
      draw(page, F, h1, store.s, h1.x, baseOf(h1), O);
      const prs = L.list.filter((m) => m.key.startsWith('pr')), names = get('B'), ads = get('ad'), tls = get('tl'), evs = get('ev');
      if (!temples.length) {
        const r = names[0].runs[0];
        draw(page, F, { ...r, fw: 700 }, '이 매장 가까이에서 찾은 절이 아직 없습니다. 직접 찾은 곳을 아래에 적어 두세요.', r.x, baseOf(r), O);
      }
      temples.forEach((t, i) => {
        if (i >= prs.length) return;
        const p = prs[i], H = page.getHeight();
        const cx = (p.x + p.w / 2 + O.x) * PX, cy = H - (p.y + p.h / 2 + O.y) * PX;
        page.drawCircle({ x: cx, y: cy, size: p.w / 2 * PX, color: C3(GRADE[t.p] || GRADE.C) });
        const pl = p.runs[0], lw = width(F, pl, t.p);
        draw(page, F, pl, t.p, p.x + (p.w - lw) / 2, baseOf(pl), O);
        const nr = names[i].runs[0], ar = ads[i].runs[0], tr = tls[i].runs[0], dr = tls[i].runs[1], er = evs[i].runs[0];
        draw(page, F, nr, fit(F, nr, t.name, ads[i].w), nr.x, baseOf(nr), O);
        draw(page, F, ar, fit(F, ar, t.addr, ads[i].w), ar.x, baseOf(ar), O);
        const gap = dr.x - (tr.x + tr.w);
        const end = draw(page, F, tr, t.tel || '전화 없음', tr.x, baseOf(tr), O);
        const dist = t.d.toFixed(1) + 'km' + (t.ov ? ' · ' + t.ov + '과 겹침' : '');
        draw(page, F, dr, fit(F, dr, dist, ads[i].w - (end - tr.x) - gap), end + gap, baseOf(tr) + (baseOf(dr) - baseOf(tr)), O);
        if (t.ev) draw(page, F, er, fit(F, er, '작년 기록(확인 필요) · ' + t.ev, evs[i].w), er.x, baseOf(er), O);
      });
      if (opt && opt.rows) { // 동지 통합(2026-11-21): 절 목록 다음 쪽에 나눔 단체 연락할 곳
        const e0 = await (await PDFLib.PDFDocument.create()).save({ addDefaultPage: false });
        const cd = await PDFLib.PDFDocument.load(await tkit(store, opt.rows, e0, opt.meta || {}));
        (await doc.copyPages(cd, cd.getPageIndices())).forEach((pg) => doc.addPage(pg));
      }
      const bk = await PDFLib.PDFDocument.load(assets.booklet);
      (await doc.copyPages(bk, bk.getPageIndices())).forEach((pg) => doc.addPage(pg));
      doc.setTitle(store.s + ' 사장님 실행 키트');
      return doc.save();
    }
    // 매장 근처 '연락할 곳' 쪽(A4 세로 1쪽)을 그려 공통 키트 앞에 붙입니다. rows: [구분, 이름, 전화, 거리km, 주소, 권할 제안서]
    async function tkit(store, rows, kitBytes, meta) {
      const doc = await PDFLib.PDFDocument.create();
      doc.registerFontkit(fontkit);
      const R = await doc.embedFont(assets.tfonts[400], { subset: false }), B = await doc.embedFont(assets.tfonts[700], { subset: false });
      const W = 595.28, H = 841.89, M = 34, pg = doc.addPage([W, H]);
      const hex = (h) => PDFLib.rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
      const C = hex(meta.color || '#6E0E00'), INK = hex('#1d1d1f'), SUB = hex('#5f5f64'), LINE = hex('#d9d9de'), SOFT = hex('#f5f5f7');
      const T = (t, x, y, size, f, color) => { t = String(t || ''); pg.drawText(t, { x, y, size, font: f || R, color: color || INK }); return f ? f.widthOfTextAtSize(t, size) : R.widthOfTextAtSize(t, size); };
      const cut = (t, f, size, max) => { t = String(t || ''); if (f.widthOfTextAtSize(t, size) <= max) return t; const a = [...t]; while (a.length > 1 && f.widthOfTextAtSize(a.join('') + '…', size) > max) a.pop(); return a.join('') + '…'; };
      pg.drawRectangle({ x: 0, y: H - 10, width: W, height: 10, color: C });
      T(meta.event + ' · 사장님용', M, H - 42, 10, B, C);
      T(cut(store.s + ' 근처 연락할 곳', B, 21, W - 2 * M), M, H - 70, 21, B);
      T('위에서부터 차례로 전화하세요. 같은 구분 안에서는 매장에서 가까운 순입니다. 통화한 날과 결과를 오른쪽 칸에 적어 두세요.', M, H - 90, 9.5, R, SUB);
      const cols = [[M, 22, '번호'], [M + 22, 50, '구분'], [M + 72, 205, '이름 · 주소'], [M + 277, 86, '전화'], [M + 363, 38, '거리'], [M + 401, 58, '권할 제안서'], [M + 459, W - M - (M + 459), '통화 메모']];
      let y = H - 118;
      pg.drawRectangle({ x: M, y: y - 6, width: W - 2 * M, height: 20, color: SOFT });
      cols.forEach(([x, , t]) => T(t, x + 3, y, 8.5, B, SUB));
      y -= 12;
      const rh = Math.min(38, (y - 70) / Math.max(rows.length + 2, 12));
      if (!rows.length) { T('카카오맵에서 이 매장 가까이(3km) 찾은 곳이 없습니다. 사장님이 아는 곳을 아래에 적어 두세요.', M + 3, y - 18, 10, B); y -= 26; }
      rows.forEach((r, i) => {
        const top = y, mid = top - rh / 2;
        pg.drawLine({ start: { x: M, y: top - rh }, end: { x: W - M, y: top - rh }, thickness: 0.5, color: LINE });
        T(String(i + 1), cols[0][0] + 5, mid - 3, 9.5, B, SUB);
        T(cut(r[0], B, 9, 46), cols[1][0] + 3, mid - 3, 9, B, C);
        T(cut(r[1], B, 10.5, 200), cols[2][0] + 3, mid + 2, 10.5, B);
        T(cut(r[4], R, 7.5, 200), cols[2][0] + 3, mid - 9, 7.5, R, SUB);
        T(r[2] || '전화 없음', cols[3][0] + 3, mid - 3, r[2] ? 10 : 8.5, r[2] ? B : R, r[2] ? INK : SUB);
        T((+r[3]).toFixed(1) + 'km', cols[4][0] + 3, mid - 3, 9, R, SUB);
        T(cut(r[5], B, 8.5, 56), cols[5][0] + 3, mid - 3, 8.5, B, C);
        pg.drawRectangle({ x: cols[6][0] + 3, y: top - rh + 5, width: cols[6][1] - 3, height: rh - 10, borderColor: LINE, borderWidth: 0.6 });
        y -= rh;
      });
      for (let k = 0; k < 2 && y - rh > 64; k++) { // 사장님이 아는 곳을 적는 빈 줄
        pg.drawLine({ start: { x: M, y: y - rh }, end: { x: W - M, y: y - rh }, thickness: 0.5, color: LINE });
        T('직접', cols[1][0] + 3, y - rh / 2 - 3, 9, B, SUB); y -= rh;
      }
      T('카카오맵 검색 결과(' + (meta.asof || '2026년 11월') + ')입니다. 전화번호가 바뀌었거나 문을 닫았을 수 있으니 통화 전에 확인하세요.', M, 46, 8, R, SUB);
      T('공공기관(경찰·소방·행정복지센터 등)은 그 기관 예산으로 사는 주문만 받습니다. 목록에 없어도 사장님이 아는 곳이 있으면 먼저 연락하세요.', M, 34, 8, R, SUB);
      const kd = await PDFLib.PDFDocument.load(kitBytes);
      (await doc.copyPages(kd, kd.getPageIndices())).forEach((p) => doc.addPage(p));
      doc.setTitle(store.s + ' ' + meta.event + ' 실행 키트');
      return doc.save();
    }
    return { proposal, kit, tkit };
  }
  if (typeof module !== 'undefined') module.exports = Gen; else root.HubGen = Gen;
})(this);
