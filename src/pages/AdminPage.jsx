import { useEffect, useRef, useState } from 'react'
import { money, clock, timeAgo } from '../lib/format'
import { isCloud, listOrders, subscribe, updateStatus, FLOW, STATUS, TYPE_LABEL, PAYMENT_LABEL } from '../lib/orders'
import { signIn, signOut, useStaffSession } from '../lib/auth'
import { lineDetails } from '../components/Cart'
import Icon, { Logo, WhatsAppIcon } from '../components/Icon'


const COLUMNS = [
  { id: 'novo', title: 'Novos', statuses: ['novo'] },
  { id: 'preparo', title: 'Em preparo', statuses: ['preparo'] },
  { id: 'pronto', title: 'Prontos / a caminho', statuses: ['pronto', 'saiu'] },
]

const NEXT_LABEL = {
  novo: 'Aceitar e preparar',
  preparo: { entrega: 'Saiu para entrega', retirada: 'Pronto p/ retirada', mesa: 'Pronto p/ servir' },
  pronto: 'Concluir',
  saiu: 'Entregue',
}

function nextStatus(o) {
  const flow = FLOW[o.type]
  return flow[flow.indexOf(o.status) + 1]
}

function isToday(iso) {
  return new Date(iso).toDateString() === new Date().toDateString()
}

