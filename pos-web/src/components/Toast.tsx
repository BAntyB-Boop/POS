import type { Toast as ToastType } from '../types';

export default function Toast({ toast }: { toast: ToastType }) {
  return (
    <div
      style={{
        position: 'fixed', bottom: 26, left: '50%', transform: 'translateX(-50%)', zIndex: 80,
        padding: '13px 24px', borderRadius: 14, fontWeight: 700, fontSize: 15, color: '#fff',
        boxShadow: '0 10px 30px rgba(0,0,0,.18)', animation: 'toastin .25s ease',
        background: toast.kind === 'warn' ? 'var(--warn)' : 'var(--brand)',
      }}
    >
      {toast.msg}
    </div>
  );
}
