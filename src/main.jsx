import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ProvedorCarrinho } from './contexto/ContextoCarrinho'
import PaginaCardapio from './paginas/PaginaCardapio'
import PaginaPedido from './paginas/PaginaPedido'
// O painel só é baixado por quem abre /admin (clientes não carregam esse código).
const PaginaAdmin = lazy(() => import('./paginas/PaginaAdmin'))
import './estilos.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ProvedorCarrinho>
        <Routes>
          <Route path="/" element={<PaginaCardapio />} />
          <Route path="/pedido/:id" element={<PaginaPedido />} />
          <Route
            path="/admin"
            element={
              <Suspense fallback={<div className="page page--center" />}>
                <PaginaAdmin />
              </Suspense>
            }
          />
          <Route path="*" element={<PaginaCardapio />} />
        </Routes>
      </ProvedorCarrinho>
    </BrowserRouter>
  </StrictMode>,
)
