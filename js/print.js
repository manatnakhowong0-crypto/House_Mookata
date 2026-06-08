// =============================================================
// print.js — ระบบพิมพ์ใบเสร็จ
// =============================================================

const Printer = (() => {

  // ─── Main print function ──────────────────────────────────────
  function printReceipt(payload) {
    const shopName = Settings.get('shopName') || 'หมูกระทะ POS';
    const html = _buildReceiptHTML(shopName, payload);
    _openPrintWindow(html);
  }

  // ─── Build receipt HTML ───────────────────────────────────────
  function _buildReceiptHTML(shopName, p) {
    const mooRows   = p.mooItems.map(_itemRow).join('');
    const drinkRows = p.drinkItems.map(_itemRow).join('');

    return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>ใบเสร็จ - ${shopName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      width: 300px;
      padding: 12px;
      color: #111;
    }
    .center { text-align: center; }
    .shop-name { font-size: 18px; font-weight: bold; margin-bottom: 2px; }
    .divider { border: none; border-top: 1px dashed #999; margin: 8px 0; }
    .divider-solid { border: none; border-top: 2px solid #111; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; margin: 3px 0; }
    .row .name { flex: 1; }
    .row .qty  { width: 30px; text-align: center; }
    .row .amt  { width: 60px; text-align: right; }
    .section-header {
      font-weight: bold; font-size: 12px; letter-spacing: 1px;
      margin: 8px 0 4px;
      background: #f0f0f0; padding: 2px 4px; border-radius: 2px;
    }
    .total-row { font-weight: bold; font-size: 15px; }
    .sub-row   { color: #555; font-size: 12px; }
    .footer    { text-align: center; margin-top: 12px; font-size: 12px; color: #777; }
    @media print {
      body { width: 100%; }
      @page { margin: 0; size: 80mm auto; }
    }
  </style>
</head>
<body>
  <div class="center">
    <div class="shop-name">🔥 ${shopName}</div>
    <div>โต๊ะ ${p.table}</div>
    <div style="font-size:11px;color:#777">${p.timestamp}</div>
  </div>

  <hr class="divider-solid">

  ${p.mooItems.length > 0 ? `
  <div class="section-header">🥩 หมูกระทะ</div>
  ${mooRows}
  <div class="row sub-row">
    <span class="name">รวมหมูกระทะ</span>
    <span class="amt">฿${p.mooTotal}</span>
  </div>` : ''}

  ${p.drinkItems.length > 0 ? `
  <hr class="divider">
  <div class="section-header">🥤 เครื่องดื่ม</div>
  ${drinkRows}
  <div class="row sub-row">
    <span class="name">รวมเครื่องดื่ม</span>
    <span class="amt">฿${p.drinkTotal}</span>
  </div>` : ''}

  <hr class="divider-solid">
  <div class="row total-row">
    <span class="name">ยอดรวมทั้งหมด</span>
    <span class="amt">฿${p.grandTotal}</span>
  </div>

  <div class="footer">
    <div>— ขอบคุณที่ใช้บริการ 🙏 —</div>
  </div>
</body>
</html>`;
  }

  function _itemRow(item) {
    return `<div class="row">
      <span class="name">${item.name}</span>
      <span class="qty">x${item.qty}</span>
      <span class="amt">฿${item.subtotal}</span>
    </div>`;
  }

  function _openPrintWindow(html) {
    const w = window.open('', '_blank', 'width=360,height=600');
    if (!w) { alert('กรุณาอนุญาต Pop-up เพื่อพิมพ์ใบเสร็จ'); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  }

  return { printReceipt };
})();
