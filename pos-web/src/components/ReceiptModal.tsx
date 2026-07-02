import type { Sale } from '../types';
import { money } from '../theme';
import CatMark from './CatMark';

interface Props {
  receipt: Sale;
  onClose: () => void;
}

const MONO = "'Space Mono',monospace";

export default function ReceiptModal({ receipt, onClose }: Props) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(42,33,24,.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: 20, animation: 'fade .18s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 360, maxWidth: '100%', background: 'var(--panel)', borderRadius: 24, padding: '26px 24px', textAlign: 'center', animation: 'pop .22s ease', boxShadow: '0 30px 70px rgba(0,0,0,.3)' }}>
        {/* ตราประทับ "ชำระเงินแล้ว" — เหมือนปั๊มบิลเงินสดของร้าน */}
        <div style={{ position: 'relative', width: 108, height: 108, margin: '0 auto' }}>
          <div style={{ position: 'absolute', inset: 0, transform: 'rotate(-8deg)', mixBlendMode: 'multiply', opacity: 0.85 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid var(--brand)' }} />
            <div style={{ position: 'absolute', inset: 9, borderRadius: '50%', border: '1px dashed var(--brand)' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CatMark size={42} color="var(--brand)" />
            </div>
          </div>
        </div>
        <div style={{ fontFamily: "'Chonburi',cursive", fontSize: 14, letterSpacing: 3, color: 'var(--brand)', marginTop: 4, transform: 'rotate(-3deg)', mixBlendMode: 'multiply', opacity: 0.85 }}>ชำระเงินแล้ว</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 8 }}>#{String(receipt.no).padStart(4, '0')} · {new Date(receipt.ts).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
        <div style={{ textAlign: 'left', background: 'var(--bg)', borderRadius: 16, padding: '14px 16px', margin: '18px 0' }}>
          {receipt.items.map((i) => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, padding: '4px 0' }}>
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.name} <span style={{ color: 'var(--muted)' }}>x{i.qty}</span></span>
              <span style={{ fontFamily: MONO, fontWeight: 700, whiteSpace: 'nowrap', paddingLeft: 8 }}>{money(i.lineTotal)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px dashed var(--line)', margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 16, fontWeight: 800 }}><span style={{ fontFamily: "'Chonburi',cursive" }}>รวม</span><span style={{ fontFamily: MONO, color: 'var(--brand)' }}>{money(receipt.total)}</span></div>
          {receipt.method === 'cash' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}><span>รับเงิน</span><span style={{ fontFamily: MONO }}>{money(receipt.received)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--muted)' }}><span>เงินทอน</span><span style={{ fontFamily: MONO }}>{money(receipt.change)}</span></div>
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}><span>ชำระโดย</span><span>{receipt.method === 'cash' ? 'เงินสด' : 'พร้อมเพย์'}</span></div>
          {receipt.note && (
            <div style={{ marginTop: 10, padding: '9px 12px', background: 'var(--soft)', borderRadius: 11, fontSize: 12.5, color: 'var(--ink)', textAlign: 'left' }}>
              {receipt.note}
            </div>
          )}
        </div>
        <button onClick={onClose} style={{ width: '100%', padding: 14, borderRadius: 15, border: 'none', background: 'var(--brand)', color: '#fff', font: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow)' }}>เริ่มบิลใหม่</button>
      </div>
    </div>
  );
}
