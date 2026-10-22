import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import MenuPage from './pages/MenuPage'
import OrderPage from './pages/OrderPage'
// O painel só é baixado por quem abre /admin (clientes não carregam esse código).
const AdminPage = lazy(() => import('./pages/AdminPage'))
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/" element={<MenuPage />} />
          <Route path="/pedido/:id" element={<OrderPage />} />
          <Route
            path="/admin"
            element={
              <Suspense fallback={<div className="page page--center" />}>
                <AdminPage />
              </Suspense>
            }
          />
          <Route path="*" element={<MenuPage />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  </StrictMode>,
)
