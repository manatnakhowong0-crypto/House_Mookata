// =============================================================
// sales.js — บิลค้างจ่าย + สรุปยอดขาย
// =============================================================
//
//  Bills    : เก็บบิลใน localStorage (mookata_bills)
//             แต่ละบิล = { id, target, items, total, orderId, ts, paid, paidTs, payMethod }
//  SalesView: Modal แสดงยอดขายวันนี้ + บิลค้างจ่าย + ประวัติจ่ายแล้ว
// =============================================================

const Bills = (() => {
  const KEY = 'mookata_bills';

  function _load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
  function _save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }

  function add(bill) {
    const list = _load();
    list.push({ ...bill, id: bill.orderId || ('B' + Date.now()), paid: false });
    if (list.length > 500) list.splice(0, list.length - 500);
    _save(list);
    _emit();
  }

  function markPaid(id, payMethod = 'เงินสด') {
    const list = _load();
    const b = list.find(x => x.id === id);
    if (b) { b.paid = true; b.paidTs = Date.now(); b.payMethod = payMethod; }
    _save(list);
    _emit();
  }

  function remove(id) {
    _save(_load().filter(x => x.id !== id));
    _emit();
  }

  function getAll()      { return _load(); }
  function getUnpaid()   { return _load().filter(b => !b.paid); }
  function getPaid()     { return _load().filter(b => b.paid); }

  function getByDate(dateStr) {
    return _load().filter(b => {
      const d = new Date(b.ts);
      const s = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return s === dateStr;
    });
  }
  function getByMonth(year, month) {
    return _load().filter(b => {
      const d = new Date(b.ts);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }
  function getByYear(year) {
    return _load().filter(b => new Date(b.ts).getFullYear() === year);
  }
  function updateBill(id, updates) {
    const list = _load();
    const idx = list.findIndex(b => b.id === id);
    if (idx >= 0) { list[idx] = { ...list[idx], ...updates }; _save(list); _emit(); }
  }

  // บิลของ "วันนี้"
  function _isToday(ts) {
    const d = new Date(ts), n = new Date();
    return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }
  function getTodayPaid()   { return getPaid().filter(b => _isToday(b.paidTs || b.ts)); }
  function getTodayAll()    { return getAll().filter(b => _isToday(b.ts)); }

  const _listeners = [];
  function onChange(fn) { _listeners.push(fn); }
  function _emit() { _listeners.forEach(fn => fn()); }

  return { add, markPaid, remove, getAll, getUnpaid, getPaid, getTodayPaid, getTodayAll, getByDate, getByMonth, getByYear, updateBill, onChange };
})();


// =============================================================
// SalesView — Modal ยอดขาย + บิลค้างจ่าย
// =============================================================
const SalesView = (() => {

  function open() {
    inject();
    document.getElementById('js-sales-modal').classList.add('open');
    goTo('unpaid');
  }
  function close() {
    document.getElementById('js-sales-modal')?.classList.remove('open');
  }

  function goTo(page) {
    document.querySelectorAll('.sales-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.page === page));
    const body = document.getElementById('js-sales-body');
    if (!body) return;
    if (page === 'summary') body.innerHTML = _buildSummary();
    if (page === 'unpaid')  body.innerHTML = _buildUnpaid();
    if (page === 'paid')    body.innerHTML = _buildPaid();
    _attach(page);
  }

  // ── สรุปยอดขายวันนี้ ──────────────────────────────────────
  function _buildSummary() {
    const paid   = Bills.getTodayPaid();
    const unpaid = Bills.getUnpaid();
    const paidTotal   = paid.reduce((s, b) => s + b.total, 0);
    const unpaidTotal = unpaid.reduce((s, b) => s + b.total, 0);

    // แยกยอดตามวิธีจ่าย
    const cash     = paid.filter(b => b.payMethod === 'เงินสด').reduce((s,b)=>s+b.total,0);
    const transfer = paid.filter(b => b.payMethod === 'โอน').reduce((s,b)=>s+b.total,0);

    // นับเมนูขายดี
    const itemCount = {};
    paid.forEach(b => (b.items||[]).forEach(it => {
      itemCount[it.name] = (itemCount[it.name]||0) + it.qty;
    }));
    const topItems = Object.entries(itemCount).sort((a,b)=>b[1]-a[1]).slice(0,5);

    return `
      <div class="sv-cards">
        <div class="sv-card green">
          <div class="sv-card-label">ยอดขายวันนี้ (จ่ายแล้ว)</div>
          <div class="sv-card-value">฿${paidTotal.toLocaleString()}</div>
          <div class="sv-card-sub">${paid.length} บิล</div>
        </div>
        <div class="sv-card orange">
          <div class="sv-card-label">ค้างจ่าย</div>
          <div class="sv-card-value">฿${unpaidTotal.toLocaleString()}</div>
          <div class="sv-card-sub">${unpaid.length} บิล</div>
        </div>
      </div>

      <div class="sv-section">
        <div class="sv-section-title">💵 แยกตามวิธีจ่าย</div>
        <div class="sv-paymethod">
          <div class="sv-pm-row"><span>เงินสด</span><span>฿${cash.toLocaleString()}</span></div>
          <div class="sv-pm-row"><span>โอน</span><span>฿${transfer.toLocaleString()}</span></div>
        </div>
      </div>

      <div class="sv-section">
        <div class="sv-section-title">🔥 เมนูขายดีวันนี้</div>
        ${topItems.length === 0
          ? `<div class="sv-empty">ยังไม่มีการขาย</div>`
          : `<div class="sv-top-list">${topItems.map((t,i)=>`
              <div class="sv-top-row">
                <span class="sv-top-rank">${i+1}</span>
                <span class="sv-top-name">${t[0]}</span>
                <span class="sv-top-qty">${t[1]} ที่</span>
              </div>`).join('')}</div>`
        }
      </div>`;
  }

  // ── บิลค้างจ่าย ───────────────────────────────────────────
  function _buildUnpaid() {
    const list = Bills.getUnpaid().sort((a,b)=>b.ts-a.ts);
    if (list.length === 0) {
      return `<div class="sv-empty-big">✅<div>ไม่มีบิลค้างจ่าย</div><small>ทุกโต๊ะจ่ายครบแล้ว</small></div>`;
    }
    const total = list.reduce((s,b)=>s+b.total,0);
    return `
      <div class="sv-unpaid-head">
        <span>ค้างจ่ายทั้งหมด <strong>${list.length}</strong> บิล</span>
        <span class="sv-unpaid-total">฿${total.toLocaleString()}</span>
      </div>
      <div class="sv-bill-list">
        ${list.map(_billCard).join('')}
      </div>`;
  }

  function _billCard(b) {
    const time = new Date(b.ts).toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' });
    const itemsPreview = (b.items||[]).map(i => `${i.name}×${i.qty}`).join(', ');
    return `
      <div class="sv-bill" data-id="${b.id}">
        <div class="sv-bill-top">
          <span class="sv-bill-target">${b.target}</span>
          <span class="sv-bill-total">฿${b.total.toLocaleString()}</span>
        </div>
        <div class="sv-bill-meta">
          <span class="sv-bill-time">🕐 ${time}</span>
          <span class="sv-bill-id">${b.orderId||''}</span>
        </div>
        <div class="sv-bill-items">${itemsPreview}</div>
        <div class="sv-bill-actions">
          <button class="sv-pay-btn cash"     data-id="${b.id}" data-method="เงินสด">💵 จ่ายสด</button>
          <button class="sv-pay-btn transfer" data-id="${b.id}" data-method="โอน">📱 โอน</button>
          <button class="sv-del-btn"          data-id="${b.id}" title="ยกเลิกบิล">🗑️</button>
        </div>
      </div>`;
  }

  // ── ประวัติจ่ายแล้ว (วันนี้) ──────────────────────────────
  function _buildPaid() {
    const list = Bills.getTodayPaid().sort((a,b)=>(b.paidTs||0)-(a.paidTs||0));
    if (list.length === 0) {
      return `<div class="sv-empty-big">📋<div>ยังไม่มีบิลที่จ่ายแล้ววันนี้</div></div>`;
    }
    return `
      <div class="sv-bill-list">
        ${list.map(b => {
          const time = new Date(b.paidTs||b.ts).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});
          return `
          <div class="sv-bill paid">
            <div class="sv-bill-top">
              <span class="sv-bill-target">${b.target}</span>
              <span class="sv-bill-total">฿${b.total.toLocaleString()}</span>
            </div>
            <div class="sv-bill-meta">
              <span class="sv-bill-time">✅ ${time}</span>
              <span class="sv-pay-tag">${b.payMethod||'เงินสด'}</span>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  // ── Events ────────────────────────────────────────────────
  function _attach(page) {
    if (page === 'unpaid') {
      document.querySelectorAll('.sv-pay-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          Bills.markPaid(btn.dataset.id, btn.dataset.method);
          Toast.show(`✅ รับชำระแล้ว (${btn.dataset.method})`);
          goTo('unpaid');
        });
      });
      document.querySelectorAll('.sv-del-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('ยกเลิกบิลนี้? (ใช้กรณีกดผิด)')) {
            Bills.remove(btn.dataset.id);
            goTo('unpaid');
          }
        });
      });
    }
  }

  // ── Inject modal ──────────────────────────────────────────
  function inject() {
    if (document.getElementById('js-sales-modal')) return;
    const el = document.createElement('div');
    el.id = 'js-sales-modal';
    el.className = 'modal-overlay';
    el.innerHTML = `
      <div class="sales-modal">
        <div class="sales-hdr">
          <span>💰 ยอดขาย & บิลค้างจ่าย</span>
          <button class="sales-close" onclick="SalesView.close()">✕</button>
        </div>
        <div class="sales-tabs">
          <button class="sales-tab active" data-page="unpaid"  onclick="SalesView.goTo('unpaid')">🧾 ค้างจ่าย</button>
          <button class="sales-tab" data-page="summary" onclick="SalesView.goTo('summary')">📊 สรุปยอด</button>
          <button class="sales-tab" data-page="paid"    onclick="SalesView.goTo('paid')">✅ จ่ายแล้ว</button>
        </div>
        <div class="sales-body" id="js-sales-body"></div>
      </div>`;
    document.body.appendChild(el);
    el.addEventListener('click', e => { if (e.target === el) close(); });

    // refresh badge เมื่อบิลเปลี่ยน
    Bills.onChange(() => _updateBadge());
    _updateBadge();
  }

  // อัปเดตเลขบิลค้างจ่ายบนปุ่ม
  function _updateBadge() {
    const btn = document.getElementById('js-sales-btn');
    if (!btn) return;
    const n = Bills.getUnpaid().length;
    btn.innerHTML = n > 0 ? `💰 ยอดขาย <span class="sales-badge">${n}</span>` : '💰 ยอดขาย';
  }

  return { open, close, goTo, inject };
})();


