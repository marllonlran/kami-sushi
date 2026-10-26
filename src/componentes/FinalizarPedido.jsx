import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LOJA } from '../configuracao'
import { useCarrinho } from '../contexto/ContextoCarrinho'
import { moeda, mascararTelefone } from '../lib/formatacao'
import { criarPedido } from '../lib/pedidos'
import Icone, { IconeWhatsApp } from './Icone'
import Gaveta from './Gaveta'
import CaixaPix from './CaixaPix'

const TIPOS = [
  { id: 'entrega', label: 'Entrega', hint: 'No seu endereço', icon: 'bike' },
  { id: 'retirada', label: 'Retirada', hint: 'Busque no balcão', icon: 'store' },
  { id: 'mesa', label: 'Na mesa', hint: 'Estou no restaurante', icon: 'table' },
]

const PAGAMENTOS = [
  { id: 'cartao', label: 'Cartão', hint: 'Crédito ou débito na maquininha', icon: 'card' },
  { id: 'pix', label: 'Pix', hint: 'Chave telefone', icon: 'pix' },
  { id: 'dinheiro', label: 'Dinheiro', hint: 'Informe se precisa de troco', icon: 'cash' },
]

const CHAVE_PERFIL = 'kami:profile'

// Mensagem para o cliente a partir do erro do servidor.
function mensagemErroEnvio(e) {
  const msg = e?.message || ''
  if (msg.includes('LOJA_PAUSADA')) return 'Os pedidos foram pausados agora há pouco. Tente de novo em alguns minutos.'
  const esgotados = msg.match(/ESGOTADO: (.+)/)
  if (esgotados) return `Acabou de esgotar: ${esgotados[1]}. Remova do carrinho para continuar.`
  return `Não conseguimos enviar o pedido. Verifique sua internet e tente de novo, ou chame a gente no WhatsApp ${LOJA.whatsappDisplay}.`
}
const ENDERECO_VAZIO = { city: LOJA.deliveryZones[0].id, cityName: '', street: '', number: '', district: '', complement: '', reference: '' }

function carregarPerfil() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_PERFIL)) || {}
  } catch {
    return {}
  }
}

