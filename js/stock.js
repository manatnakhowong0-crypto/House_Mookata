// =============================================================
// stock.js — ระบบจัดการสต็อกวัตถุดิบ
// =============================================================

const Stock = (() => {
  const STORAGE_KEY = 'mookata_stock';
  const LOG_KEY     = 'mookata_stock_log';

  // Default ต้นทุน/หน่วย/เตือนที่ ต่อ item id
  const DEFAULTS = {
    // เซ็ต — ไม่ track สต็อก (ประกอบจากของอื่น) แต่ใส่ไว้เผื่อ
    set1: { unit:'ชุด', low: 5, cost:120 }, set2: { unit:'ชุด', low: 5, cost:180 },
    set3: { unit:'ชุด', low: 3, cost:240 }, set4: { unit:'ครั้ง', low:99, cost:0 },
    // Add On
    a01: { unit:'จาน', low:10, cost:30 }, a02: { unit:'จาน', low:10, cost:30 },
    a03: { unit:'จาน', low: 8, cost:32 }, a04: { unit:'จาน', low: 8, cost:32 },
    a05: { unit:'จาน', low: 8, cost:32 }, a06: { unit:'จาน', low: 8, cost:35 },
    a07: { unit:'จาน', low: 8, cost:35 }, a08: { unit:'จาน', low: 8, cost:28 },
    a09: { unit:'จาน', low: 5, cost:35 }, a10: { unit:'จาน', low: 5, cost:38 },
    // ลูกชิ้น
    b01: { unit:'จาน', low:10, cost:10 }, b02: { unit:'จาน', low:10, cost:10 },
    b03: { unit:'จาน', low:10, cost:10 }, b04: { unit:'จาน', low:10, cost:10 },
    b05: { unit:'จาน', low: 8, cost:25 },
    // ผัก
    v01: { unit:'เซ็ต', low:10, cost:25 }, v02: { unit:'จาน', low:10, cost:10 },
    v03: { unit:'จาน', low:10, cost:10 }, v04: { unit:'จาน', low:10, cost:10 },
    v05: { unit:'จาน', low:10, cost:10 }, v06: { unit:'จาน', low:10, cost:10 },
    v07: { unit:'จาน', low:10, cost:10 }, v08: { unit:'จาน', low:10, cost:10 },
    v09: { unit:'จาน', low:10, cost: 8 }, v10: { unit:'ฟอง', low:20, cost: 5 },
    // ทานเล่น
    f01: { unit:'จาน', low: 8, cost:35 }, f02: { unit:'จาน', low: 8, cost:38 },
    f03: { unit:'จาน', low: 8, cost:38 },
    // เครื่องดื่ม
    d01: { unit:'ขวด', low:12, cost:10 }, d02: { unit:'ขวด', low:12, cost:10 },
    d03: { unit:'ขวด', low:12, cost:10 }, d04: { unit:'ขวด', low:12, cost:12 },
    d05: { unit:'ขวด', low: 8, cost:22 }, d06: { unit:'ขวด', low:12, cost:12 },
    d07: { unit:'ขวด', low: 8, cost:22 }, d08: { unit:'ขวด', low:24, cost: 5 },
    d09: { unit:'ขวด', low:12, cost:10 }, d10: { unit:'ขวด', low:12, cost:45 },
    d11: { unit:'ขวด', low:12, cost:45 }, d12: { unit:'ขวด', low: 8, cost:52 },
    d13: { unit:'ถัง', low: 5, cost:10 },
  };

  function _load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'); } catch { return {}; } }
  function _save(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

  function getItem(id) {
    const def = DEFAULTS[id] || { unit:'ชิ้น', low:5, cost:0 };
    return { qty: 0, ...def, ...(_load()[id] || {}) };
  }

  function getAll() {
    const all = _load();
    const ids = new Set([...Object.keys(DEFAULTS), ...Object.keys(all)]);
    const res = {};
    ids.forEach(id => { res[id] = getItem(id); });
    return res;
  }

  function setQty(id, qty) {
    const all = _load();
    all[id] = { ...getItem(id), qty: Math.max(0, qty) };
    _save(all);
    _log({ action:'set', id, qty, ts: Date.now() });
    _emit();
  }

  function addQty(id, amount) {
    const cur = getItem(id);
    const nq  = cur.qty + amount;
    const all = _load();
    all[id]   = { ...cur, qty: Math.max(0, nq) };
    _save(all);
    _log({ action:'add', id, amount, newQty: nq, ts: Date.now() });
    _emit();
  }

  function setLow(id, low) {
    const all = _load();
    all[id] = { ...getItem(id), low: Math.max(1, low) };
    _save(all);
  }

  // หักสต็อกเมื่อ confirm order — คืน list ที่ใกล้หมด
  function deduct(items, orderId = '') {
    const all     = _load();
    const lowList = [];
    items.forEach(({ id, qty }) => {
      const cur  = getItem(id);
      const newQ = Math.max(0, cur.qty - qty);
      all[id]    = { ...cur, qty: newQ };
      if (newQ <= cur.low) {
        const mi = _flatMenu()[id];
        lowList.push({ id, qty: newQ, unit: cur.unit, name: mi?.name||id, emoji: mi?.emoji||'📦' });
      }
    });
    _save(all);
    _log({ action:'deduct', orderId, items, ts: Date.now() });
    _emit();
    return lowList;
  }

  function getLowStock() {
    const menu = _flatMenu();
    return Object.entries(getAll())
      .filter(([, s]) => s.qty > 0 && s.qty <= s.low)
      .map(([id, s]) => ({ id, ...s, name: menu[id]?.name||id, emoji: menu[id]?.emoji||'📦' }));
  }

  function getOutOfStock() {
    const menu = _flatMenu();
    return Object.entries(getAll())
      .filter(([, s]) => s.qty === 0)
      .map(([id, s]) => ({ id, ...s, name: menu[id]?.name||id, emoji: menu[id]?.emoji||'📦' }));
  }

  function _log(e) {
    try {
      const l = JSON.parse(localStorage.getItem(LOG_KEY)||'[]');
      l.push(e);
      if (l.length > 500) l.splice(0, l.length - 500);
      localStorage.setItem(LOG_KEY, JSON.stringify(l));
    } catch {}
  }

  function getLogs(limit = 30) {
    try { return JSON.parse(localStorage.getItem(LOG_KEY)||'[]').slice(-limit).reverse(); }
    catch { return []; }
  }

  const _listeners = [];
  function onChange(fn) { _listeners.push(fn); }
  function _emit() { _listeners.forEach(fn => fn(getAll())); }

  function _flatMenu() {
    const m = {};
    Object.values(MENU_DATA).forEach(s => s.items.forEach(i => { m[i.id] = i; }));
    return m;
  }

  function toSheetPayload() {
    const menu = _flatMenu();
    return Object.entries(getAll()).map(([id, s]) => ({
      id, name: menu[id]?.name||id, emoji: menu[id]?.emoji||'',
      type: id.startsWith('d') ? 'เครื่องดื่ม' : 'หมูกระทะ',
      qty: s.qty, unit: s.unit, low: s.low, cost: s.cost||0,
    }));
  }

  return { getItem, getAll, setQty, addQty, setLow, deduct, getLowStock, getOutOfStock, getLogs, onChange, toSheetPayload };
})();

// =============================================================
// StockUI — Modal UI สำหรับจัดการสต็อก
// =============================================================
const StockUI = (() => {

  function _flatMenu() {
    const m = {};
    Object.values(MENU_DATA).forEach(s => s.items.forEach(i => { m[i.id] = i; }));
    return m;
  }

  function open() {
    inject();
    document.getElementById('js-stock-modal').classList.add('open');
    goTo('overview');
  }

  function close() {
    const m = document.getElementById('js-stock-modal');
    if (m) m.classList.remove('open');
  }

  function goTo(page) {
    document.querySelectorAll('.stock-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.page === page));
    const body = document.getElementById('js-stock-body');
    if (!body) return;
    if (page === 'overview') body.innerHTML = _buildOverview();
    if (page === 'adjust')   body.innerHTML = _buildAdjust();
    if (page === 'receive')  body.innerHTML = _buildReceive();
    if (page === 'sync')     body.innerHTML = _buildSync();
    _attachEvents(page);
  }

  // ── Overview ──────────────────────────────────────────────
  function _buildOverview() {
    const all  = Stock.getAll();
    const menu = _flatMenu();
    const low  = new Set(Stock.getLowStock().map(i => i.id));
    const out  = new Set(Stock.getOutOfStock().map(i => i.id));

    const mooRows   = _buildSection(all, menu, low, out, 'moo');
    const drinkRows = _buildSection(all, menu, low, out, 'drink');

    return `
      <div class="ov-strip">
        <div class="ov-chip green"><span id="cnt-ok">${Object.values(all).filter(s=>s.qty>s.low).length}</span>ปกติ</div>
        <div class="ov-chip orange"><span>${low.size}</span>ใกล้หมด</div>
        <div class="ov-chip red"><span>${out.size}</span>หมดแล้ว</div>
        <div class="ov-chip blue"><span>${Object.keys(all).length}</span>รายการรวม</div>
      </div>

      ${low.size > 0 ? `<div class="stock-alert">⚠️ <strong>ใกล้หมด:</strong>
        ${Stock.getLowStock().map(i=>`${i.emoji}${i.name} (${i.qty} ${i.unit})`).join(' · ')}
      </div>` : ''}

      <div class="ov-section-label">🥩 หมูกระทะ</div>
      <div class="stock-table-wrap">
        <table class="stock-table">
          <thead><tr><th>รายการ</th><th>คงเหลือ</th><th>หน่วย</th><th>สถานะ</th><th>ต้นทุน/หน่วย</th></tr></thead>
          <tbody>${mooRows}</tbody>
        </table>
      </div>

      <div class="ov-section-label" style="margin-top:16px">🥤 เครื่องดื่ม</div>
      <div class="stock-table-wrap">
        <table class="stock-table">
          <thead><tr><th>รายการ</th><th>คงเหลือ</th><th>หน่วย</th><th>สถานะ</th><th>ต้นทุน/หน่วย</th></tr></thead>
          <tbody>${drinkRows}</tbody>
        </table>
      </div>`;
  }

  function _buildSection(all, menu, low, out, type) {
    return Object.entries(all)
      .filter(([id]) => type === 'moo' ? !id.startsWith('d') : id.startsWith('d'))
      .map(([id, s]) => {
        const item    = menu[id];
        if (!item) return '';
        const isOut   = out.has(id);
        const isLow   = low.has(id);
        const pct     = s.low > 0 ? Math.min(100, Math.round(s.qty / (s.low * 3) * 100)) : 100;
        const barClr  = isOut ? '#ef4444' : isLow ? '#f97316' : '#22c55e';
        const badge   = isOut
          ? `<span class="s-badge out">หมด</span>`
          : isLow
            ? `<span class="s-badge low">ใกล้หมด</span>`
            : `<span class="s-badge ok">ปกติ</span>`;
        return `
          <tr>
            <td><span class="s-thumb">${item.img ? `<img src="${item.img}" alt="" onerror="this.outerHTML='${item.emoji}'">` : item.emoji}</span> ${item.name}</td>
            <td class="s-qty ${isOut?'c-red':isLow?'c-orange':'c-green'}">${s.qty}</td>
            <td>${s.unit}</td>
            <td>
              <div class="s-bar-wrap"><div class="s-bar" style="width:${pct}%;background:${barClr}"></div></div>
              <div style="font-size:10px;color:#94a3b8">เตือน ≤ ${s.low}</div>
            </td>
            <td style="color:#64748b">฿${s.cost||0}</td>
          </tr>`;
      }).join('');
  }

  // ── Adjust ────────────────────────────────────────────────
  function _buildAdjust() {
    const all  = Stock.getAll();
    const menu = _flatMenu();

    const mkCards = (type) => Object.entries(all)
      .filter(([id]) => type === 'moo' ? !id.startsWith('d') : id.startsWith('d'))
      .map(([id, s]) => {
        const item = menu[id];
        if (!item) return '';
        const isOut = s.qty === 0;
        const isLow = s.qty > 0 && s.qty <= s.low;
        return `
          <div class="adj-card ${isOut?'adj-out':isLow?'adj-low':''}">
            <div class="adj-top">
              <span class="adj-emoji">${item.emoji}</span>
              <span class="adj-name">${item.name}</span>
            </div>
            <div class="adj-mid">
              <button class="adj-btn" data-id="${id}" data-delta="-5">−5</button>
              <button class="adj-btn" data-id="${id}" data-delta="-1">−</button>
              <input class="adj-input" type="number" min="0" data-id="${id}" value="${s.qty}">
              <button class="adj-btn" data-id="${id}" data-delta="1">+</button>
              <button class="adj-btn" data-id="${id}" data-delta="5">+5</button>
            </div>
            <div class="adj-bot">
              <span style="font-size:11px;color:#94a3b8">${s.unit} · เตือนที่</span>
              <input class="adj-low-inp" type="number" min="1" data-id="${id}" value="${s.low}" style="width:40px;font-size:12px;border:1px solid #e2e8f0;border-radius:4px;padding:2px 4px;text-align:center">
              <span style="font-size:11px;color:#94a3b8">${s.unit}</span>
            </div>
          </div>`;
      }).join('');

    return `
      <div style="padding:14px 20px;background:#fdf8e8;border-bottom:1px solid #e8d97a;font-size:13px;color:#92400e">
        💡 แตะ +/− หรือพิมพ์จำนวนตรง แล้วกด <strong>บันทึก</strong>
      </div>
      <div style="padding:12px 20px 4px;font-weight:700;color:#0A2540;font-size:13px">🥩 หมูกระทะ</div>
      <div class="adj-grid">${mkCards('moo')}</div>
      <div style="padding:12px 20px 4px;font-weight:700;color:#1A6B9A;font-size:13px;border-top:1px solid #e2e8f0">🥤 เครื่องดื่ม</div>
      <div class="adj-grid">${mkCards('drink')}</div>
      <div class="adj-footer">
        <button class="stock-save-btn" id="adj-save-btn">💾 บันทึกทั้งหมด</button>
      </div>`;
  }

  // ── Receive ───────────────────────────────────────────────
  function _buildReceive() {
    const all  = Stock.getAll();
    const menu = _flatMenu();
    const opts = Object.entries(all).map(([id, s]) => {
      const item = menu[id];
      if (!item) return '';
      return `<option value="${id}">${item.emoji} ${item.name} (คงเหลือ ${s.qty} ${s.unit})</option>`;
    }).join('');

    const logs = Stock.getLogs(12);
    const logHTML = logs.length === 0
      ? `<div style="color:#94a3b8;font-size:13px;padding:10px">ยังไม่มีประวัติ</div>`
      : logs.map(log => {
          const d    = new Date(log.ts);
          const time = `${d.getDate()}/${d.getMonth()+1} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
          const item = menu[log.id];
          if (log.action === 'add')
            return `<div class="rcv-log-row"><span class="log-time">${time}</span> 📥 รับ <b>${item?.name||log.id}</b> +${log.amount} ${Stock.getItem(log.id).unit}</div>`;
          if (log.action === 'set')
            return `<div class="rcv-log-row"><span class="log-time">${time}</span> ✏️ ตั้งค่า <b>${item?.name||log.id}</b> = ${log.qty}</div>`;
          if (log.action === 'deduct')
            return `<div class="rcv-log-row"><span class="log-time">${time}</span> 🛒 หักออเดอร์ ${log.orderId||''}</div>`;
          return '';
        }).join('');

    return `
      <div class="rcv-form">
        <div class="rf-row">
          <div class="rf-group">
            <label>เลือกสินค้า</label>
            <select id="rcv-sel" class="rf-select">${opts}</select>
          </div>
          <div class="rf-group" style="flex:0 0 120px">
            <label>จำนวนที่รับ</label>
            <div style="display:flex;align-items:center;gap:6px">
              <input id="rcv-qty" type="number" min="1" value="1" class="rf-input">
              <span id="rcv-unit" style="font-size:13px;color:#64748b;white-space:nowrap">ชิ้น</span>
            </div>
          </div>
          <div class="rf-group" style="align-self:flex-end">
            <button class="stock-save-btn" id="rcv-btn">✅ บันทึก</button>
          </div>
        </div>
      </div>

      <div style="padding:12px 20px">
        <div style="font-size:13px;font-weight:700;color:#0A2540;margin-bottom:8px">📋 ประวัติล่าสุด</div>
        <div class="rcv-log-list">${logHTML}</div>
      </div>`;
  }

  // ── Sync ──────────────────────────────────────────────────
  function _buildSync() {
    return `
      <div style="padding:20px">
        <div class="sync-card">
          <div style="font-size:28px">📊</div>
          <div>
            <div style="font-weight:700;color:#0A2540;margin-bottom:4px">ซิงค์สต็อกไป Google Sheets</div>
            <div style="font-size:13px;color:#64748b;line-height:1.7">
              ส่งข้อมูลสต็อกปัจจุบันทั้งหมดไปบันทึกใน Sheet <strong>สต็อก</strong><br>
              ข้อมูลจะถูก<strong>เขียนทับ</strong>แถวเดิม (อัปเดตแทนที่)
            </div>
            <button class="stock-save-btn" id="sync-btn" style="margin-top:12px">☁️ ส่งสต็อกไป Sheets</button>
            <div id="sync-result" style="margin-top:10px;font-size:13px"></div>
          </div>
        </div>

        <hr style="margin:20px 0;border:none;border-top:1px solid #e2e8f0">

        <div style="font-weight:700;color:#0A2540;margin-bottom:6px">⬇️ Export CSV</div>
        <div style="font-size:13px;color:#64748b;margin-bottom:10px">ดาวน์โหลดสต็อกเปิดใน Excel/Sheets ได้เลย</div>
        <button class="stock-save-btn" id="csv-btn" style="background:#0A2540">📥 Download CSV</button>
      </div>`;
  }

  // ── Attach events ─────────────────────────────────────────
  function _attachEvents(page) {
    if (page === 'adjust') {
      document.querySelectorAll('.adj-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const inp = document.querySelector(`.adj-input[data-id="${btn.dataset.id}"]`);
          if (inp) inp.value = Math.max(0, parseInt(inp.value||0) + parseInt(btn.dataset.delta));
        });
      });
      document.getElementById('adj-save-btn')?.addEventListener('click', () => {
        document.querySelectorAll('.adj-input').forEach(i => Stock.setQty(i.dataset.id, parseInt(i.value||0)));
        document.querySelectorAll('.adj-low-inp').forEach(i => Stock.setLow(i.dataset.id, parseInt(i.value||1)));
        Toast.show('✅ บันทึกสต็อกแล้ว');
        goTo('overview');
      });
    }

    if (page === 'receive') {
      const sel = document.getElementById('rcv-sel');
      const updateUnit = () => {
        const u = document.getElementById('rcv-unit');
        if (u) u.textContent = Stock.getItem(sel.value).unit;
      };
      sel?.addEventListener('change', updateUnit);
      updateUnit();

      document.getElementById('rcv-btn')?.addEventListener('click', () => {
        const id  = sel.value;
        const qty = parseInt(document.getElementById('rcv-qty').value||0);
        if (qty <= 0) { Toast.show('⚠️ ระบุจำนวนที่รับเข้า'); return; }
        Stock.addQty(id, qty);
        const item = _flatMenu()[id];
        Toast.show(`✅ รับ ${item?.name||id} +${qty} ${Stock.getItem(id).unit}`);
        goTo('receive');
      });
    }

    if (page === 'sync') {
      document.getElementById('sync-btn')?.addEventListener('click', async () => {
        const btn = document.getElementById('sync-btn');
        const res = document.getElementById('sync-result');
        btn.disabled = true; btn.textContent = '⏳ กำลังส่ง...';
        const url = Settings.get('scriptUrl');
        if (!url) { res.textContent = '⚠️ ยังไม่ตั้งค่า URL'; res.style.color='#f97316'; btn.disabled=false; btn.textContent='☁️ ส่งสต็อกไป Sheets'; return; }
        try {
          await fetch(url, { method:'POST', mode:'no-cors', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'stock_adjust', stock: Stock.toSheetPayload() }) });
          res.textContent = '✅ ส่งสำเร็จแล้ว';
          res.style.color = '#22c55e';
        } catch(e) {
          res.textContent = '❌ ' + e.message;
          res.style.color = '#ef4444';
        }
        btn.disabled=false; btn.textContent='☁️ ส่งสต็อกไป Sheets';
      });

      document.getElementById('csv-btn')?.addEventListener('click', () => {
        const rows = Stock.toSheetPayload();
        const csv  = ['ID,ชื่อ,ประเภท,คงเหลือ,หน่วย,เตือนที่,ต้นทุน', ...rows.map(r=>[r.id,r.name,r.type,r.qty,r.unit,r.low,r.cost].join(','))].join('\n');
        const a    = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'})), download: `stock_${new Date().toISOString().slice(0,10)}.csv` });
        a.click();
      });
    }
  }

  // ── Inject modal HTML ─────────────────────────────────────
  function inject() {
    if (document.getElementById('js-stock-modal')) return;
    const el = document.createElement('div');
    el.id = 'js-stock-modal';
    el.className = 'modal-overlay';
    el.innerHTML = `
      <div class="stock-modal">
        <div class="stock-hdr">
          <span>📦 จัดการสต็อกวัตถุดิบ</span>
          <button class="stock-hdr-close" onclick="StockUI.close()">✕</button>
        </div>
        <div class="stock-tabs">
          <button class="stock-tab active" data-page="overview" onclick="StockUI.goTo('overview')">📋 ภาพรวม</button>
          <button class="stock-tab" data-page="adjust"   onclick="StockUI.goTo('adjust')">✏️ แก้ไข</button>
          <button class="stock-tab" data-page="receive"  onclick="StockUI.goTo('receive')">📥 รับของ</button>
          <button class="stock-tab" data-page="sync"     onclick="StockUI.goTo('sync')">☁️ ซิงค์</button>
        </div>
        <div class="stock-body" id="js-stock-body"></div>
      </div>`;
    document.body.appendChild(el);
    el.addEventListener('click', e => { if (e.target === el) close(); });
  }

  return { open, close, goTo, inject };
})();