// =============================================================
// ReportView — ยอดรวม (Sheet + Local) + 3 Zones + แก้ไขบิล
// =============================================================
const ReportView = (() => {
  let _type  = 'day';
  let _date  = _todayStr();
  let _month = _thisMonthStr();
  let _year  = new Date().getFullYear();
  let _editItems = [];
  let _rendering = false;

  function _todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function _thisMonthStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  }

  function open() {
    inject();
    document.getElementById('js-report-modal').classList.add('open');
    _render();
  }
  function close() {
    document.getElementById('js-report-modal')?.classList.remove('open');
  }

  // ── Date converters (HTML → Sheet format) ──────────────────────
  function _toSheetDate(s) {
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;          // 'DD/MM/YYYY'
  }
  function _toSheetMonth(s) {
    const [y, m] = s.split('-');
    return `${m}/${y}`;               // 'MM/YYYY'
  }

  const _MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

  function _periodLabel() {
    if (_type === 'day') {
      const d = new Date(_date + 'T00:00:00');
      return `${d.getDate()} ${_MONTHS_TH[d.getMonth()]} ${d.getFullYear()+543}`;
    }
    if (_type === 'month') {
      const [y, m] = _month.split('-').map(Number);
      return `${_MONTHS_TH[m-1]} ${y+543}`;
    }
    return `ปี ${_year+543}`;
  }

  function _yearOpts() {
    const cur = new Date().getFullYear();
    return Array.from({length:6},(_,i)=>cur-i).map(y =>
      `<option value="${y}" ${y===_year?'selected':''}>${y+543}</option>`
    ).join('');
  }

  // ── Local Bill helpers ─────────────────────────────────────────
  function _getBills() {
    if (_type === 'day') return Bills.getByDate(_date);
    if (_type === 'month') {
      const [y, m] = _month.split('-').map(Number);
      return Bills.getByMonth(y, m - 1);
    }
    return Bills.getByYear(_year);
  }

  function _nameInfo() {
    const m = {};
    try {
      Object.entries(MENU_DATA).forEach(([type, sec]) => {
        sec.items.forEach(i => { m[i.name] = { type, cat: i.cat || '', emoji: i.emoji || '🍽️' }; });
      });
    } catch(e) {}
    return m;
  }

  // ── Data resolution: Sheet → local fallback ────────────────────
  async function _resolveData() {
    const bills  = _getBills();
    const paid   = bills.filter(b => b.paid);
    const unpaid = bills.filter(b => !b.paid);
    const info   = _nameInfo();

    // Local payment breakdown (always from local)
    const cash     = paid.filter(b => b.payMethod === 'เงินสด').reduce((s,b) => s+b.total, 0);
    const transfer = paid.filter(b => b.payMethod === 'โอน').reduce((s,b) => s+b.total, 0);
    const unpaidRev = unpaid.reduce((s,b) => s+b.total, 0);

    // Local item breakdown (bills have items array)
    const allItems   = bills.flatMap(b => b.items || []);
    const foodItems  = allItems.filter(i => info[i.name]?.type !== 'drink');
    const drinkItems = allItems.filter(i => info[i.name]?.type === 'drink');

    const localMooItems   = _aggregateLocal(foodItems,  info);
    const localDrinkItems = _aggregateLocal(drinkItems, info);

    // Try Sheet data
    let source = 'local';
    let sheetSummary = null, sheetMoo = null, sheetDrink = null;

    if (GoogleSheet.isConnected()) {
      try {
        if (_type === 'day') {
          const sd = _toSheetDate(_date);
          [sheetSummary, sheetMoo, sheetDrink] = await Promise.all([
            GoogleSheet.getSummaryByDate(sd),
            GoogleSheet.getMooByDate(sd),
            GoogleSheet.getDrinkByDate(sd),
          ]);
        } else if (_type === 'month') {
          const sm = _toSheetMonth(_month);
          [sheetSummary, sheetMoo, sheetDrink] = await Promise.all([
            GoogleSheet.getSummaryByMonth(sm),
            GoogleSheet.getMooByMonth(sm),
            GoogleSheet.getDrinkByMonth(sm),
          ]);
        } else {
          [sheetSummary, sheetMoo, sheetDrink] = await Promise.all([
            GoogleSheet.getSummaryByYear(_year),
            GoogleSheet.getMooByYear(_year),
            GoogleSheet.getDrinkByYear(_year),
          ]);
        }
        source = 'sheet';
      } catch(e) {
        source = 'local';
      }
    }

    // Prefer Sheet numbers when available, else local
    const grandTotal = sheetSummary?.found
      ? Number(sheetSummary.grandTotal) || 0
      : paid.reduce((s,b) => s+b.total, 0);
    const mooTotal   = sheetSummary?.found ? Number(sheetSummary.mooTotal)   || 0 : localMooItems.totalAmount;
    const drinkTotal = sheetSummary?.found ? Number(sheetSummary.drinkTotal) || 0 : localDrinkItems.totalAmount;
    const orders     = sheetSummary?.found ? Number(sheetSummary.orders)     || 0 : bills.length;

    const mooData   = (sheetMoo?.items?.length)   ? sheetMoo   : localMooItems;
    const drinkData = (sheetDrink?.items?.length)  ? sheetDrink : localDrinkItems;

    const avgBill = paid.length ? Math.round(paid.reduce((s,b)=>s+b.total,0)/paid.length) : 0;
    const payBase = cash + transfer || 1;

    return {
      source, bills,
      kpi: { grandTotal, mooTotal, drinkTotal, orders, cash, transfer,
             unpaidRev, unpaidCount: unpaid.length, avgBill,
             cashPct: Math.round(cash/payBase*100) },
      moo:   { ...mooData,   info },
      drink: { ...drinkData, info },
    };
  }

  function _aggregateLocal(items, info) {
    const agg = {};
    items.forEach(i => {
      if (!agg[i.name]) agg[i.name] = { name: i.name, qty: 0, total: 0, price: i.price||0, emoji: info[i.name]?.emoji||'🍽️', cat: info[i.name]?.cat||'อื่นๆ' };
      agg[i.name].qty   += i.qty;
      agg[i.name].total += (i.price||0) * i.qty;
    });
    const arr = Object.values(agg).sort((a,b)=>b.qty-a.qty);
    return {
      items: arr,
      totalQty:    arr.reduce((s,i)=>s+i.qty, 0),
      totalAmount: arr.reduce((s,i)=>s+i.total, 0),
    };
  }

  // ── Async render ───────────────────────────────────────────────
  async function _render() {
    if (_rendering) return;
    _rendering = true;
    const body = document.getElementById('js-report-body');
    if (!body) { _rendering = false; return; }

    // Render period bar + loading spinner immediately
    body.innerHTML = _buildPeriodBar() +
      `<div id="rpt-content"><div class="rpt-loading"><div class="rpt-spinner"></div>กำลังโหลดข้อมูล…</div></div>`;
    _attachPeriodEvents();

    let data;
    try {
      data = await _resolveData();
    } catch(e) {
      data = { source:'local', bills: _getBills(), kpi:{}, moo:{items:[]}, drink:{items:[]} };
    }
    _rendering = false;

    const content = document.getElementById('rpt-content');
    if (!content) return;
    content.innerHTML = _buildKPIZone(data) + _buildFoodZone(data) + _buildDrinkZone(data) + _buildBillsZone(data.bills);
    _attachContentEvents();
  }

  // ── Period bar ─────────────────────────────────────────────────
  function _buildPeriodBar() {
    return `
      <div class="rpt-top-bar">
        <div class="rpt-type-tabs">
          <button class="rpt-type-btn ${_type==='day'?'rpt-active':''}" data-type="day">📅 รายวัน</button>
          <button class="rpt-type-btn ${_type==='month'?'rpt-active':''}" data-type="month">📆 รายเดือน</button>
          <button class="rpt-type-btn ${_type==='year'?'rpt-active':''}" data-type="year">🗓️ รายปี</button>
        </div>
        <div class="rpt-picker-wrap">
          ${_type==='day'   ? `<input type="date"  id="rpt-date-inp"  value="${_date}"  class="rpt-picker-inp">` : ''}
          ${_type==='month' ? `<input type="month" id="rpt-month-inp" value="${_month}" class="rpt-picker-inp">` : ''}
          ${_type==='year'  ? `<select id="rpt-year-sel" class="rpt-picker-inp">${_yearOpts()}</select>` : ''}
        </div>
        <div class="rpt-period-label">${_periodLabel()}</div>
      </div>`;
  }

  // ── Zone 1 : KPI ───────────────────────────────────────────────
  function _buildKPIZone({ source, kpi }) {
    const { grandTotal=0, mooTotal=0, drinkTotal=0, orders=0,
            cash=0, transfer=0, unpaidRev=0, unpaidCount=0, avgBill=0, cashPct=0 } = kpi || {};
    const tranPct = 100 - cashPct;
    const srcBadge = source === 'sheet'
      ? `<span class="rpt-src rpt-src-sheet">📡 Google Sheets</span>`
      : `<span class="rpt-src rpt-src-local">💾 ข้อมูลในเครื่อง</span>`;

    return `
      <div class="rpt-zone">
        <div class="rpt-zone-hdr rpt-zhdr-kpi">
          <span>📊 ภาพรวม KPI</span>${srcBadge}
        </div>
        <div class="rpt-kpi-grid">
          <div class="rpt-kpi-card">
            <div class="rpt-kpi-icon">💰</div>
            <div class="rpt-kpi-val kpi-green">฿${grandTotal.toLocaleString()}</div>
            <div class="rpt-kpi-lbl">ยอดขายรวม</div>
            <div class="rpt-kpi-sub">${orders} orders</div>
          </div>
          <div class="rpt-kpi-card">
            <div class="rpt-kpi-icon">🥩</div>
            <div class="rpt-kpi-val kpi-fire">฿${mooTotal.toLocaleString()}</div>
            <div class="rpt-kpi-lbl">หมูกระทะ</div>
            <div class="rpt-kpi-sub">${grandTotal>0?Math.round(mooTotal/grandTotal*100):0}%</div>
          </div>
          <div class="rpt-kpi-card">
            <div class="rpt-kpi-icon">🥤</div>
            <div class="rpt-kpi-val kpi-blue">฿${drinkTotal.toLocaleString()}</div>
            <div class="rpt-kpi-lbl">เครื่องดื่ม</div>
            <div class="rpt-kpi-sub">${grandTotal>0?Math.round(drinkTotal/grandTotal*100):0}%</div>
          </div>
          <div class="rpt-kpi-card">
            <div class="rpt-kpi-icon">🧾</div>
            <div class="rpt-kpi-val kpi-muted">฿${avgBill.toLocaleString()}</div>
            <div class="rpt-kpi-lbl">เฉลี่ย / บิล</div>
            <div class="rpt-kpi-sub">&nbsp;</div>
          </div>
        </div>
        <div class="rpt-pay-section">
          <div class="rpt-pay-cards">
            <div class="rpt-pay-chip cash-chip">
              <span class="rpt-pay-ico">💵</span>
              <div><div class="rpt-pay-v">฿${cash.toLocaleString()}</div><div class="rpt-pay-l">เงินสด (${cashPct}%)</div></div>
            </div>
            <div class="rpt-pay-chip transfer-chip">
              <span class="rpt-pay-ico">📱</span>
              <div><div class="rpt-pay-v">฿${transfer.toLocaleString()}</div><div class="rpt-pay-l">โอน (${tranPct}%)</div></div>
            </div>
            <div class="rpt-pay-chip unpaid-chip">
              <span class="rpt-pay-ico">⏳</span>
              <div><div class="rpt-pay-v">฿${unpaidRev.toLocaleString()}</div><div class="rpt-pay-l">ค้างจ่าย (${unpaidCount} บิล)</div></div>
            </div>
          </div>
          <div class="rpt-pay-bars">
            <div class="rpt-pay-bar-row">
              <span class="rpt-pblbl">💵</span>
              <div class="rpt-bar-wrap"><div class="rpt-bar rpt-bar-cash" style="width:${cashPct}%"></div></div>
              <span class="rpt-pbamt">${cashPct}%</span>
            </div>
            <div class="rpt-pay-bar-row">
              <span class="rpt-pblbl">📱</span>
              <div class="rpt-bar-wrap"><div class="rpt-bar rpt-bar-transfer" style="width:${tranPct}%"></div></div>
              <span class="rpt-pbamt">${tranPct}%</span>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ── Item zone builder ──────────────────────────────────────────
  function _buildItemZone(zoneClass, hdrClass, title, data, barColor) {
    const items      = data?.items || [];
    const totalQty   = data?.totalQty   || items.reduce((s,i)=>s+i.qty,0);
    const totalAmt   = data?.totalAmount|| items.reduce((s,i)=>s+(i.total||0),0);
    const info       = data?.info || {};
    const maxQty     = items.length > 0 ? items[0].qty : 1;
    const top5       = items.slice(0, 8);

    // Category breakdown (from local info map if available)
    const catMap = {};
    items.forEach(it => {
      const cat = info[it.name]?.cat || it.cat || 'อื่นๆ';
      if (!catMap[cat]) catMap[cat] = { qty: 0, total: 0 };
      catMap[cat].qty   += it.qty;
      catMap[cat].total += it.total||0;
    });
    const cats = Object.entries(catMap).sort((a,b)=>b[1].qty-a[1].qty);

    return `
      <div class="rpt-zone ${zoneClass}">
        <div class="rpt-zone-hdr ${hdrClass}">
          <span>${title}</span>
          <div class="rpt-zone-meta">
            <span class="rpt-meta-chip">${totalQty} ชิ้น</span>
            <span class="rpt-meta-chip rpt-meta-gold">฿${totalAmt.toLocaleString()}</span>
          </div>
        </div>
        ${top5.length === 0
          ? `<div class="rpt-no-sm">ยังไม่มีข้อมูลช่วงนี้</div>`
          : `
          <div class="rpt-rank-list">
            ${top5.map((it, i) => {
              const pct    = Math.round(it.qty / maxQty * 100);
              const medal  = ['🥇','🥈','🥉'][i] || '';
              const emoji  = info[it.name]?.emoji || it.emoji || '🍽️';
              const amt    = it.total || 0;
              return `
                <div class="rpt-rank-row">
                  <span class="rpt-rank-medal">${medal || `<span class="rpt-rank-num">${i+1}</span>`}</span>
                  <span class="rpt-rank-emoji">${emoji}</span>
                  <span class="rpt-rank-name">${it.name}</span>
                  <div class="rpt-rank-bar-wrap">
                    <div class="rpt-rank-bar" style="width:${pct}%;background:${barColor}"></div>
                  </div>
                  <span class="rpt-rank-qty">${it.qty} ที่</span>
                  <span class="rpt-rank-rev">฿${amt.toLocaleString()}</span>
                </div>`;
            }).join('')}
          </div>
          ${cats.length > 1 ? `
            <div class="rpt-sub-hdr">📂 แยกหมวดหมู่</div>
            <div class="rpt-cat-chips">
              ${cats.map(([cat, d]) => `
                <div class="rpt-cat-chip">
                  <span class="rpt-cat-nm">${cat}</span>
                  <span class="rpt-cat-qty">${d.qty} ที่</span>
                  <span class="rpt-cat-rev">฿${d.total.toLocaleString()}</span>
                </div>`).join('')}
            </div>` : ''}
        `}
      </div>`;
  }

  function _buildFoodZone(data) {
    return _buildItemZone('', 'rpt-zhdr-moo', '🥩 Food Dashboard — หมูกระทะ', data.moo, 'var(--ember)');
  }
  function _buildDrinkZone(data) {
    return _buildItemZone('', 'rpt-zhdr-drink', '🥤 Beverage Dashboard — เครื่องดื่ม', data.drink, 'var(--drink-light)');
  }

  // ── Zone 4: Bill list ──────────────────────────────────────────
  function _buildBillsZone(bills) {
    return `
      <div class="rpt-zone rpt-zone-bills">
        <button class="rpt-bills-toggle" id="rpt-bills-toggle">
          <span>📋 รายการบิล (${bills.length} บิล)</span>
          <span class="rpt-toggle-arr">▼</span>
        </button>
        <div class="rpt-bills-body" id="rpt-bills-body" style="display:none">
          ${bills.length === 0
            ? `<div class="rpt-no-data" style="padding:20px">ไม่มีข้อมูลในช่วงเวลานี้</div>`
            : `<div class="rpt-bill-list" style="padding:12px 14px;display:flex;flex-direction:column;gap:8px">
                ${bills.slice().sort((a,b)=>b.ts-a.ts).map(_billCard).join('')}
               </div>`}
        </div>
      </div>`;
  }

  function _billCard(b) {
    const d = new Date(b.ts);
    const ds = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    const badgeCls = b.paid ? 'rpt-badge-paid' : 'rpt-badge-unpaid';
    const badgeTxt = b.paid ? (b.payMethod||'เงินสด') : 'ค้างจ่าย';
    return `
      <div class="rpt-bill-card">
        <div class="rpt-bill-row1">
          <span class="rpt-bill-tgt">${b.target}</span>
          <div class="rpt-bill-r">
            <span class="rpt-badge ${badgeCls}">${badgeTxt}</span>
            <span class="rpt-bill-amt">฿${b.total.toLocaleString()}</span>
            <button class="rpt-edit-btn" data-id="${b.id}" title="แก้ไข">✏️</button>
          </div>
        </div>
        <div class="rpt-bill-row2">
          <span class="rpt-bill-time">🕐 ${ds}</span>
          <span class="rpt-bill-id">${b.orderId||''}</span>
        </div>
        <div class="rpt-bill-items">${(b.items||[]).map(i=>`${i.name}×${i.qty}`).join(', ')||'-'}</div>
      </div>`;
  }

  // ── Events ─────────────────────────────────────────────────────
  function _attachPeriodEvents() {
    document.querySelectorAll('.rpt-type-btn').forEach(btn => {
      btn.addEventListener('click', () => { _type = btn.dataset.type; _render(); });
    });
    const di = document.getElementById('rpt-date-inp');
    if (di) di.addEventListener('change', () => { _date = di.value; _render(); });
    const mi = document.getElementById('rpt-month-inp');
    if (mi) mi.addEventListener('change', () => { _month = mi.value; _render(); });
    const ys = document.getElementById('rpt-year-sel');
    if (ys) ys.addEventListener('change', () => { _year = parseInt(ys.value); _render(); });
  }

  function _attachContentEvents() {
    document.querySelectorAll('.rpt-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => _openEditModal(btn.dataset.id));
    });
    const tog = document.getElementById('rpt-bills-toggle');
    if (tog) tog.addEventListener('click', () => {
      const body = document.getElementById('rpt-bills-body');
      const arr  = tog.querySelector('.rpt-toggle-arr');
      const open = body.style.display !== 'none';
      body.style.display = open ? 'none' : 'block';
      if (arr) arr.textContent = open ? '▶' : '▼';
    });
  }

  function _openEditModal(id) {
    const bill = Bills.getAll().find(b => b.id === id);
    if (!bill) return;
    _editItems = JSON.parse(JSON.stringify(bill.items || []));

    const wrap = document.createElement('div');
    wrap.id = 'js-rpt-edit';
    wrap.className = 'rpt-edit-wrap';
    wrap.innerHTML = `
      <div class="rpt-edit-panel">
        <div class="rpt-edit-hdr">
          <span>✏️ แก้ไขบิล — ${bill.target}</span>
          <button id="rpt-edit-x">✕</button>
        </div>
        <div class="rpt-edit-scroll">
          <div class="rpt-ef"><label>โต๊ะ / ลูกค้า</label>
            <input type="text" id="ef-target" value="${bill.target}" class="rpt-einp"></div>
          <div class="rpt-ef"><label>ยอดรวม (฿)</label>
            <input type="number" id="ef-total" value="${bill.total}" class="rpt-einp"></div>
          <div class="rpt-ef"><label>วิธีชำระ</label>
            <select id="ef-method" class="rpt-einp">
              <option value="เงินสด" ${(bill.payMethod||'เงินสด')==='เงินสด'?'selected':''}>💵 เงินสด</option>
              <option value="โอน" ${bill.payMethod==='โอน'?'selected':''}>📱 โอน</option>
            </select></div>
          <div class="rpt-ef"><label>สถานะ</label>
            <select id="ef-status" class="rpt-einp">
              <option value="paid"   ${bill.paid ?'selected':''}>✅ จ่ายแล้ว</option>
              <option value="unpaid" ${!bill.paid?'selected':''}>⏳ ค้างจ่าย</option>
            </select></div>
          <div class="rpt-ef"><label>รายการสินค้า</label>
            <div class="rpt-items-edit" id="rpt-items-edit"></div>
          </div>
        </div>
        <div class="rpt-edit-footer">
          <button class="rpt-edit-cancel-btn" id="rpt-edit-x2">ยกเลิก</button>
          <button class="rpt-edit-save-btn"   id="rpt-edit-save">💾 บันทึก</button>
        </div>
      </div>`;

    document.body.appendChild(wrap);
    _renderEditItems();

    const closeEdit = () => wrap.remove();
    wrap.querySelector('#rpt-edit-x').addEventListener('click', closeEdit);
    wrap.querySelector('#rpt-edit-x2').addEventListener('click', closeEdit);
    wrap.addEventListener('click', e => { if (e.target === wrap) closeEdit(); });

    wrap.addEventListener('click', e => {
      const del = e.target.closest('.rpt-idel');
      if (del) {
        _editItems.splice(parseInt(del.dataset.idx), 1);
        _renderEditItems();
        _recalcTotal();
      }
    });
    wrap.addEventListener('input', e => {
      if (e.target.classList.contains('rpt-iqty')) {
        const idx = parseInt(e.target.dataset.idx);
        _editItems[idx].qty = parseInt(e.target.value)||0;
        _recalcTotal();
      }
    });

    wrap.querySelector('#rpt-edit-save').addEventListener('click', () => {
      const isPaid = document.getElementById('ef-status').value === 'paid';
      Bills.updateBill(id, {
        target:    (document.getElementById('ef-target').value||'').trim() || bill.target,
        total:     parseFloat(document.getElementById('ef-total').value)||0,
        payMethod: document.getElementById('ef-method').value,
        paid:      isPaid,
        paidTs:    isPaid ? (bill.paidTs || Date.now()) : null,
        items:     _editItems,
      });
      Toast.show('✅ แก้ไขบิลแล้ว');
      closeEdit();
      _render();
    });
  }

  function _renderEditItems() {
    const el = document.getElementById('rpt-items-edit');
    if (!el) return;
    el.innerHTML = _editItems.length === 0
      ? `<div style="color:#94a3b8;font-size:13px;padding:8px">ไม่มีรายการสินค้า</div>`
      : _editItems.map((item, i) => `
          <div class="rpt-irow">
            <span class="rpt-iname">${item.name}</span>
            <input class="rpt-iqty" type="number" min="0" value="${item.qty}" data-idx="${i}">
            <span class="rpt-iprice">฿${item.price||0}</span>
            <button class="rpt-idel" data-idx="${i}" title="ลบ">🗑️</button>
          </div>`).join('');
  }

  function _recalcTotal() {
    const newTotal = _editItems.reduce((s,i) => s + ((i.price||0) * (i.qty||0)), 0);
    const el = document.getElementById('ef-total');
    if (el) el.value = newTotal;
  }

  function inject() {
    if (document.getElementById('js-report-modal')) return;
    const el = document.createElement('div');
    el.id = 'js-report-modal';
    el.className = 'modal-overlay';
    el.innerHTML = `
      <div class="rpt-modal">
        <div class="rpt-hdr">
          <span>📊 ยอดรวม</span>
          <button class="rpt-hdr-close" onclick="ReportView.close()">✕</button>
        </div>
        <div class="rpt-body" id="js-report-body"></div>
      </div>`;
    document.body.appendChild(el);
    el.addEventListener('click', e => { if (e.target === el) close(); });
  }

  return { open, close };
})();
