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

  return { add, markPaid, remove, getAll, getUnpaid, getPaid, getTodayPaid, getTodayAll, onChange };
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
