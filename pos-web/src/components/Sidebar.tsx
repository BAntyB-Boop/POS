import type { Screen } from '../types';

interface Props {
  storeName: string;
  screen: Screen;
  onNavigate: (s: Screen) => void;
}

const navStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14,
  cursor: 'pointer', fontSize: 15, fontWeight: active ? 700 : 600, border: 'none', textAlign: 'left',
  width: '100%', transition: '.15s', background: active ? 'var(--soft)' : 'transparent',
  color: active ? 'var(--brand)' : 'var(--muted)', font: 'inherit',
});

export default function Sidebar({ storeName, screen, onNavigate }: Props) {
  return (
    <aside style={{ width: 238, flex: 'none', display: 'flex', flexDirection: 'column', background: 'var(--panel)', borderRight: '1px solid var(--line)', padding: '20px 16px', gap: 6, zIndex: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 6px 18px' }}>
        <div style={{ width: 44, height: 44, flex: 'none', borderRadius: 15, background: 'var(--soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'floaty 4s ease-in-out infinite' }}>
          <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
            <path d="M7 5 L15 16 L7 19 Z" fill="var(--brand)" />
            <path d="M33 5 L25 16 L33 19 Z" fill="var(--brand)" />
            <circle cx="20" cy="23" r="13" fill="var(--brand)" />
            <circle cx="15.5" cy="21" r="1.9" fill="#fff" />
            <circle cx="24.5" cy="21" r="1.9" fill="#fff" />
            <path d="M18.5 25.5 Q20 27 21.5 25.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M20 24 l-1.4 -1.6 h2.8 z" fill="#fff" />
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: "'Itim',cursive", fontSize: 20, lineHeight: 1, color: 'var(--ink)' }}>{storeName}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>ระบบขายหน้าร้าน</div>
        </div>
      </div>

      <button onClick={() => onNavigate('pos')} style={navStyle(screen === 'pos')}><span style={{ fontSize: 18 }}>🛒</span><span>ขายหน้าร้าน</span></button>
      <button onClick={() => onNavigate('products')} style={navStyle(screen === 'products')}><span style={{ fontSize: 18 }}>📦</span><span>จัดการสินค้า</span></button>
      <button onClick={() => onNavigate('reports')} style={navStyle(screen === 'reports')}><span style={{ fontSize: 18 }}>📊</span><span>รายงานยอดขาย</span></button>

      <div style={{ flex: 1 }} />

      <div style={{ padding: 14, borderRadius: 16, background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ width: 40, height: 40, flex: 'none', borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🐱</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>มะลิ</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>แคชเชียร์</div>
        </div>
      </div>
    </aside>
  );
}
