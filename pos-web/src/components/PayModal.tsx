import type { PayMethod } from '../types';
import { tabStyle } from '../styleHelpers';
import { money } from '../theme';

interface Props {
  total: number;
  payMethod: PayMethod;
  onSetMethod: (m: PayMethod) => void;
  cashReceived: string;
  onSetCash: (v: string) => void;
  storeName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function PayModal({ total, payMethod, onSetMethod, cashReceived, onSetCash, storeName, onClose, onConfirm }: Props) {
  const cashNum = parseFloat(cashReceived) || 0;
  const change = Math.max(0, cashNum - total);
  const canConfirm = payMethod === 'qr' || cashNum >= total;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(42,33,24,.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20, animation: 'fade .18s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 420, maxWidth: '100%', background: 'var(--panel)', borderRadius: 24, padding: 24, animation: 'pop .22s ease', boxShadow: '0 30px 70px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: "'Chonburi',cursive", fontSize: 22 }}>ชำระเงิน</span>
          <button onClick={onClose} style={{ width: 32, height: 32, border: 'none', borderRadius: '50%', background: 'var(--bg)', cursor: 'pointer', fontSize: 16, color: 'var(--muted)' }}>✕</button>
        </div>
        <div style={{ textAlign: 'center', padding: '16px 0 20px' }}>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>ยอดที่ต้องชำระ</div>
          <div style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 40, color: 'var(--brand)', lineHeight: 1.1 }}>{money(total)}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <button onClick={() => onSetMethod('cash')} style={tabStyle(payMethod === 'cash')}>เงินสด</button>
          <button onClick={() => onSetMethod('qr')} style={tabStyle(payMethod === 'qr')}>พร้อมเพย์</button>
        </div>
        {payMethod === 'cash' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', borderRadius: 14, padding: '13px 16px', marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: 'var(--muted)', whiteSpace: 'nowrap' }}>รับเงินมา</span>
              <input value={cashReceived} onChange={(e) => onSetCash(e.target.value)} inputMode="decimal" placeholder="0" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', textAlign: 'right', fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 22, color: 'var(--ink)' }} />
              <span style={{ fontSize: 16, color: 'var(--muted)' }}>฿</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button onClick={() => onSetCash(String(total))} style={quickBtn}>พอดี</button>
              <button onClick={() => onSetCash('100')} style={quickBtn}>฿100</button>
              <button onClick={() => onSetCash('500')} style={quickBtn}>฿500</button>
              <button onClick={() => onSetCash('1000')} style={quickBtn}>฿1000</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--soft)', borderRadius: 14, marginBottom: 18 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>เงินทอน</span>
              <span style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 22, color: 'var(--brand)' }}>{money(change)}</span>
            </div>
          </>
        )}
        {payMethod === 'qr' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 172, height: 172, borderRadius: 16, background: 'linear-gradient(45deg,#1a1a1a 25%,transparent 25%,transparent 75%,#1a1a1a 75%),linear-gradient(45deg,#1a1a1a 25%,#fff 25%,#fff 75%,#1a1a1a 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0,10px 10px', border: '8px solid #fff', boxShadow: '0 0 0 2px var(--line)' }} />
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>สแกนเพื่อจ่ายผ่านพร้อมเพย์ · ร้าน{storeName}</div>
          </div>
        )}
        <button
          onClick={onConfirm}
          disabled={!canConfirm}
          style={{ width: '100%', padding: 15, borderRadius: 15, border: 'none', cursor: canConfirm ? 'pointer' : 'not-allowed', fontSize: 16, fontWeight: 800, color: '#fff', background: canConfirm ? 'var(--brand)' : 'var(--disabled)', boxShadow: canConfirm ? 'var(--shadow)' : 'none', font: 'inherit' }}
        >
          ยืนยันการชำระเงิน
        </button>
      </div>
    </div>
  );
}

const quickBtn: React.CSSProperties = { flex: 1, padding: 10, borderRadius: 11, border: '1.5px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
