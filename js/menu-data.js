// =============================================================
// menu-data.js — เมนูร้าน Houseหมูกระทะ
// =============================================================
//  อัปเดตตามเมนูจริงของร้าน
//  - moo   : เซ็ต + Add On + ลูกชิ้น + ผัก + ทานเล่น
//  - drink : เครื่องดื่ม
//
//  แต่ละเมนู: emoji (fallback) + img (ลิงก์รูป ถ้ามี)
// =============================================================

const MENU_DATA = {

  // =================== หมูกระทะ / อาหาร ===================
  moo: {
    tabLabel: '🥩 หมูกระทะ',
    categories: ['ทั้งหมด', 'เซ็ตหมูกระทะ', 'Add On', 'ลูกชิ้น', 'ผัก', 'ทานเล่น'],
    items: [
      // ---------- เซ็ตหมูกระทะ / จิ้มจุ่ม ----------
      { id: 'set1', name: 'ชุดมินิ',     price: 199, emoji: '🍲', cat: 'เซ็ตหมูกระทะ', badge: 'hot',
        desc: 'หมู/เนื้อ/ไก่ + ทะเล + ผัก', img: 'images/moo/Mini.jpg' },
      { id: 'set2', name: 'ชุดกลาง',     price: 299, emoji: '🍲', cat: 'เซ็ตหมูกระทะ', badge: 'hot',
        desc: 'หมู/เนื้อ/ไก่ + ทะเล + ผัก', img: 'images/moo/กลาง.jpg' },
      { id: 'set3', name: 'ชุดใหญ่',     price: 399, emoji: '🍲', cat: 'เซ็ตหมูกระทะ',
        desc: 'หมู/เนื้อ/ไก่ + ทะเล + ผัก', img: 'images/moo/ใหญ่.jpg' },

      // ---------- Add On (50฿) ----------
      { id: 'a01', name: 'หมูนุ่ม House',     price: 50, emoji: '🥩', cat: 'Add On', badge: 'hot', img: 'images/moo/หมูนุ่ม House.jpg' },
      { id: 'a02', name: 'หมูพริกไทยดำ',     price: 50, emoji: '🍖', cat: 'Add On', img: 'images/moo/หมูหมัก.jpg' },
      { id: 'a05', name: 'สามชั้นสไลด์',     price: 50, emoji: '🥩', cat: 'Add On', img: 'images/moo/สามชั้นสไลด์.jpeg' },
      { id: 'a07', name: 'เนื้อ',            price: 50, emoji: '🥩', cat: 'Add On', img: 'images/moo/เนื้อ.jpg' },
      { id: 'a09', name: 'ปลาหมึก',          price: 50, emoji: '🦑', cat: 'Add On', img: 'images/moo/ปลาหมึก.jpg' },
      { id: 'a10', name: 'กุ้ง',             price: 50, emoji: '🦐', cat: 'Add On', img: 'images/moo/กุ้ง.jpg' },

      // ---------- ผัก ----------
      { id: 'v01', name: 'เซ็ทผัก',          price: 50, emoji: '🥬', cat: 'ผัก', badge: 'hot', img: 'images/moo/เซ็ทผัก.jpg' },

      // ---------- อาหารทานเล่น (70฿) ----------
      { id: 'f01', name: 'เฟรนฟราย',        price: 70, emoji: '🍟', cat: 'ทานเล่น', img: 'images/moo/เฟรนฟราย.jpg' },
      { id: 'f02', name: 'นักเก็ต',          price: 70, emoji: '🍗', cat: 'ทานเล่น', img: 'images/moo/นักเก็ต.jpg' },
      
    ]
  },

  // =================== เครื่องดื่ม ===================
  drink: {
    tabLabel: '🥤 เครื่องดื่ม',
    categories: ['ทั้งหมด', 'น้ำอัดลม', 'น้ำเปล่า', 'แอลกอฮอล์', 'อื่นๆ'],
    items: [
      // ---------- น้ำอัดลม ----------
      { id: 'd01', name: 'น้ำอัดลม แดง (เล็ก)',   price: 20, emoji: '🥤', cat: 'น้ำอัดลม', img: 'images/drink/น้ำอัดลมเเดงเล็ก.jpg' },
      { id: 'd02', name: 'น้ำอัดลม เขียว (เล็ก)', price: 20, emoji: '🥤', cat: 'น้ำอัดลม', img: 'images/drink/น้ำอัดลมเขียวเล็ก.jpg' },
      { id: 'd03', name: 'น้ำอัดลม ส้ม (เล็ก)',   price: 20, emoji: '🥤', cat: 'น้ำอัดลม', img: 'images/drink/น้ำอัดลมส้มเล็ก.jpg' },
      { id: 'd04', name: 'โค้ก (เล็ก)',           price: 20, emoji: '🥤', cat: 'น้ำอัดลม', badge: 'hot', img: 'images/drink/โค้กเล็ก.jpg' },
      { id: 'd05', name: 'โค้ก (ใหญ่)',           price: 40, emoji: '🥤', cat: 'น้ำอัดลม', img: 'images/drink/โค้กใหญ่.jpg' },
      { id: 'd06', name: 'เป๊ปซี่ (เล็ก)',        price: 20, emoji: '🥤', cat: 'น้ำอัดลม', img: 'images/drink/เป๊ปซี่เล็ก.jpg' },
      { id: 'd07', name: 'เป๊ปซี่ (ใหญ่)',        price: 40, emoji: '🥤', cat: 'น้ำอัดลม', img: 'images/drink/เป๊ปซี่ใหญ่.jpg' },

      // ---------- น้ำเปล่า ----------
      { id: 'd08', name: 'น้ำเปล่า (เล็ก)',       price: 15, emoji: '💧', cat: 'น้ำเปล่า', img: 'images/drink/น้ำเปล่าเล็ก.jpg' },
      { id: 'd09', name: 'น้ำเปล่า (ใหญ่)',       price: 30, emoji: '💧', cat: 'น้ำเปล่า', img: 'images/drink/น้ำเปล่าใหญ่.jpg' },

      // ---------- แอลกอฮอล์ ----------
      { id: 'd10', name: 'เบียร์ช้าง',           price: 65, emoji: '🍺', cat: 'แอลกอฮอล์', img: 'images/drink/เบียร์ช้าง.jpg' },
      { id: 'd11', name: 'เบียร์ลีโอ',           price: 65, emoji: '🍺', cat: 'แอลกอฮอล์', img: 'images/drink/เบียร์ลีโอ.jpg' },
      { id: 'd12', name: 'เบียร์สิงห์',          price: 75, emoji: '🍺', cat: 'แอลกอฮอล์', img: 'images/drink/เบียร์สิง.jpg' },

      // ---------- อื่นๆ ----------
      { id: 'd13', name: 'น้ำแข็ง (ถัง)',        price: 20, emoji: '🧊', cat: 'อื่นๆ', img: 'images/drink/ถังน้ำเเข็ง.jpg' },
    ]
  }
};

// Helper: หา item จาก id ทุก section
function findMenuItemById(id) {
  for (const section of Object.values(MENU_DATA)) {
    const found = section.items.find(i => i.id === id);
    if (found) return { ...found, type: id.startsWith('d') ? 'drink' : 'moo' };
  }
  return null;
}

// Helper: render รูป/emoji
function renderItemVisual(item, size = 54, cls = '') {
  if (item && item.img) {
    return `<img class="item-img ${cls}" src="${item.img}" alt="${item.name||''}"
                 style="width:${size}px;height:${size}px"
                 onerror="this.outerHTML='<span class=\\'item-emoji-fallback\\'>${item.emoji||'🍽️'}</span>'">`;
  }
  return `<span class="item-emoji-fallback ${cls}">${item?.emoji || '🍽️'}</span>`;
}
