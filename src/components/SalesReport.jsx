import { useEffect, useMemo, useState } from 'react'
import { money } from '../lib/format'
import { listOrdersSince, TYPE_LABEL, PAYMENT_LABEL } from '../lib/orders'
import { addDays, dayKey, dayLabel, daysUntilToday, hourOf, startOfDay, weekday } from '../lib/dates'
import Icon from './Icon'

const PERIODS = [
  { id: 'hoje', label: 'Hoje' },
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
  { id: 'mes', label: 'Este mês' },
]

function periodStart(id) {
  const today = startOfDay(dayKey(new Date()))
  if (id === '7d') return addDays(today, -6)
  if (id === '30d') return addDays(today, -29)
  if (id === 'mes') return startOfDay(`${dayKey(new Date()).slice(0, 7)}-01`)
  return today
}

function summarize(orders, from) {
  const valid = orders.filter((o) => o.status !== 'cancelado')
  const revenue = valid.reduce((s, o) => s + o.total, 0)

  const days = daysUntilToday(from).map((k) => ({ key: k, revenue: 0, count: 0 }))
  const dayIndex = Object.fromEntries(days.map((d, i) => [d.key, i]))
  const hours = {}
  const items = {}
  const types = {}
  const payments = {}

  for (const o of valid) {
    const d = days[dayIndex[dayKey(o.createdAt)]]
    if (d) {
      d.revenue += o.total
      d.count += 1
    }
    const h = hourOf(o.createdAt)
    hours[h] = (hours[h] || 0) + 1
    types[o.type] = (types[o.type] || 0) + o.total
    payments[o.payment] = (payments[o.payment] || 0) + o.total
    for (const l of o.items) {
      const it = (items[l.name] ||= { name: l.name, qty: 0, revenue: 0 })
      it.qty += l.qty
      it.revenue += l.qty * l.unitPrice
    }
  }

  // Faixa de horas: sempre do horário de funcionamento, ampliada se houver pedidos fora dele.
  const seen = Object.keys(hours).map(Number)
  const lo = Math.min(19, ...seen)
  const hi = Math.max(22, ...seen)
  const hourList = []
  for (let h = lo; h <= hi; h++) hourList.push({ hour: h, count: hours[h] || 0 })

  return {
    revenue,
    count: valid.length,
    ticket: valid.length ? revenue / valid.length : 0,
    cancelled: orders.length - valid.length,
    days,
    hours: hourList,
    topItems: Object.values(items).sort((a, b) => b.qty - a.qty || b.revenue - a.revenue).slice(0, 10),
    types: Object.entries(types).sort((a, b) => b[1] - a[1]),
    payments: Object.entries(payments).sort((a, b) => b[1] - a[1]),
  }
}

// Colunas verticais (uma série, uma cor). O maior valor ganha rótulo; os demais aparecem ao passar o mouse.
function Columns({ data, valueOf, labelOf, subOf, format, ariaLabel }) {
  const max = Math.max(...data.map(valueOf), 0)
  const peak = data.findIndex((d) => valueOf(d) === max && max > 0)
  // Muitas colunas (30 dias): rótulo só a cada 5, para não amontoar.
  const showLabel = (i) => data.length <= 10 || i % 5 === 0 || i === data.length - 1
  return (
    <div className={`cols ${data.length > 10 ? 'cols--dense' : ''}`} role="img" aria-label={ariaLabel}>
      {data.map((d, i) => {
        const v = valueOf(d)
        return (
          <div key={i} className="cols__col" tabIndex={0} data-tip={`${labelOf(d)}: ${format(v)}`}>
            <div className="cols__track">
              <div className="cols__bar" style={{ height: max ? `${(v / max) * 100}%` : 0 }}>
                {i === peak && <span className="cols__peak">{format(v)}</span>}
              </div>
            </div>
            <span className="cols__label">{showLabel(i) ? labelOf(d) : ' '}</span>
            {subOf && <span className="cols__sub">{subOf(d)}</span>}
          </div>
        )
      })}
    </div>
  )
}

// Barras horizontais com rótulo e valor em texto (a cor só reforça).
function BarList({ rows, max }) {
  return (
    <ul className="barlist">
      {rows.map((r) => (
        <li key={r.label} className="barlist__row">
          <span className="barlist__label">{r.label}</span>
          <span className="barlist__track">
            <span className="barlist__bar" style={{ width: max ? `${(r.value / max) * 100}%` : 0 }} />
          </span>
          <span className="barlist__value">{r.display}</span>
        </li>
      ))}
    </ul>
  )
}

