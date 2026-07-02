import type { User } from '../types';
import { ROLE_LABELS } from '../data';
import { LogOut, X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
}

// เมนูตั้งค่าฝั่งขวา — เข้าถึงโปรไฟล์และออกจากระบบได้จากทุกขนาดจอ (มือถือไม่มีเมนูซ้ายแล้ว)
export default function SettingsDrawer({ open, onClose, user, onLogout }: Props) {
  return (
    <>
      <div className={'settings-drawer-backdrop' + (open ? ' show' : '')} onClick={onClose} />
      <aside className={'settings-drawer' + (open ? ' open' : '')}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontFamily: "'Chonburi',cursive", fontSize: 20, color: 'var(--ink)' }}>ตั้งค่า</span>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, border: 'none', borderRadius: '50%', background: 'var(--bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 14, borderRadius: 16, background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: 11, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, flex: 'none', borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff' }}>
            {user.name.trim().charAt(0)}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{ROLE_LABELS[user.role]}</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={onLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 14, borderRadius: 14, border: '1.5px solid var(--danger)', background: 'var(--danger-soft)', color: 'var(--danger)', font: 'inherit', fontSize: 14.5, fontWeight: 700, cursor: 'pointer' }}
        >
          <LogOut size={17} />
          <span>ออกจากระบบ</span>
        </button>
      </aside>
    </>
  );
}
