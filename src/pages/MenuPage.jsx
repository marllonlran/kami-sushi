import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { STORE } from '../config'
import { ALL_ITEMS, CATEGORIES, basePrice } from '../data/menu'
import { useCart } from '../context/CartContext'
import { money } from '../lib/format'
import { isOpen, hoursLabel } from '../lib/hours'
import Icon, { Logo, WhatsAppIcon } from '../components/Icon'
import ItemArt from '../components/ItemArt'
import ItemSheet from '../components/ItemSheet'
import Cart from '../components/Cart'
import Checkout from '../components/Checkout'
import Sheet from '../components/Sheet'

const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function useTable() {
  const [params] = useSearchParams()
  const fromUrl = Number(params.get('mesa'))
  const [table] = useState(() => {
    if (fromUrl >= 1 && fromUrl <= STORE.tables) {
      sessionStorage.setItem('kami:table', String(fromUrl))
      return fromUrl
    }
    return Number(sessionStorage.getItem('kami:table')) || null
  })
  return table
}

function ItemCard({ item, onOpen }) {
  const from = item.variants && item.variants.length > 1
  return (
    <button type="button" className="item-card" onClick={() => onOpen(item)}>
      <div className="item-card__body">
        <h3 className="item-card__name">{item.name}</h3>
        {item.desc && <p className="item-card__desc">{item.desc}</p>}
        <div className="item-card__meta">
          <span className="item-card__price">
            {from && <small>a partir de </small>}
            {money(basePrice(item))}
          </span>
          {item.variants?.length > 1 && item.variants[0].label.includes('un.') && (
            <span className="badge">{item.variants.map((v) => v.label.replace(' un.', '')).join(' ou ')} un.</span>
          )}
          {item.units && <span className="badge">{item.units}</span>}
        </div>
      </div>
      <ItemArt item={item} />
      <span className="item-card__add" aria-hidden="true">
        <Icon name="plus" size={18} stroke={2.4} />
      </span>
    </button>
  )
}

