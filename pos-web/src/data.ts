import type { Category, Product, Sale, User, UserRole } from './types';

// บัญชีทดสอบ (mock) — ตอนต่อ backend จริงให้ย้ายไปตรวจที่ server แทน
export interface UserAccount extends User {
  password: string;
}

export const USERS: UserAccount[] = [
  { username: 'mali', password: '1234', name: 'มะลิ', role: 'cashier' },
  { username: 'admin', password: 'admin', name: 'คุณเหมียว', role: 'owner' },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'เจ้าของร้าน',
  cashier: 'แคชเชียร์',
};

export const CATEGORIES: Category[] = [
  { id: 'drink', name: 'เครื่องดื่ม', icon: '' },
  { id: 'snack', name: 'ขนม', icon: '' },
  { id: 'fresh', name: 'ของสด', icon: '' },
  { id: 'dry', name: 'อาหารแห้ง', icon: '' },
  { id: 'home', name: 'ของใช้ในบ้าน', icon: '' },
  { id: 'candy', name: 'ลูกอม', icon: '' },
];

let seq = 0;
function P(name: string, price: number, cat: string, stock: number, icon: string, description = ''): Product {
  seq += 1;
  return { id: 'p' + seq, name, description, price, cost: Math.round(price * 0.72), cat, stock, icon, img: null, barcode: '' };
}

export function makeInitialProducts(): Product[] {
  seq = 0;
  return [
    P('น้ำดื่มสิงห์', 7, 'drink', 48, '', 'ขวด 600 มล. เย็นชื่นใจ'),
    P('โค้ก กระป๋อง', 15, 'drink', 30, '', 'กระป๋อง 325 มล.'),
    P('เอ็ม-150', 12, 'drink', 24, '', 'เครื่องดื่มชูกำลัง ขวด 150 มล.'),
    P('นมกล่องจืด', 18, 'drink', 20, '', 'นม UHT รสจืด 225 มล.'),
    P('กาแฟกระป๋อง', 20, 'drink', 18, '', 'กาแฟดำพร้อมดื่ม 180 มล.'),
    P('ชาเขียวขวด', 20, 'drink', 15, '', 'ชาเขียวพร้อมดื่ม 500 มล.'),
    P('มันฝรั่งเลย์', 20, 'snack', 22, '', 'รสออริจินัล ซองใหญ่'),
    P('ปลาเส้นทาโร่', 10, 'snack', 40, '', 'ปลาเส้นปรุงรส ซองเล็ก'),
    P('บิสกิตแครกเกอร์', 12, 'snack', 16, '', 'แครกเกอร์กรอบ ห่อสุดคุ้ม'),
    P('สาหร่ายเถ้าแก่น้อย', 22, 'snack', 14, '', 'สาหร่ายทอดกรอบ รสคลาสสิก'),
    P('ไข่ไก่ เบอร์ 2', 5, 'fresh', 60, '', 'ไข่ไก่สดใหม่ ราคาต่อฟอง'),
    P('นมสดพาสเจอร์ไรส์', 25, 'fresh', 12, '', 'นมสดแท้ 100% ขวด 830 มล. แช่เย็น'),
    P('เต้าหู้ไข่', 10, 'fresh', 8, '', 'เต้าหู้ไข่หลอด เหมาะทำแกงจืด'),
    P('มาม่าต้มยำ', 6, 'dry', 80, '', 'บะหมี่กึ่งสำเร็จรูป รสต้มยำกุ้ง'),
    P('ข้าวสารหอมมะลิ 1กก.', 48, 'dry', 10, '', 'ข้าวหอมมะลิแท้ ถุง 1 กิโลกรัม'),
    P('น้ำปลาทิพรส', 35, 'dry', 9, '', 'น้ำปลาแท้ ขวด 700 มล.'),
    P('น้ำมันพืช 1ล.', 58, 'dry', 6, '', 'น้ำมันปาล์ม ขวด 1 ลิตร'),
    P('น้ำตาลทราย 1กก.', 28, 'dry', 11, '', 'น้ำตาลทรายขาว ถุง 1 กิโลกรัม'),
    P('สบู่โพรเทคส์', 15, 'home', 20, '', 'สบู่ก้อนสูตรแอนตี้แบคทีเรีย'),
    P('ยาสีฟันคอลเกต', 42, 'home', 7, '', 'ยาสีฟันสูตรเย็นสดชื่น หลอด 150 กรัม'),
    P('ผงซักฟอกซอง', 10, 'home', 26, '', 'ผงซักฟอกซองเล็ก ซักมือ'),
    P('กระดาษทิชชู่', 25, 'home', 13, '', 'กระดาษชำระ แพ็ค 6 ม้วน'),
    P('ไฟแช็ก', 10, 'home', 34, '', 'ไฟแช็กแก๊ส จุดติดง่าย'),
    P('หมากฝรั่งล็อตเต้', 5, 'candy', 50, '', 'หมากฝรั่งรสมิ้นต์ แผงเล็ก'),
    P('ลูกอมมิ้นต์', 8, 'candy', 44, '', 'ลูกอมรสมิ้นต์เย็น ซองพกพา'),
    P('เยลลี่ผลไม้', 10, 'candy', 30, '', 'เยลลี่รูปหมี รสผลไม้รวม'),
  ];
}

