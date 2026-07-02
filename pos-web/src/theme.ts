import type { ThemeName } from './types';

export const THEMES: Record<ThemeName, Record<string, string>> = {
  morning: {
    '--bg': '#F3ECD8', '--panel': '#FFFCF3', '--ink': '#2A2118', '--muted': '#8A7A5C',
    '--brand': '#CF3A24', '--brand2': '#B9862A', '--soft': '#F7E7C4', '--line': '#E6D8AF',
    '--shadow': '0 10px 26px rgba(160,60,30,.18)',
  },
  shade: {
    '--bg': '#E9EFE7', '--panel': '#FBFDF9', '--ink': '#1F2E28', '--muted': '#71857D',
    '--brand': '#2C6E63', '--brand2': '#A6852E', '--soft': '#DCEAE3', '--line': '#D3E0D8',
    '--shadow': '0 10px 26px rgba(30,90,80,.18)',
  },
  lamp: {
    '--bg': '#F2E4CE', '--panel': '#FFFAF0', '--ink': '#2E2013', '--muted': '#8C7860',
    '--brand': '#C97A2B', '--brand2': '#8E3B3B', '--soft': '#F6DFB0', '--line': '#E8D3A8',
    '--shadow': '0 10px 26px rgba(180,110,30,.18)',
  },
};

export function applyTheme(root: HTMLElement, theme: ThemeName) {
  const p = THEMES[theme] || {};
  Object.keys(p).forEach((k) => root.style.setProperty(k, p[k]));
}

export function money(v: number): string {
  return '฿' + Number(v || 0).toLocaleString('en-US');
}
