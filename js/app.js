// =============================================================
// app.js — Logic หลักของระบบ: UI rendering + event wiring
// =============================================================

// ─── App State ────────────────────────────────────────────────
const App = (() => {

  let currentTab   = 'moo';
  let currentCat   = 'ทั้งหมด';
  let currentTable = 1;
  let orderMode    = 'table';   // 'table' | 'takeaway'
  const TOTAL_TABLES = 10;

  // ─── Init ──────────────────────────────────────────────────
  function init() {
    Settings.load();              // โหลด config (รวม default URL) ก่อน
    _startClock();
    _renderTables();
    _renderTabs();
    _renderCategories();
    _renderMenu();
    _renderOrderPanel();
    _wireCartEvents();
    _wireSheetStatus();
    GoogleSheet.testConnection(); // ทดสอบเชื่อมต่อ (มี URL พร้อมแล้ว)
    // Stock
    StockUI.inject();
    _updateStockIndicator();
    Stock.onChange(() => _updateStockIndicator());
    // Sales view
    SalesView.inject();
  }

  // ─── Order mode (โต๊ะ vs ซื้อกลับ) ─────────────────────────
  function setMode(mode) {
    orderMode = mode;
    document.getElementById('ot-tab-table').classList.toggle('active', mode === 'table');
    document.getElementById('ot-tab-takeaway').classList.toggle('active', mode === 'takeaway');
    document.getElementById('js-table-selector').style.display  = mode === 'table'    ? 'flex' : 'none';
    document.getElementById('js-customer-input').style.display  = mode === 'takeaway' ? 'block' : 'none';
    _updateTargetBadge();
  }

  // ชื่อ target ปัจจุบัน (โต๊ะ X หรือ ชื่อลูกค้า)
  function _currentTarget() {
    if (orderMode === 'takeaway') {
      const name = (document.getElementById('js-customer-name')?.value || '').trim();
      return name ? `🛍️ ${name}` : '🛍️ ซื้อกลับ';
    }
    return `โต๊ะ ${currentTable}`;
  }

  function _updateTargetBadge() {
    document.getElementById('js-table-badge').textContent = _currentTarget();
  }

  // ─── Clock ─────────────────────────────────────────────────
  function _startClock() {
    const el = document.getElementById('js-clock');
    function tick() {
      el.textContent = new Date().toLocaleTimeString('th-TH', { hour12: false });
    }
    tick();
    setInterval(tick, 1000);
  }

  // ─── Tables ────────────────────────────────────────────────
  function _renderTables() {
    const el = document.getElementById('js-table-selector');
    el.innerHTML = Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1).map(n =>
      `<button class="table-chip ${currentTable === n ? 'active' : ''}"
               data-table="${n}">โต๊ะ ${n}</button>`
    ).join('');

    el.querySelectorAll('.table-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTable = Number(btn.dataset.table);
        _updateTargetBadge();
        _renderTables();
      });
    });
  }

  // ─── Tabs ──────────────────────────────────────────────────
  function _renderTabs() {
    document.querySelectorAll('.js-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === currentTab);
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        currentCat = 'ทั้งหมด';
        _renderTabs();
        _renderCategories();
        _renderMenu();
      });
    });
  }

  // ─── Categories ────────────────────────────────────────────
  function _renderCategories() {
    const cats = MENU_DATA[currentTab].categories;
    const isDrink = currentTab === 'drink';
    const el = document.getElementById('js-category-bar');

    el.innerHTML = cats.map(c =>
      `<button class="cat-btn ${currentCat === c ? 'active' + (isDrink ? ' drink' : '') : ''}"
               data-cat="${c}">${c}</button>`
    ).join('');

    el.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentCat = btn.dataset.cat;
        _renderCategories();
        _renderMenu();
      });
    });
  }

  // ─── Menu Grid ─────────────────────────────────────────────
  function _renderMenu() {
    const { items } = MENU_DATA[currentTab];
    const filtered  = currentCat === 'ทั้งหมด' ? items : items.filter(i => i.cat === currentCat);
    const isDrink   = currentTab === 'drink';
    const el        = document.getElementById('js-menu-grid');

    el.innerHTML = filtered.map(item => `
      <div class="menu-item ${isDrink ? 'drink-item' : ''}" data-id="${item.id}" role="button" tabindex="0">
        ${item.badge ? `<span class="item-badge badge-${item.badge}">${item.badge === 'hot' ? '🔥 HOT' : '✨ NEW'}</span>` : ''}
        <div class="item-thumb">
          ${item.img
            ? `<img class="item-thumb-img" src="${item.img}" alt="${item.name || ''}"
                    onerror="this.parentNode.innerHTML='<span class=\\'item-thumb-emoji\\'>${item.emoji || '🍽️'}</span>'">`
            : `<span class="item-thumb-emoji">${item.emoji || '🍽️'}</span>`
          }
        </div>
        <div class="item-body">
          <div class="item-name">${item.name}</div>
          ${item.desc ? `<div class="item-desc">${item.desc}</div>` : ''}
          <div class="item-price">฿${item.price}</div>
        </div>
      </div>
    `).join('');

    el.querySelectorAll('.menu-item').forEach(card => {
      card.addEventListener('click', () => {
        Cart.add(card.dataset.id);
        _animatePop(card);
      });
      card.addEventListener('keydown', e => { if (e.key === 'Enter') card.click(); });
    });
  }

  function _animatePop(el) {
    el.classList.add('pop');
    setTimeout(() => el.classList.remove('pop'), 300);
  }

  // ─── Order Panel ───────────────────────────────────────────
  function _renderOrderPanel() {
    const items   = Cart.getItems();
    const listEl  = document.getElementById('js-order-list');
    const countEl = document.getElementById('js-order-count');
    const confirmBtn = document.getElementById('js-confirm-btn');

    if (items.length === 0) {
      listEl.innerHTML = `
        <div class="empty-order">
          <span class="empty-icon">🍽️</span>
          <span>ยังไม่มีรายการ<br>กดเมนูเพื่อเพิ่ม</span>
        </div>`;
      countEl.textContent = '0';
      confirmBtn.disabled = true;
    } else {
      listEl.innerHTML = items.map(item => `
        <div class="order-item ${item.type === 'drink' ? 'is-drink' : ''}">
          <span class="order-item-visual">${renderItemVisual(item, 34)}</span>
          <div class="order-item-info">
            <div class="order-item-name">${item.name}</div>
            <div class="order-item-price">฿${item.price} / ชิ้น</div>
          </div>
          <div class="qty-ctrl">
            <button class="qty-btn minus" data-id="${item.id}" data-delta="-1">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" data-id="${item.id}" data-delta="1">+</button>
          </div>
          <div class="order-item-total">฿${item.price * item.qty}</div>
        </div>
      `).join('');

      listEl.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          Cart.changeQty(btn.dataset.id, Number(btn.dataset.delta));
        });
      });

      const total = Cart.getSummary().totalQty;
      countEl.textContent = total;
      confirmBtn.disabled = false;
    }

    _updateSummary();
  }

  function _updateSummary() {
    const { mooTotal, drinkTotal, grandTotal, totalQty } = Cart.getSummary();
    document.getElementById('js-sum-qty').textContent   = `${totalQty} รายการ`;
    document.getElementById('js-sum-moo').textContent   = `฿${mooTotal}`;
    document.getElementById('js-sum-drink').textContent = `฿${drinkTotal}`;
    document.getElementById('js-sum-total').textContent = `฿${grandTotal}`;
  }

  // ─── Wire Cart events ──────────────────────────────────────
  function _wireCartEvents() {
    Cart.onChange((event, data) => {
      _renderOrderPanel();
      if (event === 'add' && data) Toast.show(`เพิ่ม ${data.emoji} ${data.name}`);
    });

    document.getElementById('js-clear-btn').addEventListener('click', () => {
      if (Cart.isEmpty()) return;
      if (confirm('ล้างรายการทั้งหมด?')) Cart.clear();
    });

    document.getElementById('js-confirm-btn').addEventListener('click', _confirmOrder);
  }

  // ─── Confirm order → send to Sheets + deduct stock ────────
  async function _confirmOrder() {
    if (Cart.isEmpty()) return;

    // ถ้าซื้อกลับ ต้องมีชื่อลูกค้า
    if (orderMode === 'takeaway') {
      const name = (document.getElementById('js-customer-name')?.value || '').trim();
      if (!name) {
        Toast.show('⚠️ กรุณาพิมพ์ชื่อลูกค้าก่อน');
        document.getElementById('js-customer-name')?.focus();
        return;
      }
    }

    const btn = document.getElementById('js-confirm-btn');
    btn.disabled = true;
    btn.textContent = '⏳ กำลังบันทึก...';

    const target  = _currentTarget();
    const payload = Cart.toPayload(target);
    const result  = await GoogleSheet.sendOrder(payload);

    if (result.ok) {
      Toast.show('✅ บันทึกลง Google Sheets สำเร็จ!');
    } else if (result.reason === 'no_url') {
      Toast.show('💾 บันทึกในเครื่องแล้ว (ยังไม่ได้เชื่อม Sheets)');
    } else {
      Toast.show('💾 บันทึกในเครื่องแล้ว (เน็ตมีปัญหา)');
    }

    // ── บันทึกเป็นบิลค้างจ่าย ─────────────────────────────────
    Bills.add({
      target,
      items: [...payload.mooItems, ...payload.drinkItems],
      total: payload.grandTotal,
      orderId: result.orderId || ('LOCAL-' + Date.now()),
      ts: Date.now()
    });

    // ── หักสต็อก ──────────────────────────────────────────────
    const allItems = [...payload.mooItems, ...payload.drinkItems].map(i => ({
      id:  Cart.getItems().find(c => c.name === i.name)?.id || '',
      qty: i.qty,
    })).filter(i => i.id);

    const lowList = Stock.deduct(allItems, result.orderId || '');

    // แจ้งเตือนสต็อกใกล้หมด
    if (lowList.length > 0) {
      setTimeout(() => {
        Toast.show(`⚠️ สต็อกใกล้หมด: ${lowList.map(i => i.name).join(', ')}`);
        _updateStockIndicator();
      }, 2800);
    }
    _updateStockIndicator();

    // เคลียร์ชื่อลูกค้าถ้าซื้อกลับ
    if (orderMode === 'takeaway') {
      const inp = document.getElementById('js-customer-name');
      if (inp) inp.value = '';
      _updateTargetBadge();
    }

    Cart.clear();
    btn.disabled = false;
    btn.innerHTML = '✅ บันทึกออเดอร์';
  }

  // ─── Stock indicator badge in header ─────────────────────
  function _updateStockIndicator() {
    const el  = document.getElementById('js-stock-indicator');
    if (!el) return;
    const out = Stock.getOutOfStock().length;
    const low = Stock.getLowStock().length;
    el.className = 'stock-indicator';
    if (out > 0) {
      el.className += ' danger';
      el.textContent = `📦 หมด ${out}`;
    } else if (low > 0) {
      el.className += ' warn';
      el.textContent = `📦 ใกล้หมด ${low}`;
    } else {
      el.textContent = `📦 สต็อก`;
    }
  }

  // ─── Sheet status dot ─────────────────────────────────────
  function _wireSheetStatus() {
    GoogleSheet.onStatusChange(connected => {
      const dot  = document.getElementById('js-sheet-dot');
      const text = document.getElementById('js-sheet-status');
      dot.classList.toggle('connected', connected);
      text.textContent = connected ? 'เชื่อม Google Sheets แล้ว' : 'ยังไม่ได้เชื่อม Google Sheets';
    });
  }

  return { init, setMode };
})();

