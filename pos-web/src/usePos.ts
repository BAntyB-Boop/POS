import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { applyTheme } from './theme';
import type {
  CartMap, Category, CategoryForm, PayMethod, Product, ProductForm, ReportPeriod, Sale, Screen, ThemeName, Toast, User,
} from './types';
import { api } from './api';

export interface PosOptions {
  theme?: ThemeName;
  storeName?: string;
}

export function usePos(opts: PosOptions = {}, user: User | null) {
  const [screen, setScreen] = useState<Screen>('pos');
  const [theme, setThemeState] = useState<ThemeName>(opts.theme || 'morning');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartMap>({});
  const [orderNote, setOrderNote] = useState('');
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [pSearch, setPSearch] = useState('');
  const [pCat, setPCat] = useState('all');

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>({ name: '', description: '', price: '', cat: '', stock: '', barcode: '', icon: '', img: null });
  // ช่องในฟอร์มสินค้าที่ยังไม่ผ่าน validation — ใช้ไฮไลต์กรอบแดง
  const [formErrors, setFormErrors] = useState<Partial<Record<'name' | 'cat' | 'price' | 'barcode', boolean>>>({});

  const [showCatModal, setShowCatModal] = useState(false);
  const [catForm, setCatForm] = useState<CategoryForm>({ name: '', icon: '' });
  const [catError, setCatError] = useState(false);

  const [showPay, setShowPay] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');

  const [showReceipt, setShowReceipt] = useState(false);
  const [receipt, setReceipt] = useState<Sale | null>(null);

  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('day');
  const [monthOffset, setMonthOffset] = useState(0);

  const [sales] = useState<Sale[]>([]);
  const [toastState, setToastState] = useState<Toast | null>(null);
  const [now, setNow] = useState(Date.now());

  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const toast = useCallback((msg: string, kind: 'ok' | 'warn' = 'ok') => {
    clearTimeout(toastTimer.current);
    setToastState({ msg, kind });
    toastTimer.current = setTimeout(() => setToastState(null), 1800);
  }, []);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem('meow-pos-token');
    if (!token) return;
    try {
      const [cats, prods] = await Promise.all([
        api.getCategories(),
        api.getProducts(),
      ]);
      setCategories(cats);
      setProducts(prods);
      const lowStockCount = prods.filter((p) => p.stock <= p.reorderLevel).length;
      if (lowStockCount > 0) {
        toast(`สินค้าใกล้หมด ${lowStockCount} รายการ`, 'warn');
      }
    } catch (err: any) {
      toast(err?.message || 'ไม่สามารถโหลดข้อมูลจากเซิร์ฟเวอร์ได้', 'warn');
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  useEffect(() => {
    if (rootRef.current) applyTheme(rootRef.current, theme);
  }, [theme]);


  const money = useCallback((v: number) => '฿' + Number(v || 0).toLocaleString('en-US'), []);

  const lowStockCount = useMemo(() => products.filter((p) => p.stock <= p.reorderLevel).length, [products]);

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

  const confirmPay = useCallback(async () => {
    const total = cartTotal;
    let received = total;
    if (payMethod === 'cash') {
      received = parseFloat(cashReceived) || 0;
      if (received < total) { toast('รับเงินไม่พอ', 'warn'); return; }
    }
    const items = Object.keys(cart).map((id) => {
      const qty = cart[id];
      return {
        product_id: parseInt(id, 10),
        quantity: qty,
      };
    });
    try {
      const sale = await api.checkout({
        items,
        payment_method: payMethod === 'cash' ? 'cash' : 'promptpay',
        received_amount: payMethod === 'cash' ? Math.round(received * 100) : undefined,
        discount: 0,
        description: orderNote.trim(),
      });

      const updatedProducts = await api.getProducts();
      setProducts(updatedProducts);

      setCart({});
      setOrderNote('');
      setShowPay(false);
      setShowReceipt(true);
      setReceipt(sale);
      toast('ขายสำเร็จ', 'ok');
    } catch (err: any) {
      toast(err?.message || 'เกิดข้อผิดพลาดในการทำรายการ', 'warn');
    }
  }, [cart, cartTotal, cashReceived, orderNote, payMethod, products, toast]);

  const closeReceipt = useCallback(() => setShowReceipt(false), []);

  const openAdd = useCallback(() => {
    // ต้องมีหมวดหมู่ก่อนถึงจะเพิ่มสินค้าได้ (backend บังคับ category_id)
    if (categories.length === 0) {
      toast('กรุณาเพิ่มหมวดหมู่ก่อนเพิ่มสินค้า', 'warn');
      setShowCatModal(true);
      setCatForm({ name: '', icon: '' });
      setCatError(false);
      return;
    }
    setShowProductModal(true);
    setEditingId(null);
    setFormErrors({});
    setForm({ name: '', description: '', price: '', cat: categories[0]?.id || '', stock: '', barcode: '', icon: '', img: null });
  }, [categories, toast]);

  const openEdit = useCallback((id: string) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setShowProductModal(true);
    setEditingId(id);
    setFormErrors({});
    setForm({ name: p.name, description: p.description || '', price: String(p.price), cat: p.cat, stock: String(p.stock), barcode: p.barcode || '', icon: p.icon, img: p.img });
  }, [products]);

  const closeProduct = useCallback(() => setShowProductModal(false), []);

  const updForm = useCallback(<K extends keyof ProductForm>(k: K, v: ProductForm[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    // พอผู้ใช้เริ่มแก้ช่องไหน ให้เอากรอบแดงของช่องนั้นออก
    setFormErrors((prev) => (prev[k as keyof typeof prev] ? { ...prev, [k]: false } : prev));
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

  const saveProduct = useCallback(async () => {
    // เช็คทุกช่องพร้อมกัน แล้วไฮไลต์กรอบแดงทุกช่องที่ขาด
    const errors = {
      name: !form.name.trim(),
      cat: !form.cat,
      price: (parseFloat(form.price) || 0) <= 0,
      barcode: !form.barcode.trim(),
    };
    if (errors.name || errors.cat || errors.price || errors.barcode) {
      setFormErrors(errors);
      if (errors.name) toast('กรุณาใส่ชื่อสินค้า', 'warn');
      else if (errors.cat) toast('กรุณาเลือกหมวดหมู่', 'warn');
      else if (errors.price) toast('กรุณาใส่ราคา', 'warn');
      else toast('กรุณาใส่บาร์โค้ด หรือกดปุ่ม "สแกน" เพื่อสร้างอัตโนมัติ', 'warn');
      return;
    }
    try {
      const saved = await api.saveProduct(form, editingId);
      if (editingId) {
        setProducts((prev) => prev.map((p) => (p.id === editingId ? saved : p)));
        toast('บันทึกการแก้ไขแล้ว', 'ok');
      } else {
        setProducts((prev) => [saved, ...prev]);
        setScreen('products');
        toast('เพิ่มสินค้าใหม่แล้ว', 'ok');
      }
      setShowProductModal(false);
    } catch (err: any) {
      toast(err?.message || 'ไม่สามารถบันทึกสินค้าได้', 'warn');
    }
  }, [editingId, form, toast]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      await api.deleteProduct(id);
      setCart((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast('ลบสินค้าแล้ว', 'ok');
    } catch (err: any) {
      toast(err?.message || 'ไม่สามารถลบสินค้าได้', 'warn');
    }
  }, [toast]);

  const openCat = useCallback(() => { setShowCatModal(true); setCatForm({ name: '', icon: '' }); setCatError(false); }, []);
  const closeCat = useCallback(() => setShowCatModal(false), []);

  const updateCatForm = useCallback((next: CategoryForm) => {
    setCatForm(next);
    setCatError(false);
  }, []);

  const saveCat = useCallback(async () => {
    if (!catForm.name.trim()) { setCatError(true); toast('กรุณาใส่ชื่อหมวดหมู่', 'warn'); return; }
    try {
      const saved = await api.saveCategory(catForm);
      setCategories((prev) => prev.concat([saved]));
      // ไม่ปิด modal เพื่อให้เพิ่มหลายหมวดต่อกันได้ แค่เคลียร์ช่องกรอก
      setCatForm({ name: '', icon: '' });
      toast('เพิ่มหมวดหมู่แล้ว', 'ok');
    } catch (err: any) {
      toast(err?.message || 'ไม่สามารถเพิ่มหมวดหมู่ได้', 'warn');
    }
  }, [catForm, toast]);

  const renameCat = useCallback(async (id: string, name: string) => {
    if (!name.trim()) { toast('กรุณาใส่ชื่อหมวดหมู่', 'warn'); return; }
    try {
      const saved = await api.updateCategory(id, name.trim());
      setCategories((prev) => prev.map((c) => (c.id === id ? saved : c)));
      toast('แก้ไขหมวดหมู่แล้ว', 'ok');
    } catch (err: any) {
      toast(err?.message || 'ไม่สามารถแก้ไขหมวดหมู่ได้', 'warn');
    }
  }, [toast]);

  const deleteCat = useCallback(async (id: string) => {
    // backend ไม่ให้ลบหมวดที่ยังมีสินค้า — เช็คก่อนเพื่อแจ้งเป็นภาษาไทย
    if (products.some((p) => p.cat === id)) {
      toast('ลบไม่ได้: ยังมีสินค้าอยู่ในหมวดหมู่นี้', 'warn');
      return;
    }
    try {
      await api.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setActiveCat((prev) => (prev === id ? 'all' : prev));
      setPCat((prev) => (prev === id ? 'all' : prev));
      toast('ลบหมวดหมู่แล้ว', 'ok');
    } catch (err: any) {
      toast(err?.message || 'ไม่สามารถลบหมวดหมู่ได้', 'warn');
    }
  }, [products, toast]);

  const setTheme = useCallback((t: ThemeName) => setThemeState(t), []);

  return {
    rootRef,
    screen, setScreen,
    theme, setTheme,
    categories, products,
    cart, orderNote, setOrderNote, search, setSearch, activeCat, setActiveCat,
    pSearch, setPSearch, pCat, setPCat,
    showProductModal, editingId, form, updForm, setForm, formErrors,
    showCatModal, catForm, setCatForm, updateCatForm, catError,
    showPay, payMethod, setPayMethod, cashReceived,
    showReceipt, receipt,
    reportPeriod, setReportPeriod, monthOffset, setMonthOffset,
    sales, toastState, showToast: toast,
    now,
    money,
    addToCart, decCart, removeCart, clearCart, cartTotal,
    openPay, closePay, setCash, confirmPay, closeReceipt,
    openAdd, openEdit, closeProduct, onImg, genBarcode, saveProduct, deleteProduct,
    openCat, closeCat, saveCat, renameCat, deleteCat,
    lowStockCount,
    storeName: opts.storeName || 'โชคดีการค้า',
  };
}
