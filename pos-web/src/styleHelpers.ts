import type { CSSProperties } from 'react';

export const chipStyle = (active: boolean): CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 999,
  cursor: 'pointer', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', transition: '.15s',
  border: '1.5px solid ' + (active ? 'var(--brand)' : 'var(--line)'),
  background: active ? 'var(--brand)' : 'var(--panel)',
  color: active ? '#fff' : 'var(--muted)', font: 'inherit',
});

export const iconChipStyle = (active: boolean): CSSProperties => ({
  width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 20, borderRadius: 11, cursor: 'pointer', background: active ? 'var(--soft)' : 'var(--bg)',
  border: '2px solid ' + (active ? 'var(--brand)' : 'transparent'), transition: '.12s',
});

export const tabStyle = (active: boolean): CSSProperties => ({
  flex: 1, padding: 12, borderRadius: 13, cursor: 'pointer', fontSize: 15, fontWeight: 700,
  border: '2px solid ' + (active ? 'var(--brand)' : 'var(--line)'),
  background: active ? 'var(--soft)' : 'var(--panel)',
  color: active ? 'var(--brand)' : 'var(--muted)', transition: '.15s', font: 'inherit',
});
