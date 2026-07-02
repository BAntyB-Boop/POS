import { useState, useEffect, useRef } from 'react';
import type { Screen, ThemeName, Product } from '../types';
import { Bell } from 'lucide-react';

interface Props {
  screen: Screen;
  productCount: number;
  now: number;
  onSetTheme: (t: ThemeName) => void;
  onToggleSidebar: () => void;
  lowStockProducts: Product[];
  onEditProduct: (id: string) => void;
}

const swatch = (bg: string): React.CSSProperties => ({
  width: 22, height: 22, padding: 0, borderRadius: '50%', border: '2px solid #fff',
  boxShadow: '0 0 0 1.5px var(--line)', cursor: 'pointer', background: bg,
});

export default function Header({ screen, productCount, now, onSetTheme, onToggleSidebar, lowStockProducts, onEditProduct }: Props) {
  const title = screen === 'pos' ? 'ขายหน้าร้าน' : screen === 'products' ? 'จัดการสินค้า' : 'รายงานยอดขาย';
  const sub = screen === 'pos' ? 'เลือกสินค้าเพื่อเพิ่มลงตะกร้า' : screen === 'products' ? `${productCount} รายการในระบบ` : 'ภาพรวมการขายวันนี้';
  const d = new Date(now);
  const dateLabel = d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  const clockLabel = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header style={{ height: 66, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px 0 12px', borderBottom: '1px solid var(--line)', background: 'var(--panel)', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <button
          onClick={onToggleSidebar}
          title="เปิด/ปิดเมนู"
          style={{ width: 40, height: 40, flex: 'none', border: 'none', borderRadius: 12, background: 'transparent', cursor: 'pointer', fontSize: 20, color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ☰
        </button>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "'Itim',cursive", fontSize: 21, lineHeight: 1.1, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingRight: 12, borderRight: '1px solid var(--line)' }}>
          <button onClick={() => onSetTheme('morning')} title="เช้า" style={swatch('#CF3A24')} />
          <button onClick={() => onSetTheme('shade')} title="ร่มเงา" style={swatch('#2C6E63')} />
          <button onClick={() => onSetTheme('lamp')} title="แสงไฟ" style={swatch('#C97A2B')} />
        </div>

        {/* Bell Notifications */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            title="การแจ้งเตือน"
            style={{
              position: 'relative',
              width: 36,
              height: 36,
              borderRadius: 11,
              border: '1.5px solid var(--line)',
              background: 'var(--panel)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muted)',
              transition: '.15s',
              outline: 'none',
            }}
          >
            <Bell
              size={18}
              style={
                lowStockProducts.length > 0
                  ? { animation: 'bellRing 10s infinite', transformOrigin: 'top center', display: 'block' }
                  : undefined
              }
            />
            {lowStockProducts.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  background: 'var(--danger)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  boxShadow: '0 0 0 2px var(--panel)',
                }}
              >
                {lowStockProducts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: 44,
                right: 0,
                width: 290,
                maxHeight: 340,
                background: 'var(--panel)',
                border: '1.5px solid var(--line)',
                borderRadius: 16,
                boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'pop 0.18s ease-out',
              }}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>
                การแจ้งเตือน
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {lowStockProducts.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
                    ไม่มีการแจ้งเตือนในขณะนี้
                  </div>
                ) : (
                  lowStockProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onEditProduct(p.id);
                        setShowNotifications(false);
                      }}
                      className="notification-item"
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--line)',
                        fontSize: 12.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: '.15s',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{p.name}</div>
                      <div style={{ color: 'var(--danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5 }}>
                        <span>สินค้าใกล้หมดสต็อก</span>
                        <span style={{ fontWeight: 700 }}>เหลือ {p.stock} (เกณฑ์ {p.reorderLevel})</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right', paddingLeft: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{clockLabel} น.</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{dateLabel}</div>
        </div>
      </div>
    </header>
  );
}
