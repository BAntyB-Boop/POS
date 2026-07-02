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

function App(props: PosOptions) {
  const pos = usePos(props);

  return (
    <div
      ref={pos.rootRef}
      style={{
        ['--ok' as string]: '#3FBF8F',
        ['--warn' as string]: '#F4A63B',
        ['--danger' as string]: '#F26B6B',
        display: 'flex', height: '100vh', width: '100%', overflow: 'hidden',
        background: 'var(--bg)', fontFamily: "'Noto Sans Thai',system-ui,sans-serif", color: 'var(--ink)',
      }}
    >
      <Sidebar storeName={pos.storeName} screen={pos.screen} onNavigate={pos.setScreen} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header screen={pos.screen} productCount={pos.products.length} now={pos.now} onSetTheme={pos.setTheme} />

        {pos.screen === 'pos' && (
          <PosScreen
            categories={pos.categories}
            products={pos.products}
            search={pos.search}
            onSearch={pos.setSearch}
            activeCat={pos.activeCat}
            onSelectCat={pos.setActiveCat}
            lowStockThreshold={pos.lowStockThreshold}
            onAdd={pos.addToCart}
            cart={pos.cart}
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
            lowStockThreshold={pos.lowStockThreshold}
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
            sales={pos.sales}
            now={pos.now}
            reportPeriod={pos.reportPeriod}
            onSetPeriod={pos.setReportPeriod}
            monthOffset={pos.monthOffset}
            onPrevMonth={() => pos.setMonthOffset((v) => Math.max(-24, v - 1))}
            onNextMonth={() => pos.setMonthOffset((v) => Math.min(0, v + 1))}
            lowStockThreshold={pos.lowStockThreshold}
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
          onUpdate={pos.updForm}
          onImg={pos.onImg}
          onGenBarcode={pos.genBarcode}
          onClose={pos.closeProduct}
          onSave={pos.saveProduct}
        />
      )}

      {pos.showCatModal && (
        <CategoryModal
          catForm={pos.catForm}
          onUpdate={pos.setCatForm}
          onClose={pos.closeCat}
          onSave={pos.saveCat}
        />
      )}

      {pos.toastState && <Toast toast={pos.toastState} />}
    </div>
  );
}

export default App;
