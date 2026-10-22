import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { STORE } from '../config'
import { useCart } from '../context/CartContext'
import { money, maskPhone } from '../lib/format'
import { createOrder } from '../lib/orders'
import Icon, { WhatsAppIcon } from './Icon'
import Sheet from './Sheet'
import PixBox from './PixBox'

const TYPES = [
  { id: 'entrega', label: 'Entrega', hint: 'No seu endereço', icon: 'bike' },
  { id: 'retirada', label: 'Retirada', hint: 'Busque no balcão', icon: 'store' },
  { id: 'mesa', label: 'Na mesa', hint: 'Estou no restaurante', icon: 'table' },
]

const PAYMENTS = [
  { id: 'cartao', label: 'Cartão', hint: 'Crédito ou débito na maquininha', icon: 'card' },
  { id: 'pix', label: 'Pix', hint: 'Chave telefone', icon: 'pix' },
  { id: 'dinheiro', label: 'Dinheiro', hint: 'Informe se precisa de troco', icon: 'cash' },
]

const PROFILE_KEY = 'kami:profile'

// Mensagem para o cliente a partir do erro do servidor.
function sendErrorMessage(e) {
  const msg = e?.message || ''
  if (msg.includes('LOJA_PAUSADA')) return 'Os pedidos foram pausados agora há pouco. Tente de novo em alguns minutos.'
  const soldOut = msg.match(/ESGOTADO: (.+)/)
  if (soldOut) return `Acabou de esgotar: ${soldOut[1]}. Remova do carrinho para continuar.`
  return `Não conseguimos enviar o pedido. Verifique sua internet e tente de novo, ou chame a gente no WhatsApp ${STORE.whatsappDisplay}.`
}
const EMPTY_ADDRESS = { city: STORE.deliveryZones[0].id, cityName: '', street: '', number: '', district: '', complement: '', reference: '' }

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}
  } catch {
    return {}
  }
}

