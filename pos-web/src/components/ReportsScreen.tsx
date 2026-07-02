import type { Category, Product, ReportPeriod, Sale } from '../types';
import { tabStyle } from '../styleHelpers';
import { money } from '../theme';

interface Props {
  categories: Category[];
  products: Product[];
  sales: Sale[];
  now: number;
  reportPeriod: ReportPeriod;
  onSetPeriod: (p: ReportPeriod) => void;
  monthOffset: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  lowStockThreshold: number;
}

export default function ReportsScreen({
  categories, products, sales, now, reportPeriod, onSetPeriod, monthOffset, onPrevMonth, onNextMonth, lowStockThreshold,
}: Props) {
  const isMonth = reportPeriod === 'month';
  const rnow = new Date(now);
  const selMonth = new Date(rnow.getFullYear(), rnow.getMonth() + monthOffset, 1);
  const inPeriod = (ts: number) => {
    const d = new Date(ts);
    return isMonth
      ? d.getMonth() === selMonth.getMonth() && d.getFullYear() === selMonth.getFullYear()
      : d.toDateString() === rnow.toDateString();
  };
  const periodSales = sales.filter((x) => inPeriod(x.ts));
  const todayTotal = periodSales.reduce((s, x) => s + x.total, 0);
  const bills = periodSales.length;
  const itemsSold = periodSales.reduce((s, x) => s + x.items.reduce((a, i) => a + i.qty, 0), 0);
  const avg = bills ? Math.round(todayTotal / bills) : 0;

  const dayAgg: Record<number, number> = {};
  periodSales.forEach((x) => { const d = new Date(x.ts).getDate(); dayAgg[d] = (dayAgg[d] || 0) + x.total; });
  const dayKeys = Object.keys(dayAgg).map(Number).sort((a, b) => a - b);
  const dvals = dayKeys.map((k) => dayAgg[k]);
  const dmax = dvals.length ? Math.max(...dvals) : 1;

  const agg: Record<string, { name: string; icon: string; qty: number; rev: number }> = {};
  periodSales.forEach((x) => x.items.forEach((i) => {
    if (!agg[i.name]) agg[i.name] = { name: i.name, icon: i.icon, qty: 0, rev: 0 };
    agg[i.name].qty += i.qty;
    agg[i.name].rev += i.lineTotal;
  }));
  const topArr = Object.values(agg).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const maxQty = topArr.length ? topArr[0].qty : 1;

  const cagg: Record<string, number> = {};
  periodSales.forEach((x) => x.items.forEach((i) => { cagg[i.cat] = (cagg[i.cat] || 0) + i.lineTotal; }));
  const cvals = Object.values(cagg);
  const cmax = cvals.length ? Math.max(...cvals) : 1;
  const catBreakdown = categories.filter((c) => cagg[c.id]);

  const recent = periodSales.slice().reverse().slice(0, 6);
  const lowStock = products.filter((p) => p.stock <= lowStockThreshold).sort((a, b) => a.stock - b.stock).slice(0, 8);

  const nextDisabled = monthOffset >= 0;

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
            <span style={{ fontFamily: "'Itim',cursive", fontSize: 18, minWidth: 158, textAlign: 'center' }}>📅 {selMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</span>
            <button onClick={onNextMonth} disabled={nextDisabled} style={{ width: 38, height: 38, flex: 'none', borderRadius: 11, border: '1.5px solid var(--line)', background: 'var(--panel)', fontSize: 14, color: nextDisabled ? '#d9cfc9' : 'var(--ink)', cursor: nextDisabled ? 'not-allowed' : 'pointer' }}>▶</button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
        <StatCard label={isMonth ? 'ยอดขายรวมเดือน' : 'ยอดขายวันนี้'} icon="💰" value={money(todayTotal)} accent />
        <StatCard label="จำนวนบิล" icon="🧾" value={String(bills)} />
        <StatCard label="ชิ้นที่ขายได้" icon="📦" value={String(itemsSold)} />
        <StatCard label="เฉลี่ยต่อบิล" icon="📈" value={money(avg)} />
      </div>

      {isMonth && (
        <div style={{ background: 'var(--panel)', border: '1.5px solid var(--line)', borderRadius: 18, padding: '18px 20px' }}>
          <div style={{ fontFamily: "'Itim',cursive", fontSize: 18, marginBottom: 14 }}>📈 ยอดขายรายวัน · {selMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</div>
          {dayKeys.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13, padding: '14px 0' }}>ยังไม่มียอดขายในเดือนนี้ ลองขายสักบิลดูนะ 🐱</div>}
          {dayKeys.map((k) => (
            <div key={k} style={{ marginBottom: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>วันที่ {k}</span>
                <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{money(dayAgg[k])}</span>
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: 999 }}>
                <div style={{ height: 8, borderRadius: 999, background: 'var(--brand)', width: Math.round((dayAgg[k] / dmax) * 100) + '%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
        <div style={{ background: 'var(--panel)', border: '1.5px solid var(--line)', borderRadius: 18, padding: '18px 20px' }}>
          <div style={{ fontFamily: "'Itim',cursive", fontSize: 18, marginBottom: 14 }}>🏆 สินค้าขายดี</div>
          {topArr.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13, padding: '14px 0' }}>ยังไม่มีข้อมูลการขาย ลองขายสักบิลดูนะ 🐱</div>}
          {topArr.map((t) => (
            <div key={t.name} style={{ marginBottom: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{t.icon} {t.name}</span>
                <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{t.qty} ชิ้น · {money(t.rev)}</span>
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: 999 }}>
                <div style={{ height: 8, borderRadius: 999, background: 'var(--brand)', width: Math.round((t.qty / maxQty) * 100) + '%' }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--panel)', border: '1.5px solid var(--line)', borderRadius: 18, padding: '18px 20px' }}>
          <div style={{ fontFamily: "'Itim',cursive", fontSize: 18, marginBottom: 14 }}>🐈 สินค้าใกล้หมด</div>
          {lowStock.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13, padding: '14px 0' }}>สต็อกยังเพียงพอทุกรายการ 👍</div>}
          {lowStock.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
              {p.img ? (
                <div style={{ width: 34, height: 34, flex: 'none', borderRadius: 9, overflow: 'hidden', background: 'var(--soft)' }}>
                  <img src={p.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ width: 34, height: 34, flex: 'none', borderRadius: 9, background: 'var(--soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{p.icon}</div>
              )}
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap', color: p.stock <= 2 ? 'var(--danger)' : 'var(--warn)', background: p.stock <= 2 ? '#FDECEA' : '#FFF3E0' }}>{p.stock} ชิ้น</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--panel)', border: '1.5px solid var(--line)', borderRadius: 18, padding: '18px 20px' }}>
          <div style={{ fontFamily: "'Itim',cursive", fontSize: 18, marginBottom: 14 }}>🗂️ ยอดขายตามหมวดหมู่</div>
          {catBreakdown.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13, padding: '14px 0' }}>ยังไม่มีข้อมูล</div>}
          {catBreakdown.map((c) => (
            <div key={c.id} style={{ marginBottom: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{c.icon} {c.name}</span>
                <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{money(cagg[c.id])}</span>
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: 999 }}>
                <div style={{ height: 8, borderRadius: 999, background: 'var(--brand2)', width: Math.round((cagg[c.id] / cmax) * 100) + '%' }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--panel)', border: '1.5px solid var(--line)', borderRadius: 18, padding: '18px 20px' }}>
          <div style={{ fontFamily: "'Itim',cursive", fontSize: 18, marginBottom: 14 }}>🧾 บิลล่าสุด</div>
          {recent.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13, padding: '14px 0' }}>ยังไม่มีบิลวันนี้</div>}
          {recent.map((r) => (
            <div key={r.no} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>#{String(r.no).padStart(4, '0')}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{new Date(r.ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น. · {r.items.length} รายการ · {r.items.reduce((a, i) => a + i.qty, 0)} ชิ้น</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>{money(r.total)}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.method === 'cash' ? 'เงินสด' : 'พร้อมเพย์'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, icon, value, accent }: { label: string; icon: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: 'var(--panel)', border: '1.5px solid var(--line)', borderRadius: 18, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</span><span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div style={{ fontFamily: "'Itim',cursive", fontSize: 30, color: accent ? 'var(--brand)' : 'var(--ink)', marginTop: 6 }}>{value}</div>
    </div>
  );
}
