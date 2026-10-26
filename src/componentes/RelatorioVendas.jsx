import { useEffect, useMemo, useState } from 'react'
import { moeda } from '../lib/formatacao'
import { listarPedidosDesde, ROTULO_TIPO, ROTULO_PAGAMENTO } from '../lib/pedidos'
import { somarDias, chaveDia, rotuloDia, diasAteHoje, horaDe, inicioDoDia, diaSemana } from '../lib/datas'
import Icone from './Icone'

const PERIODOS = [
  { id: 'hoje', label: 'Hoje' },
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
  { id: 'mes', label: 'Este mês' },
]

function inicioPeriodo(id) {
  const hoje = inicioDoDia(chaveDia(new Date()))
  if (id === '7d') return somarDias(hoje, -6)
  if (id === '30d') return somarDias(hoje, -29)
  if (id === 'mes') return inicioDoDia(`${chaveDia(new Date()).slice(0, 7)}-01`)
  return hoje
}

function resumir(pedidos, inicio) {
  const valido = pedidos.filter((o) => o.status !== 'cancelado')
  const faturamento = valido.reduce((s, o) => s + o.total, 0)

  const dias = diasAteHoje(inicio).map((k) => ({ key: k, revenue: 0, count: 0 }))
  const indiceDia = Object.fromEntries(dias.map((d, i) => [d.key, i]))
  const horas = {}
  const itens = {}
  const tipos = {}
  const pagamentos = {}

  for (const o of valido) {
    const d = dias[indiceDia[chaveDia(o.createdAt)]]
    if (d) {
      d.revenue += o.total
      d.count += 1
    }
    const h = horaDe(o.createdAt)
    horas[h] = (horas[h] || 0) + 1
    tipos[o.type] = (tipos[o.type] || 0) + o.total
    pagamentos[o.payment] = (pagamentos[o.payment] || 0) + o.total
    for (const l of o.items) {
      const it = (itens[l.name] ||= { name: l.name, qty: 0, revenue: 0 })
      it.qty += l.qty
      it.revenue += l.qty * l.unitPrice
    }
  }

  // Faixa de horas: sempre do horário de funcionamento, ampliada se houver pedidos fora dele.
  const horasComVenda = Object.keys(horas).map(Number)
  const lo = Math.min(19, ...horasComVenda)
  const hi = Math.max(22, ...horasComVenda)
  const listaHoras = []
  for (let h = lo; h <= hi; h++) listaHoras.push({ hour: h, count: horas[h] || 0 })

  return {
    revenue: faturamento,
    count: valido.length,
    ticket: valido.length ? faturamento / valido.length : 0,
    cancelled: pedidos.length - valido.length,
    days: dias,
    hours: listaHoras,
    topItems: Object.values(itens).sort((a, b) => b.qty - a.qty || b.revenue - a.revenue).slice(0, 10),
    types: Object.entries(tipos).sort((a, b) => b[1] - a[1]),
    payments: Object.entries(pagamentos).sort((a, b) => b[1] - a[1]),
  }
}

// Colunas verticais (uma série, uma cor). O maior valor ganha rótulo; os demais aparecem ao passar o mouse.
function Colunas({ data, valueOf, labelOf, subOf, format, ariaLabel }) {
  const max = Math.max(...data.map(valueOf), 0)
  const pico = data.findIndex((d) => valueOf(d) === max && max > 0)
  // Muitas colunas (30 dias): rótulo só a cada 5, para não amontoar.
  const mostrarRotulo = (i) => data.length <= 10 || i % 5 === 0 || i === data.length - 1
  return (
    <div className={`cols ${data.length > 10 ? 'cols--dense' : ''}`} role="img" aria-label={ariaLabel}>
      {data.map((d, i) => {
        const v = valueOf(d)
        return (
          <div key={i} className="cols__col" tabIndex={0} data-tip={`${labelOf(d)}: ${format(v)}`}>
            <div className="cols__track">
              <div className="cols__bar" style={{ height: max ? `${(v / max) * 100}%` : 0 }}>
                {i === pico && <span className="cols__peak">{format(v)}</span>}
              </div>
            </div>
            <span className="cols__label">{mostrarRotulo(i) ? labelOf(d) : ' '}</span>
            {subOf && <span className="cols__sub">{subOf(d)}</span>}
          </div>
        )
      })}
    </div>
  )
}

