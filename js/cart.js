// =============================================================
// cart.js — จัดการตะกร้าและออเดอร์
// =============================================================

const Cart = (() => {
  let items = []; // [{ id, name, price, emoji, type, qty }]

  // ─── Public API ─────────────────────────────────────────────

  function add(itemId) {
    const menuItem = findMenuItemById(itemId);
    if (!menuItem) return;

    const existing = items.find(i => i.id === itemId);
    if (existing) {
      existing.qty++;
    } else {
      items.push({ ...menuItem, qty: 1 });
    }

    _onChange('add', menuItem);
  }

  function changeQty(itemId, delta) {
    const idx = items.findIndex(i => i.id === itemId);
    if (idx === -1) return;
    items[idx].qty += delta;
    if (items[idx].qty <= 0) items.splice(idx, 1);
    _onChange('qty');
  }

  function remove(itemId) {
    items = items.filter(i => i.id !== itemId);
    _onChange('remove');
  }

  function clear() {
    items = [];
    _onChange('clear');
  }

  function getItems() { return [...items]; }
  function isEmpty()  { return items.length === 0; }

  // ─── Computed ────────────────────────────────────────────────

  function getSummary() {
    const mooItems   = items.filter(i => i.type === 'moo');
    const drinkItems = items.filter(i => i.type === 'drink');
    const mooTotal   = mooItems.reduce((s, i) => s + i.price * i.qty, 0);
    const drinkTotal = drinkItems.reduce((s, i) => s + i.price * i.qty, 0);
    const totalQty   = items.reduce((s, i) => s + i.qty, 0);
    return {
      mooItems, drinkItems,
      mooTotal, drinkTotal,
      grandTotal: mooTotal + drinkTotal,
      totalQty
    };
  }

  // ─── Serialise for API / print ───────────────────────────────

  function toPayload(table) {
    const s = getSummary();
    return {
      timestamp:  new Date().toLocaleString('th-TH'),
      table,
      mooItems:   s.mooItems.map(i => ({ name: i.name, qty: i.qty, price: i.price, subtotal: i.price * i.qty })),
      drinkItems: s.drinkItems.map(i => ({ name: i.name, qty: i.qty, price: i.price, subtotal: i.price * i.qty })),
      mooTotal:   s.mooTotal,
      drinkTotal: s.drinkTotal,
      grandTotal: s.grandTotal
    };
  }

  // ─── Event system (simple pub/sub) ───────────────────────────

  const _listeners = [];
  function onChange(fn) { _listeners.push(fn); }
  function _onChange(event, data) {
    _listeners.forEach(fn => fn(event, data, getSummary()));
  }

  return { add, changeQty, remove, clear, getItems, isEmpty, getSummary, toPayload, onChange };
})();
