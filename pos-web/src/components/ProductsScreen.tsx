import type { Category, Product } from '../types';
import { chipStyle } from '../styleHelpers';
import { money } from '../theme';

interface Props {
  categories: Category[];
  products: Product[];
  pSearch: string;
  onPSearch: (v: string) => void;
  pCat: string;
  onSelectPCat: (id: string) => void;
  lowStockThreshold: number;
  onOpenCat: () => void;
  onOpenAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ProductsScreen({
  categories, products, pSearch, onPSearch, pCat, onSelectPCat, lowStockThreshold,
  onOpenCat, onOpenAdd, onEdit, onDelete,
}: Props) {
  const catName = (id: string) => categories.find((c) => c.id === id)?.name || 'อื่นๆ';
  const catIcon = (id: string) => categories.find((c) => c.id === id)?.icon || '📦';
  const pq = pSearch.trim().toLowerCase();
  const chips = [{ id: 'all', name: 'ทั้งหมด', icon: '🐾' }, ...categories];
  const list = products.filter((p) => (pCat === 'all' || p.cat === pCat) && (!pq || p.name.toLowerCase().includes(pq) || p.description.toLowerCase().includes(pq)));

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--panel)', border: '1.5px solid var(--line)', borderRadius: 14, padding: '9px 14px', width: 230 }}>
            <span style={{ fontSize: 15 }}>🔍</span>
            <input value={pSearch} onChange={(e) => onPSearch(e.target.value)} placeholder="ค้นหาสินค้า..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: 'var(--ink)', width: '100%' }} />
          </div>
          {chips.map((c) => (
            <button key={c.id} onClick={() => onSelectPCat(c.id)} style={chipStyle(pCat === c.id)}>
              <span>{c.icon}</span><span>{c.name}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onOpenCat} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 16px', borderRadius: 13, border: '1.5px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)', font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            <span>🏷️</span><span>หมวดหมู่</span>
          </button>
          <button onClick={onOpenAdd} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 13, border: 'none', background: 'var(--brand)', color: '#fff', font: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow)' }}>
            <span style={{ fontSize: 17 }}>＋</span><span>เพิ่มสินค้า</span>
          </button>
        </div>
      </div>

      <div className="table-scroll" style={{ background: 'var(--panel)', border: '1.5px solid var(--line)', borderRadius: 18 }}>
       <div>
        <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1fr 0.9fr 0.9fr 132px', gap: 12, alignItems: 'center', padding: '13px 18px', background: 'var(--bg)', fontSize: 12, fontWeight: 700, color: 'var(--muted)', borderRadius: '16.5px 16.5px 0 0' }}>
          <div>สินค้า</div><div>หมวดหมู่</div><div>ราคา</div><div>คงเหลือ</div><div style={{ textAlign: 'right' }}>จัดการ</div>
        </div>
        {list.length === 0 && (
          <div style={{ padding: 50, textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: 46, marginBottom: 8 }}>🐾</div>ยังไม่มีสินค้าในหมวดนี้
          </div>
        )}
        {list.map((p) => (
          <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2.4fr 1fr 0.9fr 0.9fr 132px', gap: 12, alignItems: 'center', padding: '12px 18px', borderTop: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              {p.img ? (
                <div style={{ width: 42, height: 42, flex: 'none', borderRadius: 11, overflow: 'hidden', background: 'var(--soft)' }}>
                  <img src={p.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ width: 42, height: 42, flex: 'none', borderRadius: 11, background: 'var(--soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{p.icon}</div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                {p.description && (
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{p.description}</div>
                )}
              </div>
            </div>
            <div><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)', background: 'var(--bg)', padding: '4px 10px', borderRadius: 999 }}>{catIcon(p.cat)} {catName(p.cat)}</span></div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>{money(p.price)}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: p.stock <= lowStockThreshold ? 'var(--danger)' : 'var(--ink)' }}>{p.stock}</div>
            <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
              <button onClick={() => onEdit(p.id)} style={{ padding: '7px 12px', borderRadius: 9, border: '1.5px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)', font: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>แก้ไข</button>
              <button onClick={() => onDelete(p.id)} style={{ width: 32, height: 32, borderRadius: 9, border: '1.5px solid #FADBD8', background: '#FDECEA', color: 'var(--danger)', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>🗑</button>
            </div>
          </div>
        ))}
       </div>
      </div>
    </div>
  );
}
