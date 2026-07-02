import type { Sale } from '../types';
import { money } from '../theme';

interface Props {
  date: Date;
  bills: Sale[];
  onClose: () => void;
  onSelectBill: (sale: Sale) => void;
}

export default function DayDetailModal({ date, bills, onClose, onSelectBill }: Props) {
  const total = bills.reduce((s, x) => s + x.total, 0);
  const itemsSold = bills.reduce((s, x) => s + x.items.reduce((a, i) => a + i.qty, 0), 0);
  const avg = bills.length ? Math.round(total / bills.length) : 0;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(58,46,42,.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: 20, animation: 'fade .18s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 460, maxWidth: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'var(--panel)', borderRadius: 24, padding: 24, animation: 'pop .22s ease', boxShadow: '0 30px 70px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: "'Itim',cursive", fontSize: 21 }}>{date.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <button onClick={onClose} style={{ width: 32, height: 32, border: 'none', borderRadius: '50%', background: 'var(--bg)', cursor: 'pointer', fontSize: 16, color: 'var(--muted)' }}>✕</button>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 14 }}>รายละเอียดการขายของวันนี้</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div style={{ background: 'var(--soft)', borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>ยอดขาย</div>
            <div style={{ fontFamily: "'Itim',cursive", fontSize: 21, color: 'var(--brand)' }}>{money(total)}</div>
          </div>
          <div style={{ background: 'var(--bg)', borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>จำนวนบิล</div>
            <div style={{ fontFamily: "'Itim',cursive", fontSize: 21, color: 'var(--ink)' }}>{bills.length}</div>
          </div>
          <div style={{ background: 'var(--bg)', borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>เฉลี่ย/บิล</div>
            <div style={{ fontFamily: "'Itim',cursive", fontSize: 21, color: 'var(--ink)' }}>{money(avg)}</div>
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>บิลทั้งหมด ({bills.length}) · {itemsSold} ชิ้น — แตะบิลเพื่อดูรายละเอียด</div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {bills.length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>ไม่มีบิลในวันนี้</div>
          )}
          {bills.slice().reverse().map((b) => (
            <button
              key={b.no}
              onClick={() => onSelectBill(b)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 14px', marginBottom: 8, borderRadius: 13, border: '1.5px solid var(--line)', background: 'var(--bg)', cursor: 'pointer', font: 'inherit', color: 'inherit', textAlign: 'left', transition: '.12s' }}
            >
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>#{String(b.no).padStart(4, '0')}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{new Date(b.ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น. · {b.items.length} รายการ · {b.items.reduce((a, i) => a + i.qty, 0)} ชิ้น</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>{money(b.total)}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{b.method === 'cash' ? 'เงินสด' : 'พร้อมเพย์'}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
