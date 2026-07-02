import { useState } from 'react';
import type { Category, CategoryForm } from '../types';

interface Props {
  categories: Category[];
  catForm: CategoryForm;
  catError: boolean;
  onUpdate: (form: CategoryForm) => void;
  onClose: () => void;
  onSave: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

const inputStyle: React.CSSProperties = {
  flex: 1, minWidth: 0, padding: '10px 13px', border: '1.5px solid var(--line)', borderRadius: 12,
  outline: 'none', fontSize: 14, background: 'var(--bg)', color: 'var(--ink)', font: 'inherit',
};

function CatRow({ cat, onRename, onDelete }: { cat: Category; onRename: (id: string, name: string) => void; onDelete: (id: string) => void }) {
  const [name, setName] = useState(cat.name);
  const dirty = name.trim() !== '' && name.trim() !== cat.name;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      {dirty && (
        <button onClick={() => onRename(cat.id, name)} style={{ padding: '9px 13px', borderRadius: 10, border: 'none', background: 'var(--brand)', color: '#fff', font: 'inherit', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>บันทึก</button>
      )}
      <button onClick={() => onDelete(cat.id)} style={{ padding: '9px 13px', borderRadius: 10, border: '1.5px solid var(--danger)', background: 'var(--danger-soft)', color: 'var(--danger)', font: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>ลบ</button>
    </div>
  );
}

export default function CategoryModal({ categories, catForm, catError, onUpdate, onClose, onSave, onRename, onDelete }: Props) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(42,33,24,.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 65, padding: 20, animation: 'fade .18s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 400, maxWidth: '100%', background: 'var(--panel)', borderRadius: 24, padding: 24, animation: 'pop .22s ease', boxShadow: '0 30px 70px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <span style={{ fontFamily: "'Chonburi',cursive", fontSize: 21 }}>จัดการหมวดหมู่</span>
          <button onClick={onClose} style={{ width: 32, height: 32, border: 'none', borderRadius: '50%', background: 'var(--bg)', cursor: 'pointer', fontSize: 16, color: 'var(--muted)' }}>✕</button>
        </div>

        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>หมวดหมู่ทั้งหมด — แก้ชื่อแล้วกดบันทึก หรือกดลบ (ลบได้เฉพาะหมวดที่ไม่มีสินค้า)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto', marginBottom: 18 }}>
          {categories.length === 0 && (
            <div style={{ padding: '18px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13, border: '1.5px dashed var(--line)', borderRadius: 12 }}>ยังไม่มีหมวดหมู่ เพิ่มด้านล่างได้เลย</div>
          )}
          {categories.map((c) => (
            <CatRow key={c.id} cat={c} onRename={onRename} onDelete={onDelete} />
          ))}
        </div>

        <div style={{ borderTop: '1.5px solid var(--line)', paddingTop: 16 }}>
          <div style={{ fontSize: 12, color: catError ? 'var(--danger)' : 'var(--muted)', fontWeight: catError ? 700 : 400, marginBottom: 6 }}>เพิ่มหมวดหมู่ใหม่{catError ? ' — กรุณากรอกชื่อ' : ''}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={catForm.name}
              onChange={(e) => onUpdate({ ...catForm, name: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') onSave(); }}
              placeholder="เช่น เครื่องเขียน"
              style={catError ? { ...inputStyle, border: '1.5px solid var(--danger)', background: 'var(--danger-soft)' } : inputStyle}
            />
            <button onClick={onSave} style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: 'var(--brand)', color: '#fff', font: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow)', whiteSpace: 'nowrap' }}>เพิ่ม</button>
          </div>
        </div>
      </div>
    </div>
  );
}
