import { useState, useEffect } from 'react';
import type { Category, Product, ReportPeriod, Sale } from '../types';
import { tabStyle } from '../styleHelpers';
import { money } from '../theme';
import BillModal from './BillModal';
import DayDetailModal from './DayDetailModal';
import { api } from '../api';
import Thumb from './Thumb';

interface Props {
  categories: Category[];
  products: Product[];
  now: number;
  reportPeriod: ReportPeriod;
  onSetPeriod: (p: ReportPeriod) => void;
  monthOffset: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  lowStockThreshold: number;
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${date}`;
}

export default function ReportsScreen({
  categories, products, now, reportPeriod, onSetPeriod, monthOffset, onPrevMonth, onNextMonth, lowStockThreshold,
}: Props) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedBill, setSelectedBill] = useState<Sale | null>(null);
  const [billSearch, setBillSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ revenue: 0, orderCount: 0, itemsSold: 0, avgPerOrder: 0 });
  const [salesOverTime, setSalesOverTime] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [dayBills, setDayBills] = useState<any[]>([]);

  const isMonth = reportPeriod === 'month';
  const rnow = new Date(now);
  const selMonth = new Date(rnow.getFullYear(), rnow.getMonth() + monthOffset, 1);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        let fromYmd: string;
        let toYmdStr: string;

        if (reportPeriod === 'month') {
          fromYmd = toYmd(selMonth);
          const nextMonth = new Date(selMonth.getFullYear(), selMonth.getMonth() + 1, 1);
          toYmdStr = toYmd(nextMonth);
        } else {
          fromYmd = toYmd(rnow);
          const tomorrow = new Date(rnow);
          tomorrow.setDate(tomorrow.getDate() + 1);
          toYmdStr = toYmd(tomorrow);
        }

        const [sum, timeSales, top, byCat, recent] = await Promise.all([
          api.getReportsSummary(fromYmd, toYmdStr),
          api.getSalesOverTime(fromYmd, toYmdStr),
          api.getTopProducts(fromYmd, toYmdStr),
          api.getSalesByCategory(fromYmd, toYmdStr),
          api.getRecentOrders(100),
        ]);

        if (active) {
          setSummary(sum);
          setSalesOverTime(timeSales);
          setTopProducts(top);
          setSalesByCategory(byCat);
          setRecentOrders(recent);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [reportPeriod, monthOffset, now]);

  useEffect(() => {
    if (selectedDay === null) {
      setDayBills([]);
      return;
    }
    const dayVal = selectedDay;
    let active = true;
    async function loadDayBills() {
      try {
        const y = rnow.getFullYear();
        const m = rnow.getMonth() + monthOffset;
        const fromDate = new Date(y, m, dayVal);
        const toDate = new Date(y, m, dayVal + 1);

        const fromYmd = toYmd(fromDate);
        const toYmdStr = toYmd(toDate);

        const url = `http://localhost:3000/api/orders?from=${fromYmd}&to=${toYmdStr}&limit=200`;
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('meow-pos-token')}`
          }
        });
        const data = await res.json();
        if (active && data.items) {
          const mapped = data.items.map((d: any) => ({
            no: d.id,
            ts: typeof d.created_at === 'number' ? d.created_at : new Date(d.created_at).getTime(),
            total: d.total_amount / 100,
            method: d.payment_method === 'cash' ? 'cash' : 'qr',
            received: d.received_amount / 100,
            change: d.change_amount / 100,
            note: d.description || '',
            itemsCount: d.items_count,
            cashierName: d.cashier_name,
          }));
          setDayBills(mapped);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadDayBills();
    return () => {
      active = false;
    };
  }, [selectedDay, monthOffset, now]);

  const handleSelectBill = async (bill: any) => {
    try {
      const fullOrder = await api.getOrderDetails(bill.no);
      setSelectedBill(fullOrder);
    } catch (err: any) {
      alert('ไม่สามารถดึงข้อมูลรายละเอียดบิลได้');
    }
  };

  const todayTotal = summary.revenue;
  const bills = summary.orderCount;
  const itemsSold = summary.itemsSold;
  const avg = summary.avgPerOrder;

  const dayAgg: Record<number, number> = {};
  salesOverTime.forEach((row) => {
    const day = parseInt(row.date.split('-')[2], 10);
    dayAgg[day] = row.revenue;
  });
  const dayKeys = Object.keys(dayAgg).map(Number).sort((a, b) => a - b);
  const dvals = dayKeys.map((k) => dayAgg[k]);
  const dmax = dvals.length ? Math.max(...dvals) : 1;

  const topArr = topProducts.map((t) => {
    const p = products.find((x) => x.id === t.productId);
    return {
      name: t.productName,
      icon: p ? p.icon : '📦',
      qty: t.quantitySold,
      rev: t.revenue,
    };
  });
  const maxQty = topArr.length ? topArr[0].qty : 1;

  const cagg: Record<string, number> = {};
  salesByCategory.forEach((row) => {
    cagg[row.categoryId] = row.revenue;
  });
  const cvals = Object.values(cagg);
  const cmax = cvals.length ? Math.max(...cvals) : 1;
  const catBreakdown = categories.filter((c) => cagg[c.id]);

  const bq = billSearch.trim().toLowerCase();
  const recent = bq
    ? recentOrders.filter((s) => {
        const noStr = String(s.no);
        const padded = '#' + noStr.padStart(4, '0');
        return noStr.includes(bq.replace(/^#/, '')) || padded.includes(bq) || (s.note && s.note.toLowerCase().includes(bq));
      }).slice(0, 10)
    : recentOrders.slice(0, 6);

  const lowStock = products.filter((p) => p.stock <= lowStockThreshold).sort((a, b) => a.stock - b.stock).slice(0, 8);

  const nextDisabled = monthOffset >= 0;

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <span className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 9, background: 'var(--panel)', border: '1.5px solid var(--line)', borderRadius: 14, padding: 5, width: 260, maxWidth: '100%' }}>
          <button onClick={() => onSetPeriod('day')} style={tabStyle(!isMonth)}>วันนี้</button>
          <button onClick={() => onSetPeriod('month')} style={tabStyle(isMonth)}>รายเดือน</button>
        </div>
        {isMonth && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <button onClick={onPrevMonth} style={{ width: 38, height: 38, flex: 'none', borderRadius: 11, border: '1.5px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)', fontSize: 14, cursor: 'pointer' }}>◀</button>
            <span style={{ fontFamily: "'Itim',cursive", fontSize: 18, minWidth: 158, textAlign: 'center' }}>{selMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</span>
            <button onClick={onNextMonth} disabled={nextDisabled} style={{ width: 38, height: 38, flex: 'none', borderRadius: 11, border: '1.5px solid var(--line)', background: 'var(--panel)', fontSize: 14, color: nextDisabled ? '#d9cfc9' : 'var(--ink)', cursor: nextDisabled ? 'not-allowed' : 'pointer' }}>▶</button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
        <StatCard label={isMonth ? 'ยอดขายรวมเดือน' : 'ยอดขายวันนี้'} value={money(todayTotal)} accent />
        <StatCard label="จำนวนบิล" value={String(bills)} />
        <StatCard label="ชิ้นที่ขายได้" value={String(itemsSold)} />
        <StatCard label="เฉลี่ยต่อบิล" value={money(avg)} />
      </div>

      {isMonth && (
        <div style={{ background: 'var(--panel)', border: '1.5px solid var(--line)', borderRadius: 18, padding: '18px 20px' }}>
          <div style={{ fontFamily: "'Itim',cursive", fontSize: 18, marginBottom: 14 }}>ยอดขายรายวัน · {selMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</div>
          {dayKeys.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13, padding: '14px 0' }}>ยังไม่มียอดขายในเดือนนี้ ลองขายสักรายการดูนะ</div>}
          {dayKeys.length > 0 && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>แตะวันที่เพื่อดูรายละเอียดของวันนั้น</div>}
          {dayKeys.map((k) => (
            <button
              key={k}
              onClick={() => setSelectedDay(k)}
              className="day-row"
              style={{ display: 'block', width: '100%', marginBottom: 6, padding: '7px 10px', border: 'none', borderRadius: 12, background: 'transparent', cursor: 'pointer', font: 'inherit', color: 'inherit', textAlign: 'left', transition: '.12s' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>วันที่ {k}</span>
                <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{money(dayAgg[k])}</span>
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: 999 }}>
                <div style={{ height: 8, borderRadius: 999, background: 'var(--brand)', width: Math.round((dayAgg[k] / dmax) * 100) + '%' }} />
              </div>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
        <div style={{ background: 'var(--panel)', border: '1.5px solid var(--line)', borderRadius: 18, padding: '18px 20px' }}>
          <div style={{ fontFamily: "'Itim',cursive", fontSize: 18, marginBottom: 14 }}>สินค้าขายดี</div>
          {topArr.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13, padding: '14px 0' }}>ยังไม่มีข้อมูลการขาย ลองขายสักรายการดูนะ</div>}
          {topArr.map((t) => (
            <div key={t.name} style={{ marginBottom: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{t.name}</span>
                <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{t.qty} ชิ้น · {money(t.rev)}</span>
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: 999 }}>
                <div style={{ height: 8, borderRadius: 999, background: 'var(--brand)', width: Math.round((t.qty / maxQty) * 100) + '%' }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--panel)', border: '1.5px solid var(--line)', borderRadius: 18, padding: '18px 20px' }}>
          <div style={{ fontFamily: "'Itim',cursive", fontSize: 18, marginBottom: 14 }}>สินค้าใกล้หมด</div>
          {lowStock.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13, padding: '14px 0' }}>สต็อกยังเพียงพอทุกรายการ</div>}
          {lowStock.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
              <Thumb name={p.name} img={p.img} size={34} radius={9} />
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap', color: p.stock <= 2 ? 'var(--danger)' : 'var(--warn)', background: p.stock <= 2 ? '#FDECEA' : '#FFF3E0' }}>{p.stock} ชิ้น</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--panel)', border: '1.5px solid var(--line)', borderRadius: 18, padding: '18px 20px' }}>
          <div style={{ fontFamily: "'Itim',cursive", fontSize: 18, marginBottom: 14 }}>ยอดขายตามหมวดหมู่</div>
          {catBreakdown.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13, padding: '14px 0' }}>ยังไม่มีข้อมูล</div>}
          {catBreakdown.map((c) => (
            <div key={c.id} style={{ marginBottom: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</span>
                <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{money(cagg[c.id])}</span>
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: 999 }}>
                <div style={{ height: 8, borderRadius: 999, background: 'var(--brand2)', width: Math.round((cagg[c.id] / cmax) * 100) + '%' }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--panel)', border: '1.5px solid var(--line)', borderRadius: 18, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: "'Itim',cursive", fontSize: 18 }}>{bq ? 'ผลค้นหาบิล' : 'บิลล่าสุด'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--bg)', border: '1.5px solid var(--line)', borderRadius: 11, padding: '7px 12px', width: 190 }}>
              <span style={{ fontSize: 13 }}>🔍</span>
              <input
                value={billSearch}
                onChange={(e) => setBillSearch(e.target.value)}
                placeholder="เลขบิล / ชื่อสินค้า..."
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 12.5, color: 'var(--ink)', width: '100%' }}
              />
              {bq && (
                <button onClick={() => setBillSearch('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted)', fontSize: 12, padding: 0 }}>✕</button>
              )}
            </div>
          </div>
          {recent.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13, padding: '14px 0' }}>{bq ? 'ไม่พบบิลที่ค้นหา' : 'ยังไม่มีบิลวันนี้'}</div>}
          {recent.map((r) => (
            <button
              key={r.no}
              onClick={() => handleSelectBill(r)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 4px', border: 'none', borderBottom: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', font: 'inherit', color: 'inherit', textAlign: 'left' }}
            >
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>#{String(r.no).padStart(4, '0')}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                  {bq
                    ? new Date(r.ts).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                    : new Date(r.ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น. · {r.items ? r.items.length : r.itemsCount} รายการ
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>{money(r.total)}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.method === 'cash' ? 'เงินสด' : 'พร้อมเพย์'}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedDay != null && (
        <DayDetailModal
          date={new Date(selMonth.getFullYear(), selMonth.getMonth(), selectedDay)}
          bills={dayBills}
          onClose={() => setSelectedDay(null)}
          onSelectBill={handleSelectBill}
        />
      )}

      {selectedBill && <BillModal sale={selectedBill} onClose={() => setSelectedBill(null)} />}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: 'var(--panel)', border: '1.5px solid var(--line)', borderRadius: 18, padding: 18 }}>
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</div>
      <div style={{ fontFamily: "'Itim',cursive", fontSize: 30, color: accent ? 'var(--brand)' : 'var(--ink)', marginTop: 6 }}>{value}</div>
    </div>
  );
}
