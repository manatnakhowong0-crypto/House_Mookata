// ╔══════════════════════════════════════════════════════════════╗
// ║       HOUSEหมูกระทะ — Google Apps Script v3.0               ║
// ║       POS + Stock Management Backend                         ║
// ╠══════════════════════════════════════════════════════════════╣
// ║  Sheets ที่สร้างอัตโนมัติ:                                   ║
// ║  • ออเดอร์_หมูกระทะ   — รายการอาหารแต่ละชิ้น               ║
// ║  • ออเดอร์_เครื่องดื่ม — รายการเครื่องดื่มแต่ละชิ้น         ║
// ║  • สรุปออเดอร์         — สรุปทุก order (1 แถว/order)         ║
// ║  • สรุปรายวัน          — ยอดรวมแต่ละวัน                      ║
// ║  • สต็อกสินค้า         — คงเหลือปัจจุบัน + แจ้งเตือน        ║
// ║  • ประวัติสต็อก        — ทุกการเพิ่ม/ตัดสต็อก               ║
// ╚══════════════════════════════════════════════════════════════╝

// ══════════════════════════════════════════════
//  CONFIG
// ══════════════════════════════════════════════
const SHEET = {
  MOO:          'ออเดอร์_หมูกระทะ',
  DRINK:        'ออเดอร์_เครื่องดื่ม',
  SUMMARY:      'สรุปออเดอร์',
  DAILY:        'สรุปรายวัน',
  STOCK:        'สต็อกสินค้า',
  STOCK_LOG:    'ประวัติสต็อก',
};

