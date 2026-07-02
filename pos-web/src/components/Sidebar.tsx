import type { Screen, User } from '../types';
import { ROLE_LABELS } from '../data';
import { ShoppingCart, Package, BarChart3, LogOut } from 'lucide-react';


interface Props {
  storeName: string;
  screen: Screen;
  onNavigate: (s: Screen) => void;
  open: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
  lowStockCount: number;
}

const navStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14,
  cursor: 'pointer', fontSize: 15, fontWeight: active ? 700 : 600, border: 'none', textAlign: 'left',
  width: '100%', transition: '.15s', background: active ? 'var(--soft)' : 'transparent',
  color: active ? 'var(--brand)' : 'var(--muted)', font: 'inherit',
});

export default function Sidebar({ storeName, screen, onNavigate, open, onClose, user, onLogout, lowStockCount }: Props) {
  const navigate = (s: Screen) => {
    onNavigate(s);
    // บนจอแคบ sidebar เป็น overlay — เลือกเมนูแล้วปิดให้เอง
    if (window.innerWidth <= 1024) onClose();
  };
  return (
    <>
    <div className={'sidebar-backdrop' + (open ? ' show' : '')} onClick={onClose} />
    <aside className={'app-sidebar' + (open ? '' : ' closed')}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 6px 18px' }}>
        <div style={{ width: 44, height: 44, flex: 'none', borderRadius: 15, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Itim',cursive", fontSize: 22 }}>
          {storeName.trim().charAt(0)}
        </div>
        <div>
          <div style={{ fontFamily: "'Itim',cursive", fontSize: 20, lineHeight: 1, color: 'var(--ink)' }}>{storeName}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>ระบบขายหน้าร้าน</div>
        </div>
      </div>

      <button onClick={() => navigate('pos')} style={navStyle(screen === 'pos')}>
        <ShoppingCart size={18} />
        <span>ขายหน้าร้าน</span>
      </button>
      <button onClick={() => navigate('products')} style={navStyle(screen === 'products')}>
        <Package size={18} />
        <span style={{ flex: 1 }}>จัดการสินค้า</span>
        {lowStockCount > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'var(--danger)', borderRadius: 999, padding: '2px 8px', flex: 'none' }}>{lowStockCount}</span>
        )}
      </button>
      <button onClick={() => navigate('reports')} style={navStyle(screen === 'reports')}>
        <BarChart3 size={18} />
        <span>รายงานยอดขาย</span>
      </button>

      <div style={{ flex: 1 }} />

      <div style={{ padding: 14, borderRadius: 16, background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ width: 40, height: 40, flex: 'none', borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: '#fff' }}>
          {user.name.trim().charAt(0)}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{ROLE_LABELS[user.role]}</div>
        </div>
        <button
          onClick={onLogout}
          title="ออกจากระบบ"
          style={{ flex: 'none', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--panel)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', color: 'var(--muted)', transition: '.15s' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
    </>
  );
}