// Bipe curto gerado pelo navegador (sem arquivo de áudio).
function beep(ctx) {
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

function Login() {
  const [email, setEmail] = useState('')
  const [secret, setSecret] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const ok = await signIn(isCloud ? { email, password: secret } : { pin: secret })
    setBusy(false)
    if (!ok) {
      setError(true)
      setSecret('')
    }
  }

  return (
    <div className="page page--center">
      <form className="login-card" onSubmit={submit}>
        <Logo size={56} />
        <h1>Painel da cozinha</h1>
        {isCloud ? (
          <>
            <p className="muted">Entre com o e-mail e a senha da equipe.</p>
            <label className="field login-card__field">
              <span className="field__label">E-mail</span>
              <input className="input" type="email" autoComplete="username" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="field login-card__field">
              <span className="field__label">Senha</span>
              <input
                className={`input ${error ? 'is-error' : ''}`}
                type="password"
                autoComplete="current-password"
                required
                value={secret}
                onChange={(e) => {
                  setSecret(e.target.value)
                  setError(false)
                }}
              />
            </label>
            {error && <p className="field__error">E-mail ou senha incorretos</p>}
          </>
        ) : (
          <>
            <p className="muted">Modo de teste: digite o PIN da equipe.</p>
            <input
              className={`input input--pin ${error ? 'is-error' : ''}`}
              type="password"
              inputMode="numeric"
              autoFocus
              maxLength={8}
              value={secret}
              onChange={(e) => {
                setSecret(e.target.value.replace(/D/g, ''))
                setError(false)
              }}
              aria-label="PIN"
              placeholder="••••"
            />
            {error && <p className="field__error">PIN incorreto</p>}
          </>
        )}
        <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
          <Icon name="lock" size={18} /> {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

function OrderCard({ order, fresh, onAdvance, onCancel, onPrint }) {
  const next = nextStatus(order)
  const nl = NEXT_LABEL[order.status]
  const label = typeof nl === 'object' ? nl[order.type] : nl
  const phone = order.customer.phone?.replace(/\D/g, '')
  return (
    <article className={`ticket ticket--${order.type} ${fresh ? 'is-fresh' : ''}`}>
      <header className="ticket__head">
        <span className="ticket__code">#{order.code}</span>
        <span className={`type-tag type-tag--${order.type}`}>
          {TYPE_LABEL[order.type]}
          {order.table ? ` ${order.table}` : ''}
        </span>
        <span className="ticket__time" title={clock(order.createdAt)}>
          {timeAgo(order.createdAt)}
        </span>
      </header>
      <p className="ticket__customer">{order.customer.name}</p>
      <ul className="ticket__items">
        {order.items.map((l, i) => {
          const d = lineDetails(l)
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
          <Icon name="pin" size={14} /> {order.address.street}, {order.address.number}
          {order.address.complement ? ` · ${order.address.complement}` : ''} · {order.address.district}{order.address.cityName ? ` · ${order.address.cityName}` : ''}
          {order.address.reference ? ` (ref.: ${order.address.reference})` : ''}
        </p>
      )}
      {order.type === 'entrega' && (
        <p className={`ticket__fee ${order.deliveryFee == null ? 'is-pending' : ''}`}>
          Taxa de entrega: {order.deliveryFee == null ? 'a combinar pelo WhatsApp' : money(order.deliveryFee)}
        </p>
      )}
      <div className="ticket__pay">
        <span>
          {PAYMENT_LABEL[order.payment]}
          {order.changeFor ? ` · troco p/ ${money(order.changeFor)}` : ''}
        </span>
        <strong>{money(order.total)}</strong>
      </div>
      <footer className="ticket__actions">
        {next && (
          <button type="button" className="btn btn--primary btn--sm btn--grow" onClick={() => onAdvance(order, next)}>
            {label}
          </button>
        )}
        {phone && (
          <a className="icon-btn icon-btn--sm icon-btn--wa" href={`https://wa.me/55${phone}`} target="_blank" rel="noreferrer" aria-label="WhatsApp do cliente">
            <WhatsAppIcon size={16} />
          </a>
        )}
        <button type="button" className="icon-btn icon-btn--sm" onClick={() => onPrint(order)} aria-label="Imprimir">
          <Icon name="print" size={16} />
        </button>
        {order.status === 'novo' && (
          <button type="button" className="icon-btn icon-btn--sm icon-btn--danger" onClick={() => onCancel(order)} aria-label="Cancelar pedido">
            <Icon name="close" size={16} />
          </button>
        )}
      </footer>
    </article>
  )
}

function PrintTicket({ order }) {
  if (!order) return null
  return (
    <div className="print-ticket">
      <h1>KAMI SUSHI</h1>
      <p>
        Pedido #{order.code} · {clock(order.createdAt)}
      </p>
      <p>
        <b>
          {TYPE_LABEL[order.type].toUpperCase()}
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
            <b>{l.qty}x</b> {l.name} <span>{money(l.qty * l.unitPrice)}</span>
          </p>
          {lineDetails(l).length > 0 && <p className="sub">{lineDetails(l).join(' / ')}</p>}
          {l.note && <p className="sub">OBS: {l.note}</p>}
        </div>
      ))}
      <hr />
      {order.notes && <p>OBS: {order.notes}</p>}
      <p>
        <b>TOTAL {money(order.total)}</b>
      </p>
      <p>
        {PAYMENT_LABEL[order.payment]}
        {order.changeFor ? ` - troco p/ ${money(order.changeFor)}` : ''}
      </p>
    </div>
  )
}

export default function AdminPage() {
  const { ready, authed } = useStaffSession()
  const [orders, setOrders] = useState([])
  const [view, setView] = useState('board')
  const [sound, setSound] = useState(true)
  const [fresh, setFresh] = useState(new Set())
  const [printing, setPrinting] = useState(null)
  const [, tick] = useState(0)
  const audioRef = useRef(null)
  const knownRef = useRef(null)
  const soundRef = useRef(sound)
  soundRef.current = sound
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    if (!authed) return
    try {
      audioRef.current = new (window.AudioContext || window.webkitAudioContext)()
    } catch {}
    const load = async () => {
      let list
      try {
        list = await listOrders()
        setOffline(false)
      } catch (e) {
        console.error(e)
        setOffline(true)
        return
      }
      const ids = new Set(list.map((o) => o.id))
      if (knownRef.current) {
        const added = list.filter((o) => !knownRef.current.has(o.id)).map((o) => o.id)
        if (added.length) {
          if (soundRef.current) beep(audioRef.current)
          setFresh((prev) => new Set([...prev, ...added]))
          setTimeout(() => setFresh((prev) => new Set([...prev].filter((id) => !added.includes(id)))), 8000)
        }
      }
      knownRef.current = ids
      setOrders(list)
    }
    load()
    const unsub = subscribe(load)
    const timer = setInterval(() => tick((t) => t + 1), 30000)
    return () => {
      unsub()
      clearInterval(timer)
    }
  }, [authed])

  const newCount = orders.filter((o) => o.status === 'novo').length
  useEffect(() => {
    document.title = newCount ? `(${newCount}) Novos pedidos · Kami` : 'Painel · Kami Sushi'
  }, [newCount])

  useEffect(() => {
    if (!printing) return
    const t = setTimeout(() => {
      window.print()
      setPrinting(null)
    }, 50)
    return () => clearTimeout(t)
  }, [printing])

  if (!ready) return <div className="page page--center" />
  if (!authed) return <Login />

  const run = (p) => p.catch(() => alert('Não foi possível atualizar o pedido. Verifique a internet e tente de novo.'))
  const advance = (o, status) => run(updateStatus(o.id, status))
  const cancel = (o) => {
    if (confirm(`Cancelar o pedido #${o.code} de ${o.customer.name}?`)) run(updateStatus(o.id, 'cancelado'))
  }

  const today = orders.filter((o) => isToday(o.createdAt))
  const done = today.filter((o) => o.status === 'concluido' || o.status === 'cancelado')
  const revenue = today.filter((o) => o.status === 'concluido').reduce((s, o) => s + o.total, 0)

  return (
    <>
    <div className="page admin">
      <header className="topbar">
        <div className="topbar__inner container container--wide">
          <div className="brand">
            <Logo size={34} />
            <span className="brand__name">
              Kami <em>Painel</em>
            </span>
          </div>
          <div className="seg" role="tablist">
            <button type="button" role="tab" aria-selected={view === 'board'} className={view === 'board' ? 'is-on' : ''} onClick={() => setView('board')}>
              Em andamento
            </button>
            <button type="button" role="tab" aria-selected={view === 'done'} className={view === 'done' ? 'is-on' : ''} onClick={() => setView('done')}>
              Finalizados hoje <span className="seg__count">{done.length}</span>
            </button>
          </div>
          <div className="topbar__actions">
            <button
              type="button"
              className={`icon-btn ${sound ? 'is-on' : ''}`}
              onClick={() => {
                audioRef.current?.resume()
                setSound((s) => !s)
              }}
              aria-label={sound ? 'Desativar som' : 'Ativar som'}
              title={sound ? 'Som ligado' : 'Som desligado'}
            >
              <Icon name={sound ? 'bell' : 'bellOff'} />
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                signOut()
              }}
              aria-label="Sair"
              title="Sair"
            >
              <Icon name="logout" />
            </button>
          </div>
        </div>
      </header>

      <main className="container container--wide admin__main">
        {offline && <div className="alert">Sem conexão com o servidor. Tentando de novo…</div>}
        {!isCloud && <div className="alert alert--info">Modo de teste: os pedidos ficam só neste navegador. Conecte o Supabase para receber pedidos de qualquer aparelho.</div>}
        <div className="stats">
          <div className="stat">
            <span className="stat__label">Novos</span>
            <span className="stat__value accent">{newCount}</span>
          </div>
          <div className="stat">
            <span className="stat__label">Pedidos hoje</span>
            <span className="stat__value">{today.filter((o) => o.status !== 'cancelado').length}</span>
          </div>
          <div className="stat">
            <span className="stat__label">Faturado hoje</span>
            <span className="stat__value">{money(revenue)}</span>
          </div>
        </div>

        {view === 'board' ? (
          <div className="board">
            {COLUMNS.map((col) => {
              const list = orders.filter((o) => col.statuses.includes(o.status)).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
              return (
                <section key={col.id} className={`column column--${col.id}`}>
                  <h2 className="column__title">
                    {col.title} <span className="column__count">{list.length}</span>
                  </h2>
                  <div className="column__list">
                    {list.length ? (
                      list.map((o) => (
                        <OrderCard key={o.id} order={o} fresh={fresh.has(o.id)} onAdvance={advance} onCancel={cancel} onPrint={setPrinting} />
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
            {done.length ? (
              done.map((o) => (
                <div key={o.id} className="done-row">
                  <span className="ticket__code">#{o.code}</span>
                  <span>{clock(o.createdAt)}</span>
                  <span className={`type-tag type-tag--${o.type}`}>{TYPE_LABEL[o.type]}</span>
                  <span className="done-row__name">{o.customer.name}</span>
                  <span className={`status-tag status-tag--${STATUS[o.status].tone}`}>{STATUS[o.status].label}</span>
                  <strong>{money(o.total)}</strong>
                </div>
              ))
            ) : (
              <p className="column__empty">Nenhum pedido finalizado hoje.</p>
            )}
          </div>
        )}
      </main>
    </div>
    <PrintTicket order={printing} />
    </>
  )
}
