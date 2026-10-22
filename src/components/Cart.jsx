import { useCart } from '../context/CartContext'
import { money } from '../lib/format'
import { isOpen, hoursLabel } from '../lib/hours'
import { STORE } from '../config'
import Icon from './Icon'

export function lineDetails(l) {
  return [
    l.variant?.label,
    ...Object.values(l.options || {}),
    ...(l.extras || []).map((e) => `+ ${e.label}`),
  ].filter(Boolean)
}

export default function Cart({ onCheckout, paused = false, soldOut = [] }) {
  const { lines, setQty, subtotal, count } = useCart()
  const open = isOpen()
  const soldOutLines = lines.filter((l) => soldOut.includes(l.itemId))

  if (!lines.length) {
    return (
      <div className="cart cart--empty">
        <div className="cart__empty-icon">
          <Icon name="bag" size={32} stroke={1.6} />
        </div>
        <p className="cart__empty-title">Seu carrinho está vazio</p>
        <p className="muted">Escolha seus pratos no cardápio e eles aparecem aqui.</p>
      </div>
    )
  }

  return (
    <div className="cart">
      <h2 className="cart__title">
        Seu pedido <span className="muted">· {count} {count === 1 ? 'item' : 'itens'}</span>
      </h2>
      <ul className="cart__list">
        {lines.map((l) => {
          const details = lineDetails(l)
          return (
            <li key={l.key} className={`cart-line ${soldOut.includes(l.itemId) ? 'is-soldout' : ''}`}>
              <div className="cart-line__info">
                <p className="cart-line__name">{l.name}</p>
                {details.length > 0 && <p className="cart-line__details">{details.join(' · ')}</p>}
                {l.note && <p className="cart-line__note">“{l.note}”</p>}
                {soldOut.includes(l.itemId) ? (
                  <p className="cart-line__soldout">Esgotado · remova do carrinho</p>
                ) : (
                  <p className="cart-line__price">{money(l.unitPrice * l.qty)}</p>
                )}
              </div>
              <div className="stepper stepper--sm">
                <button type="button" onClick={() => setQty(l.key, l.qty - 1)} aria-label={`Remover um ${l.name}`}>
                  <Icon name={l.qty === 1 ? 'close' : 'minus'} size={16} />
                </button>
                <span>{l.qty}</span>
                <button type="button" onClick={() => setQty(l.key, l.qty + 1)} aria-label={`Adicionar um ${l.name}`}>
                  <Icon name="plus" size={16} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="cart__footer">
        <div className="sum-row sum-row--total">
          <span>Subtotal</span>
          <strong>{money(subtotal)}</strong>
        </div>
        {!open ? (
          <div className="closed-note">
            <Icon name="clock" size={18} />
            Estamos fechados agora. Pedidos das {hoursLabel}.
          </div>
        ) : paused ? (
          <div className="closed-note closed-note--paused">
            <Icon name="clock" size={18} />
            <span>
              Pedidos pausados por alguns minutos. Já já voltamos! Dúvidas: WhatsApp {STORE.whatsappDisplay}.
            </span>
          </div>
        ) : soldOutLines.length ? (
          <div className="closed-note closed-note--paused">
            <Icon name="close" size={18} />
            <span>Remova os itens esgotados para finalizar o pedido.</span>
          </div>
        ) : (
          <button type="button" className="btn btn--primary btn--block" onClick={onCheckout}>
            Finalizar pedido
          </button>
        )}
      </div>
    </div>
  )
}
