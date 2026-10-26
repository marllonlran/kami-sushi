import { useEffect, useRef, useState } from 'react'
import { moeda, horaMinuto, tempoAtras } from '../lib/formatacao'
import { naNuvem, listarPedidos, assinar, atualizarStatus, FLUXO, STATUS, ROTULO_TIPO, ROTULO_PAGAMENTO } from '../lib/pedidos'
import { entrar, sair, useSessaoEquipe } from '../lib/autenticacao'
import { useConfigLoja, atualizarConfigLoja } from '../lib/loja'
import { detalhesLinha } from '../componentes/Carrinho'
import GerenciadorCardapio from '../componentes/GerenciadorCardapio'
import RelatorioVendas from '../componentes/RelatorioVendas'
import Icone, { Logo, LogoTexto, IconeWhatsApp } from '../componentes/Icone'


const COLUNAS = [
  { id: 'novo', title: 'Novos', statuses: ['novo'] },
  { id: 'preparo', title: 'Em preparo', statuses: ['preparo'] },
  { id: 'pronto', title: 'Prontos / a caminho', statuses: ['pronto', 'saiu'] },
]

const ROTULO_PROXIMO = {
  novo: 'Aceitar e preparar',
  preparo: { entrega: 'Saiu para entrega', retirada: 'Pronto p/ retirada', mesa: 'Pronto p/ servir' },
  pronto: 'Concluir',
  saiu: 'Entregue',
}

function proximoStatus(o) {
  const fluxo = FLUXO[o.type]
  return fluxo[fluxo.indexOf(o.status) + 1]
}

function ehHoje(iso) {
  return new Date(iso).toDateString() === new Date().toDateString()
}

// Bipe curto gerado pelo navegador (sem arquivo de áudio).
function bipe(ctx) {
  if (!ctx) return
  ;[0, 0.22].forEach((t) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = 880
    g.gain.setValueAtTime(0.0001, ctx.currentTime + t)
    g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.18)
    o.connect(g).connect(ctx.destination)
    o.start(ctx.currentTime + t)
    o.stop(ctx.currentTime + t + 0.2)
  })
}