export default function FinalizarPedido({ onClose, table }) {
  const { linhas, subtotal, limpar } = useCarrinho()
  const navegar = useNavigate()
  const perfil = carregarPerfil()

  const [tipo, setTipo] = useState(table ? 'mesa' : perfil.type || 'entrega')
  const [nome, setNome] = useState(perfil.name || '')
  const [telefone, setTelefone] = useState(perfil.phone || '')
  const [endereco, setEndereco] = useState({ ...ENDERECO_VAZIO, ...perfil.address })
  const [numeroMesa, setNumeroMesa] = useState(table || null)
  const [pagamento, setPagamento] = useState('cartao')
  const [trocoPara, setTrocoPara] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState(null)

  const zona = LOJA.deliveryZones.find((z) => z.id === endereco.city) || LOJA.deliveryZones[0]
  // null = taxa a combinar pelo WhatsApp
  const taxaEntrega = tipo === 'entrega' ? zona.fee : 0
  const total = subtotal + (taxaEntrega || 0)
  const setCampoEndereco = (k) => (e) => setEndereco((a) => ({ ...a, [k]: e.target.value }))

  function validar() {
    const e = {}
    if (!nome.trim()) e.name = 'Informe seu nome'
    if (tipo !== 'mesa' && telefone.replace(/\D/g, '').length < 10) e.phone = 'Informe um telefone com DDD'
    if (tipo === 'entrega') {
      if (zona.fee === null && !endereco.cityName.trim()) e.cityName = 'Informe a cidade'
      if (!endereco.street.trim()) e.street = 'Informe a rua'
      if (!endereco.number.trim()) e.number = 'Nº'
      if (!endereco.district.trim()) e.district = 'Informe o bairro'
    }
    if (tipo === 'mesa' && !numeroMesa) e.table = 'Escolha a mesa'
    const troco = Number(trocoPara.replace(',', '.'))
    if (pagamento === 'dinheiro' && trocoPara && (!troco || troco < total)) e.changeFor = `O troco deve ser para um valor acima de ${moeda(total)}`
    setErros(e)
    return Object.keys(e).length === 0
  }

  async function enviar(ev) {
    ev.preventDefault()
    if (!validar()) {
      document.querySelector('.field--error')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setEnviando(true)
    setErroEnvio(null)
    try {
      localStorage.setItem(CHAVE_PERFIL, JSON.stringify({ name: nome, phone: telefone, address: endereco, type: tipo === 'mesa' ? perfil.type : tipo }))
    } catch {}
    let pedido
    try {
      pedido = await criarPedido({
        type: tipo,
        customer: { name: nome.trim(), phone: telefone },
        address: tipo === 'entrega' ? { ...endereco, cityName: zona.fee === null ? endereco.cityName.trim() : zona.name } : null,
        table: tipo === 'mesa' ? numeroMesa : null,
        payment: pagamento,
        changeFor: pagamento === 'dinheiro' && trocoPara ? Number(trocoPara.replace(',', '.')) : null,
        notes: observacoes.trim(),
        items: linhas.map(({ key, ...l }) => l),
        subtotal,
        deliveryFee: taxaEntrega,
        total,
      })
    } catch (e) {
      console.error(e)
      setEnviando(false)
      setErroEnvio(mensagemErroEnvio(e))
      return
    }
    try {
      const meusPedidos = JSON.parse(localStorage.getItem('kami:myOrders')) || []
      localStorage.setItem('kami:myOrders', JSON.stringify([{ id: pedido.id, code: pedido.code }, ...meusPedidos].slice(0, 10)))
    } catch {}
    limpar()
    onClose()
    navegar(`/pedido/${pedido.id}`)
  }

  const err = (k) => erros[k] && <span className="field__error">{erros[k]}</span>

  return (
    <Gaveta onClose={onClose} label="Finalizar pedido" wide>
      <form className="checkout" onSubmit={enviar} noValidate>
        <h2 className="checkout__title">Finalizar pedido</h2>

        <section className="checkout__section">
          <h3 className="step-title">
            <span className="step-num">1</span> Como você quer receber?
          </h3>
          <div className="option-cards option-cards--3">
            {TIPOS.map((t) => (
              <label key={t.id} className={`option-card ${tipo === t.id ? 'is-on' : ''}`}>
                <input type="radio" name="type" checked={tipo === t.id} onChange={() => setTipo(t.id)} />
                <Icone name={t.icon} size={24} />
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
            <label className={`field ${erros.name ? 'field--error' : ''}`}>
              <span className="field__label">Nome</span>
              <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" placeholder="Como podemos te chamar?" />
              {err('name')}
            </label>
            {tipo !== 'mesa' && (
              <label className={`field ${erros.phone ? 'field--error' : ''}`}>
                <span className="field__label">WhatsApp</span>
                <input
                  className="input"
                  value={telefone}
                  onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(83) 90000-0000"
                />
                {err('phone')}
              </label>
            )}
          </div>
        </section>

        {tipo === 'entrega' && (
          <section className="checkout__section">
            <h3 className="step-title">
              <span className="step-num">3</span> Endereço de entrega
            </h3>
            <div className="field">
              <span className="field__label">Cidade</span>
              <div className="option-cards option-cards--3">
                {LOJA.deliveryZones.map((z) => (
                  <label key={z.id} className={`option-card option-card--compact ${endereco.city === z.id ? 'is-on' : ''}`}>
                    <input type="radio" name="city" checked={endereco.city === z.id} onChange={() => setEndereco((a) => ({ ...a, city: z.id }))} />
                    <span className="option-card__label">{z.name}</span>
                    <span className="option-card__fee">{z.fee === null ? 'A combinar' : `Taxa ${moeda(z.fee)}`}</span>
                  </label>
                ))}
              </div>
            </div>
            {zona.fee === null && (
              <>
                <label className={`field ${erros.cityName ? 'field--error' : ''}`}>
                  <span className="field__label">Qual cidade?</span>
                  <input className="input" value={endereco.cityName} onChange={setCampoEndereco('cityName')} placeholder="Nome da cidade" />
                  {err('cityName')}
                </label>
                <div className="info-note">
                  <IconeWhatsApp size={18} />
                  A taxa de entrega para outras cidades é combinada pelo WhatsApp depois do pedido.
                </div>
              </>
            )}
            <div className="form-grid form-grid--address">
              <label className={`field field--street ${erros.street ? 'field--error' : ''}`}>
                <span className="field__label">Rua</span>
                <input className="input" value={endereco.street} onChange={setCampoEndereco('street')} autoComplete="address-line1" placeholder="Rua / Avenida" />
                {err('street')}
              </label>
              <label className={`field field--number ${erros.number ? 'field--error' : ''}`}>
                <span className="field__label">Número</span>
                <input className="input" value={endereco.number} onChange={setCampoEndereco('number')} inputMode="numeric" placeholder="Nº" />
                {err('number')}
              </label>
              <label className={`field ${erros.district ? 'field--error' : ''}`}>
                <span className="field__label">Bairro</span>
                <input className="input" value={endereco.district} onChange={setCampoEndereco('district')} placeholder="Bairro" />
                {err('district')}
              </label>
              <label className="field">
                <span className="field__label">
                  Complemento <span className="muted">(opcional)</span>
                </span>
                <input className="input" value={endereco.complement} onChange={setCampoEndereco('complement')} placeholder="Apto, bloco, casa…" />
              </label>
              <label className="field field--full">
                <span className="field__label">
                  Ponto de referência <span className="muted">(opcional)</span>
                </span>
                <input className="input" value={endereco.reference} onChange={setCampoEndereco('reference')} placeholder="Ex.: próximo à praça" />
              </label>
            </div>
          </section>
        )}

        {tipo === 'mesa' && (
          <section className={`checkout__section ${erros.table ? 'field--error' : ''}`}>
            <h3 className="step-title">
              <span className="step-num">3</span> Qual é a sua mesa?
            </h3>
            <div className="table-grid">
              {Array.from({ length: LOJA.tables }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" className={`table-btn ${numeroMesa === n ? 'is-on' : ''}`} onClick={() => setNumeroMesa(n)}>
                  {n}
                </button>
              ))}
            </div>
            {err('table')}
          </section>
        )}

        {tipo === 'retirada' && (
          <section className="checkout__section">
            <div className="info-note">
              <Icone name="store" size={18} />
              Avisaremos pelo WhatsApp quando o pedido estiver pronto para retirar no balcão.
            </div>
          </section>
        )}

        <section className="checkout__section">
          <h3 className="step-title">
            <span className="step-num">{tipo === 'retirada' ? 3 : 4}</span> Pagamento
          </h3>
          <p className="muted small">
            {tipo === 'entrega' ? 'Você paga na entrega.' : tipo === 'mesa' ? 'Você paga no restaurante.' : 'Você paga na retirada.'}
          </p>
          <div className="option-cards option-cards--3">
            {PAGAMENTOS.map((p) => (
              <label key={p.id} className={`option-card ${pagamento === p.id ? 'is-on' : ''}`}>
                <input type="radio" name="payment" checked={pagamento === p.id} onChange={() => setPagamento(p.id)} />
                <Icone name={p.icon} size={24} />
                <span className="option-card__label">{p.label}</span>
                <span className="option-card__hint">{p.hint}</span>
              </label>
            ))}
          </div>
          {pagamento === 'pix' && <CaixaPix amount={total} />}
          {pagamento === 'dinheiro' && (
            <label className={`field field--narrow ${erros.changeFor ? 'field--error' : ''}`}>
              <span className="field__label">
                Troco para quanto? <span className="muted">(deixe vazio se não precisar)</span>
              </span>
              <div className="input-prefix">
                <span>R$</span>
                <input className="input" value={trocoPara} onChange={(e) => setTrocoPara(e.target.value.replace(/[^\d,]/g, ''))} inputMode="decimal" placeholder="100,00" />
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
            <textarea className="input" rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} maxLength={200} placeholder="Ex.: mandar hashi extra, molho shoyu…" />
          </label>
        </section>

        <div className="checkout__summary">
          <div className="sum-row">
            <span>Subtotal</span>
            <span>{moeda(subtotal)}</span>
          </div>
          {tipo === 'entrega' && (
            <div className="sum-row">
              <span>Taxa de entrega</span>
              <span>{taxaEntrega === null ? 'A combinar' : moeda(taxaEntrega)}</span>
            </div>
          )}
          <div className="sum-row sum-row--total">
            <span>Total</span>
            <strong>{moeda(total)}</strong>
          </div>
          {erroEnvio && (
            <p className="field__error" role="alert">
              {erroEnvio}
            </p>
          )}
          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={enviando}>
            {enviando ? 'Enviando…' : `Enviar pedido · ${moeda(total)}`}
          </button>
        </div>
      </form>
    </Gaveta>
  )
}
