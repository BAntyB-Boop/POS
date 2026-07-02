import type { CartMap, Category, Product } from '../types';
import { chipStyle } from '../styleHelpers';
import { money } from '../theme';
import Thumb from './Thumb';

interface Props {
  categories: Category[];
  products: Product[];
  search: string;
  onSearch: (v: string) => void;
  activeCat: string;
  onSelectCat: (id: string) => void;
  onAdd: (id: string) => void;
  cart: CartMap;
  orderNote: string;
  onOrderNote: (v: string) => void;
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onClearCart: () => void;
  onOpenPay: () => void;
}

export default function PosScreen({
  categories, products, search, onSearch, activeCat, onSelectCat,
  onAdd, cart, orderNote, onOrderNote, onInc, onDec, onClearCart, onOpenPay,
}: Props) {
  const q = search.trim().toLowerCase();
  const filtered = products.filter((p) => (activeCat === 'all' || p.cat === activeCat) && (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)));
  const cartIds = Object.keys(cart);
  const total = cartIds.reduce((s, id) => {
    const p = products.find((x) => x.id === id);
    return s + (p ? p.price * cart[id] : 0);
  }, 0);
  const count = cartIds.reduce((s, id) => s + cart[id], 0);

  const chips = [{ id: 'all', name: 'ทั้งหมด' }, ...categories];

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, padding: '18px 20px', gap: 15 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--panel)', border: '1.5px solid var(--line)', borderRadius: 16, padding: '11px 16px' }}>
          <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="ค้นหาสินค้า..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, color: 'var(--ink)' }} />
        </div>
        <div style={{ display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 2, flex: 'none' }}>
          {chips.map((c) => (
            <button key={c.id} onClick={() => onSelectCat(c.id)} style={chipStyle(activeCat === c.id)}>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {filtered.length === 0 && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--muted)' }}>
              <div style={{ fontSize: 15 }}>ไม่พบสินค้าที่ค้นหา</div>
            </div>
          )}
          {filtered.length > 0 && (
            <div className="product-grid">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onAdd(p.id)}
                  className="product-card"
                  style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 9, padding: 13, background: 'var(--panel)', border: '1.5px solid var(--line)', borderRadius: 18, cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'inherit', transition: '.15s', boxShadow: '0 2px 6px rgba(180,120,90,.05)' }}
                >
                  {p.stock <= p.reorderLevel && (
                    <div style={{ position: 'absolute', top: 9, right: 9, background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: 10, fontWeight: 700, padding: '3px 8px 3px 7px', borderRadius: '3px 10px 10px 3px', borderLeft: '1.5px dashed var(--danger)' }}>ใกล้หมด</div>
                  )}
                  <Thumb name={p.name} img={p.img} size={56} radius={15} />
                  <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 35 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 30 }}>{p.description}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 16, color: 'var(--brand)' }}>{money(p.price)}</span>
                    <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>คงเหลือ {p.stock}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="cart-aside">
        <div style={{ padding: '18px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontFamily: "'Chonburi',cursive", fontSize: 19 }}>ตะกร้า</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', background: 'var(--soft)', padding: '2px 9px', borderRadius: 999 }}>{count} ชิ้น</span>
          </div>
          <button onClick={onClearCart} style={{ border: 'none', background: 'transparent', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', padding: 4 }}>ล้าง</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', minHeight: 0 }}>
          {cartIds.length === 0 && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--muted)', textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>ยังไม่มีสินค้าในตะกร้า</div>
              <div style={{ fontSize: 12.5 }}>แตะสินค้าทางซ้ายเพื่อเพิ่มได้เลย</div>
            </div>
          )}
          {cartIds.map((id) => {
            const p = products.find((x) => x.id === id);
            if (!p) return null;
            const qty = cart[id];
            return (
              <div key={id} style={{ display: 'flex', gap: 11, alignItems: 'center', padding: 10, borderRadius: 14, background: 'var(--bg)', marginBottom: 9, animation: 'slidein .2s ease' }}>
                <Thumb name={p.name} img={p.img} size={42} radius={11} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 1 }}>{money(p.price)} /ชิ้น</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 999, padding: 2 }}>
                  <button onClick={() => onDec(id)} style={{ width: 26, height: 26, border: 'none', borderRadius: '50%', background: 'transparent', cursor: 'pointer', fontSize: 17, color: 'var(--muted)', lineHeight: 1 }}>−</button>
                  <span style={{ minWidth: 22, textAlign: 'center', fontSize: 14, fontWeight: 700 }}>{qty}</span>
                  <button onClick={() => onInc(id)} style={{ width: 26, height: 26, border: 'none', borderRadius: '50%', background: 'var(--brand)', cursor: 'pointer', fontSize: 16, color: '#fff', lineHeight: 1 }}>+</button>
                </div>
                <div style={{ width: 62, textAlign: 'right', fontFamily: "'Space Mono',monospace", fontSize: 14, fontWeight: 700 }}>{money(p.price * qty)}</div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, background: 'var(--bg)', border: '1.5px solid var(--line)', borderRadius: 13, padding: '10px 13px' }}>
            <textarea
              value={orderNote}
              onChange={(e) => onOrderNote(e.target.value)}
              placeholder="หมายเหตุ order เช่น ไม่ใส่น้ำแข็ง, แยกถุง..."
              rows={1}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--ink)', fontFamily: 'inherit', resize: 'none', lineHeight: '20px', maxHeight: 60 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 14, color: 'var(--muted)' }}>ยอดรวมทั้งหมด</span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 26, color: 'var(--ink)' }}>{money(total)}</span>
          </div>
          <button
            onClick={onOpenPay}
            disabled={total <= 0}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 18, border: 'none', cursor: total > 0 ? 'pointer' : 'not-allowed', fontSize: 16, fontWeight: 800, color: '#fff', background: total > 0 ? 'var(--brand)' : 'var(--disabled)', boxShadow: total > 0 ? 'var(--shadow)' : 'none', transition: '.15s', font: 'inherit' }}
          >
            <span>ชำระเงิน</span><span style={{ fontFamily: "'Space Mono',monospace" }}>{money(total)}</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
