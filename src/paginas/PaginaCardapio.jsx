import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LOJA } from '../configuracao'
import { TODOS_ITENS, CATEGORIAS, precoBase } from '../dados/cardapio'
import { useCarrinho } from '../contexto/ContextoCarrinho'
import { moeda } from '../lib/formatacao'
import { estaAberto, rotuloHorario } from '../lib/horario'
import { useConfigLoja } from '../lib/loja'
import Icone, { Logo, LogoTexto, IconeWhatsApp } from '../componentes/Icone'
import ArteItem from '../componentes/ArteItem'
import GavetaItem from '../componentes/GavetaItem'
import Carrinho from '../componentes/Carrinho'
import FinalizarPedido from '../componentes/FinalizarPedido'
import Gaveta from '../componentes/Gaveta'

const normalizar = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function useMesa() {
  const [params] = useSearchParams()
  const daUrl = Number(params.get('mesa'))
  const [mesa] = useState(() => {
    if (daUrl >= 1 && daUrl <= LOJA.tables) {
      sessionStorage.setItem('kami:table', String(daUrl))
      return daUrl
    }
    return Number(sessionStorage.getItem('kami:table')) || null
  })
  return mesa
}

function CartaoItem({ item, onOpen, soldOut = false }) {
  const inicio = item.variants && item.variants.length > 1
  return (
    <button type="button" className={`item-card ${soldOut ? 'is-soldout' : ''}`} onClick={() => onOpen(item)} disabled={soldOut}>
      <div className="item-card__body">
        <h3 className="item-card__name">{item.name}</h3>
        {item.desc && <p className="item-card__desc">{item.desc}</p>}
        <div className="item-card__meta">
          <span className="item-card__price">
            {inicio && <small>a partir de </small>}
            {moeda(precoBase(item))}
          </span>
          {item.variants?.length > 1 && item.variants[0].label.includes('un.') && (
            <span className="badge">{item.variants.map((v) => v.label.replace(' un.', '')).join(' ou ')} un.</span>
          )}
          {item.units && <span className="badge">{item.units}</span>}
        </div>
      </div>
      <ArteItem item={item} />
      {soldOut ? (
        <span className="soldout-tag">Esgotado</span>
      ) : (
        <span className="item-card__add" aria-hidden="true">
          <Icone name="plus" size={18} stroke={2.4} />
        </span>
      )}
    </button>
  )
}

