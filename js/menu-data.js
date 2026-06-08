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
        desc: 'หมู/เนื้อ/ไก่ + ทะเล + ผัก', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop&auto=format' },
      { id: 'set2', name: 'ชุดกลาง',     price: 299, emoji: '🍲', cat: 'เซ็ตหมูกระทะ', badge: 'hot',
        desc: 'หมู/เนื้อ/ไก่ + ทะเล + ผัก', img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&h=200&fit=crop&auto=format' },
      { id: 'set3', name: 'ชุดใหญ่',     price: 399, emoji: '🍲', cat: 'เซ็ตหมูกระทะ',
        desc: 'หมู/เนื้อ/ไก่ + ทะเล + ผัก', img: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=200&h=200&fit=crop&auto=format' },
      { id: 'set4', name: 'เซ็ตย่างให้', price: 79,  emoji: '🔥', cat: 'เซ็ตหมูกระทะ', badge: 'new',
        desc: 'บริการย่างให้', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&h=200&fit=crop&auto=format' },

      // ---------- Add On (50฿) ----------
      { id: 'a01', name: 'หมูนุ่ม House',     price: 50, emoji: '🥩', cat: 'Add On', badge: 'hot', img: 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=200&h=200&fit=crop&auto=format' },
      { id: 'a02', name: 'หมูพริกไทยดำ',     price: 50, emoji: '🍖', cat: 'Add On', img: 'https://images.unsplash.com/photo-1558030006-450675393462?w=200&h=200&fit=crop&auto=format' },
      { id: 'a03', name: 'หมูสันในสไลด์',    price: 50, emoji: '🥓', cat: 'Add On', img: 'https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?w=200&h=200&fit=crop&auto=format' },
      { id: 'a04', name: 'หมูสันคอสไลด์',    price: 50, emoji: '🥓', cat: 'Add On', img: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=200&h=200&fit=crop&auto=format' },
      { id: 'a05', name: 'สามชั้นสไลด์',     price: 50, emoji: '🥩', cat: 'Add On', img: 'https://images.unsplash.com/photo-1623236765986-cbc87d35a82a?w=200&h=200&fit=crop&auto=format' },
      { id: 'a06', name: 'เบคอน',            price: 50, emoji: '🥓', cat: 'Add On', img: 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=200&h=200&fit=crop&auto=format' },
      { id: 'a07', name: 'เนื้อ',            price: 50, emoji: '🥩', cat: 'Add On', img: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=200&h=200&fit=crop&auto=format' },
      { id: 'a08', name: 'ไก่',              price: 50, emoji: '🍗', cat: 'Add On', img: 'https://images.unsplash.com/photo-1604908177522-f65e2f84296c?w=200&h=200&fit=crop&auto=format' },
      { id: 'a09', name: 'ปลาหมึก',          price: 50, emoji: '🦑', cat: 'Add On', img: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=200&h=200&fit=crop&auto=format' },
      { id: 'a10', name: 'กุ้ง',             price: 50, emoji: '🦐', cat: 'Add On', img: 'https://images.unsplash.com/photo-1565680018160-d7b7b9fc4878?w=200&h=200&fit=crop&auto=format' },

      // ---------- ลูกชิ้น ----------
      { id: 'b01', name: 'ปูอัด',            price: 20, emoji: '🦀', cat: 'ลูกชิ้น', img: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=200&h=200&fit=crop&auto=format' },
      { id: 'b02', name: 'เต้าหู้ชีส',       price: 20, emoji: '🧀', cat: 'ลูกชิ้น', img: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200&h=200&fit=crop&auto=format' },
      { id: 'b03', name: 'เต้าหู้ปลา',       price: 20, emoji: '🍥', cat: 'ลูกชิ้น', img: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=200&h=200&fit=crop&auto=format' },
      { id: 'b04', name: 'เต้าหู้ไข่',       price: 20, emoji: '🥚', cat: 'ลูกชิ้น', img: 'https://images.unsplash.com/photo-1518569656558-1f25e69d2fd4?w=200&h=200&fit=crop&auto=format' },
      { id: 'b05', name: 'ชีส',              price: 50, emoji: '🧀', cat: 'ลูกชิ้น', img: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=200&h=200&fit=crop&auto=format' },

      // ---------- ผัก ----------
      { id: 'v01', name: 'เซ็ทผัก',          price: 50, emoji: '🥬', cat: 'ผัก', badge: 'hot', img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&h=200&fit=crop&auto=format' },
      { id: 'v02', name: 'ผักบุ้ง',          price: 20, emoji: '🥬', cat: 'ผัก', img: 'https://images.unsplash.com/photo-1498579397066-22750a3cb424?w=200&h=200&fit=crop&auto=format' },
      { id: 'v03', name: 'กระหล่ำปลี',      price: 20, emoji: '🥬', cat: 'ผัก', img: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=200&h=200&fit=crop&auto=format' },
      { id: 'v04', name: 'ผักกาดขาว',       price: 20, emoji: '🥬', cat: 'ผัก', img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200&h=200&fit=crop&auto=format' },
      { id: 'v05', name: 'เห็ดเข็มทอง',     price: 20, emoji: '🍄', cat: 'ผัก', img: 'https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=200&h=200&fit=crop&auto=format' },
      { id: 'v06', name: 'ข้าวโพด',         price: 20, emoji: '🌽', cat: 'ผัก', img: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=200&h=200&fit=crop&auto=format' },
      { id: 'v07', name: 'แครอท',           price: 20, emoji: '🥕', cat: 'ผัก', img: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=200&h=200&fit=crop&auto=format' },
      { id: 'v08', name: 'ตั้งโอ๋',          price: 20, emoji: '🥬', cat: 'ผัก', img: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=200&h=200&fit=crop&auto=format' },
      { id: 'v09', name: 'วุ้นเส้น',         price: 20, emoji: '🍜', cat: 'ผัก', img: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=200&h=200&fit=crop&auto=format' },
      { id: 'v10', name: 'ไข่ไก่',           price: 10, emoji: '🥚', cat: 'ผัก', img: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=200&h=200&fit=crop&auto=format' },

      // ---------- อาหารทานเล่น (70฿) ----------
      { id: 'f01', name: 'เฟรนฟราย',        price: 70, emoji: '🍟', cat: 'ทานเล่น', img: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&h=200&fit=crop&auto=format' },
      { id: 'f02', name: 'นักเก็ต',          price: 70, emoji: '🍗', cat: 'ทานเล่น', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&h=200&fit=crop&auto=format' },
      { id: 'f03', name: 'ไก่ป็อป',          price: 70, emoji: '🍗', cat: 'ทานเล่น', img: 'https://images.unsplash.com/photo-1587848641040-9527a1278d4b?w=200&h=200&fit=crop&auto=format' },
    ]
  },

  // =================== เครื่องดื่ม ===================
  drink: {
    tabLabel: '🥤 เครื่องดื่ม',
    categories: ['ทั้งหมด', 'น้ำอัดลม', 'น้ำเปล่า', 'แอลกอฮอล์', 'อื่นๆ'],
    items: [
      // ---------- น้ำอัดลม ----------
      { id: 'd01', name: 'น้ำอัดลม แดง (เล็ก)',   price: 20, emoji: '🥤', cat: 'น้ำอัดลม', img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&h=200&fit=crop&auto=format' },
      { id: 'd02', name: 'น้ำอัดลม เขียว (เล็ก)', price: 20, emoji: '🥤', cat: 'น้ำอัดลม', img: 'https://images.unsplash.com/photo-1585162697884-7c00c71f0eb7?w=200&h=200&fit=crop&auto=format' },
      { id: 'd03', name: 'น้ำอัดลม ส้ม (เล็ก)',   price: 20, emoji: '🥤', cat: 'น้ำอัดลม', img: 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=200&h=200&fit=crop&auto=format' },
      { id: 'd04', name: 'โค้ก (เล็ก)',           price: 20, emoji: '🥤', cat: 'น้ำอัดลม', badge: 'hot', img: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200&h=200&fit=crop&auto=format' },
      { id: 'd05', name: 'โค้ก (ใหญ่)',           price: 40, emoji: '🥤', cat: 'น้ำอัดลม', img: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=200&h=200&fit=crop&auto=format' },
      { id: 'd06', name: 'เป๊ปซี่ (เล็ก)',        price: 20, emoji: '🥤', cat: 'น้ำอัดลม', img: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=200&h=200&fit=crop&auto=format' },
      { id: 'd07', name: 'เป๊ปซี่ (ใหญ่)',        price: 40, emoji: '🥤', cat: 'น้ำอัดลม', img: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=200&h=200&fit=crop&auto=format' },

      // ---------- น้ำเปล่า ----------
      { id: 'd08', name: 'น้ำเปล่า (เล็ก)',       price: 15, emoji: '💧', cat: 'น้ำเปล่า', img: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=200&h=200&fit=crop&auto=format' },
      { id: 'd09', name: 'น้ำเปล่า (ใหญ่)',       price: 30, emoji: '💧', cat: 'น้ำเปล่า', img: 'https://images.unsplash.com/photo-1616118132534-381148898bb4?w=200&h=200&fit=crop&auto=format' },

      // ---------- แอลกอฮอล์ ----------
      { id: 'd10', name: 'เบียร์ช้าง',           price: 65, emoji: '🍺', cat: 'แอลกอฮอล์', img: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=200&h=200&fit=crop&auto=format' },
      { id: 'd11', name: 'เบียร์ลีโอ',           price: 65, emoji: '🍺', cat: 'แอลกอฮอล์', img: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=200&h=200&fit=crop&auto=format' },
      { id: 'd12', name: 'เบียร์สิงห์',          price: 75, emoji: '🍺', cat: 'แอลกอฮอล์', img: 'https://images.unsplash.com/photo-1532634993-15f421e42ec0?w=200&h=200&fit=crop&auto=format' },

      // ---------- อื่นๆ ----------
      { id: 'd13', name: 'น้ำแข็ง (ถัง)',        price: 20, emoji: '🧊', cat: 'อื่นๆ', img: 'https://images.unsplash.com/photo-1518467166778-b88f373ffec7?w=200&h=200&fit=crop&auto=format' },
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
