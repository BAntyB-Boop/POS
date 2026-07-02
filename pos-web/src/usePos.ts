import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, genHistory, makeInitialProducts } from './data';
import { applyTheme } from './theme';
import type {
  CartMap, Category, CategoryForm, PayMethod, Product, ProductForm, ReportPeriod, Sale, Screen, ThemeName, Toast,
} from './types';

export interface PosOptions {
  theme?: ThemeName;
  storeName?: string;
  lowStockThreshold?: number;
}

export function usePos(opts: PosOptions = {}) {
  const [screen, setScreen] = useState<Screen>('pos');
  const [theme, setThemeState] = useState<ThemeName>(opts.theme || 'peach');
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [products, setProducts] = useState<Product[]>(() => makeInitialProducts());
  const [cart, setCart] = useState<CartMap>({});
  const [orderNote, setOrderNote] = useState('');
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [pSearch, setPSearch] = useState('');
  const [pCat, setPCat] = useState('all');

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>({ name: '', description: '', price: '', cat: 'drink', stock: '', barcode: '', icon: '', img: null });

  const [showCatModal, setShowCatModal] = useState(false);
  const [catForm, setCatForm] = useState<CategoryForm>({ name: '', icon: '' });

  const [showPay, setShowPay] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');

  const [showReceipt, setShowReceipt] = useState(false);
  const [receipt, setReceipt] = useState<Sale | null>(null);

  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('day');
  const [monthOffset, setMonthOffset] = useState(0);

  const [sales, setSales] = useState<Sale[]>(() => genHistory(makeInitialProducts()));
  const [toastState, setToastState] = useState<Toast | null>(null);
  const [now, setNow] = useState(Date.now());

  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  useEffect(() => {
    if (rootRef.current) applyTheme(rootRef.current, theme);
  }, [theme]);

  const toast = useCallback((msg: string, kind: 'ok' | 'warn' = 'ok') => {
    clearTimeout(toastTimer.current);
    setToastState({ msg, kind });
    toastTimer.current = setTimeout(() => setToastState(null), 1800);
  }, []);

  const money = useCallback((v: number) => '฿' + Number(v || 0).toLocaleString('en-US'), []);

  const addToCart = useCallback((id: string) => {
    setCart((prevCart) => {
      const p = products.find((x) => x.id === id);
      if (!p) return prevCart;
      const cur = prevCart[id] || 0;
      if (cur >= p.stock) {
        toast('สินค้าคงเหลือไม่พอ', 'warn');
        return prevCart;
      }
      return { ...prevCart, [id]: cur + 1 };
    });
  }, [products, toast]);

  const decCart = useCallback((id: string) => {
    setCart((prev) => {
      const next = { ...prev };
      const c = (next[id] || 0) - 1;
      if (c <= 0) delete next[id];
      else next[id] = c;
      return next;
    });
  }, []);

  const removeCart = useCallback((id: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const clearCart = useCallback(() => { setCart({}); setOrderNote(''); }, []);

  const cartTotal = useMemo(() => {
    return Object.keys(cart).reduce((s, id) => {
      const p = products.find((x) => x.id === id);
      return s + (p ? p.price * cart[id] : 0);
    }, 0);
  }, [cart, products]);

  const openPay = useCallback(() => {
    if (cartTotal <= 0) { toast('ตะกร้ายังว่างอยู่', 'warn'); return; }
    setPayMethod('cash');
    setCashReceived('');
    setShowPay(true);
  }, [cartTotal, toast]);

  const closePay = useCallback(() => setShowPay(false), []);

  const setCash = useCallback((v: string) => setCashReceived(String(v).replace(/[^0-9.]/g, '')), []);

  const confirmPay = useCallback(() => {
    const total = cartTotal;
    let received = total;
    let change = 0;
    if (payMethod === 'cash') {
      received = parseFloat(cashReceived) || 0;
      if (received < total) { toast('รับเงินไม่พอ', 'warn'); return; }
      change = received - total;
    }
    const items = Object.keys(cart).map((id) => {
      const p = products.find((x) => x.id === id)!;
      const qty = cart[id];
      return { id, name: p.name, icon: p.icon, img: p.img, cat: p.cat, price: p.price, qty, lineTotal: p.price * qty };
    });
    const nextProducts = products.map((p) => (cart[p.id] ? { ...p, stock: Math.max(0, p.stock - cart[p.id]) } : p));
    const sale: Sale = { no: sales.length + 1, ts: Date.now(), items, total, method: payMethod, received, change, note: orderNote.trim() };
    setProducts(nextProducts);
    setSales((prev) => prev.concat([sale]));
    setCart({});
    setOrderNote('');
    setShowPay(false);
    setShowReceipt(true);
    setReceipt(sale);
    toast('ขายสำเร็จ', 'ok');
  }, [cart, cartTotal, cashReceived, orderNote, payMethod, products, sales.length, toast]);

  const closeReceipt = useCallback(() => setShowReceipt(false), []);

  const openAdd = useCallback(() => {
    setShowProductModal(true);
    setEditingId(null);
    setForm({ name: '', description: '', price: '', cat: categories[0]?.id || '', stock: '', barcode: '', icon: '', img: null });
  }, [categories]);

  const openEdit = useCallback((id: string) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setShowProductModal(true);
    setEditingId(id);
    setForm({ name: p.name, description: p.description || '', price: String(p.price), cat: p.cat, stock: String(p.stock), barcode: p.barcode || '', icon: p.icon, img: p.img });
  }, [products]);

  const closeProduct = useCallback(() => setShowProductModal(false), []);

  const updForm = useCallback(<K extends keyof ProductForm>(k: K, v: ProductForm[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  }, []);

  const onImg = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => updForm('img', r.result as string);
    r.readAsDataURL(f);
  }, [updForm]);

  const genBarcode = useCallback(() => {
    let s = '885';
    for (let i = 0; i < 10; i++) s += Math.floor(Math.random() * 10);
    updForm('barcode', s);
    toast('สแกนบาร์โค้ดแล้ว', 'ok');
  }, [updForm, toast]);

  const saveProduct = useCallback(() => {
    if (!form.name.trim()) { toast('กรุณาใส่ชื่อสินค้า', 'warn'); return; }
    const price = parseFloat(form.price) || 0;
    if (price <= 0) { toast('กรุณาใส่ราคา', 'warn'); return; }
    const stock = parseInt(form.stock, 10) || 0;
    if (editingId) {
      setProducts((prev) => prev.map((p) => (p.id === editingId
        ? { ...p, name: form.name.trim(), description: form.description.trim(), price, cat: form.cat, stock, barcode: form.barcode, icon: form.icon, img: form.img }
        : p)));
      setShowProductModal(false);
      toast('บันทึกการแก้ไขแล้ว', 'ok');
    } else {
      const id = 'p' + Date.now();
      const np: Product = { id, name: form.name.trim(), description: form.description.trim(), price, cost: Math.round(price * 0.72), cat: form.cat, stock, barcode: form.barcode, icon: form.icon, img: form.img };
      setProducts((prev) => [np, ...prev]);
      setShowProductModal(false);
      setScreen('products');
      toast('เพิ่มสินค้าใหม่แล้ว', 'ok');
    }
  }, [editingId, form, toast]);

  const deleteProduct = useCallback((id: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast('ลบสินค้าแล้ว', 'ok');
  }, [toast]);

  const openCat = useCallback(() => { setShowCatModal(true); setCatForm({ name: '', icon: '' }); }, []);
  const closeCat = useCallback(() => setShowCatModal(false), []);

  const saveCat = useCallback(() => {
    if (!catForm.name.trim()) { toast('กรุณาใส่ชื่อหมวดหมู่', 'warn'); return; }
    const id = 'c' + Date.now();
    setCategories((prev) => prev.concat([{ id, name: catForm.name.trim(), icon: '' }]));
    setShowCatModal(false);
    toast('เพิ่มหมวดหมู่แล้ว', 'ok');
  }, [catForm, toast]);

  const setTheme = useCallback((t: ThemeName) => setThemeState(t), []);

  return {
    rootRef,
    screen, setScreen,
    theme, setTheme,
    categories, products,
    cart, orderNote, setOrderNote, search, setSearch, activeCat, setActiveCat,
    pSearch, setPSearch, pCat, setPCat,
    showProductModal, editingId, form, updForm, setForm,
    showCatModal, catForm, setCatForm,
    showPay, payMethod, setPayMethod, cashReceived,
    showReceipt, receipt,
    reportPeriod, setReportPeriod, monthOffset, setMonthOffset,
    sales, toastState, showToast: toast,
    now,
    money,
    addToCart, decCart, removeCart, clearCart, cartTotal,
    openPay, closePay, setCash, confirmPay, closeReceipt,
    openAdd, openEdit, closeProduct, onImg, genBarcode, saveProduct, deleteProduct,
    openCat, closeCat, saveCat,
    lowStockThreshold: opts.lowStockThreshold ?? 5,
    storeName: opts.storeName || 'โชคดีการค้า',
  };
}