function TelaLogin() {
  const [email, setEmail] = useState('')
  const [credencial, setCredencial] = useState('')
  const [erro, setErro] = useState(false)
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    setOcupado(true)
    const ok = await entrar(naNuvem ? { email, password: credencial } : { pin: credencial })
    setOcupado(false)
    if (!ok) {
      setErro(true)
      setCredencial('')
    }
  }

  return (
    <div className="page page--center">
      <form className="login-card" onSubmit={enviar}>
        <Logo size={64} tilt />
        <h1>Painel da cozinha</h1>
        {naNuvem ? (
          <>
            <p className="muted">Entre com o e-mail e a senha da equipe.</p>
            <label className="field login-card__field">
              <span className="field__label">E-mail</span>
              <input className="input" type="email" autoComplete="username" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="field login-card__field">
              <span className="field__label">Senha</span>
              <input
                className={`input ${erro ? 'is-error' : ''}`}
                type="password"
                autoComplete="current-password"
                required
                value={credencial}
                onChange={(e) => {
                  setCredencial(e.target.value)
                  setErro(false)
                }}
              />
            </label>
            {erro && <p className="field__error">E-mail ou senha incorretos</p>}
          </>
        ) : (
          <>
            <p className="muted">Modo de teste: digite o PIN da equipe.</p>
            <input
              className={`input input--pin ${erro ? 'is-error' : ''}`}
              type="password"
              inputMode="numeric"
              autoFocus
              maxLength={8}
              value={credencial}
              onChange={(e) => {
                setCredencial(e.target.value.replace(/D/g, ''))
                setErro(false)
              }}
              aria-label="PIN"
              placeholder="••••"
            />
            {erro && <p className="field__error">PIN incorreto</p>}
          </>
        )}
        <button className="btn btn--primary btn--block" type="submit" disabled={ocupado}>
          <Icone name="lock" size={18} /> {ocupado ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

// Mensagem pronta para o cliente, conforme a etapa do pedido.
function linkWhatsapp(pedido) {
  const digitos = pedido.customer.phone?.replace(/\D/g, '')
  if (!digitos) return null
  const primeiroNome = pedido.customer.name.split(' ')[0]
  const codigo = `#${pedido.code}`
  const linkAcompanhamento = `${window.location.origin}/pedido/${pedido.id}`
  let texto
  if (pedido.status === 'saiu') {
    texto = [
      `Olá, ${primeiroNome}! Seu pedido ${codigo} do Kami Sushi saiu para entrega 🛵`,
      `Total: ${moeda(pedido.total)} (${ROTULO_PAGAMENTO[pedido.payment]})`,
      pedido.deliveryFee == null ? 'Taxa de entrega: a combinar por aqui.' : null,
      pedido.changeFor ? `Levamos troco para ${moeda(pedido.changeFor)}.` : null,
      `Acompanhe: ${linkAcompanhamento}`,
    ]
  } else if (pedido.status === 'pronto') {
    texto = [`Olá, ${primeiroNome}! Seu pedido ${codigo} do Kami Sushi está pronto para retirada no balcão 🍣`, `Total: ${moeda(pedido.total)}`]
  } else if (pedido.status === 'preparo') {
    texto = [`Olá, ${primeiroNome}! Seu pedido ${codigo} do Kami Sushi já está em preparo 🍣`, `Acompanhe: ${linkAcompanhamento}`]
  } else if (pedido.status === 'concluido') {
    texto = [`Olá, ${primeiroNome}! Obrigado pelo pedido ${codigo} 🧡 Volte sempre ao Kami Sushi!`]
  } else {
    texto = [`Olá, ${primeiroNome}! Recebemos seu pedido ${codigo} no Kami Sushi 🍣`]
  }
  return `https://wa.me/55${digitos}?text=${encodeURIComponent(texto.filter(Boolean).join('\n'))}`
}

function CartaoPedido({ order, fresh, onAdvance, onCancel, onPrint }) {
  const proximo = proximoStatus(order)
  const nl = ROTULO_PROXIMO[order.status]
  const rotulo = typeof nl === 'object' ? nl[order.type] : nl
  const wa = linkWhatsapp(order)
  const notificar = wa && (order.status === 'pronto' || order.status === 'saiu')
  return (
    <article className={`ticket ticket--${order.type} ${fresh ? 'is-fresh' : ''}`}>
      <header className="ticket__head">
        <span className="ticket__code">#{order.code}</span>
        <span className={`type-tag type-tag--${order.type}`}>
          {ROTULO_TIPO[order.type]}
          {order.table ? ` ${order.table}` : ''}
        </span>
        <span className="ticket__time" title={horaMinuto(order.createdAt)}>
          {tempoAtras(order.createdAt)}
        </span>
      </header>
      <p className="ticket__customer">{order.customer.name}</p>
      <ul className="ticket__items">
        {order.items.map((l, i) => {
          const d = detalhesLinha(l)
          return (
            <li key={i}>
              <strong>{l.qty}×</strong>
              <span>
                {l.name}
                {d.length > 0 && <small>{d.join(' · ')}</small>}
                {l.note && <small className="ticket__note">⚠ {l.note}</small>}
              </span>
            </li>
          )
        })}
      </ul>
      {order.notes && <p className="ticket__obs">Obs.: {order.notes}</p>}
      {order.address && (
        <p className="ticket__addr">
          <Icone name="pin" size={14} /> {order.address.street}, {order.address.number}
          {order.address.complement ? ` · ${order.address.complement}` : ''} · {order.address.district}{order.address.cityName ? ` · ${order.address.cityName}` : ''}
          {order.address.reference ? ` (ref.: ${order.address.reference})` : ''}
        </p>
      )}
      {order.type === 'entrega' && (
        <p className={`ticket__fee ${order.deliveryFee == null ? 'is-pending' : ''}`}>
          Taxa de entrega: {order.deliveryFee == null ? 'a combinar pelo WhatsApp' : moeda(order.deliveryFee)}
        </p>
      )}
      <div className="ticket__pay">
        <span>
          {ROTULO_PAGAMENTO[order.payment]}
          {order.changeFor ? ` · troco p/ ${moeda(order.changeFor)}` : ''}
        </span>
        <strong>{moeda(order.total)}</strong>
      </div>
      {notificar && (
        <a className="btn btn--wa btn--sm btn--block" href={wa} target="_blank" rel="noreferrer">
          <IconeWhatsApp size={16} /> {order.status === 'saiu' ? 'Avisar: saiu para entrega' : 'Avisar: pronto para retirar'}
        </a>
      )}
      <footer className="ticket__actions">
        {proximo && (
          <button type="button" className="btn btn--primary btn--sm btn--grow" onClick={() => onAdvance(order, proximo)}>
            {rotulo}
          </button>
        )}
        {wa && !notificar && (
          <a className="icon-btn icon-btn--sm icon-btn--wa" href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp do cliente" title="Mensagem para o cliente">
            <IconeWhatsApp size={16} />
          </a>
        )}
        <button type="button" className="icon-btn icon-btn--sm" onClick={() => onPrint(order)} aria-label="Imprimir">
          <Icone name="print" size={16} />
        </button>
        {order.status === 'novo' && (
          <button type="button" className="icon-btn icon-btn--sm icon-btn--danger" onClick={() => onCancel(order)} aria-label="Cancelar pedido">
            <Icone name="close" size={16} />
          </button>
        )}
      </footer>
    </article>
  )
}

function ComandaImpressao({ order }) {
  if (!order) return null
  return (
    <div className="print-ticket">
      <h1>KAMI SUSHI</h1>
      <p>
        Pedido #{order.code} · {horaMinuto(order.createdAt)}
      </p>
      <p>
        <b>
          {ROTULO_TIPO[order.type].toUpperCase()}
          {order.table ? ` - MESA ${order.table}` : ''}
        </b>
      </p>
      <p>{order.customer.name} {order.customer.phone}</p>
      {order.address && (
        <p>
          {order.address.street}, {order.address.number} {order.address.complement} - {order.address.district}{order.address.cityName ? ` - ${order.address.cityName}` : ''}
          {order.address.reference ? ` (ref.: ${order.address.reference})` : ''}
        </p>
      )}
      <hr />
      {order.items.map((l, i) => (
        <div key={i} className="print-ticket__line">
          <p>
            <b>{l.qty}x</b> {l.name} <span>{moeda(l.qty * l.unitPrice)}</span>
          </p>
          {detalhesLinha(l).length > 0 && <p className="sub">{detalhesLinha(l).join(' / ')}</p>}
          {l.note && <p className="sub">OBS: {l.note}</p>}
        </div>
      ))}
      <hr />
      {order.notes && <p>OBS: {order.notes}</p>}
      <p>
        <b>TOTAL {moeda(order.total)}</b>
      </p>
      <p>
        {ROTULO_PAGAMENTO[order.payment]}
        {order.changeFor ? ` - troco p/ ${moeda(order.changeFor)}` : ''}
      </p>
    </div>
  )
}

export default function PaginaAdmin() {
  const { ready, authed } = useSessaoEquipe()
  const [pedidos, setPedidos] = useState([])
  const [visao, setVisao] = useState('board')
  const loja = useConfigLoja()
  const [pausando, setPausando] = useState(false)
  const [som, setSom] = useState(true)
  const [novos, setNovos] = useState(new Set())
  const [imprimindo, setImprimindo] = useState(null)
  const [, atualizarRelogio] = useState(0)
  const refAudio = useRef(null)
  const refConhecidos = useRef(null)
  const refSom = useRef(som)
  refSom.current = som
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    if (!authed) return
    try {
      refAudio.current = new (window.AudioContext || window.webkitAudioContext)()
    } catch {}
    const carregar = async () => {
      let lista
      try {
        lista = await listarPedidos()
        setOffline(false)
      } catch (e) {
        console.error(e)
        setOffline(true)
        return
      }
      const ids = new Set(lista.map((o) => o.id))
      if (refConhecidos.current) {
        const adicionado = lista.filter((o) => !refConhecidos.current.has(o.id)).map((o) => o.id)
        if (adicionado.length) {
          if (refSom.current) bipe(refAudio.current)
          setNovos((anterior) => new Set([...anterior, ...adicionado]))
          setTimeout(() => setNovos((anterior) => new Set([...anterior].filter((id) => !adicionado.includes(id)))), 8000)
        }
      }
      refConhecidos.current = ids
      setPedidos(lista)
    }
    carregar()
    const cancelarAssinatura = assinar(carregar)
    const temporizador = setInterval(() => atualizarRelogio((t) => t + 1), 30000)
    return () => {
      cancelarAssinatura()
      clearInterval(temporizador)
    }
  }, [authed])

  const qtdNovos = pedidos.filter((o) => o.status === 'novo').length
  useEffect(() => {
    document.title = qtdNovos ? `(${qtdNovos}) Novos pedidos · Kami` : 'Painel · Kami Sushi'
  }, [qtdNovos])

  useEffect(() => {
    if (!imprimindo) return
    const t = setTimeout(() => {
      window.print()
      setImprimindo(null)
    }, 50)
    return () => clearTimeout(t)
  }, [imprimindo])

  if (!ready) return <div className="page page--center" />
  if (!authed) return <TelaLogin />

  const executar = (p) => p.catch(() => alert('Não foi possível atualizar o pedido. Verifique a internet e tente de novo.'))
  const avancar = (o, status) => executar(atualizarStatus(o.id, status))
  const cancelar = (o) => {
    if (confirm(`Cancelar o pedido #${o.code} de ${o.customer.name}?`)) executar(atualizarStatus(o.id, 'cancelado'))
  }

  const hoje = pedidos.filter((o) => ehHoje(o.createdAt))
  const finalizados = hoje.filter((o) => o.status === 'concluido' || o.status === 'cancelado')
  const faturamento = hoje.filter((o) => o.status === 'concluido').reduce((s, o) => s + o.total, 0)

  return (
    <>
    <div className="page admin">
      <header className="topbar">
        <div className="topbar__inner container container--wide">
          <div className="brand">
            <Logo size={36} />
            <LogoTexto sub="Painel" />
          </div>
          <div className="seg" role="tablist">
            <button type="button" role="tab" aria-selected={visao === 'board'} className={visao === 'board' ? 'is-on' : ''} onClick={() => setVisao('board')}>
              Em andamento
            </button>
            <button type="button" role="tab" aria-selected={visao === 'done'} className={visao === 'done' ? 'is-on' : ''} onClick={() => setVisao('done')}>
              Finalizados <span className="seg__count">{finalizados.length}</span>
            </button>
            <button type="button" role="tab" aria-selected={visao === 'menu'} className={visao === 'menu' ? 'is-on' : ''} onClick={() => setVisao('menu')}>
              Cardápio {loja.soldOut.length > 0 && <span className="seg__count">{loja.soldOut.length}</span>}
            </button>
            <button type="button" role="tab" aria-selected={visao === 'report'} className={visao === 'report' ? 'is-on' : ''} onClick={() => setVisao('report')}>
              Relatório
            </button>
          </div>
          <div className="topbar__actions">
            <button
              type="button"
              className={`icon-btn ${som ? 'is-on' : ''}`}
              onClick={() => {
                refAudio.current?.resume()
                setSom((s) => !s)
              }}
              aria-label={som ? 'Desativar som' : 'Ativar som'}
              title={som ? 'Som ligado' : 'Som desligado'}
            >
              <Icone name={som ? 'bell' : 'bellOff'} />
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                sair()
              }}
              aria-label="Sair"
              title="Sair"
            >
              <Icone name="logout" />
            </button>
          </div>
        </div>
      </header>

      <main className="container container--wide admin__main">
        {offline && <div className="alert">Sem conexão com o servidor. Tentando de novo…</div>}
        {!naNuvem && <div className="alert alert--info">Modo de teste: os pedidos ficam só neste navegador. Conecte o Supabase para receber pedidos de qualquer aparelho.</div>}
        <div className={`store-bar ${loja.paused ? 'is-paused' : ''}`}>
          <span className="store-bar__dot" />
          <div className="store-bar__text">
            <strong>{loja.paused ? 'Pedidos pausados' : 'Recebendo pedidos'}</strong>
            <span>{loja.paused ? 'Clientes não conseguem enviar pedidos agora.' : 'Clientes podem pedir no horário de funcionamento.'}</span>
          </div>
          <button
            type="button"
            className={`btn btn--sm ${loja.paused ? 'btn--primary' : 'btn--ghost'}`}
            disabled={pausando || !loja.loaded}
            onClick={async () => {
              setPausando(true)
              try {
                await atualizarConfigLoja({ paused: !loja.paused })
              } catch (e) {
                console.error(e)
                alert('Não foi possível mudar. Verifique a internet e tente de novo.')
              }
              setPausando(false)
            }}
          >
            {pausando ? 'Salvando…' : loja.paused ? 'Voltar a receber' : 'Pausar pedidos'}
          </button>
        </div>
        <div className="stats">
          <div className="stat">
            <span className="stat__label">Novos</span>
            <span className="stat__value accent">{qtdNovos}</span>
          </div>
          <div className="stat">
            <span className="stat__label">Pedidos hoje</span>
            <span className="stat__value">{hoje.filter((o) => o.status !== 'cancelado').length}</span>
          </div>
          <div className="stat">
            <span className="stat__label">Faturado hoje</span>
            <span className="stat__value">{moeda(faturamento)}</span>
          </div>
        </div>

        {visao === 'report' ? (
          <RelatorioVendas />
        ) : visao === 'menu' ? (
          <GerenciadorCardapio soldOut={loja.soldOut} />
        ) : visao === 'board' ? (
          <div className="board">
            {COLUNAS.map((col) => {
              const lista = pedidos.filter((o) => col.statuses.includes(o.status)).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
              return (
                <section key={col.id} className={`column column--${col.id}`}>
                  <h2 className="column__title">
                    {col.title} <span className="column__count">{lista.length}</span>
                  </h2>
                  <div className="column__list">
                    {lista.length ? (
                      lista.map((o) => (
                        <CartaoPedido key={o.id} order={o} fresh={novos.has(o.id)} onAdvance={avancar} onCancel={cancelar} onPrint={setImprimindo} />
                      ))
                    ) : (
                      <p className="column__empty">Nenhum pedido aqui</p>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <div className="done-list">
            {finalizados.length ? (
              finalizados.map((o) => (
                <div key={o.id} className="done-row">
                  <span className="ticket__code">#{o.code}</span>
                  <span>{horaMinuto(o.createdAt)}</span>
                  <span className={`type-tag type-tag--${o.type}`}>{ROTULO_TIPO[o.type]}</span>
                  <span className="done-row__name">{o.customer.name}</span>
                  <span className={`status-tag status-tag--${STATUS[o.status].tone}`}>{STATUS[o.status].label}</span>
                  <strong>{moeda(o.total)}</strong>
                </div>
              ))
            ) : (
              <p className="column__empty">Nenhum pedido finalizado hoje.</p>
            )}
          </div>
        )}
      </main>
    </div>
    <ComandaImpressao order={imprimindo} />
    </>
  )
}