export default function Checkout({ onClose, table }) {
  const { lines, subtotal, clear } = useCart()
  const navigate = useNavigate()
  const profile = loadProfile()

  const [type, setType] = useState(table ? 'mesa' : profile.type || 'entrega')
  const [name, setName] = useState(profile.name || '')
  const [phone, setPhone] = useState(profile.phone || '')
  const [address, setAddress] = useState({ ...EMPTY_ADDRESS, ...profile.address })
  const [tableNo, setTableNo] = useState(table || null)
  const [payment, setPayment] = useState('cartao')
  const [changeFor, setChangeFor] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)

  const zone = STORE.deliveryZones.find((z) => z.id === address.city) || STORE.deliveryZones[0]
  // null = taxa a combinar pelo WhatsApp
  const deliveryFee = type === 'entrega' ? zone.fee : 0
  const total = subtotal + (deliveryFee || 0)
  const setAddr = (k) => (e) => setAddress((a) => ({ ...a, [k]: e.target.value }))

  function validate() {
    const e = {}
    if (!name.trim()) e.name = 'Informe seu nome'
    if (type !== 'mesa' && phone.replace(/\D/g, '').length < 10) e.phone = 'Informe um telefone com DDD'
    if (type === 'entrega') {
      if (zone.fee === null && !address.cityName.trim()) e.cityName = 'Informe a cidade'
      if (!address.street.trim()) e.street = 'Informe a rua'
      if (!address.number.trim()) e.number = 'Nº'
      if (!address.district.trim()) e.district = 'Informe o bairro'
    }
    if (type === 'mesa' && !tableNo) e.table = 'Escolha a mesa'
    const change = Number(changeFor.replace(',', '.'))
    if (payment === 'dinheiro' && changeFor && (!change || change < total)) e.changeFor = `O troco deve ser para um valor acima de ${money(total)}`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit(ev) {
    ev.preventDefault()
    if (!validate()) {
      document.querySelector('.field--error')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSending(true)
    setSendError(null)
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify({ name, phone, address, type: type === 'mesa' ? profile.type : type }))
    } catch {}
    let order
    try {
      order = await createOrder({
        type,
        customer: { name: name.trim(), phone },
        address: type === 'entrega' ? { ...address, cityName: zone.fee === null ? address.cityName.trim() : zone.name } : null,
        table: type === 'mesa' ? tableNo : null,
        payment,
        changeFor: payment === 'dinheiro' && changeFor ? Number(changeFor.replace(',', '.')) : null,
        notes: notes.trim(),
        items: lines.map(({ key, ...l }) => l),
        subtotal,
        deliveryFee,
        total,
      })
    } catch (e) {
      console.error(e)
      setSending(false)
      setSendError(sendErrorMessage(e))
      return
    }
    try {
      const mine = JSON.parse(localStorage.getItem('kami:myOrders')) || []
      localStorage.setItem('kami:myOrders', JSON.stringify([{ id: order.id, code: order.code }, ...mine].slice(0, 10)))
    } catch {}
    clear()
    onClose()
    navigate(`/pedido/${order.id}`)
  }

  const err = (k) => errors[k] && <span className="field__error">{errors[k]}</span>

  return (
    <Sheet onClose={onClose} label="Finalizar pedido" wide>
      <form className="checkout" onSubmit={submit} noValidate>
        <h2 className="checkout__title">Finalizar pedido</h2>

        <section className="checkout__section">
          <h3 className="step-title">
            <span className="step-num">1</span> Como você quer receber?
          </h3>
          <div className="option-cards option-cards--3">
            {TYPES.map((t) => (
              <label key={t.id} className={`option-card ${type === t.id ? 'is-on' : ''}`}>
                <input type="radio" name="type" checked={type === t.id} onChange={() => setType(t.id)} />
                <Icon name={t.icon} size={24} />
                <span className="option-card__label">{t.label}</span>
                <span className="option-card__hint">{t.hint}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="checkout__section">
          <h3 className="step-title">
            <span className="step-num">2</span> Seus dados
          </h3>
          <div className="form-grid">
            <label className={`field ${errors.name ? 'field--error' : ''}`}>
              <span className="field__label">Nome</span>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Como podemos te chamar?" />
              {err('name')}
            </label>
            {type !== 'mesa' && (
              <label className={`field ${errors.phone ? 'field--error' : ''}`}>
                <span className="field__label">WhatsApp</span>
                <input
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(83) 90000-0000"
                />
                {err('phone')}
              </label>
            )}
          </div>
        </section>

        {type === 'entrega' && (
          <section className="checkout__section">
            <h3 className="step-title">
              <span className="step-num">3</span> Endereço de entrega
            </h3>
            <div className="field">
              <span className="field__label">Cidade</span>
              <div className="option-cards option-cards--3">
                {STORE.deliveryZones.map((z) => (
                  <label key={z.id} className={`option-card option-card--compact ${address.city === z.id ? 'is-on' : ''}`}>
                    <input type="radio" name="city" checked={address.city === z.id} onChange={() => setAddress((a) => ({ ...a, city: z.id }))} />
                    <span className="option-card__label">{z.name}</span>
                    <span className="option-card__fee">{z.fee === null ? 'A combinar' : `Taxa ${money(z.fee)}`}</span>
                  </label>
                ))}
              </div>
            </div>
            {zone.fee === null && (
              <>
                <label className={`field ${errors.cityName ? 'field--error' : ''}`}>
                  <span className="field__label">Qual cidade?</span>
                  <input className="input" value={address.cityName} onChange={setAddr('cityName')} placeholder="Nome da cidade" />
                  {err('cityName')}
                </label>
                <div className="info-note">
                  <WhatsAppIcon size={18} />
                  A taxa de entrega para outras cidades é combinada pelo WhatsApp depois do pedido.
                </div>
              </>
            )}
            <div className="form-grid form-grid--address">
              <label className={`field field--street ${errors.street ? 'field--error' : ''}`}>
                <span className="field__label">Rua</span>
                <input className="input" value={address.street} onChange={setAddr('street')} autoComplete="address-line1" placeholder="Rua / Avenida" />
                {err('street')}
              </label>
              <label className={`field field--number ${errors.number ? 'field--error' : ''}`}>
                <span className="field__label">Número</span>
                <input className="input" value={address.number} onChange={setAddr('number')} inputMode="numeric" placeholder="Nº" />
                {err('number')}
              </label>
              <label className={`field ${errors.district ? 'field--error' : ''}`}>
                <span className="field__label">Bairro</span>
                <input className="input" value={address.district} onChange={setAddr('district')} placeholder="Bairro" />
                {err('district')}
              </label>
              <label className="field">
                <span className="field__label">
                  Complemento <span className="muted">(opcional)</span>
                </span>
                <input className="input" value={address.complement} onChange={setAddr('complement')} placeholder="Apto, bloco, casa…" />
              </label>
              <label className="field field--full">
                <span className="field__label">
                  Ponto de referência <span className="muted">(opcional)</span>
                </span>
                <input className="input" value={address.reference} onChange={setAddr('reference')} placeholder="Ex.: próximo à praça" />
              </label>
            </div>
          </section>
        )}

        {type === 'mesa' && (
          <section className={`checkout__section ${errors.table ? 'field--error' : ''}`}>
            <h3 className="step-title">
              <span className="step-num">3</span> Qual é a sua mesa?
            </h3>
            <div className="table-grid">
              {Array.from({ length: STORE.tables }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" className={`table-btn ${tableNo === n ? 'is-on' : ''}`} onClick={() => setTableNo(n)}>
                  {n}
                </button>
              ))}
            </div>
            {err('table')}
          </section>
        )}

        {type === 'retirada' && (
          <section className="checkout__section">
            <div className="info-note">
              <Icon name="store" size={18} />
              Avisaremos pelo WhatsApp quando o pedido estiver pronto para retirar no balcão.
            </div>
          </section>
        )}

        <section className="checkout__section">
          <h3 className="step-title">
            <span className="step-num">{type === 'retirada' ? 3 : 4}</span> Pagamento
          </h3>
          <p className="muted small">
            {type === 'entrega' ? 'Você paga na entrega.' : type === 'mesa' ? 'Você paga no restaurante.' : 'Você paga na retirada.'}
          </p>
          <div className="option-cards option-cards--3">
            {PAYMENTS.map((p) => (
              <label key={p.id} className={`option-card ${payment === p.id ? 'is-on' : ''}`}>
                <input type="radio" name="payment" checked={payment === p.id} onChange={() => setPayment(p.id)} />
                <Icon name={p.icon} size={24} />
                <span className="option-card__label">{p.label}</span>
                <span className="option-card__hint">{p.hint}</span>
              </label>
            ))}
          </div>
          {payment === 'pix' && <PixBox amount={total} />}
          {payment === 'dinheiro' && (
            <label className={`field field--narrow ${errors.changeFor ? 'field--error' : ''}`}>
              <span className="field__label">
                Troco para quanto? <span className="muted">(deixe vazio se não precisar)</span>
              </span>
              <div className="input-prefix">
                <span>R$</span>
                <input className="input" value={changeFor} onChange={(e) => setChangeFor(e.target.value.replace(/[^\d,]/g, ''))} inputMode="decimal" placeholder="100,00" />
              </div>
              {err('changeFor')}
            </label>
          )}
        </section>

        <section className="checkout__section">
          <label className="field">
            <span className="field__label">
              Alguma observação para o pedido? <span className="muted">(opcional)</span>
            </span>
            <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} placeholder="Ex.: mandar hashi extra, molho shoyu…" />
          </label>
        </section>

        <div className="checkout__summary">
          <div className="sum-row">
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          {type === 'entrega' && (
            <div className="sum-row">
              <span>Taxa de entrega</span>
              <span>{deliveryFee === null ? 'A combinar' : money(deliveryFee)}</span>
            </div>
          )}
          <div className="sum-row sum-row--total">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
          {sendError && (
            <p className="field__error" role="alert">
              {sendError}
            </p>
          )}
          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={sending}>
            {sending ? 'Enviando…' : `Enviar pedido · ${money(total)}`}
          </button>
        </div>
      </form>
    </Sheet>
  )
}
