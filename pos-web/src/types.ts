export type Screen = 'pos' | 'products' | 'reports';
export type UserRole = 'admin' | 'cashier';

export interface User {
  username: string;
  name: string;
  role: UserRole;
}
export type ThemeName = 'peach' | 'mint' | 'grape';
export type PayMethod = 'cash' | 'qr';
export type ReportPeriod = 'day' | 'month';

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  cat: string;
  stock: number;
  icon: string;
  img: string | null;
  barcode: string;
}

export interface CartMap {
  [productId: string]: number;
}

export interface SaleItem {
  id: string;
  name: string;
  icon: string;
  img: string | null;
  cat: string;
  price: number;
  qty: number;
  lineTotal: number;
}

export interface Sale {
  no: number;
  ts: number;
  items: SaleItem[];
  total: number;
  method: PayMethod;
  received: number;
  change: number;
  note: string;
}

export interface ProductForm {
  name: string;
  description: string;
  price: string;
  cat: string;
  stock: string;
  barcode: string;
  icon: string;
  img: string | null;
}

export interface CategoryForm {
  name: string;
  icon: string;
}

export interface Toast {
  msg: string;
  kind: 'ok' | 'warn';
}
