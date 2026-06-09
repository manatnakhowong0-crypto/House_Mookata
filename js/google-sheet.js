// =============================================================
// google-sheet.js — ส่ง/รับข้อมูลกับ Google Apps Script v3
// =============================================================

const GoogleSheet = (() => {

  let _connected = false;
  const _listeners = [];

  function onStatusChange(fn) { _listeners.push(fn); }
  function _emit() { _listeners.forEach(fn => fn(_connected)); }
  function _setConnected(val) { _connected = val; _emit(); }
  function isConnected() { return _connected && !!Settings.get('scriptUrl'); }

  // ─── Base fetch helpers ────────────────────────────────────
  async function _get(params = {}) {
    const url = Settings.get('scriptUrl');
    if (!url) return null;
    const qs  = new URLSearchParams(params).toString();
    const res = await fetch(`${url}?${qs}`);
    return res.json();
  }

  // POST แบบ no-cors (ส่งได้แต่อ่าน response ไม่ได้)
  async function _postNoCors(payload) {
    const url = Settings.get('scriptUrl');
    if (!url) return { ok: false, reason: 'no_url' };
    try {
      await fetch(url, {
        method:  'POST',
        mode:    'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      return { ok: true };
    } catch (err) {
      console.error('[Sheet] POST failed:', err);
      return { ok: false, reason: 'network_error' };
    }
  }

  // ─── Connection ────────────────────────────────────────────
  async function testConnection() {
    const url = Settings.get('scriptUrl');
    if (!url) { _setConnected(false); return false; }
    try {
      const data = await _get({ action: 'ping' });
      _setConnected(data?.status === 'ok');
      return data?.status === 'ok';
    } catch {
      _setConnected(false);
      return false;
    }
  }

  // ─── ORDER ────────────────────────────────────────────────
  async function sendOrder(payload) {
    _saveLocal(payload);
    return _postNoCors({ action: 'order', ...payload });
  }

  // ─── READ (GET) ───────────────────────────────────────────
  async function getTodaySummary()           { return _get({ action: 'today' }); }
  async function getSummaryByDate(date)      { return _get({ action: 'summary', date }); }
  async function getOrdersByDate(date)       { return _get({ action: 'orders',  date }); }
  async function getDailyReport(limit = 30) { return _get({ action: 'daily', limit }); }

  // ─── STOCK READ ───────────────────────────────────────────
  async function getStock()    { return _get({ action: 'stock' }); }
  async function getLowStock() { return _get({ action: 'stock_low' }); }

  // ─── STOCK WRITE ──────────────────────────────────────────
  async function stockAdd(payload)    { return _postNoCors({ action: 'stock_add',    ...payload }); }
  async function stockSet(payload)    { return _postNoCors({ action: 'stock_set',    ...payload }); }
  async function stockAdjust(payload) { return _postNoCors({ action: 'stock_adjust', ...payload }); }

  // ─── Local backup ─────────────────────────────────────────
  function _saveLocal(payload) {
    try {
      const KEY  = 'mookata_orders';
      const list = JSON.parse(localStorage.getItem(KEY) || '[]');
      list.push({ ...payload, _savedAt: Date.now() });
      if (list.length > 300) list.splice(0, list.length - 300);
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch {}
  }

  function getLocalOrders() {
    return JSON.parse(localStorage.getItem('mookata_orders') || '[]');
  }

  return {
    testConnection, isConnected, onStatusChange,
    sendOrder,
    getTodaySummary, getSummaryByDate, getOrdersByDate, getDailyReport,
    getStock, getLowStock, stockAdd, stockSet, stockAdjust,
    getLocalOrders,
  };
})();
