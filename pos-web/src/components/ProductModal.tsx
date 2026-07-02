import type { ChangeEvent } from 'react';
import type { Category, ProductForm } from '../types';
import Thumb from './Thumb';

interface Props {
  isEditing: boolean;
  form: ProductForm;
  categories: Category[];
  errors: Partial<Record<'name' | 'cat' | 'price' | 'barcode', boolean>>;
  onUpdate: <K extends keyof ProductForm>(k: K, v: ProductForm[K]) => void;
  onImg: (e: ChangeEvent<HTMLInputElement>) => void;
  onGenBarcode: () => void;
  onClose: () => void;
  onSave: () => void;
}

export default function ProductModal({ isEditing, form, categories, errors, onUpdate, onImg, onGenBarcode, onClose, onSave }: Props) {
  const fieldStyle = (k: keyof typeof errors): React.CSSProperties =>
    errors[k] ? { ...inputStyle, border: '1.5px solid var(--danger)', background: 'var(--danger-soft)' } : inputStyle;
  const labelStyle = (k: keyof typeof errors): React.CSSProperties =>
    ({ fontSize: 12, color: errors[k] ? 'var(--danger)' : 'var(--muted)', fontWeight: errors[k] ? 700 : 400, marginBottom: 6 });
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(42,33,24,.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20, animation: 'fade .18s ease', overflow: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 480, maxWidth: '100%', background: 'var(--panel)', borderRadius: 24, padding: 24, animation: 'pop .22s ease', boxShadow: '0 30px 70px rgba(0,0,0,.3)', margin: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <span style={{ fontFamily: "'Chonburi',cursive", fontSize: 22 }}>{isEditing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</span>
          <button onClick={onClose} style={{ width: 32, height: 32, border: 'none', borderRadius: '50%', background: 'var(--bg)', cursor: 'pointer', fontSize: 16, color: 'var(--muted)' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start' }}>
          <div style={{ flex: 'none' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 7 }}>รูปสินค้า</div>
            <Thumb name={form.name} img={form.img} size={84} radius={16} fontSize={34} />
          </div>
          <div style={{ flex: 1, minWidth: 0, alignSelf: 'flex-end' }}>
            <label style={{ display: 'inline-block', padding: '10px 16px', borderRadius: 12, border: '1.5px solid var(--line)', background: 'var(--bg)', fontSize: 13, color: 'var(--brand)', fontWeight: 600, cursor: 'pointer' }}>
              อัพโหลดรูป
              <input type="file" accept="image/*" onChange={onImg} style={{ display: 'none' }} />
            </label>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 7 }}>ถ้าไม่ใส่รูป ระบบจะแสดงตัวอักษรแรกของชื่อสินค้าแทน</div>
          </div>
        </div>

        <div style={{ marginBottom: 13 }}>
          <div style={labelStyle('name')}>ชื่อสินค้า{errors.name ? ' — กรุณากรอก' : ''}</div>
          <input value={form.name} onChange={(e) => onUpdate('name', e.target.value)} placeholder="เช่น น้ำดื่มสิงห์" style={fieldStyle('name')} />
        </div>

        <div style={{ marginBottom: 13 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>รายละเอียดสินค้า</div>
          <textarea
            value={form.description}
            onChange={(e) => onUpdate('description', e.target.value)}
            placeholder="เช่น ขวด 600 มล. เย็นชื่นใจ"
            rows={2}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: 44 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 13 }}>
          <div style={{ flex: 1 }}>
            <div style={labelStyle('cat')}>หมวดหมู่{errors.cat ? ' — กรุณาเลือก' : ''}</div>
            <select value={form.cat} onChange={(e) => onUpdate('cat', e.target.value)} style={{ ...fieldStyle('cat'), cursor: 'pointer' }}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ width: 120 }}>
            <div style={labelStyle('price')}>ราคา (฿){errors.price ? ' — กรุณากรอก' : ''}</div>
            <input value={form.price} onChange={(e) => onUpdate('price', e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" placeholder="0" style={fieldStyle('price')} />
          </div>
          <div style={{ width: 120 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>คงเหลือ</div>
            <input value={form.stock} onChange={(e) => onUpdate('stock', e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="0" style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={labelStyle('barcode')}>บาร์โค้ด{errors.barcode ? ' — กรุณากรอก หรือกด "สแกน"' : ''}</div>
          <div style={{ display: 'flex', gap: 9 }}>
            <input value={form.barcode} onChange={(e) => onUpdate('barcode', e.target.value)} placeholder="สแกนหรือพิมพ์บาร์โค้ด" style={{ ...fieldStyle('barcode'), flex: 1 }} />
            <button onClick={onGenBarcode} style={{ padding: '0 16px', borderRadius: 12, border: '1.5px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>สแกน</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 14, borderRadius: 14, border: '1.5px solid var(--line)', background: 'var(--panel)', color: 'var(--muted)', font: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>ยกเลิก</button>
          <button onClick={onSave} style={{ flex: 2, padding: 14, borderRadius: 14, border: 'none', background: 'var(--brand)', color: '#fff', font: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow)' }}>บันทึกสินค้า</button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', border: '1.5px solid var(--line)', borderRadius: 12, outline: 'none', fontSize: 14, background: 'var(--bg)', color: 'var(--ink)' };
