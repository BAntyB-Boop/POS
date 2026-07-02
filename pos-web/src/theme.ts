import type { ThemeName } from './types';

export const THEMES: Record<ThemeName, Record<string, string>> = {
  peach: {
    '--bg': '#FFF6F0', '--panel': '#ffffff', '--ink': '#3A2E2A', '--muted': '#A38A80',
    '--brand': '#FF7A59', '--brand2': '#FFB74D', '--soft': '#FFE8DD', '--line': '#F2E6DE',
    '--shadow': '0 10px 26px rgba(220,120,80,.16)',
  },
  mint: {
    '--bg': '#EEFAF4', '--panel': '#ffffff', '--ink': '#26403A', '--muted': '#7FA398',
    '--brand': '#22B892', '--brand2': '#6FD3BC', '--soft': '#D6F3E9', '--line': '#DBEEE7',
    '--shadow': '0 10px 26px rgba(30,170,130,.16)',
  },
  grape: {
    '--bg': '#F6F1FE', '--panel': '#ffffff', '--ink': '#372B4D', '--muted': '#9A8BB2',
    '--brand': '#8E6BE0', '--brand2': '#BCA0F0', '--soft': '#EBE1FB', '--line': '#EADFF7',
    '--shadow': '0 10px 26px rgba(120,80,210,.16)',
  },
};

export function applyTheme(root: HTMLElement, theme: ThemeName) {
  const p = THEMES[theme] || {};
  Object.keys(p).forEach((k) => root.style.setProperty(k, p[k]));
}

export function money(v: number): string {
  return '฿' + Number(v || 0).toLocaleString('en-US');
}