export function genHistory(products: Product[]): Sale[] {
  const sales: Sale[] = [];
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setFullYear(start.getFullYear() - 2);
  const weights = products.map((p) => Math.max(1.2, 9 - p.price / 10) + Math.random() * 2.5);
  const totalW = weights.reduce((a, b) => a + b, 0);
  const pick = () => {
    let r = Math.random() * totalW;
    for (let i = 0; i < products.length; i++) {
      r -= weights[i];
      if (r <= 0) return products[i];
    }
    return products[products.length - 1];
  };
  for (const day = new Date(start); day <= now; day.setDate(day.getDate() + 1)) {
    const isToday = day.toDateString() === now.toDateString();
    const dow = day.getDay();
    const weekend = dow === 0 || dow === 6;
    const me = (day.getFullYear() - start.getFullYear()) * 12 + (day.getMonth() - start.getMonth());
    const growth = 1 + (me / 24) * 0.35;
    const seas = day.getMonth() === 11 ? 1.25 : day.getMonth() === 3 ? 1.12 : 1;
    let nb = Math.round((weekend ? 15 : 10) * growth * seas * (0.7 + Math.random() * 0.6));
    let maxHour = 20;
    if (isToday) {
      maxHour = Math.min(20, now.getHours());
      if (maxHour < 7) nb = 0;
    }
    for (let b = 0; b < nb; b++) {
      const hour = 7 + Math.floor(Math.random() * (maxHour - 7 + 1));
      const minute = Math.floor(Math.random() * 60);
      const ts = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0).getTime();
      const nItems = 1 + Math.floor(Math.random() * 5);
      const chosen: Record<string, number> = {};
      for (let k = 0; k < nItems; k++) {
        const p = pick();
        chosen[p.id] = (chosen[p.id] || 0) + (1 + Math.floor(Math.random() * 3));
      }
      const items = Object.keys(chosen).map((id) => {
        const p = products.find((x) => x.id === id)!;
        const qty = chosen[id];
        return { id, name: p.name, icon: p.icon, img: null, cat: p.cat, price: p.price, qty, lineTotal: p.price * qty };
      });
      const total = items.reduce((a, i) => a + i.lineTotal, 0);
      const method: 'cash' | 'qr' = Math.random() < 0.6 ? 'cash' : 'qr';
      const received = method === 'cash' ? Math.ceil(total / 10) * 10 + (Math.random() < 0.25 ? 10 : 0) : total;
      sales.push({ no: 0, ts, items, total, method, received, change: received - total, note: '' });
    }
  }
  sales.sort((a, b) => a.ts - b.ts);
  sales.forEach((s, i) => { s.no = i + 1; });
  return sales;
}
