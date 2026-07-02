import type { Screen, ThemeName } from '../types';

interface Props {
  screen: Screen;
  productCount: number;
  now: number;
  onSetTheme: (t: ThemeName) => void;
}

const swatch = (bg: string): React.CSSProperties => ({
  width: 22, height: 22, padding: 0, borderRadius: '50%', border: '2px solid #fff',
  boxShadow: '0 0 0 1.5px var(--line)', cursor: 'pointer', background: bg,
});

export default function Header({ screen, productCount, now, onSetTheme }: Props) {
  const title = screen === 'pos' ? 'ขายหน้าร้าน' : screen === 'products' ? 'จัดการสินค้า' : 'รายงานยอดขาย';
  const sub = screen === 'pos' ? 'เลือกสินค้าเพื่อเพิ่มลงตะกร้า' : screen === 'products' ? `${productCount} รายการในระบบ` : 'ภาพรวมการขายวันนี้';
  const d = new Date(now);
  const dateLabel = d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  const clockLabel = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  return (
    <header style={{ height: 66, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--line)', background: 'var(--panel)', gap: 16 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "'Itim',cursive", fontSize: 21, lineHeight: 1.1, color: 'var(--ink)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingRight: 16, borderRight: '1px solid var(--line)' }}>
          <button onClick={() => onSetTheme('peach')} title="พีช" style={swatch('#FF7A59')} />
          <button onClick={() => onSetTheme('mint')} title="มินต์" style={swatch('#22B892')} />
          <button onClick={() => onSetTheme('grape')} title="ลาเวนเดอร์" style={swatch('#8E6BE0')} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{clockLabel} น.</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{dateLabel}</div>
        </div>
      </div>
    </header>
  );
}