export default function MenuPage() {
  const table = useTable()
  const { count, subtotal } = useCart()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(CATEGORIES[0].id)
  const [openItem, setOpenItem] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const chipsRef = useRef(null)
  const open = isOpen()

  const lastOrder = useMemo(() => {
    try {
      const last = (JSON.parse(localStorage.getItem('kami:myOrders')) || [])[0]
      return last?.id ? last : null
    } catch {
      return null
    }
  }, [])

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return null
    return ALL_ITEMS.filter((i) => normalize(`${i.name} ${i.desc} ${i.categoryName}`).includes(q))
  }, [query])

  const featured = useMemo(() => ALL_ITEMS.filter((i) => i.featured), [])

  // Destaca a categoria visível enquanto rola a página.
  useEffect(() => {
    if (results) return
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (vis[0]) setActive(vis[0].target.id.replace('cat-', ''))
      },
      { rootMargin: '-200px 0px -55% 0px' },
    )
    CATEGORIES.forEach((c) => {
      const el = document.getElementById(`cat-${c.id}`)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [results])

  // Mantém o chip ativo visível na barra de categorias.
  useEffect(() => {
    const chip = chipsRef.current?.querySelector(`[data-cat="${active}"]`)
    chip?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [active])

  const goTo = (id) => {
    setQuery('')
    requestAnimationFrame(() => {
      const el = document.getElementById(`cat-${id}`)
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 128, behavior: 'smooth' })
    })
  }

  const showToast = (name) => {
    setToast(`${name} adicionado`)
    clearTimeout(showToast.t)
    showToast.t = setTimeout(() => setToast(null), 2200)
  }

  const startCheckout = () => {
    setCartOpen(false)
    setCheckoutOpen(true)
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar__inner container">
          <a href="#top" className="brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Logo size={36} />
            <span className="brand__name">
              Kami <em>Sushi</em>
            </span>
          </a>
          <div className="topbar__actions">
            {lastOrder && (
              <Link to={`/pedido/${lastOrder.id}`} className="btn btn--ghost btn--sm hide-sm">
                <Icon name="receipt" size={16} /> Meu pedido
              </Link>
            )}
            <a className="icon-btn icon-btn--wa" href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp">
              <WhatsAppIcon size={20} />
            </a>
            <button type="button" className="cart-btn" onClick={() => setCartOpen(true)} aria-label={`Abrir carrinho, ${count} itens`}>
              <Icon name="bag" size={20} />
              {count > 0 && <span className="cart-btn__count">{count}</span>}
            </button>
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero__glow" aria-hidden="true" />
        <div className="container hero__inner">
          <span className={`status-pill ${open ? 'is-open' : 'is-closed'}`}>
            <span className="status-pill__dot" />
            {open ? `Aberto agora · até ${STORE.hours.close}h` : `Fechado · abrimos às ${STORE.hours.open}h`}
          </span>
          <h1 className="hero__title">
            Sushi feito na hora,
            <br />
            <span className="accent">do nosso jeito.</span>
          </h1>
          <p className="hero__sub">
            Temakis, hots, combos e barcas para entrega, retirada ou direto na sua mesa. Todos os dias, das {hoursLabel}.
          </p>
          <div className="hero__chips">
            <span className="info-chip">
              <Icon name="bike" size={16} /> Entrega
            </span>
            <span className="info-chip">
              <Icon name="store" size={16} /> Retirada
            </span>
            <span className="info-chip">
              <Icon name="table" size={16} /> Na mesa
            </span>
            <span className="info-chip">
              <Icon name="pix" size={16} /> Pix, cartão ou dinheiro
            </span>
          </div>
          {table && (
            <div className="table-banner">
              <Icon name="table" size={18} />
              <span>
                Você está na <strong>Mesa {table}</strong>. Seu pedido vai direto para a cozinha.
              </span>
            </div>
          )}
          {lastOrder && (
            <Link to={`/pedido/${lastOrder.id}`} className="table-banner table-banner--link show-sm">
              <Icon name="receipt" size={18} />
              <span>
                Acompanhar meu último pedido <span className="accent">#{lastOrder.code}</span>
              </span>
            </Link>
          )}
        </div>
      </section>

      <nav className="catbar" aria-label="Categorias">
        <div className="container catbar__inner">
          <label className="search">
            <Icon name="search" size={18} />
            <input type="search" placeholder="Buscar no cardápio" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar no cardápio" />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Limpar busca">
                <Icon name="close" size={16} />
              </button>
            )}
          </label>
          <div className="chips" ref={chipsRef}>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                data-cat={c.id}
                className={`chip ${!results && active === c.id ? 'is-on' : ''}`}
                onClick={() => goTo(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="container layout">
        <main className="menu">
          {results ? (
            <section className="menu-section">
              <header className="menu-section__head">
                <h2>
                  {results.length} {results.length === 1 ? 'resultado' : 'resultados'} para “{query}”
                </h2>
              </header>
              {results.length ? (
                <div className="item-grid">
                  {results.map((i) => (
                    <ItemCard key={i.id} item={i} onOpen={setOpenItem} />
                  ))}
                </div>
              ) : (
                <p className="muted empty-search">Nada encontrado. Tente “salmão”, “temaki” ou “combo”.</p>
              )}
            </section>
          ) : (
            <>
              <section className="menu-section">
                <header className="menu-section__head">
                  <h2>
                    <Icon name="fire" size={20} className="accent" /> Mais pedidos
                  </h2>
                </header>
                <div className="featured">
                  {featured.map((i) => (
                    <button key={i.id} type="button" className="feat-card" onClick={() => setOpenItem(i)}>
                      <ItemArt item={i} />
                      <span className="feat-card__cat">{i.categoryName}</span>
                      <span className="feat-card__name">{i.name}</span>
                      <span className="feat-card__price">{money(basePrice(i))}</span>
                    </button>
                  ))}
                </div>
              </section>

              {CATEGORIES.map((c) => (
                <section key={c.id} id={`cat-${c.id}`} className="menu-section">
                  <header className="menu-section__head">
                    <h2>{c.name}</h2>
                    <span className="menu-section__jp" aria-hidden="true">
                      {c.jp}
                    </span>
                  </header>
                  {c.id === 'lanches' && <p className="section-note">Adicionais: carne bovina R$ 7 · bacon R$ 5 · cheddar R$ 5</p>}
                  <div className="item-grid">
                    {c.items.map((i) => (
                      <ItemCard key={i.id} item={{ ...i, categoryId: c.id, categoryName: c.name }} onOpen={setOpenItem} />
                    ))}
                  </div>
                </section>
              ))}
            </>
          )}

          <footer className="site-footer">
            <Logo size={44} />
            <p className="brand__name">
              Kami <em>Sushi</em>
            </p>
            <p className="muted">Todos os dias · {hoursLabel}</p>
            <a href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">
              <WhatsAppIcon size={16} /> {STORE.whatsappDisplay}
            </a>
          </footer>
        </main>

        <aside className="side-cart">
          <Cart onCheckout={startCheckout} />
        </aside>
      </div>

      {count > 0 && (
        <button type="button" className="cart-bar" onClick={() => setCartOpen(true)}>
          <span className="cart-bar__count">{count}</span>
          <span>Ver carrinho</span>
          <strong>{money(subtotal)}</strong>
        </button>
      )}

      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={16} stroke={3} /> {toast}
        </div>
      )}

      {openItem && <ItemSheet item={openItem} onClose={() => setOpenItem(null)} onAdded={showToast} />}
      {cartOpen && (
        <Sheet onClose={() => setCartOpen(false)} label="Carrinho">
          <Cart onCheckout={startCheckout} />
        </Sheet>
      )}
      {checkoutOpen && <Checkout onClose={() => setCheckoutOpen(false)} table={table} />}
    </div>
  )
}