// ══════════════════════════════════════════════
//  doPost — dispatcher
// ══════════════════════════════════════════════
function doPost(e) {
  try {
    const raw = JSON.parse(e.postData.contents);
    const ss  = SpreadsheetApp.getActiveSpreadsheet();
    _initAllSheets(ss);

    const action = raw.action || 'order';

    if (action === 'order')          return _handleOrder(ss, raw);
    if (action === 'stock_add')      return _handleStockAdd(ss, raw);
    if (action === 'stock_set')      return _handleStockSet(ss, raw);
    if (action === 'stock_adjust')   return _handleStockAdjust(ss, raw);

    return _json({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    console.error('doPost error:', err);
    return _json({ status: 'error', message: err.toString() });
  }
}

// ══════════════════════════════════════════════
//  doGet — dispatcher
// ══════════════════════════════════════════════
function doGet(e) {
  try {
    const action = (e.parameter.action || 'ping').toLowerCase();
    const ss     = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'ping')    return _json({ status: 'ok', message: '🔥 MooKata POS API v3', time: _now() });
    if (action === 'today')   return _json(_getDailySummary(ss, _today()));
    if (action === 'summary') return _json(_getDailySummary(ss, e.parameter.date || _today()));
    if (action === 'orders')  return _json(_getOrdersByDate(ss, e.parameter.date || _today()));
    if (action === 'daily')   return _json(_getDailyList(ss, parseInt(e.parameter.limit || '30')));
    if (action === 'stock')   return _json(_getStock(ss));
    if (action === 'stock_low') return _json(_getLowStock(ss));
    // ── Item-level breakdown ──────────────────────────────────
    if (action === 'moo_day')       return _json(_getItemsByDate(ss, SHEET.MOO,   e.parameter.date  || _today()));
    if (action === 'drink_day')     return _json(_getItemsByDate(ss, SHEET.DRINK, e.parameter.date  || _today()));
    if (action === 'moo_month')     return _json(_getItemsByMonth(ss, SHEET.MOO,   e.parameter.month));
    if (action === 'drink_month')   return _json(_getItemsByMonth(ss, SHEET.DRINK, e.parameter.month));
    if (action === 'moo_year')      return _json(_getItemsByYear(ss, SHEET.MOO,   e.parameter.year));
    if (action === 'drink_year')    return _json(_getItemsByYear(ss, SHEET.DRINK, e.parameter.year));
    if (action === 'summary_month') return _json(_getSummaryByMonth(ss, e.parameter.month));
    if (action === 'summary_year')  return _json(_getSummaryByYear(ss,  e.parameter.year));

    return _json({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    return _json({ status: 'error', message: err.toString() });
  }
}

// ══════════════════════════════════════════════
//  ORDER HANDLER
// ══════════════════════════════════════════════
function _handleOrder(ss, raw) {
  const orderId   = _generateOrderId(ss);
  const tsDisplay = _now();
  const dateOnly  = _today();

  // Sheet หมูกระทะ
  if (raw.mooItems && raw.mooItems.length > 0) {
    const sheet = ss.getSheetByName(SHEET.MOO);
    raw.mooItems.forEach(item => {
      sheet.appendRow([orderId, tsDisplay, dateOnly, `โต๊ะ ${raw.table}`,
                       item.name, item.qty, item.price, item.subtotal]);
    });
  }

  // Sheet เครื่องดื่ม
  if (raw.drinkItems && raw.drinkItems.length > 0) {
    const sheet = ss.getSheetByName(SHEET.DRINK);
    raw.drinkItems.forEach(item => {
      sheet.appendRow([orderId, tsDisplay, dateOnly, `โต๊ะ ${raw.table}`,
                       item.name, item.qty, item.price, item.subtotal]);
    });
  }

  // Sheet สรุปออเดอร์
  ss.getSheetByName(SHEET.SUMMARY).appendRow([
    orderId, tsDisplay, dateOnly, `โต๊ะ ${raw.table}`,
    (raw.mooItems||[]).length, (raw.drinkItems||[]).length,
    (raw.mooItems||[]).reduce((s,i)=>s+i.qty,0),
    (raw.drinkItems||[]).reduce((s,i)=>s+i.qty,0),
    raw.mooTotal, raw.drinkTotal, raw.grandTotal,
  ]);

  // Sheet สรุปรายวัน
  _updateDailySummary(ss, dateOnly, raw);

  // ── ตัดสต็อกอัตโนมัติ ──────────────────────────────────────
  const allItems = [...(raw.mooItems||[]), ...(raw.drinkItems||[])];
  const stockWarnings = _deductStock(ss, orderId, allItems);

  return _json({ status: 'ok', orderId, stockWarnings, message: 'บันทึกสำเร็จ' });
}

// ══════════════════════════════════════════════
//  STOCK HANDLERS
// ══════════════════════════════════════════════

// เพิ่มสต็อก (รับของ)
function _handleStockAdd(ss, raw) {
  // raw = { items: [{ itemId, name, qty, unit, cost?, note? }] }
  const sheet   = ss.getSheetByName(SHEET.STOCK);
  const logSheet = ss.getSheetByName(SHEET.STOCK_LOG);
  const results = [];

  (raw.items || []).forEach(item => {
    const row = _findStockRow(sheet, item.itemId);
    if (row === -1) {
      // รายการใหม่ — เพิ่มลง Sheet
      sheet.appendRow([
        item.itemId,
        item.name,
        item.unit || 'จาน',
        item.qty,               // คงเหลือ
        item.alertQty || 5,     // แจ้งเตือนเมื่อต่ำกว่า
        item.cost || 0,
        _now(),
      ]);
    } else {
      // รายการเดิม — บวกเพิ่ม
      const cur = Number(sheet.getRange(row, 4).getValue());
      sheet.getRange(row, 4).setValue(cur + item.qty);
      sheet.getRange(row, 7).setValue(_now()); // updated_at
    }

    // บันทึก log
    logSheet.appendRow([
      _now(), item.itemId, item.name, 'รับของ', item.qty,
      _getStockQty(sheet, item.itemId), raw.note || '', raw.by || 'system'
    ]);

    results.push({ itemId: item.itemId, added: item.qty });
  });

  return _json({ status: 'ok', results });
}

// ตั้งค่าสต็อกตรงๆ (นับของ)
function _handleStockSet(ss, raw) {
  // raw = { items: [{ itemId, name, qty, unit, alertQty?, cost? }] }
  const sheet    = ss.getSheetByName(SHEET.STOCK);
  const logSheet = ss.getSheetByName(SHEET.STOCK_LOG);

  (raw.items || []).forEach(item => {
    const row = _findStockRow(sheet, item.itemId);
    if (row === -1) {
      sheet.appendRow([
        item.itemId, item.name, item.unit || 'จาน',
        item.qty, item.alertQty || 5, item.cost || 0, _now()
      ]);
    } else {
      const prev = Number(sheet.getRange(row, 4).getValue());
      sheet.getRange(row, 4).setValue(item.qty);
      if (item.alertQty !== undefined) sheet.getRange(row, 5).setValue(item.alertQty);
      if (item.cost !== undefined)     sheet.getRange(row, 6).setValue(item.cost);
      sheet.getRange(row, 7).setValue(_now());

      logSheet.appendRow([
        _now(), item.itemId, item.name, 'ปรับยอด (นับของ)',
        item.qty - prev, item.qty, raw.note || '', raw.by || 'system'
      ]);
    }
  });

  return _json({ status: 'ok', message: 'ตั้งค่าสต็อกสำเร็จ' });
}

// ปรับสต็อกแบบ +/- (ของหาย/เสีย)
function _handleStockAdjust(ss, raw) {
  // raw = { itemId, delta, reason, by }
  const sheet    = ss.getSheetByName(SHEET.STOCK);
  const logSheet = ss.getSheetByName(SHEET.STOCK_LOG);
  const row      = _findStockRow(sheet, raw.itemId);
  if (row === -1) return _json({ status: 'error', message: 'ไม่พบสินค้า: ' + raw.itemId });

  const cur = Number(sheet.getRange(row, 4).getValue());
  const newQty = Math.max(0, cur + raw.delta);
  sheet.getRange(row, 4).setValue(newQty);
  sheet.getRange(row, 7).setValue(_now());

  const name = sheet.getRange(row, 2).getValue();
  logSheet.appendRow([
    _now(), raw.itemId, name, raw.reason || 'ปรับด้วยตัวเอง',
    raw.delta, newQty, raw.note || '', raw.by || 'system'
  ]);

  return _json({ status: 'ok', itemId: raw.itemId, newQty });
}

// ══════════════════════════════════════════════
//  STOCK HELPERS
// ══════════════════════════════════════════════

// ตัดสต็อกเมื่อขายได้ — return รายการที่สต็อกต่ำ
function _deductStock(ss, orderId, items) {
  const sheet    = ss.getSheetByName(SHEET.STOCK);
  const logSheet = ss.getSheetByName(SHEET.STOCK_LOG);
  const warnings = [];

  items.forEach(item => {
    const row = _findStockRowByName(sheet, item.name);
    if (row === -1) return; // ไม่ได้ track สต็อกสินค้านี้

    const cur      = Number(sheet.getRange(row, 4).getValue());
    const alertQty = Number(sheet.getRange(row, 5).getValue());
    const newQty   = Math.max(0, cur - item.qty);
    const name     = sheet.getRange(row, 2).getValue();
    const itemId   = sheet.getRange(row, 1).getValue();

    sheet.getRange(row, 4).setValue(newQty);
    sheet.getRange(row, 7).setValue(_now());

    logSheet.appendRow([
      _now(), itemId, name, 'ขาย', -item.qty, newQty, `Order: ${orderId}`, 'POS'
    ]);

    // แจ้งเตือนถ้าสต็อกต่ำ
    if (newQty <= alertQty) {
      warnings.push({ itemId, name, remaining: newQty, alertQty });
    }
  });

  return warnings;
}

// ดึงสต็อกทั้งหมด
function _getStock(ss) {
  const sheet   = ss.getSheetByName(SHEET.STOCK);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { items: [] };

  const rows  = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  const items = rows
    .filter(r => r[0])
    .map(r => ({
      itemId:    r[0],
      name:      r[1],
      unit:      r[2],
      qty:       r[3],
      alertQty:  r[4],
      cost:      r[5],
      updatedAt: r[6],
      isLow:     Number(r[3]) <= Number(r[4]),
    }));

  return { count: items.length, items };
}

// ดึงเฉพาะสต็อกที่ต่ำกว่าเกณฑ์
function _getLowStock(ss) {
  const all  = _getStock(ss);
  const low  = all.items.filter(i => i.isLow);
  return { count: low.length, items: low };
}

function _getStockQty(sheet, itemId) {
  const row = _findStockRow(sheet, itemId);
  return row === -1 ? 0 : Number(sheet.getRange(row, 4).getValue());
}

// หาแถวจาก itemId (คอลัมน์ A)
function _findStockRow(sheet, itemId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const idx = ids.findIndex(id => String(id).trim() === String(itemId).trim());
  return idx === -1 ? -1 : idx + 2;
}

// หาแถวจากชื่อสินค้า (คอลัมน์ B) — ใช้ตัดสต็อกตาม order
function _findStockRowByName(sheet, name) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const names = sheet.getRange(2, 2, lastRow - 1, 1).getValues().flat();
  const idx   = names.findIndex(n => String(n).trim() === String(name).trim());
  return idx === -1 ? -1 : idx + 2;
}

// ══════════════════════════════════════════════
//  ORDER HELPERS (เหมือนเดิม)
// ══════════════════════════════════════════════
function _generateOrderId(ss) {
  const dateKey = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyyMMdd');
  const sheet   = ss.getSheetByName(SHEET.SUMMARY);
  const lastRow = sheet.getLastRow();
  let num = 1;
  if (lastRow > 1) {
    const ids      = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
    const todayIds = ids.filter(id => String(id).includes(dateKey));
    if (todayIds.length > 0) {
      const parts = String(todayIds[todayIds.length - 1]).split('-');
      num = parseInt(parts[parts.length - 1] || '0') + 1;
    }
  }
  return `MK-${dateKey}-${String(num).padStart(4, '0')}`;
}

function _updateDailySummary(ss, dateOnly, raw) {
  const sheet   = ss.getSheetByName(SHEET.DAILY);
  const lastRow = sheet.getLastRow();
  let targetRow = -1;
  if (lastRow > 1) {
    const dates = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
    for (let i = 0; i < dates.length; i++) {
      if (_normDate(dates[i]) === dateOnly) { targetRow = i + 2; break; }
    }
  }
  const mooQty   = (raw.mooItems||[]).reduce((s,i)=>s+i.qty,0);
  const drinkQty = (raw.drinkItems||[]).reduce((s,i)=>s+i.qty,0);
  if (targetRow === -1) {
    sheet.appendRow([dateOnly, 1, mooQty, drinkQty, raw.mooTotal, raw.drinkTotal, raw.grandTotal]);
  } else {
    const r = sheet.getRange(targetRow, 1, 1, 7).getValues()[0];
    sheet.getRange(targetRow, 2, 1, 6).setValues([[
      (r[1]||0)+1, (r[2]||0)+mooQty, (r[3]||0)+drinkQty,
      (r[4]||0)+raw.mooTotal, (r[5]||0)+raw.drinkTotal, (r[6]||0)+raw.grandTotal
    ]]);
  }
}

function _getDailySummary(ss, dateStr) {
  const sheet   = ss.getSheetByName(SHEET.DAILY);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { date: dateStr, found: false };
  const rows = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  const row  = rows.find(r => _normDate(r[0]) === dateStr);
  if (!row) return { date: dateStr, found: false };
  return { date:row[0], found:true, orders:row[1], mooQty:row[2], drinkQty:row[3],
           mooTotal:row[4], drinkTotal:row[5], grandTotal:row[6] };
}

function _getOrdersByDate(ss, dateStr) {
  const sheet   = ss.getSheetByName(SHEET.SUMMARY);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { date: dateStr, orders: [] };
  const rows   = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
  const orders = rows.filter(r => _normDate(r[2]) === dateStr)
    .map(r => ({ orderId:r[0], time:r[1], date:r[2], table:r[3],
                 mooQty:r[6], drinkQty:r[7], mooTotal:r[8], drinkTotal:r[9], grandTotal:r[10] }));
  return { date: dateStr, count: orders.length, orders };
}

function _getDailyList(ss, limit) {
  const sheet   = ss.getSheetByName(SHEET.DAILY);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { days: [] };
  const rows = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  const days = rows.filter(r=>r[0]).slice(-limit).reverse()
    .map(r => ({ date:r[0], orders:r[1], mooQty:r[2], drinkQty:r[3],
                 mooTotal:r[4], drinkTotal:r[5], grandTotal:r[6] }));
  return { count: days.length, days };
}

// ══════════════════════════════════════════════
//  SHEET INITIALIZER
// ══════════════════════════════════════════════
function _initAllSheets(ss) {
  _ensureSheet(ss, SHEET.MOO,
    ['Order ID','วันที่/เวลา','วันที่','โต๊ะ','ชื่อเมนู','จำนวน','ราคา/ชิ้น','รวม'],
    '#C0392B', {1:120,2:160,3:100,4:70,5:180,6:60,7:80,8:80});

  _ensureSheet(ss, SHEET.DRINK,
    ['Order ID','วันที่/เวลา','วันที่','โต๊ะ','ชื่อเมนู','จำนวน','ราคา/ชิ้น','รวม'],
    '#1A6B9A', {1:120,2:160,3:100,4:70,5:180,6:60,7:80,8:80});

  _ensureSheet(ss, SHEET.SUMMARY,
    ['Order ID','วันที่/เวลา','วันที่','โต๊ะ','เมนูหมู(ประเภท)','เมนูดื่ม(ประเภท)',
     'ชิ้นหมูกระทะ','ชิ้นเครื่องดื่ม','ยอดหมูกระทะ','ยอดเครื่องดื่ม','ยอดรวม'],
    '#1A0A00', {1:130,2:160,3:100,4:70,5:120,6:120,7:100,8:110,9:100,10:110,11:80});

  _ensureSheet(ss, SHEET.DAILY,
    ['วันที่','จำนวน Order','ชิ้นหมูกระทะ','ชิ้นเครื่องดื่ม','ยอดหมูกระทะ','ยอดเครื่องดื่ม','ยอดรวม'],
    '#2D1A0E', {1:110,2:100,3:110,4:120,5:110,6:120,7:90});

  // ── Sheet สต็อกสินค้า ──────────────────────────────────────
  _ensureSheet(ss, SHEET.STOCK,
    ['Item ID','ชื่อสินค้า','หน่วย','คงเหลือ','แจ้งเตือนเมื่อต่ำกว่า','ราคาทุน/หน่วย','อัปเดตล่าสุด'],
    '#7B3F00', {1:100,2:200,3:70,4:80,5:120,6:110,7:150});

  // ── Sheet ประวัติสต็อก ────────────────────────────────────
  _ensureSheet(ss, SHEET.STOCK_LOG,
    ['วันที่/เวลา','Item ID','ชื่อสินค้า','ประเภท','จำนวนเปลี่ยน','คงเหลือหลัง','หมายเหตุ','โดย'],
    '#4A2500', {1:150,2:100,3:200,4:120,5:100,6:100,7:200,8:100});
}

function _ensureSheet(ss, name, headers, bg, colWidths) {
  if (ss.getSheetByName(name)) return;
  const s = ss.insertSheet(name);
  const r = s.getRange(1, 1, 1, headers.length);
  r.setValues([headers]).setFontWeight('bold').setFontSize(11)
   .setBackground(bg).setFontColor('#FFD700')
   .setHorizontalAlignment('center').setVerticalAlignment('middle');
  s.setRowHeight(1, 36);
  s.setFrozenRows(1);
  if (colWidths) Object.entries(colWidths).forEach(([c,w]) => s.setColumnWidth(+c, w));
  // ตั้งคอลัมน์ข้อมูลทั้งหมดเป็น "ข้อความ" กันไม่ให้ Sheets แปลงวันที่อัตโนมัติ
  s.getRange(2, 1, 5000, headers.length).setNumberFormat('@');
  s.getRange(2, 1, 1000, headers.length).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);
}

// ══════════════════════════════════════════════
//  ITEM-LEVEL BREAKDOWN HELPERS
// ══════════════════════════════════════════════

function _getItemsByDate(ss, sheetName, dateStr) {
  // dateStr = 'dd/MM/yyyy'
  const sheet = ss.getSheetByName(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return _emptyItems();
  const rows = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  return _aggregateItems(rows.filter(r => _normDate(r[2]) === dateStr));
}

function _getItemsByMonth(ss, sheetName, monthStr) {
  // monthStr = 'MM/yyyy'  e.g. '06/2026'
  const sheet = ss.getSheetByName(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return _emptyItems();
  const rows = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  // date col (r[2]) = 'dd/MM/yyyy' → slice(3) = 'MM/yyyy'
  return _aggregateItems(rows.filter(r => _normDate(r[2]).slice(3) === monthStr));
}

function _getItemsByYear(ss, sheetName, year) {
  // year = '2026'
  const sheet = ss.getSheetByName(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return _emptyItems();
  const rows = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  // date col slice(6) = 'yyyy'
  return _aggregateItems(rows.filter(r => _normDate(r[2]).slice(6) === String(year)));
}

function _aggregateItems(rows) {
  const agg = {};
  rows.forEach(function(r) {
    const name = String(r[4]).trim();
    if (!name) return;
    if (!agg[name]) agg[name] = { name: name, qty: 0, total: 0, price: Number(r[6]) || 0 };
    agg[name].qty   += Number(r[5]) || 0;
    agg[name].total += Number(r[7]) || 0;
  });
  const items = Object.values(agg).sort(function(a, b) { return b.qty - a.qty; });
  return {
    itemCount:   items.length,
    totalQty:    items.reduce(function(s,i){ return s+i.qty; }, 0),
    totalAmount: items.reduce(function(s,i){ return s+i.total; }, 0),
    items:       items
  };
}

function _emptyItems() {
  return { itemCount: 0, totalQty: 0, totalAmount: 0, items: [] };
}

function _getSummaryByMonth(ss, monthStr) {
  // monthStr = 'MM/yyyy'
  const sheet = ss.getSheetByName(SHEET.DAILY);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return _emptySummary();
  const rows = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  const filtered = rows.filter(function(r){ return r[0] && _normDate(r[0]).slice(3) === monthStr; });
  return _sumDailyRows(filtered);
}

function _getSummaryByYear(ss, year) {
  const sheet = ss.getSheetByName(SHEET.DAILY);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return _emptySummary();
  const rows = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  const filtered = rows.filter(function(r){ return r[0] && _normDate(r[0]).slice(6) === String(year); });
  return _sumDailyRows(filtered);
}

function _sumDailyRows(rows) {
  if (!rows.length) return _emptySummary();
  const t = rows.reduce(function(acc, r) {
    return {
      orders:     acc.orders     + (Number(r[1])||0),
      mooQty:     acc.mooQty     + (Number(r[2])||0),
      drinkQty:   acc.drinkQty   + (Number(r[3])||0),
      mooTotal:   acc.mooTotal   + (Number(r[4])||0),
      drinkTotal: acc.drinkTotal + (Number(r[5])||0),
      grandTotal: acc.grandTotal + (Number(r[6])||0),
    };
  }, { orders:0, mooQty:0, drinkQty:0, mooTotal:0, drinkTotal:0, grandTotal:0 });
  return Object.assign({ found: true, dayCount: rows.length }, t);
}

function _emptySummary() {
  return { found: false, orders:0, mooQty:0, drinkQty:0, mooTotal:0, drinkTotal:0, grandTotal:0 };
}

// ══════════════════════════════════════════════
//  DATE/TIME UTILITIES
// ══════════════════════════════════════════════
function _now()   { return Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm:ss'); }
function _today() { return Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy'); }

// แปลงค่าวันที่จาก Sheet (อาจเป็น Date object หรือ string) → 'dd/MM/yyyy' เสมอ
function _normDate(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, 'Asia/Bangkok', 'dd/MM/yyyy');
  }
  // string: ตัดเอาเฉพาะส่วนวันที่ (เผื่อมีเวลาต่อท้าย) แล้ว pad เลขศูนย์
  const s = String(v).trim().split(' ')[0].split(',')[0];
  const parts = s.split('/');
  if (parts.length === 3) {
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    let   y = parts[2];
    if (y.length === 2) y = '20' + y;
    return `${d}/${m}/${y}`;
  }
  return s;
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}

// ══════════════════════════════════════════════
//  DEV / TEST FUNCTIONS (รัน ใน Script Editor)
// ══════════════════════════════════════════════

/** ติดตั้ง Sheet ทั้งหมด (รันครั้งแรก) */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  _initAllSheets(ss);
  SpreadsheetApp.getUi().alert('✅ Setup สำเร็จ!\n\n' + Object.values(SHEET).map(s=>'• '+s).join('\n'));
}

/** โหลดสต็อกเริ่มต้นจาก menu-data (รันหลัง setup) */
function seedStock() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET.STOCK);
  _initAllSheets(ss);

  // สต็อกเริ่มต้นตามเมนูจริง Houseหมูกระทะ — แก้ qty ตามของจริงได้
  const seed = [
    // Add On
    { id:'a01', name:'หมูนุ่ม House',    unit:'จาน', qty:40, alert:10, cost:30 },
    { id:'a02', name:'หมูพริกไทยดำ',    unit:'จาน', qty:40, alert:10, cost:30 },
    { id:'a03', name:'หมูสันในสไลด์',   unit:'จาน', qty:30, alert:8,  cost:32 },
    { id:'a04', name:'หมูสันคอสไลด์',   unit:'จาน', qty:30, alert:8,  cost:32 },
    { id:'a05', name:'สามชั้นสไลด์',    unit:'จาน', qty:30, alert:8,  cost:32 },
    { id:'a06', name:'เบคอน',           unit:'จาน', qty:25, alert:8,  cost:35 },
    { id:'a07', name:'เนื้อ',           unit:'จาน', qty:25, alert:8,  cost:35 },
    { id:'a08', name:'ไก่',             unit:'จาน', qty:30, alert:8,  cost:28 },
    { id:'a09', name:'ปลาหมึก',         unit:'จาน', qty:20, alert:5,  cost:35 },
    { id:'a10', name:'กุ้ง',            unit:'จาน', qty:20, alert:5,  cost:38 },
    // ลูกชิ้น
    { id:'b01', name:'ปูอัด',           unit:'จาน', qty:40, alert:10, cost:10 },
    { id:'b02', name:'เต้าหู้ชีส',      unit:'จาน', qty:40, alert:10, cost:10 },
    { id:'b03', name:'เต้าหู้ปลา',      unit:'จาน', qty:40, alert:10, cost:10 },
    { id:'b04', name:'เต้าหู้ไข่',      unit:'จาน', qty:40, alert:10, cost:10 },
    { id:'b05', name:'ชีส',             unit:'จาน', qty:25, alert:8,  cost:25 },
    // ผัก
    { id:'v01', name:'เซ็ทผัก',         unit:'เซ็ต', qty:30, alert:10, cost:25 },
    { id:'v02', name:'ผักบุ้ง',         unit:'จาน', qty:30, alert:10, cost:10 },
    { id:'v03', name:'กระหล่ำปลี',     unit:'จาน', qty:30, alert:10, cost:10 },
    { id:'v04', name:'ผักกาดขาว',      unit:'จาน', qty:30, alert:10, cost:10 },
    { id:'v05', name:'เห็ดเข็มทอง',    unit:'จาน', qty:30, alert:10, cost:10 },
    { id:'v06', name:'ข้าวโพด',        unit:'จาน', qty:30, alert:10, cost:10 },
    { id:'v07', name:'แครอท',          unit:'จาน', qty:30, alert:10, cost:10 },
    { id:'v08', name:'ตั้งโอ๋',         unit:'จาน', qty:30, alert:10, cost:10 },
    { id:'v09', name:'วุ้นเส้น',        unit:'จาน', qty:40, alert:10, cost:8  },
    { id:'v10', name:'ไข่ไก่',          unit:'ฟอง', qty:100,alert:20, cost:5  },
    // ทานเล่น
    { id:'f01', name:'เฟรนฟราย',       unit:'จาน', qty:30, alert:8,  cost:35 },
    { id:'f02', name:'นักเก็ต',         unit:'จาน', qty:30, alert:8,  cost:38 },
    { id:'f03', name:'ไก่ป็อป',         unit:'จาน', qty:30, alert:8,  cost:38 },
    // เครื่องดื่ม
    { id:'d01', name:'น้ำอัดลม แดง (เล็ก)',   unit:'ขวด', qty:48, alert:12, cost:10 },
    { id:'d02', name:'น้ำอัดลม เขียว (เล็ก)', unit:'ขวด', qty:48, alert:12, cost:10 },
    { id:'d03', name:'น้ำอัดลม ส้ม (เล็ก)',   unit:'ขวด', qty:48, alert:12, cost:10 },
    { id:'d04', name:'โค้ก (เล็ก)',           unit:'ขวด', qty:48, alert:12, cost:12 },
    { id:'d05', name:'โค้ก (ใหญ่)',           unit:'ขวด', qty:24, alert:8,  cost:22 },
    { id:'d06', name:'เป๊ปซี่ (เล็ก)',        unit:'ขวด', qty:48, alert:12, cost:12 },
    { id:'d07', name:'เป๊ปซี่ (ใหญ่)',        unit:'ขวด', qty:24, alert:8,  cost:22 },
    { id:'d08', name:'น้ำเปล่า (เล็ก)',       unit:'ขวด', qty:60, alert:24, cost:5  },
    { id:'d09', name:'น้ำเปล่า (ใหญ่)',       unit:'ขวด', qty:36, alert:12, cost:10 },
    { id:'d10', name:'เบียร์ช้าง',           unit:'ขวด', qty:48, alert:12, cost:45 },
    { id:'d11', name:'เบียร์ลีโอ',           unit:'ขวด', qty:48, alert:12, cost:45 },
    { id:'d12', name:'เบียร์สิงห์',          unit:'ขวด', qty:36, alert:8,  cost:52 },
    { id:'d13', name:'น้ำแข็ง (ถัง)',        unit:'ถัง', qty:20, alert:5,  cost:10 },
  ];

  // เพิ่มเฉพาะที่ยังไม่มี
  let added = 0;
  seed.forEach(item => {
    if (_findStockRow(sheet, item.id) === -1) {
      sheet.appendRow([item.id, item.name, item.unit, item.qty, item.alert, item.cost, _now()]);
      added++;
    }
  });

  SpreadsheetApp.getUi().alert(`✅ เพิ่มสต็อกเริ่มต้นสำเร็จ: ${added} รายการ`);
}

/** ทดสอบ order + ตัดสต็อก */
function testOrder() {
  const res = _handleOrder(SpreadsheetApp.getActiveSpreadsheet(), {
    table: 5,
    mooItems:   [{ name:'หมูนุ่ม House', qty:2, price:50, subtotal:100 },
                 { name:'เซ็ทผัก',       qty:1, price:50, subtotal:50  }],
    drinkItems: [{ name:'เบียร์ช้าง',    qty:3, price:65, subtotal:195 }],
    mooTotal: 150, drinkTotal: 195, grandTotal: 345,
  });
  Logger.log(res.getContent());
}

/** ทดสอบดูสต็อก */
function testGetStock() {
  Logger.log(JSON.stringify(_getStock(SpreadsheetApp.getActiveSpreadsheet()), null, 2));
}