import { useCarrinho } from '../contexto/ContextoCarrinho'
import { TODOS_ITENS, SUGESTOES } from '../dados/cardapio'
import { moeda } from '../lib/formatacao'
import { estaAberto, rotuloHorario } from '../lib/horario'
import { LOJA } from '../configuracao'
import Icone from './Icone'

export function detalhesLinha(l) {
  return [
    l.variant?.label,
    ...Object.values(l.options || {}),
    ...(l.extras || []).map((e) => `+ ${e.label}`),
  ].filter(Boolean)
}

const ITEM_POR_ID = Object.fromEntries(TODOS_ITENS.map((i) => [i.id, i]))

// Até 3 sugestões: uma de cada grupo que ainda não está no carrinho.
function escolherSugestoes(linhas, esgotados) {
  const noCarrinho = new Set(linhas.map((l) => ITEM_POR_ID[l.itemId]?.categoryId))
  const saida = []
  for (const g of SUGESTOES) {
    if (noCarrinho.has(g.group)) continue
    const id = g.items.find((i) => ITEM_POR_ID[i] && !esgotados.includes(i))
    if (id) saida.push(ITEM_POR_ID[id])
  }
  return saida.slice(0, 3)
}

export default function Carrinho({ onCheckout, paused = false, soldOut = [] }) {
  const { linhas, setQtd, subtotal, contagem, adicionar } = useCarrinho()
  const aberto = estaAberto()
  const linhasEsgotadas = linhas.filter((l) => soldOut.includes(l.itemId))
  const sugestoes = escolherSugestoes(linhas, soldOut)
  const adicionarSugestao = (item) =>
    adicionar({ itemId: item.id, name: item.name, variant: null, options: {}, extras: [], note: '', qty: 1, unitPrice: item.price })

  if (!linhas.length) {
    return (
      <div className="cart cart--empty">
        <div className="cart__empty-icon">
          <Icone name="bag" size={32} stroke={1.6} />
        </div>
        <p className="cart__empty-title">Seu carrinho está vazio</p>
        <p className="muted">Escolha seus pratos no cardápio e eles aparecem aqui.</p>
      </div>
    )
  }

  return (
    <div className="cart">
      <h2 className="cart__title">
        Seu pedido <span className="muted">· {contagem} {contagem === 1 ? 'item' : 'itens'}</span>
      </h2>
      <ul className="cart__list">
        {linhas.map((l) => {
          const detalhes = detalhesLinha(l)
          return (
            <li key={l.key} className={`cart-line ${soldOut.includes(l.itemId) ? 'is-soldout' : ''}`}>
              <div className="cart-line__info">
                <p className="cart-line__name">{l.name}</p>
                {detalhes.length > 0 && <p className="cart-line__details">{detalhes.join(' · ')}</p>}
                {l.note && <p className="cart-line__note">“{l.note}”</p>}
                {soldOut.includes(l.itemId) ? (
                  <p className="cart-line__soldout">Esgotado · remova do carrinho</p>
                ) : (
                  <p className="cart-line__price">{moeda(l.unitPrice * l.qty)}</p>
                )}
              </div>
              <div className="stepper stepper--sm">
                <button type="button" onClick={() => setQtd(l.key, l.qty - 1)} aria-label={`Remover um ${l.name}`}>
                  <Icone name={l.qty === 1 ? 'close' : 'minus'} size={16} />
                </button>
                <span>{l.qty}</span>
                <button type="button" onClick={() => setQtd(l.key, l.qty + 1)} aria-label={`Adicionar um ${l.name}`}>
                  <Icone name="plus" size={16} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      {sugestoes.length > 0 && (
        <div className="upsell">
          <p className="upsell__title">Que tal adicionar?</p>
          <div className="upsell__list">
            {sugestoes.map((item) => (
              <button key={item.id} type="button" className="upsell__item" onClick={() => adicionarSugestao(item)} aria-label={`Adicionar ${item.name}`}>
                <span className="upsell__name">{item.name}</span>
                <span className="upsell__price">+ {moeda(item.price)}</span>
                <span className="upsell__add" aria-hidden="true">
                  <Icone name="plus" size={14} stroke={2.6} />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="cart__footer">
        <div className="sum-row sum-row--total">
          <span>Subtotal</span>
          <strong>{moeda(subtotal)}</strong>
        </div>
        {!aberto ? (
          <div className="closed-note">
            <Icone name="clock" size={18} />
            Estamos fechados agora. Pedidos das {rotuloHorario}.
          </div>
        ) : paused ? (
          <div className="closed-note closed-note--paused">
            <Icone name="clock" size={18} />
            <span>
              Pedidos pausados por alguns minutos. Já já voltamos! Dúvidas: WhatsApp {LOJA.whatsappDisplay}.
            </span>
          </div>
        ) : linhasEsgotadas.length ? (
          <div className="closed-note closed-note--paused">
            <Icone name="close" size={18} />
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
