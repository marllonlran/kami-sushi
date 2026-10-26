import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LOJA } from '../configuracao'
import { moeda, horaMinuto } from '../lib/formatacao'
import { obterPedido, assinar, FLUXO, STATUS, ROTULO_TIPO, ROTULO_PAGAMENTO } from '../lib/pedidos'
import { detalhesLinha } from '../componentes/Carrinho'
import Icone, { Logo, IconeWhatsApp } from '../componentes/Icone'
import CaixaPix from '../componentes/CaixaPix'

const TEXTO_ETAPA = {
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

const ROTULO_ETAPA = { novo: 'Recebido', preparo: 'Em preparo', pronto: 'Pronto', saiu: 'Saiu p/ entrega', concluido: 'Concluído' }

export default function PaginaPedido() {
  const { id } = useParams()
  const [pedido, setPedido] = useState(undefined)

  useEffect(() => {
    // Em caso de falha de rede, mantém o que já está na tela e tenta de novo na próxima atualização.
    const carregar = () => obterPedido(id).then(setPedido, (e) => console.error(e))
    carregar()
    return assinar(carregar)
  }, [id])

  if (pedido === undefined) return <div className="page page--center" />

  if (!pedido) {
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

  const fluxo = FLUXO[pedido.type]
  const cancelados = pedido.status === 'cancelado'
  const etapaAtual = fluxo.indexOf(pedido.status)
  const textoWhatsapp = encodeURIComponent(`Olá! Sobre o pedido #${pedido.code} (${pedido.customer.name})`)
  const waPix = encodeURIComponent(`Olá! Segue o comprovante do Pix do pedido #${pedido.code}, no valor de ${moeda(pedido.total)}.`)

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar__inner container container--narrow">
          <Link to="/" className="icon-btn" aria-label="Voltar ao cardápio">
            <Icone name="back" />
          </Link>
          <span className="topbar__title">Pedido #{pedido.code}</span>
          <a className="icon-btn icon-btn--wa" href={`https://wa.me/${LOJA.whatsapp}?text=${textoWhatsapp}`} target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp">
            <IconeWhatsApp size={20} />
          </a>
        </div>
      </header>

      <main className="container container--narrow order-page">
        <section className={`order-hero ${cancelados ? 'is-cancelled' : ''}`}>
          <p className="order-hero__eyebrow">
            {pedido.table ? `Mesa ${pedido.table}` : ROTULO_TIPO[pedido.type]} · feito às {horaMinuto(pedido.createdAt)}
          </p>
          <h1 className="order-hero__title">{cancelados ? 'Pedido cancelado' : STATUS[pedido.status].label}</h1>
          <p className="order-hero__text">
            {cancelados ? 'Fale com a gente pelo WhatsApp se tiver alguma dúvida.' : TEXTO_ETAPA[pedido.type][pedido.status]}
          </p>

          {!cancelados && (
            <ol className="timeline">
              {fluxo.map((s, i) => (
                <li key={s} className={`timeline__step ${i < etapaAtual ? 'is-done' : ''} ${i === etapaAtual ? 'is-current' : ''}`}>
                  <span className="timeline__dot">{i < etapaAtual ? <Icone name="check" size={14} stroke={3} /> : null}</span>
                  <span className="timeline__label">{ROTULO_ETAPA[s]}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="order-hero__live">
            <span className="live-dot" /> Esta página atualiza sozinha
          </p>
        </section>

        {pedido.payment === 'pix' && !cancelados && (
          <section className="card">
            <h2 className="card__title">Pagamento via Pix</h2>
            <CaixaPix amount={pedido.total} />
            <a className="btn btn--wa btn--block" href={`https://wa.me/${LOJA.whatsapp}?text=${waPix}`} target="_blank" rel="noreferrer">
              <IconeWhatsApp size={18} /> Enviar comprovante
            </a>
          </section>
        )}

        <section className="card">
          <h2 className="card__title">Resumo</h2>
          <ul className="summary-list">
            {pedido.items.map((l, i) => {
              const d = detalhesLinha(l)
              return (
                <li key={i}>
                  <span className="summary-list__qty">{l.qty}×</span>
                  <span className="summary-list__name">
                    {l.name}
                    {d.length > 0 && <small>{d.join(' · ')}</small>}
                    {l.note && <small className="cart-line__note">“{l.note}”</small>}
                  </span>
                  <span>{moeda(l.qty * l.unitPrice)}</span>
                </li>
              )
            })}
          </ul>
          <div className="sum-row">
            <span>Subtotal</span>
            <span>{moeda(pedido.subtotal)}</span>
          </div>
          {pedido.type === 'entrega' && (
            <div className="sum-row">
              <span>Taxa de entrega</span>
              <span>{typeof pedido.deliveryFee === 'number' ? moeda(pedido.deliveryFee) : 'A combinar'}</span>
            </div>
          )}
          <div className="sum-row sum-row--total">
            <span>Total</span>
            <strong>{moeda(pedido.total)}</strong>
          </div>
        </section>

        <section className="card">
          <h2 className="card__title">Detalhes</h2>
          <dl className="details">
            <dt>Nome</dt>
            <dd>{pedido.customer.name}</dd>
            {pedido.address && (
              <>
                <dt>Endereço</dt>
                <dd>
                  {pedido.address.street}, {pedido.address.number}
                  {pedido.address.complement ? ` · ${pedido.address.complement}` : ''} · {pedido.address.district}{pedido.address.cityName ? ` · ${pedido.address.cityName}` : ''}
                  {pedido.address.reference && <small>Ref.: {pedido.address.reference}</small>}
                </dd>
              </>
            )}
            <dt>Pagamento</dt>
            <dd>
              {ROTULO_PAGAMENTO[pedido.payment]}
              {pedido.changeFor ? ` · troco para ${moeda(pedido.changeFor)}` : ''}
            </dd>
            {pedido.notes && (
              <>
                <dt>Observação</dt>
                <dd>{pedido.notes}</dd>
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
