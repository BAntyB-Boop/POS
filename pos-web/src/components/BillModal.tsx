import type { Sale } from '../types';
import { money } from '../theme';
import Thumb from './Thumb';

interface Props {
  sale: Sale;
  onClose: () => void;
}

export default function BillModal({ sale, onClose }: Props) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(58,46,42,.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 75, padding: 20, animation: 'fade .18s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 380, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--panel)', borderRadius: 24, padding: '24px', animation: 'pop .22s ease', boxShadow: '0 30px 70px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: "'Itim',cursive", fontSize: 22 }}>บิล #{String(sale.no).padStart(4, '0')}</span>
          <button onClick={onClose} style={{ width: 32, height: 32, border: 'none', borderRadius: '50%', background: 'var(--bg)', cursor: 'pointer', fontSize: 16, color: 'var(--muted)' }}>✕</button>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 14 }}>
          {new Date(sale.ts).toLocaleString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} น.
        </div>

        <div style={{ background: 'var(--bg)', borderRadius: 16, padding: '14px 16px', marginBottom: 14 }}>
          {sale.items.map((i) => (
            <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
              <Thumb name={i.name} img={i.img} size={32} radius={9} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{money(i.price)} × {i.qty}</div>
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{money(i.lineTotal)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px dashed var(--line)', margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800 }}>
            <span>รวม {sale.items.reduce((a, i) => a + i.qty, 0)} ชิ้น</span>
            <span style={{ color: 'var(--brand)' }}>{money(sale.total)}</span>
          </div>
          {sale.method === 'cash' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}><span>รับเงิน</span><span>{money(sale.received)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--muted)' }}><span>เงินทอน</span><span>{money(sale.change)}</span></div>
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>
            <span>ชำระโดย</span><span>{sale.method === 'cash' ? 'เงินสด' : 'พร้อมเพย์'}</span>
          </div>
          {sale.note && (
            <div style={{ marginTop: 10, padding: '9px 12px', background: 'var(--soft)', borderRadius: 11, fontSize: 12.5, color: 'var(--ink)' }}>
              หมายเหตุ: {sale.note}
            </div>
          )}
        </div>

        <button onClick={onClose} style={{ width: '100%', padding: 13, borderRadius: 14, border: 'none', background: 'var(--brand)', color: '#fff', font: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow)' }}>ปิด</button>
      </div>
    </div>
  );
}