// Barras horizontais com rótulo e valor em texto (a cor só reforça).
function ListaBarras({ rows, max }) {
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

export default function RelatorioVendas() {
  const [periodo, setPeriodo] = useState('hoje')
  const [pedidos, setPedidos] = useState(null)
  const [erro, setErro] = useState(false)
  const [recarregar, setRecarregar] = useState(0)
  const inicio = useMemo(() => inicioPeriodo(periodo), [periodo, recarregar])

  useEffect(() => {
    let emExecucao = true
    setPedidos(null)
    setErro(false)
    listarPedidosDesde(inicio).then(
      (lista) => emExecucao && setPedidos(lista),
      (e) => {
        console.error(e)
        if (emExecucao) setErro(true)
      },
    )
    return () => {
      emExecucao = false
    }
  }, [inicio])

  const r = useMemo(() => (pedidos ? resumir(pedidos, inicio) : null), [pedidos, inicio])
  const variosDias = periodo !== 'hoje'

  return (
    <div className="report">
      <div className="report__filters">
        <div className="seg" role="tablist" aria-label="Período">
          {PERIODOS.map((p) => (
            <button key={p.id} type="button" role="tab" aria-selected={periodo === p.id} className={periodo === p.id ? 'is-on' : ''} onClick={() => setPeriodo(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setRecarregar((n) => n + 1)}>
          Atualizar
        </button>
      </div>

      {erro && <div className="alert">Não foi possível carregar o relatório. Verifique a internet e toque em Atualizar.</div>}
      {!r && !erro && <p className="column__empty">Carregando…</p>}

      {r && (
        <>
          <div className="stats stats--4">
            <div className="stat">
              <span className="stat__label">Vendas</span>
              <span className="stat__value">{moeda(r.revenue)}</span>
            </div>
            <div className="stat">
              <span className="stat__label">Pedidos</span>
              <span className="stat__value">{r.count}</span>
            </div>
            <div className="stat">
              <span className="stat__label">Ticket médio</span>
              <span className="stat__value">{moeda(r.ticket)}</span>
            </div>
            <div className="stat">
              <span className="stat__label">Cancelados</span>
              <span className="stat__value">{r.cancelled}</span>
            </div>
          </div>

          {r.count === 0 ? (
            <div className="report-card report-card--empty">
              <Icone name="receipt" size={28} stroke={1.6} />
              <p>Nenhum pedido neste período ainda.</p>
            </div>
          ) : (
            <>
              <div className="report-grid">
                {variosDias && (
                  <section className="report-card report-card--wide">
                    <h3 className="report-card__title">Vendas por dia</h3>
                    <Colunas
                      data={r.days}
                      valueOf={(d) => d.revenue}
                      labelOf={(d) => rotuloDia(d.key)}
                      subOf={r.days.length <= 7 ? (d) => diaSemana(d.key) : null}
                      format={moeda}
                      ariaLabel="Vendas por dia"
                    />
                  </section>
                )}
                <section className="report-card">
                  <h3 className="report-card__title">Horários de pico</h3>
                  <p className="report-card__hint">Pedidos por hora</p>
                  <Colunas
                    data={r.hours}
                    valueOf={(h) => h.count}
                    labelOf={(h) => `${h.hour}h`}
                    format={(v) => `${v} ${v === 1 ? 'pedido' : 'pedidos'}`}
                    ariaLabel="Pedidos por hora"
                  />
                </section>
                <section className="report-card">
                  <h3 className="report-card__title">Como receberam</h3>
                  <ListaBarras max={r.types[0]?.[1]} rows={r.types.map(([k, v]) => ({ label: ROTULO_TIPO[k], value: v, display: moeda(v) }))} />
                  <h3 className="report-card__title report-card__title--gap">Pagamento</h3>
                  <ListaBarras
                    max={r.payments[0]?.[1]}
                    rows={r.payments.map(([k, v]) => ({ label: ROTULO_PAGAMENTO[k].replace(' (maquininha)', ''), value: v, display: moeda(v) }))}
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
                        <td className="num">{moeda(it.revenue)}</td>
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
