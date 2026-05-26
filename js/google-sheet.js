// =============================================================
// google-sheet.js — ส่งข้อมูลออเดอร์ไป Google Sheets
// =============================================================

const GoogleSheet = (() => {

  // ─── Connection status ────────────────────────────────────────
  let _connected = false;
  const _statusListeners = [];

  function onStatusChange(fn) { _statusListeners.push(fn); }
  function _emitStatus() { _statusListeners.forEach(fn => fn(_connected)); }

  function setConnected(val) {
    _connected = val;
    _emitStatus();
  }

  function isConnected() { return _connected && !!Settings.get('scriptUrl'); }

  // ─── Check connection on load ─────────────────────────────────
  async function testConnection() {
    const url = Settings.get('scriptUrl');
    if (!url) { setConnected(false); return false; }

    try {
      // GET request เพื่อ ping ว่า script ยังทำงานอยู่
      const res = await fetch(url, { method: 'GET', mode: 'no-cors' });
      setConnected(true);
      return true;
    } catch {
      setConnected(false);
      return false;
    }
  }

  // ─── Send order payload ───────────────────────────────────────
  async function sendOrder(payload) {
    const url = Settings.get('scriptUrl');
    if (!url) {
      console.warn('[GoogleSheet] ยังไม่ได้ตั้งค่า Script URL');
      return { ok: false, reason: 'no_url' };
    }

    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',               // Google Apps Script ต้องใช้ no-cors
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // no-cors = ไม่สามารถอ่าน response body ได้
      // แต่ถ้าไม่ throw = สำเร็จ
      _saveLocalBackup(payload);
      return { ok: true };

    } catch (err) {
      console.error('[GoogleSheet] ส่งข้อมูลไม่ได้:', err);
      _saveLocalBackup(payload);        // backup ไว้ในเครื่องก่อน
      return { ok: false, reason: 'network_error', error: err };
    }
  }

  // ─── Local backup (IndexedDB-free fallback via localStorage) ──
  function _saveLocalBackup(payload) {
    try {
      const key = 'mookata_orders';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push({ ...payload, _savedAt: Date.now() });
      // เก็บแค่ 200 ออเดอร์ล่าสุด
      if (existing.length > 200) existing.splice(0, existing.length - 200);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch { /* storage full — ignore */ }
  }

  // Expose history (for future "unsent orders" retry feature)
  function getLocalOrders() {
    return JSON.parse(localStorage.getItem('mookata_orders') || '[]');
  }

  return { sendOrder, testConnection, isConnected, onStatusChange, getLocalOrders };
})();
