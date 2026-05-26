// =============================================================
// app.js — Logic หลักของระบบ: UI rendering + event wiring
// =============================================================

// ─── App State ────────────────────────────────────────────────
const App = (() => {

  let currentTab   = 'moo';
  let currentCat   = 'ทั้งหมด';
  let currentTable = 1;
  const TOTAL_TABLES = 10;

  // ─── Init ──────────────────────────────────────────────────
  function init() {
    _startClock();
    _renderTables();
    _renderTabs();
    _renderCategories();
    _renderMenu();
    _renderOrderPanel();
    _wireCartEvents();
    _wireSheetStatus();
    GoogleSheet.testConnection();
    Settings.load();
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
        document.getElementById('js-table-badge').textContent = `โต๊ะ ${currentTable}`;
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
        <div class="item-emoji">${item.emoji}</div>
        <div class="item-name">${item.name}</div>
        <div class="item-price">฿${item.price}</div>
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
          <span class="order-item-emoji">${item.emoji}</span>
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
    document.getElementById('js-print-btn').addEventListener('click', () => {
      if (Cart.isEmpty()) { Toast.show('ไม่มีรายการในตะกร้า'); return; }
      Printer.printReceipt(Cart.toPayload(currentTable));
    });
  }

  // ─── Confirm order → send to Sheets ───────────────────────
  async function _confirmOrder() {
    if (Cart.isEmpty()) return;
    const btn = document.getElementById('js-confirm-btn');
    btn.disabled = true;
    btn.textContent = '⏳ กำลังบันทึก...';

    const payload = Cart.toPayload(currentTable);
    const result  = await GoogleSheet.sendOrder(payload);

    if (result.ok) {
      Toast.show('✅ บันทึกลง Google Sheets สำเร็จ!');
    } else if (result.reason === 'no_url') {
      Toast.show('💾 บันทึกในเครื่องแล้ว (ยังไม่ได้เชื่อม Sheets)');
    } else {
      Toast.show('💾 บันทึกในเครื่องแล้ว (เน็ตมีปัญหา)');
    }

    Cart.clear();
    btn.disabled = false;
    btn.innerHTML = '✅ บันทึกออเดอร์';
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

  return { init };
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
  let _data = {};

  function load() {
    _data = JSON.parse(localStorage.getItem(KEY) || '{}');
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