// ─── Toast (standalone util) ──────────────────────────────────
const Toast = (() => {
  function show(msg) {
    const el  = document.getElementById('js-toast');
    const txt = document.getElementById('js-toast-msg');
    txt.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2600);
  }
  return { show };
})();

// ─── Settings (localStorage wrapper + modal wiring) ───────────
const Settings = (() => {
  const KEY = 'mookata_config';

  // ── ค่าเริ่มต้น — แก้ URL Apps Script ตรงนี้ ──────────────
  const DEFAULTS = {
    scriptUrl: 'https://script.google.com/macros/s/AKfycbz8ZKL1TJwNUGx_LRGMpJx060VtQsc-6YzrYR3lLBMUwCopfAN4Xujr3CsSLIO75763/exec',
    shopName:  'Houseหมูกระทะ',
  };

  let _data = {};

  function load() {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    // รวม default กับที่บันทึกไว้ (ค่าที่ผู้ใช้ตั้งเองมาก่อน)
    _data = { ...DEFAULTS, ...saved };
  }
  function get(key) { return _data[key] || ''; }
  function save(obj) {
    Object.assign(_data, obj);
    localStorage.setItem(KEY, JSON.stringify(_data));
  }

  // Modal wiring
  function openModal() {
    document.getElementById('js-script-url').value  = get('scriptUrl');
    document.getElementById('js-shop-name').value   = get('shopName');
    document.getElementById('js-config-modal').classList.add('open');
  }
  function closeModal() {
    document.getElementById('js-config-modal').classList.remove('open');
  }
  function saveModal() {
    save({
      scriptUrl: document.getElementById('js-script-url').value.trim(),
      shopName:  document.getElementById('js-shop-name').value.trim()
    });
    GoogleSheet.testConnection();
    closeModal();
    Toast.show('บันทึกการตั้งค่าแล้ว');
  }

  return { load, get, save, openModal, closeModal, saveModal };
})();

// ─── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
