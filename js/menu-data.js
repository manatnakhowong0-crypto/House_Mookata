// =============================================================
// menu-data.js — ข้อมูลเมนูทั้งหมด แก้ไขเพิ่ม/ลดเมนูได้ที่นี่
// =============================================================

const MENU_DATA = {

  // =================== หมูกระทะ ===================
  moo: {
    tabLabel: '🥩 หมูกระทะ',
    categories: ['ทั้งหมด', 'เนื้อหมู', 'เนื้อวัว', 'อาหารทะเล', 'ผัก/อื่นๆ'],
    items: [
      // --- เนื้อหมู ---
      { id: 'm01', name: 'หมูสามชั้น',      price: 89,  emoji: '🥩', cat: 'เนื้อหมู',    badge: 'hot' },
      { id: 'm02', name: 'หมูคอ',           price: 89,  emoji: '🍖', cat: 'เนื้อหมู',    badge: 'hot' },
      { id: 'm03', name: 'หมูหัน',          price: 99,  emoji: '🥓', cat: 'เนื้อหมู' },
      { id: 'm04', name: 'หมูลิ้น',         price: 109, emoji: '🍖', cat: 'เนื้อหมู' },
      { id: 'm05', name: 'หมูกรอบ',         price: 119, emoji: '🥓', cat: 'เนื้อหมู',   badge: 'new' },

      // --- เนื้อวัว ---
      { id: 'm06', name: 'เนื้อวัวสไลด์',  price: 129, emoji: '🥩', cat: 'เนื้อวัว' },
      { id: 'm07', name: 'เนื้อออสเตรเลีย',price: 159, emoji: '🥩', cat: 'เนื้อวัว',   badge: 'new' },
      { id: 'm08', name: 'เนื้อวากิว',      price: 199, emoji: '🥩', cat: 'เนื้อวัว',   badge: 'hot' },

      // --- อาหารทะเล ---
      { id: 'm09', name: 'กุ้งแม่น้ำ',     price: 149, emoji: '🦐', cat: 'อาหารทะเล' },
      { id: 'm10', name: 'หอยเชลล์',       price: 139, emoji: '🦪', cat: 'อาหารทะเล' },
      { id: 'm11', name: 'ปลาหมึก',        price: 99,  emoji: '🦑', cat: 'อาหารทะเล' },
      { id: 'm12', name: 'ปลานิล',         price: 119, emoji: '🐟', cat: 'อาหารทะเล' },

      // --- ผัก/อื่นๆ ---
      { id: 'm13', name: 'ผักรวม',         price: 49,  emoji: '🥬', cat: 'ผัก/อื่นๆ' },
      { id: 'm14', name: 'เต้าหู้',        price: 39,  emoji: '⬜', cat: 'ผัก/อื่นๆ' },
      { id: 'm15', name: 'บะหมี่',         price: 29,  emoji: '🍜', cat: 'ผัก/อื่นๆ' },
      { id: 'm16', name: 'ไข่ไก่',         price: 19,  emoji: '🥚', cat: 'ผัก/อื่นๆ' },
      { id: 'm17', name: 'ข้าวสวย',        price: 15,  emoji: '🍚', cat: 'ผัก/อื่นๆ' },
    ]
  },

  // =================== เครื่องดื่ม ===================
  drink: {
    tabLabel: '🥤 เครื่องดื่ม',
    categories: ['ทั้งหมด', 'น้ำอัดลม', 'น้ำผลไม้', 'ชา/กาแฟ', 'แอลกอฮอล์'],
    items: [
      // --- น้ำอัดลม ---
      { id: 'd01', name: 'โค้ก',           price: 25, emoji: '🥤', cat: 'น้ำอัดลม' },
      { id: 'd02', name: 'เป๊ปซี่',        price: 25, emoji: '🥤', cat: 'น้ำอัดลม' },
      { id: 'd03', name: 'สไปรท์',         price: 25, emoji: '🥤', cat: 'น้ำอัดลม' },
      { id: 'd04', name: 'น้ำเปล่า',       price: 15, emoji: '💧', cat: 'น้ำอัดลม' },

      // --- น้ำผลไม้ ---
      { id: 'd05', name: 'น้ำส้ม',         price: 35, emoji: '🍊', cat: 'น้ำผลไม้' },
      { id: 'd06', name: 'น้ำมะพร้าว',    price: 45, emoji: '🥥', cat: 'น้ำผลไม้' },
      { id: 'd07', name: 'น้ำแตงโม',      price: 40, emoji: '🍉', cat: 'น้ำผลไม้',  badge: 'new' },
      { id: 'd08', name: 'น้ำมะม่วง',     price: 40, emoji: '🥭', cat: 'น้ำผลไม้' },

      // --- ชา/กาแฟ ---
      { id: 'd09', name: 'ชาเย็น',         price: 30, emoji: '🧋', cat: 'ชา/กาแฟ' },
      { id: 'd10', name: 'กาแฟเย็น',       price: 35, emoji: '☕', cat: 'ชา/กาแฟ' },
      { id: 'd11', name: 'ชาไทย',          price: 35, emoji: '🫖', cat: 'ชา/กาแฟ',  badge: 'hot' },
      { id: 'd12', name: 'โอเลี้ยง',       price: 30, emoji: '🧊', cat: 'ชา/กาแฟ' },

      // --- แอลกอฮอล์ ---
      { id: 'd13', name: 'เบียร์ช้าง',     price: 65, emoji: '🍺', cat: 'แอลกอฮอล์' },
      { id: 'd14', name: 'เบียร์ลีโอ',     price: 60, emoji: '🍺', cat: 'แอลกอฮอล์' },
      { id: 'd15', name: 'เบียร์สิงห์',    price: 65, emoji: '🍺', cat: 'แอลกอฮอล์' },
      { id: 'd16', name: 'ไวน์แดง (แก้ว)', price: 120,emoji: '🍷', cat: 'แอลกอฮอล์', badge: 'new' },
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
