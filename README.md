# 🔥 หมูกระทะ POS

ระบบ Point-of-Sale สำหรับร้านหมูกระทะ — ทำงานได้บนเบราว์เซอร์ล้วน ไม่ต้องติดตั้งอะไร  
บันทึกออเดอร์ลง **Google Sheets** แบ่งแยก **หมูกระทะ** และ **เครื่องดื่ม** อัตโนมัติ

---

## 📁 โครงสร้างไฟล์

```
mookata-pos/
├── index.html                  ← เปิดไฟล์นี้ในเบราว์เซอร์
├── css/
│   └── style.css               ← UI ทั้งหมด
├── js/
│   ├── menu-data.js            ← ข้อมูลเมนู (แก้ไขเมนูได้ที่นี่)
│   ├── cart.js                 ← จัดการตะกร้าสินค้า
│   ├── google-sheet.js         ← ส่งข้อมูลไป Google Sheets
│   ├── print.js                ← พิมพ์ใบเสร็จ
│   └── app.js                  ← Logic หลัก + UI rendering
├── config/
│   └── settings.json           ← Template config (ค่าจริงใน localStorage)
├── backend/
│   └── google-apps-script.js  ← Code ที่ต้องวางใน Google Apps Script
└── assets/
    ├── images/                 ← รูปเมนู (optional)
    └── icons/                  ← ไอคอน (optional)
```

---

## 🚀 วิธีใช้งาน (ไม่ต้องเชื่อม Sheets)

1. เปิดไฟล์ `index.html` ด้วยเบราว์เซอร์ (Chrome / Firefox / Edge)
2. เลือกโต๊ะ → กดเมนูเพื่อเพิ่ม → กด **บันทึกออเดอร์**
3. ออเดอร์จะถูกบันทึกใน localStorage (ดูได้ที่ DevTools → Application)

---

## 📊 เชื่อม Google Sheets (แนะนำ)

### ขั้นตอน

**1. สร้าง Google Sheets ใหม่**  
ไปที่ [sheets.new](https://sheets.new) สร้าง Spreadsheet ใหม่

**2. เปิด Apps Script**  
`Extensions` → `Apps Script`

**3. วาง Code**  
ลบ code เดิมทั้งหมด → วาง code จากไฟล์ `backend/google-apps-script.js`

**4. Deploy**
```
Deploy → New Deployment
  Type        : Web App
  Execute as  : Me
  Who can access : Anyone
```
กด `Deploy` → คัดลอก **Deployment URL**

**5. ใส่ URL ในหน้าเว็บ**  
กดปุ่ม ⚙️ ที่มุมขวาบน → วาง URL → กด **บันทึก**

### Sheet ที่จะถูกสร้างอัตโนมัติ

| Sheet | คอลัมน์ |
|-------|---------|
| 🟠 หมูกระทะ | วันที่/เวลา, โต๊ะ, เมนู, จำนวน, ราคา/ชิ้น, รวม |
| 🔵 เครื่องดื่ม | วันที่/เวลา, โต๊ะ, เมนู, จำนวน, ราคา/ชิ้น, รวม |
| ⬛ สรุปยอด | วันที่/เวลา, โต๊ะ, ยอดหมูกระทะ, ยอดเครื่องดื่ม, ยอดรวม |

---

## 🍖 แก้ไขเมนู

แก้ไขที่ `js/menu-data.js` — เพิ่ม object ใน array `items`:

```js
{ id: 'm99', name: 'หมูนำเข้า', price: 199, emoji: '🥩', cat: 'เนื้อหมู', badge: 'new' }
```

| field  | ค่า |
|--------|-----|
| `id`   | ต้องไม่ซ้ำ — หมูขึ้นต้น `m`, เครื่องดื่มขึ้นต้น `d` |
| `badge`| `'hot'` หรือ `'new'` (ไม่ใส่ก็ได้) |
| `cat`  | ต้องตรงกับค่าใน `categories` array |

---

## 🖨️ ใบเสร็จ

กดปุ่ม **🖨️ พิมพ์** จะเปิด popup พร้อมใบเสร็จแยกรายการ ขนาด 80mm  
ต้องอนุญาต Pop-up ในเบราว์เซอร์ก่อน

---

## 📱 Responsive

รองรับ Tablet และมือถือ — layout จะสลับเป็น 2 rows อัตโนมัติ

---

## 🔒 Privacy

ข้อมูลออเดอร์ทั้งหมดเก็บใน `localStorage` ของเครื่องคุณเอง  
ส่งไป Google Sheets เฉพาะเมื่อกด **บันทึกออเดอร์** เท่านั้น
