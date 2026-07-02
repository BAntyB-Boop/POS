import type { CategoryForm } from '../types';

interface Props {
  catForm: CategoryForm;
  onUpdate: (form: CategoryForm) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function CategoryModal({ catForm, onUpdate, onClose, onSave }: Props) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(58,46,42,.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 65, padding: 20, animation: 'fade .18s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 380, maxWidth: '100%', background: 'var(--panel)', borderRadius: 24, padding: 24, animation: 'pop .22s ease', boxShadow: '0 30px 70px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <span style={{ fontFamily: "'Itim',cursive", fontSize: 21 }}>เพิ่มหมวดหมู่ใหม่</span>
          <button onClick={onClose} style={{ width: 32, height: 32, border: 'none', borderRadius: '50%', background: 'var(--bg)', cursor: 'pointer', fontSize: 16, color: 'var(--muted)' }}>✕</button>
        </div>
        <div style={{ marginBottom: 13 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>ชื่อหมวดหมู่</div>
          <input
            value={catForm.name}
            onChange={(e) => onUpdate({ ...catForm, name: e.target.value })}
            placeholder="เช่น เครื่องเขียน"
            style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--line)', borderRadius: 12, outline: 'none', fontSize: 14, background: 'var(--bg)', color: 'var(--ink)', marginBottom: 8 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 13, borderRadius: 14, border: '1.5px solid var(--line)', background: 'var(--panel)', color: 'var(--muted)', font: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>ยกเลิก</button>
          <button onClick={onSave} style={{ flex: 2, padding: 13, borderRadius: 14, border: 'none', background: 'var(--brand)', color: '#fff', font: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow)' }}>เพิ่มหมวดหมู่</button>
        </div>
      </div>
    </div>
  );
}
