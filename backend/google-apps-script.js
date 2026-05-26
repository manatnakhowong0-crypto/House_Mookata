// =============================================================
// backend/google-apps-script.js
// วาง code นี้ใน Google Apps Script แล้ว Deploy เป็น Web App
// =============================================================
//
// วิธีติดตั้ง:
//   1. เปิด Google Sheets ใหม่
//   2. Extensions → Apps Script → ลบ code เดิม → วาง code นี้
//   3. Deploy → New Deployment → Web App
//      - Execute as : Me
//      - Who has access : Anyone
//   4. Copy Deployment URL → ใส่ในหน้าเว็บ POS (ปุ่ม ⚙️)
//
// Sheet ที่จะถูกสร้างอัตโนมัติ:
//   • หมูกระทะ   — รายการอาหารแต่ละชิ้น
//   • เครื่องดื่ม — รายการเครื่องดื่มแต่ละชิ้น
//   • สรุปยอด    — ยอดรวมทุก transaction
// =============================================================

const SHEET_MOO     = 'หมูกระทะ';
const SHEET_DRINK   = 'เครื่องดื่ม';
const SHEET_SUMMARY = 'สรุปยอด';

// ─── POST: รับออเดอร์จากหน้าเว็บ ────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss   = SpreadsheetApp.getActiveSpreadsheet();
    ensureSheets(ss);

    // บันทึกรายการหมูกระทะ
    if (data.mooItems && data.mooItems.length > 0) {
      const sheet = ss.getSheetByName(SHEET_MOO);
      data.mooItems.forEach(item => {
        sheet.appendRow([
          data.timestamp,
          `โต๊ะ ${data.table}`,
          item.name,
          item.qty,
          item.price,
          item.subtotal
        ]);
      });
    }

    // บันทึกรายการเครื่องดื่ม
    if (data.drinkItems && data.drinkItems.length > 0) {
      const sheet = ss.getSheetByName(SHEET_DRINK);
      data.drinkItems.forEach(item => {
        sheet.appendRow([
          data.timestamp,
          `โต๊ะ ${data.table}`,
          item.name,
          item.qty,
          item.price,
          item.subtotal
        ]);
      });
    }

    // บันทึกสรุปยอดรวม
    ss.getSheetByName(SHEET_SUMMARY).appendRow([
      data.timestamp,
      `โต๊ะ ${data.table}`,
      data.mooTotal,
      data.drinkTotal,
      data.grandTotal
    ]);

    return _json({ status: 'ok', message: 'บันทึกสำเร็จ' });

  } catch (err) {
    return _json({ status: 'error', message: err.toString() });
  }
}

// ─── GET: ping / health check ────────────────────────────────
function doGet() {
  return _json({ status: 'ready', message: 'MooKata POS API is running 🔥' });
}

// ─── Helper: สร้าง Sheet + Header อัตโนมัติ ─────────────────
function ensureSheets(ss) {
  _ensureSheet(ss, SHEET_MOO,
    ['วันที่/เวลา', 'โต๊ะ', 'เมนู', 'จำนวน', 'ราคา/ชิ้น', 'รวม'],
    '#FF4500'
  );
  _ensureSheet(ss, SHEET_DRINK,
    ['วันที่/เวลา', 'โต๊ะ', 'เมนู', 'จำนวน', 'ราคา/ชิ้น', 'รวม'],
    '#1A6B9A'
  );
  _ensureSheet(ss, SHEET_SUMMARY,
    ['วันที่/เวลา', 'โต๊ะ', 'ยอดหมูกระทะ', 'ยอดเครื่องดื่ม', 'ยอดรวม'],
    '#2D1A0E'
  );
}

function _ensureSheet(ss, name, headers, color) {
  if (ss.getSheetByName(name)) return;
  const s = ss.insertSheet(name);
  const headerRange = s.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold')
             .setBackground(color)
             .setFontColor('#FFFFFF')
             .setHorizontalAlignment('center');
  s.setFrozenRows(1);
  s.setColumnWidth(1, 160); // วันที่
  s.setColumnWidth(2, 80);  // โต๊ะ
  s.setColumnWidth(3, 160); // ชื่อ
}

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
