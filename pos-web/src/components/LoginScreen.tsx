import { useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '../types';
import { ROLE_LABELS, USERS } from '../data';
import { api } from '../api';
import CatMark from './CatMark';

interface Props {
  storeName: string;
  onLogin: (user: User) => void;
}

export default function LoginScreen({ storeName, onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const loginTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(loginTimer.current), []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    const startedAt = Date.now();
    try {
      const { token, user } = await api.login(username, password);
      localStorage.setItem('meow-pos-token', token);
      // รอให้ animation น้ำขึ้นเล่นครบ 2 วิ (นับจากตอนกดปุ่ม) ก่อนพาเข้าหน้าใน
      const remaining = Math.max(0, 2000 - (Date.now() - startedAt));
      loginTimer.current = setTimeout(() => onLogin(user), remaining);
    } catch (err: any) {
      setError(err?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่');
      setLoading(false);
    }
  };

  const quickLogin = (username: string, password: string) => {
    setUsername(username);
    setPassword(password);
    setError('');
  };

  // ฟองน้ำ (particle) สุ่มตำแหน่ง/ขนาด/จังหวะ ครั้งเดียวตอน mount
  const bubbles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 7 + Math.random() * 18,
        delay: Math.random() * 1.1,
        duration: 1.3 + Math.random() * 1.2,
        opacity: 0.2 + Math.random() * 0.5,
        color: Math.random() < 0.5 ? 'var(--brand)' : 'var(--brand2)',
      })),
    [],
  );

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px 20px', background: 'var(--bg)', overflowY: 'auto', minHeight: '100%' }}>
      <div style={{ width: 400, maxWidth: '100%', animation: 'pop .25s ease' }}>
        <div style={{ background: 'var(--panel)', border: '1.5px solid var(--line)', borderRadius: 26, padding: '34px 30px', boxShadow: 'var(--shadow)' }}>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 74, height: 74, borderRadius: 24, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CatMark size={40} color="#fff" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Chonburi',cursive", fontSize: 28, lineHeight: 1.1, color: 'var(--ink)' }}>{storeName}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>ระบบขายหน้าร้าน · เข้าสู่ระบบเพื่อเริ่มงาน</div>
            </div>
          </div>

          <form onSubmit={submit}>
            <div style={{ marginBottom: 13 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>ชื่อผู้ใช้</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, border: '1.5px solid var(--line)', borderRadius: 13, padding: '12px 14px', background: 'var(--bg)' }}>
                <input
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  placeholder="เช่น mali"
                  autoFocus
                  autoCapitalize="none"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14.5, color: 'var(--ink)', width: '100%' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>รหัสผ่าน</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, border: '1.5px solid var(--line)', borderRadius: 13, padding: '12px 14px', background: 'var(--bg)' }}>
                <input
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14.5, color: 'var(--ink)', width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  title={showPw ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0, color: 'var(--brand)', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                >
                  {showPw ? 'ซ่อน' : 'แสดง'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 12, background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: 15, borderRadius: 15, border: 'none', background: loading ? 'var(--disabled)' : 'var(--brand)', color: '#fff', font: 'inherit', fontSize: 16, fontWeight: 800, cursor: loading ? 'wait' : 'pointer', boxShadow: loading ? 'none' : 'var(--shadow)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 3, borderColor: 'rgba(255,255,255,.4)', borderTopColor: '#fff' }} />
                  <span>กำลังเข้าสู่ระบบ...</span>
                </>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>
          </form>
        </div>

        <div style={{ marginTop: 14, background: 'var(--panel)', border: '1.5px dashed var(--line)', borderRadius: 18, padding: '13px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>บัญชีทดสอบ — แตะเพื่อกรอกอัตโนมัติ</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {USERS.map((u) => (
              <button
                key={u.username}
                type="button"
                onClick={() => quickLogin(u.username, u.password)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 999, border: '1.5px solid var(--line)', background: 'var(--bg)', font: 'inherit', fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', cursor: 'pointer' }}
              >
                <span>{u.name} · {ROLE_LABELS[u.role]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90, overflow: 'hidden' }}>
          {/* น้ำสีแบรนด์ไหลขึ้นจากล่างคลุมจอ แล้วพื้นหลังไล่ตามเป็นคลื่นชั้นที่สอง */}
          <div style={{ position: 'absolute', inset: '-40px 0 0 0', background: 'var(--brand)', borderRadius: '48% 52% 0 0 / 46px', transform: 'translateY(103%)', animation: 'waterrise .75s cubic-bezier(.33,.8,.4,1) forwards' }} />
          <div style={{ position: 'absolute', inset: '-40px 0 0 0', background: 'var(--bg)', borderRadius: '52% 48% 0 0 / 46px', transform: 'translateY(103%)', animation: 'waterrise .85s cubic-bezier(.33,.8,.4,1) .3s forwards' }} />

          {/* particle ฟองน้ำลอยขึ้นตลอดช่วงโหลด */}
          {bubbles.map((b) => (
            <div
              key={b.id}
              style={{
                position: 'absolute',
                bottom: -30,
                left: b.left + '%',
                width: b.size,
                height: b.size,
                borderRadius: '50%',
                background: b.color,
                ['--bubble-opacity' as string]: b.opacity,
                opacity: 0,
                animation: `bubbleup ${b.duration}s ease-in ${b.delay}s infinite`,
              }}
            />
          ))}

          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, animation: 'pop .35s ease .75s both' }}>
            <div style={{ width: 86, height: 86, borderRadius: 28, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'floaty 2.5s ease-in-out infinite' }}>
              <CatMark size={48} color="#fff" />
            </div>
            <div className="spinner" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Chonburi',cursive", fontSize: 21, color: 'var(--ink)' }}>กำลังเปิดร้าน...</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>เตรียมแมวเฝ้าร้านให้พร้อม</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