export default function SalesReport() {
  const [period, setPeriod] = useState('hoje')
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)
  const from = useMemo(() => periodStart(period), [period, reload])

  useEffect(() => {
    let alive = true
    setOrders(null)
    setError(false)
    listOrdersSince(from).then(
      (list) => alive && setOrders(list),
      (e) => {
        console.error(e)
        if (alive) setError(true)
      },
    )
    return () => {
      alive = false
    }
  }, [from])

  const r = useMemo(() => (orders ? summarize(orders, from) : null), [orders, from])
  const multiDay = period !== 'hoje'

  return (
    <div className="report">
      <div className="report__filters">
        <div className="seg" role="tablist" aria-label="Período">
          {PERIODS.map((p) => (
            <button key={p.id} type="button" role="tab" aria-selected={period === p.id} className={period === p.id ? 'is-on' : ''} onClick={() => setPeriod(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setReload((n) => n + 1)}>
          Atualizar
        </button>
      </div>

      {error && <div className="alert">Não foi possível carregar o relatório. Verifique a internet e toque em Atualizar.</div>}
      {!r && !error && <p className="column__empty">Carregando…</p>}

      {r && (
        <>
          <div className="stats stats--4">
            <div className="stat">
              <span className="stat__label">Vendas</span>
              <span className="stat__value">{money(r.revenue)}</span>
            </div>
            <div className="stat">
              <span className="stat__label">Pedidos</span>
              <span className="stat__value">{r.count}</span>
            </div>
            <div className="stat">
              <span className="stat__label">Ticket médio</span>
              <span className="stat__value">{money(r.ticket)}</span>
            </div>
            <div className="stat">
              <span className="stat__label">Cancelados</span>
              <span className="stat__value">{r.cancelled}</span>
            </div>
          </div>

          {r.count === 0 ? (
            <div className="report-card report-card--empty">
              <Icon name="receipt" size={28} stroke={1.6} />
              <p>Nenhum pedido neste período ainda.</p>
            </div>
          ) : (
            <>
              <div className="report-grid">
                {multiDay && (
                  <section className="report-card report-card--wide">
                    <h3 className="report-card__title">Vendas por dia</h3>
                    <Columns
                      data={r.days}
                      valueOf={(d) => d.revenue}
                      labelOf={(d) => dayLabel(d.key)}
                      subOf={r.days.length <= 7 ? (d) => weekday(d.key) : null}
                      format={money}
                      ariaLabel="Vendas por dia"
                    />
                  </section>
                )}
                <section className="report-card">
                  <h3 className="report-card__title">Horários de pico</h3>
                  <p className="report-card__hint">Pedidos por hora</p>
                  <Columns
                    data={r.hours}
                    valueOf={(h) => h.count}
                    labelOf={(h) => `${h.hour}h`}
                    format={(v) => `${v} ${v === 1 ? 'pedido' : 'pedidos'}`}
                    ariaLabel="Pedidos por hora"
                  />
                </section>
                <section className="report-card">
                  <h3 className="report-card__title">Como receberam</h3>
                  <BarList max={r.types[0]?.[1]} rows={r.types.map(([k, v]) => ({ label: TYPE_LABEL[k], value: v, display: money(v) }))} />
                  <h3 className="report-card__title report-card__title--gap">Pagamento</h3>
                  <BarList
                    max={r.payments[0]?.[1]}
                    rows={r.payments.map(([k, v]) => ({ label: PAYMENT_LABEL[k].replace(' (maquininha)', ''), value: v, display: money(v) }))}
                  />
                </section>
              </div>

              <section className="report-card">
                <h3 className="report-card__title">Mais vendidos</h3>
                <table className="top-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Prato</th>
                      <th className="num">Qtd.</th>
                      <th className="num">Vendido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.topItems.map((it, i) => (
                      <tr key={it.name}>
                        <td className="top-table__rank">{i + 1}</td>
                        <td>
                          <span className="top-table__name">{it.name}</span>
                          <span className="top-table__bar" style={{ width: `${(it.qty / r.topItems[0].qty) * 100}%` }} />
                        </td>
                        <td className="num">{it.qty}</td>
                        <td className="num">{money(it.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
              <p className="muted small">Valores com taxa de entrega incluída. Pedidos cancelados não entram nas vendas.</p>
            </>
          )}
        </>
      )}
    </div>
  )
}
