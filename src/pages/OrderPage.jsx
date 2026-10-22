import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { STORE } from '../config'
import { money, clock } from '../lib/format'
import { getOrder, subscribe, FLOW, STATUS, TYPE_LABEL, PAYMENT_LABEL } from '../lib/orders'
import { lineDetails } from '../components/Cart'
import Icon, { Logo, WhatsAppIcon } from '../components/Icon'
import PixBox from '../components/PixBox'

const STEP_TEXT = {
  entrega: {
    novo: 'Recebemos seu pedido e já vamos confirmar.',
    preparo: 'Nossa cozinha está preparando tudo com carinho.',
    saiu: 'Seu pedido saiu para entrega!',
    concluido: 'Pedido entregue. Bom apetite!',
  },
  retirada: {
    novo: 'Recebemos seu pedido e já vamos confirmar.',
    preparo: 'Nossa cozinha está preparando tudo com carinho.',
    pronto: 'Pronto! Pode vir buscar no balcão.',
    concluido: 'Pedido retirado. Bom apetite!',
  },
  mesa: {
    novo: 'Recebemos seu pedido.',
    preparo: 'Nossa cozinha está preparando tudo com carinho.',
    pronto: 'Seu pedido está a caminho da mesa.',
    concluido: 'Pedido servido. Bom apetite!',
  },
}

const STEP_LABEL = { novo: 'Recebido', preparo: 'Em preparo', pronto: 'Pronto', saiu: 'Saiu p/ entrega', concluido: 'Concluído' }

export default function OrderPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(undefined)

  useEffect(() => {
    // Em caso de falha de rede, mantém o que já está na tela e tenta de novo na próxima atualização.
    const load = () => getOrder(id).then(setOrder, (e) => console.error(e))
    load()
    return subscribe(load)
  }, [id])

  if (order === undefined) return <div className="page page--center" />

  if (!order) {
    return (
      <div className="page page--center">
        <div className="empty-state">
          <Logo size={64} tilt />
          <h1>Pedido não encontrado</h1>
          <p className="muted">Confira o número do pedido ou fale com a gente.</p>
          <Link to="/" className="btn btn--primary">
            Voltar ao cardápio
          </Link>
        </div>
      </div>
    )
  }

  const flow = FLOW[order.type]
  const cancelled = order.status === 'cancelado'
  const current = flow.indexOf(order.status)
  const waText = encodeURIComponent(`Olá! Sobre o pedido #${order.code} (${order.customer.name})`)
  const waPix = encodeURIComponent(`Olá! Segue o comprovante do Pix do pedido #${order.code}, no valor de ${money(order.total)}.`)

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar__inner container container--narrow">
          <Link to="/" className="icon-btn" aria-label="Voltar ao cardápio">
            <Icon name="back" />
          </Link>
          <span className="topbar__title">Pedido #{order.code}</span>
          <a className="icon-btn icon-btn--wa" href={`https://wa.me/${STORE.whatsapp}?text=${waText}`} target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp">
            <WhatsAppIcon size={20} />
          </a>
        </div>
      </header>

      <main className="container container--narrow order-page">
        <section className={`order-hero ${cancelled ? 'is-cancelled' : ''}`}>
          <p className="order-hero__eyebrow">
            {order.table ? `Mesa ${order.table}` : TYPE_LABEL[order.type]} · feito às {clock(order.createdAt)}
          </p>
          <h1 className="order-hero__title">{cancelled ? 'Pedido cancelado' : STATUS[order.status].label}</h1>
          <p className="order-hero__text">
            {cancelled ? 'Fale com a gente pelo WhatsApp se tiver alguma dúvida.' : STEP_TEXT[order.type][order.status]}
          </p>

          {!cancelled && (
            <ol className="timeline">
              {flow.map((s, i) => (
                <li key={s} className={`timeline__step ${i < current ? 'is-done' : ''} ${i === current ? 'is-current' : ''}`}>
                  <span className="timeline__dot">{i < current ? <Icon name="check" size={14} stroke={3} /> : null}</span>
                  <span className="timeline__label">{STEP_LABEL[s]}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="order-hero__live">
            <span className="live-dot" /> Esta página atualiza sozinha
          </p>
        </section>

        {order.payment === 'pix' && !cancelled && (
          <section className="card">
            <h2 className="card__title">Pagamento via Pix</h2>
            <PixBox amount={order.total} />
            <a className="btn btn--wa btn--block" href={`https://wa.me/${STORE.whatsapp}?text=${waPix}`} target="_blank" rel="noreferrer">
              <WhatsAppIcon size={18} /> Enviar comprovante
            </a>
          </section>
        )}

        <section className="card">
          <h2 className="card__title">Resumo</h2>
          <ul className="summary-list">
            {order.items.map((l, i) => {
              const d = lineDetails(l)
              return (
                <li key={i}>
                  <span className="summary-list__qty">{l.qty}×</span>
                  <span className="summary-list__name">
                    {l.name}
                    {d.length > 0 && <small>{d.join(' · ')}</small>}
                    {l.note && <small className="cart-line__note">“{l.note}”</small>}
                  </span>
                  <span>{money(l.qty * l.unitPrice)}</span>
                </li>
              )
            })}
          </ul>
          <div className="sum-row">
            <span>Subtotal</span>
            <span>{money(order.subtotal)}</span>
          </div>
          {order.type === 'entrega' && (
            <div className="sum-row">
              <span>Taxa de entrega</span>
              <span>{typeof order.deliveryFee === 'number' ? money(order.deliveryFee) : 'A combinar'}</span>
            </div>
          )}
          <div className="sum-row sum-row--total">
            <span>Total</span>
            <strong>{money(order.total)}</strong>
          </div>
        </section>

        <section className="card">
          <h2 className="card__title">Detalhes</h2>
          <dl className="details">
            <dt>Nome</dt>
            <dd>{order.customer.name}</dd>
            {order.address && (
              <>
                <dt>Endereço</dt>
                <dd>
                  {order.address.street}, {order.address.number}
                  {order.address.complement ? ` · ${order.address.complement}` : ''} · {order.address.district}{order.address.cityName ? ` · ${order.address.cityName}` : ''}
                  {order.address.reference && <small>Ref.: {order.address.reference}</small>}
                </dd>
              </>
            )}
            <dt>Pagamento</dt>
            <dd>
              {PAYMENT_LABEL[order.payment]}
              {order.changeFor ? ` · troco para ${money(order.changeFor)}` : ''}
            </dd>
            {order.notes && (
              <>
                <dt>Observação</dt>
                <dd>{order.notes}</dd>
              </>
            )}
          </dl>
        </section>

        <Link to="/" className="btn btn--ghost btn--block">
          Fazer outro pedido
        </Link>
      </main>
    </div>
  )
}
