import type { Category, Product, Sale, User, ProductForm, CategoryForm } from './types';

// ตั้ง VITE_API_URL เป็น origin ของ backend (ไม่ต้องมี /api ต่อท้าย) เช่น https://xxx.up.railway.app
const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const BASE_URL = `${API_ORIGIN}/api`;
const TOKEN_KEY = 'meow-pos-token';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
    throw new Error(errorMsg);
  }
  return data as T;
}

// Translate database Product to frontend Product
export function mapProductFromDb(p: any): Product {
  return {
    id: String(p.id),
    name: p.name,
    description: p.description || '',
    price: (p.sale_price || 0) / 100,
    cost: (p.cost_price || 0) / 100,
    cat: String(p.category_id),
    stock: p.quantity_in_stock || 0,
    icon: p.icon || '📦',
    img: p.image_url || null,
    barcode: p.barcode || '',
  };
}

// Translate database Category to frontend Category
export function mapCategoryFromDb(c: any): Category {
  return {
    id: String(c.id),
    name: c.name,
    icon: c.icon || '🏷️',
  };
}

// Translate backend order / sale to frontend Sale format
export function mapSaleFromDb(s: any): Sale {
  const ts = typeof s.created_at === 'number' ? s.created_at : new Date(s.created_at).getTime();
  const items = (s.items || []).map((item: any) => ({
    id: String(item.product_id),
    name: item.product_name || '',
    icon: item.icon || '📦',
    img: item.image_url || null,
    cat: String(item.category_id || ''),
    price: (item.unit_price || 0) / 100,
    qty: item.quantity || 0,
    lineTotal: (item.subtotal || 0) / 100,
  }));
  return {
    no: s.id,
    ts,
    items,
    total: (s.total_amount || 0) / 100,
    method: s.payment_method === 'cash' ? 'cash' : 'qr',
    received: (s.received_amount || 0) / 100,
    change: (s.change_amount || 0) / 100,
    note: s.description || '',
  };
}

export const api = {
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const data = await request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    return {
      token: data.token,
      user: {
        username: data.user.username,
        name: data.user.name,
        role: data.user.role,
      },
    };
  },

  async getMe(): Promise<User> {
    const data = await request<any>('/auth/me');
    return {
      username: data.username,
      name: data.name,
      role: data.role,
    };
  },

  async getCategories(): Promise<Category[]> {
    const data = await request<any[]>('/categories');
    return data.map(mapCategoryFromDb);
  },

  async saveCategory(form: CategoryForm): Promise<Category> {
    const data = await request<any>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name: form.name, icon: form.icon }),
    });
    return mapCategoryFromDb(data);
  },

  async getProducts(): Promise<Product[]> {
    const data = await request<{ items: any[]; total: number }>('/products?limit=200');
    return data.items.map(mapProductFromDb);
  },

  async saveProduct(form: ProductForm, editingId: string | null): Promise<Product> {
    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      sale_price: Math.round((parseFloat(form.price) || 0) * 100),
      cost_price: Math.round((parseFloat(form.price) || 0) * 0.72 * 100), // Default cost formula: 72%
      category_id: parseInt(form.cat, 10),
      quantity_in_stock: parseInt(form.stock, 10) || 0,
      barcode: form.barcode,
      icon: form.icon,
      image_url: form.img,
    };

    if (editingId) {
      // PATCH doesn't accept quantity_in_stock
      const { quantity_in_stock, ...patchBody } = body;
      const data = await request<any>(`/products/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify(patchBody),
      });
      return mapProductFromDb(data);
    } else {
      const data = await request<any>('/products', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return mapProductFromDb(data);
    }
  },

  async deleteProduct(id: string): Promise<void> {
    await request<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  async checkout(order: {
    items: { product_id: number; quantity: number }[];
    payment_method: 'cash' | 'promptpay' | 'card';
    received_amount?: number;
    discount?: number;
    description?: string;
  }): Promise<Sale> {
    const data = await request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
    return mapSaleFromDb(data);
  },

  async getOrderDetails(id: number): Promise<Sale> {
    const data = await request<any>(`/orders/${id}`);
    return mapSaleFromDb(data);
  },

  async getReportsSummary(from?: string, to?: string): Promise<any> {
    const query = from && to ? `?from=${from}&to=${to}` : '';
    const data = await request<any>(`/reports/summary${query}`);
    return {
      revenue: data.revenue / 100,
      orderCount: data.order_count,
      itemsSold: data.items_sold,
      avgPerOrder: data.avg_per_order / 100,
    };
  },

  async getSalesOverTime(from?: string, to?: string): Promise<any[]> {
    const query = from && to ? `?from=${from}&to=${to}` : '';
    const data = await request<any[]>(`/reports/sales-over-time${query}`);
    return data.map((d) => ({
      date: d.date,
      revenue: d.revenue / 100,
      orderCount: d.order_count,
    }));
  },

  async getTopProducts(from?: string, to?: string): Promise<any[]> {
    const query = from && to ? `?from=${from}&to=${to}` : '';
    const data = await request<any[]>(`/reports/top-products${query}`);
    return data.map((d) => ({
      productId: String(d.product_id),
      productName: d.product_name,
      quantitySold: d.quantity_sold,
      revenue: d.revenue / 100,
    }));
  },

  async getSalesByCategory(from?: string, to?: string): Promise<any[]> {
    const query = from && to ? `?from=${from}&to=${to}` : '';
    const data = await request<any[]>(`/reports/sales-by-category${query}`);
    return data.map((d) => ({
      categoryId: String(d.category_id),
      categoryName: d.category_name,
      quantitySold: d.quantity_sold,
      revenue: d.revenue / 100,
    }));
  },

  async getRecentOrders(limit: number = 6): Promise<any[]> {
    const data = await request<any[]>(`/reports/recent-orders?limit=${limit}`);
    return data.map(mapOrderSummaryFromDb);
  },

  async getOrdersRange(from: string, to: string, limit: number = 200): Promise<any[]> {
    const data = await request<{ items: any[] }>(`/orders?from=${from}&to=${to}&limit=${limit}`);
    return (data.items || []).map(mapOrderSummaryFromDb);
  },
};

function mapOrderSummaryFromDb(d: any) {
  return {
    no: d.id,
    ts: typeof d.created_at === 'number' ? d.created_at : new Date(d.created_at).getTime(),
    total: d.total_amount / 100,
    method: d.payment_method === 'cash' ? 'cash' : 'qr',
    received: d.received_amount / 100,
    change: d.change_amount / 100,
    note: d.description || '',
    itemsCount: d.items_count,
    cashierName: d.cashier_name,
  };
}
