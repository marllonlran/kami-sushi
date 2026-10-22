import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import MenuPage from './pages/MenuPage'
import OrderPage from './pages/OrderPage'
import AdminPage from './pages/AdminPage'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/" element={<MenuPage />} />
          <Route path="/pedido/:id" element={<OrderPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<MenuPage />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  </StrictMode>,
)
