import type { Sale } from '../types';
import { money } from '../theme';

interface Props {
  receipt: Sale;
  onClose: () => void;
}

export default function ReceiptModal({ receipt, onClose }: Props) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(58,46,42,.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: 20, animation: 'fade .18s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 360, maxWidth: '100%', background: 'var(--panel)', borderRadius: 24, padding: '26px 24px', textAlign: 'center', animation: 'pop .22s ease', boxShadow: '0 30px 70px rgba(0,0,0,.3)' }}>
        <div style={{ fontSize: 54, animation: 'floaty 3s ease-in-out infinite' }}>😸</div>
        <div style={{ fontFamily: "'Itim',cursive", fontSize: 24, marginTop: 4 }}>ขายสำเร็จ!</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>#{String(receipt.no).padStart(4, '0')} · {new Date(receipt.ts).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
        <div style={{ textAlign: 'left', background: 'var(--bg)', borderRadius: 16, padding: '14px 16px', margin: '18px 0' }}>
          {receipt.items.map((i) => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, padding: '4px 0' }}>
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.icon} {i.name} <span style={{ color: 'var(--muted)' }}>x{i.qty}</span></span>
              <span style={{ fontWeight: 600, whiteSpace: 'nowrap', paddingLeft: 8 }}>{money(i.lineTotal)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px dashed var(--line)', margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800 }}><span>รวม</span><span style={{ color: 'var(--brand)' }}>{money(receipt.total)}</span></div>
          {receipt.method === 'cash' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}><span>รับเงิน</span><span>{money(receipt.received)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--muted)' }}><span>เงินทอน</span><span>{money(receipt.change)}</span></div>
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}><span>ชำระโดย</span><span>{receipt.method === 'cash' ? 'เงินสด' : 'พร้อมเพย์'}</span></div>
        </div>
        <button onClick={onClose} style={{ width: '100%', padding: 14, borderRadius: 15, border: 'none', background: 'var(--brand)', color: '#fff', font: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow)' }}>เริ่มบิลใหม่</button>
      </div>
    </div>
  );
}