export default function PaginaCardapio() {
  const mesa = useMesa()
  const { contagem, subtotal } = useCarrinho()
  const [busca, setBusca] = useState('')
  const [ativo, setAtivo] = useState(CATEGORIAS[0].id)
  const [itemAberto, setItemAberto] = useState(null)
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)
  const [finalizacaoAberta, setFinalizacaoAberta] = useState(false)
  const [aviso, setAviso] = useState(null)
  const refChips = useRef(null)
  const loja = useConfigLoja()
  const aberto = estaAberto()
  const pausado = aberto && loja.paused
  const estaEsgotado = (id) => loja.soldOut.includes(id)

  const ultimoPedido = useMemo(() => {
    try {
      const ultimo = (JSON.parse(localStorage.getItem('kami:myOrders')) || [])[0]
      return ultimo?.id ? ultimo : null
    } catch {
      return null
    }
  }, [])

  const resultados = useMemo(() => {
    const q = normalizar(busca.trim())
    if (!q) return null
    return TODOS_ITENS.filter((i) => normalizar(`${i.name} ${i.desc} ${i.categoryName}`).includes(q))
  }, [busca])

  const destaques = useMemo(() => TODOS_ITENS.filter((i) => i.featured), [])

  // Destaca a categoria visível enquanto rola a página.
  useEffect(() => {
    if (resultados) return
    const obs = new IntersectionObserver(
      (entradas) => {
        const vis = entradas.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (vis[0]) setAtivo(vis[0].target.id.replace('cat-', ''))
      },
      { rootMargin: '-200px 0px -55% 0px' },
    )
    CATEGORIAS.forEach((c) => {
      const el = document.getElementById(`cat-${c.id}`)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [resultados])

  // Mantém o chip ativo visível na barra de categorias.
  useEffect(() => {
    const chipAtivo = refChips.current?.querySelector(`[data-cat="${ativo}"]`)
    chipAtivo?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [ativo])

  const irPara = (id) => {
    setBusca('')
    requestAnimationFrame(() => {
      const el = document.getElementById(`cat-${id}`)
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 128, behavior: 'smooth' })
    })
  }

  const mostrarAviso = (nome) => {
    setAviso(`${nome} adicionado`)
    clearTimeout(mostrarAviso.t)
    mostrarAviso.t = setTimeout(() => setAviso(null), 2200)
  }

  const iniciarFinalizacao = () => {
    setCarrinhoAberto(false)
    setFinalizacaoAberta(true)
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar__inner container">
          <a href="#top" className="brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Logo size={38} />
            <LogoTexto />
          </a>
          <div className="topbar__actions">
            {ultimoPedido && (
              <Link to={`/pedido/${ultimoPedido.id}`} className="btn btn--ghost btn--sm hide-sm">
                <Icone name="receipt" size={16} /> Meu pedido
              </Link>
            )}
            <a className="icon-btn icon-btn--wa" href={`https://wa.me/${LOJA.whatsapp}`} target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp">
              <IconeWhatsApp size={20} />
            </a>
            <button type="button" className="cart-btn" onClick={() => setCarrinhoAberto(true)} aria-label={`Abrir carrinho, ${contagem} itens`}>
              <Icone name="bag" size={20} />
              {contagem > 0 && <span className="cart-btn__count">{contagem}</span>}
            </button>
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero__glow" aria-hidden="true" />
        <div className="container hero__inner">
          <span className={`status-pill ${pausado ? 'is-paused' : aberto ? 'is-open' : 'is-closed'}`}>
            <span className="status-pill__dot" />
            {pausado
              ? 'Pedidos pausados por alguns minutos'
              : aberto
                ? `Aberto agora · até ${LOJA.hours.close}h`
                : `Fechado · abrimos às ${LOJA.hours.open}h`}
          </span>
          <h1 className="hero__title">
            Sushi feito na hora,
            <br />
            <span className="accent">do nosso jeito.</span>
          </h1>
          <p className="hero__sub">
            Temakis, hots, combos e barcas para entrega, retirada ou direto na sua mesa. Todos os dias, das {rotuloHorario}.
          </p>
          <div className="hero__chips">
            <span className="info-chip">
              <Icone name="bike" size={16} /> Entrega
            </span>
            <span className="info-chip">
              <Icone name="store" size={16} /> Retirada
            </span>
            <span className="info-chip">
              <Icone name="table" size={16} /> Na mesa
            </span>
            <span className="info-chip">
              <Icone name="pix" size={16} /> Pix, cartão ou dinheiro
            </span>
          </div>
          {mesa && (
            <div className="table-banner">
              <Icone name="table" size={18} />
              <span>
                Você está na <strong>Mesa {mesa}</strong>. Seu pedido vai direto para a cozinha.
              </span>
            </div>
          )}
          {ultimoPedido && (
            <Link to={`/pedido/${ultimoPedido.id}`} className="table-banner table-banner--link show-sm">
              <Icone name="receipt" size={18} />
              <span>
                Acompanhar meu último pedido <span className="accent">#{ultimoPedido.code}</span>
              </span>
            </Link>
          )}
        </div>
      </section>

      <nav className="catbar" aria-label="Categorias">
        <div className="container catbar__inner">
          <label className="search">
            <Icone name="search" size={18} />
            <input type="search" placeholder="Buscar no cardápio" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar no cardápio" />
            {busca && (
              <button type="button" onClick={() => setBusca('')} aria-label="Limpar busca">
                <Icone name="close" size={16} />
              </button>
            )}
          </label>
          <div className="chips" ref={refChips}>
            {CATEGORIAS.map((c) => (
              <button
                key={c.id}
                type="button"
                data-cat={c.id}
                className={`chip ${!resultados && ativo === c.id ? 'is-on' : ''}`}
                onClick={() => irPara(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="container layout">
        <main className="menu">
          {resultados ? (
            <section className="menu-section">
              <header className="menu-section__head">
                <h2>
                  {resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'} para “{busca}”
                </h2>
              </header>
              {resultados.length ? (
                <div className="item-grid">
                  {resultados.map((i) => (
                    <CartaoItem key={i.id} item={i} onOpen={setItemAberto} soldOut={estaEsgotado(i.id)} />
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
                    <Icone name="fire" size={20} className="accent" /> Mais pedidos
                  </h2>
                </header>
                <div className="featured">
                  {destaques.map((i) => (
                    <button key={i.id} type="button" className={`feat-card ${estaEsgotado(i.id) ? 'is-soldout' : ''}`} onClick={() => setItemAberto(i)} disabled={estaEsgotado(i.id)}>
                      <ArteItem item={i} />
                      <span className="feat-card__cat">{i.categoryName}</span>
                      <span className="feat-card__name">{i.name}</span>
                      <span className="feat-card__price">{estaEsgotado(i.id) ? 'Esgotado' : moeda(precoBase(i))}</span>
                    </button>
                  ))}
                </div>
              </section>

              {CATEGORIAS.map((c) => (
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
                      <CartaoItem key={i.id} item={{ ...i, categoryId: c.id, categoryName: c.name }} onOpen={setItemAberto} soldOut={estaEsgotado(i.id)} />
                    ))}
                  </div>
                </section>
              ))}
            </>
          )}

          <footer className="site-footer">
            <div className="brand brand--stacked">
              <Logo size={56} tilt />
              <LogoTexto />
            </div>
            <p className="muted">Todos os dias · {rotuloHorario}</p>
            <a href={`https://wa.me/${LOJA.whatsapp}`} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">
              <IconeWhatsApp size={16} /> {LOJA.whatsappDisplay}
            </a>
          </footer>
        </main>

        <aside className="side-cart">
          <Carrinho onCheckout={iniciarFinalizacao} paused={loja.paused} soldOut={loja.soldOut} />
        </aside>
      </div>

      {contagem > 0 && (
        <button type="button" className="cart-bar" onClick={() => setCarrinhoAberto(true)}>
          <span className="cart-bar__count">{contagem}</span>
          <span>Ver carrinho</span>
          <strong>{moeda(subtotal)}</strong>
        </button>
      )}

      {aviso && (
        <div className="toast" role="status">
          <Icone name="check" size={16} stroke={3} /> {aviso}
        </div>
      )}

      {itemAberto && <GavetaItem item={itemAberto} onClose={() => setItemAberto(null)} onAdded={mostrarAviso} />}
      {carrinhoAberto && (
        <Gaveta onClose={() => setCarrinhoAberto(false)} label="Carrinho">
          <Carrinho onCheckout={iniciarFinalizacao} paused={loja.paused} soldOut={loja.soldOut} />
        </Gaveta>
      )}
      {finalizacaoAberta && <FinalizarPedido onClose={() => setFinalizacaoAberta(false)} table={mesa} />}
    </div>
  )
}
