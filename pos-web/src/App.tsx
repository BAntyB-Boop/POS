import { useState } from 'react';
import type { User } from './types';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PosScreen from './components/PosScreen';
import ProductsScreen from './components/ProductsScreen';
import ReportsScreen from './components/ReportsScreen';
import PayModal from './components/PayModal';
import ReceiptModal from './components/ReceiptModal';
import ProductModal from './components/ProductModal';
import CategoryModal from './components/CategoryModal';
import Toast from './components/Toast';
import { usePos, type PosOptions } from './usePos';

const USER_KEY = 'meow-pos-user';

function App(props: PosOptions) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  const pos = usePos(props, user);
  // จอกว้างเปิด sidebar ไว้ก่อน จอแคบ (iPad แนวตั้ง/มือถือ) เริ่มแบบปิด
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 1024);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('meow-pos-token');
  };

  return (
    <div
      ref={pos.rootRef}
      style={{
        ['--ok' as string]: '#3F7D52',
        ['--warn' as string]: '#B9862A',
        ['--danger' as string]: '#96332A',
        ['--danger-soft' as string]: '#F3DAD3',
        ['--warn-soft' as string]: '#F6E7C4',
        ['--disabled' as string]: '#D6C9A0',
        display: 'flex', height: '100vh', width: '100%', overflow: 'hidden',
        background: 'var(--bg)', fontFamily: "'IBM Plex Sans Thai',system-ui,sans-serif", color: 'var(--ink)',
      }}
    >
      {!user ? (
        <LoginScreen storeName={pos.storeName} onLogin={handleLogin} />
      ) : (
      <>
      <Sidebar
        storeName={pos.storeName}
        screen={pos.screen}
        onNavigate={pos.setScreen}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
        lowStockCount={pos.lowStockCount}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header
          screen={pos.screen}
          productCount={pos.products.length}
          now={pos.now}
          onSetTheme={pos.setTheme}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          lowStockProducts={pos.products.filter((p) => p.stock <= p.reorderLevel)}
          onEditProduct={(id) => {
            pos.setScreen('products');
            if (user.role === 'admin') {
              pos.openEdit(id);
            } else {
              pos.setSearch(pos.products.find((p) => p.id === id)?.name || '');
            }
          }}
        />

        {pos.screen === 'pos' && (
          <PosScreen
            categories={pos.categories}
            products={pos.products}
            search={pos.search}
            onSearch={pos.setSearch}
            activeCat={pos.activeCat}
            onSelectCat={pos.setActiveCat}
            onAdd={pos.addToCart}
            cart={pos.cart}
            orderNote={pos.orderNote}
            onOrderNote={pos.setOrderNote}
            onInc={pos.addToCart}
            onDec={pos.decCart}
            onClearCart={pos.clearCart}
            onOpenPay={pos.openPay}
          />
        )}

        {pos.screen === 'products' && (
          <ProductsScreen
            categories={pos.categories}
            products={pos.products}
            pSearch={pos.pSearch}
            onPSearch={pos.setPSearch}
            pCat={pos.pCat}
            onSelectPCat={pos.setPCat}
            isAdmin={user.role === 'admin'}
            onOpenCat={pos.openCat}
            onOpenAdd={pos.openAdd}
            onEdit={pos.openEdit}
            onDelete={pos.deleteProduct}
          />
        )}

        {pos.screen === 'reports' && (
          <ReportsScreen
            categories={pos.categories}
            products={pos.products}
            now={pos.now}
            reportPeriod={pos.reportPeriod}
            onSetPeriod={pos.setReportPeriod}
            monthOffset={pos.monthOffset}
            onPrevMonth={() => pos.setMonthOffset((v) => Math.max(-24, v - 1))}
            onNextMonth={() => pos.setMonthOffset((v) => Math.min(0, v + 1))}
          />
        )}
      </main>

      {pos.showPay && (
        <PayModal
          total={pos.cartTotal}
          payMethod={pos.payMethod}
          onSetMethod={pos.setPayMethod}
          cashReceived={pos.cashReceived}
          onSetCash={pos.setCash}
          storeName={pos.storeName}
          onClose={pos.closePay}
          onConfirm={pos.confirmPay}
        />
      )}

      {pos.showReceipt && pos.receipt && (
        <ReceiptModal receipt={pos.receipt} onClose={pos.closeReceipt} />
      )}

      {pos.showProductModal && (
        <ProductModal
          isEditing={!!pos.editingId}
          form={pos.form}
          categories={pos.categories}
          errors={pos.formErrors}
          onUpdate={pos.updForm}
          onImg={pos.onImg}
          onGenBarcode={pos.genBarcode}
          onClose={pos.closeProduct}
          onSave={pos.saveProduct}
        />
      )}

      {pos.showCatModal && (
        <CategoryModal
          categories={pos.categories}
          catForm={pos.catForm}
          catError={pos.catError}
          onUpdate={pos.updateCatForm}
          onClose={pos.closeCat}
          onSave={pos.saveCat}
          onRename={pos.renameCat}
          onDelete={pos.deleteCat}
        />
      )}

      </>
      )}

      {pos.toastState && <Toast toast={pos.toastState} />}
    </div>
  );
}

export default App;
