import type { Screen } from '../types';
import { ShoppingCart, Package, BarChart3 } from 'lucide-react';

interface Props {
  screen: Screen;
  onNavigate: (s: Screen) => void;
}

const ITEMS: { id: Screen; label: string; Icon: typeof ShoppingCart; primary?: boolean }[] = [
  { id: 'products', label: 'สินค้า', Icon: Package },
  { id: 'pos', label: 'ขาย', Icon: ShoppingCart, primary: true },
  { id: 'reports', label: 'รายงาน', Icon: BarChart3 },
];

// แถบเมนูล่างจอ — ใช้แทนเมนูข้างบนมือถือ/แท็บเล็ต ให้กดสลับหน้าได้แบบแอปมือถือ
// ปุ่ม "ขาย" อยู่กลางและเน้นด้วยวงกลมสีแบรนด์ เพราะเป็นงานหลักของแคชเชียร์
export default function BottomNav({ screen, onNavigate }: Props) {
  return (
    <nav className="bottom-nav">
      {ITEMS.map(({ id, label, Icon, primary }) => {
        const active = screen === id;
        if (primary) {
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="bottom-nav-item"
              style={{ color: 'var(--brand)' }}
            >
              <span className="bottom-nav-fab" style={{ background: 'var(--brand)', boxShadow: active ? '0 6px 18px rgba(0,0,0,.28)' : 'var(--shadow)' }}>
                <Icon size={28} color="#fff" strokeWidth={2.4} />
              </span>
              <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 600 }}>{label}</span>
            </button>
          );
        }
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="bottom-nav-item"
            style={{ color: active ? 'var(--brand)' : 'var(--muted)' }}
          >
            <Icon size={22} strokeWidth={active ? 2.4 : 2} />
            <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
