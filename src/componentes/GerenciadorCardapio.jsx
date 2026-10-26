import { useMemo, useState } from 'react'
import { CATEGORIAS } from '../dados/cardapio'
import { atualizarConfigLoja } from '../lib/loja'
import Icone from './Icone'

const normalizar = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Aba "Cardápio" do painel: marca itens como esgotados ou disponíveis.
export default function GerenciadorCardapio({ soldOut }) {
  const [busca, setBusca] = useState('')
  const [salvando, setSalvando] = useState(null)

  const categorias = useMemo(() => {
    const q = normalizar(busca.trim())
    if (!q) return CATEGORIAS
    return CATEGORIAS.map((c) => ({ ...c, items: c.items.filter((i) => normalizar(`${i.name} ${i.desc}`).includes(q)) })).filter(
      (c) => c.items.length,
    )
  }, [busca])

  const itensEsgotados = useMemo(() => CATEGORIAS.flatMap((c) => c.items).filter((i) => soldOut.includes(i.id)), [soldOut])

  async function alternar(id) {
    const proximo = soldOut.includes(id) ? soldOut.filter((x) => x !== id) : [...soldOut, id]
    setSalvando(id)
    try {
      await atualizarConfigLoja({ soldOut: proximo })
    } catch (e) {
      console.error(e)
      alert('Não foi possível salvar. Verifique a internet e tente de novo.')
    }
    setSalvando(null)
  }

  return (
    <div className="menu-manager">
      <div className="menu-manager__top">
        <label className="search">
          <Icone name="search" size={18} />
          <input type="search" placeholder="Buscar item" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar item" />
        </label>
        <p className="muted small">Toque no item para marcar como esgotado. O cliente vê na hora.</p>
      </div>

      {itensEsgotados.length > 0 && (
        <section className="mm-section mm-section--soldout">
          <h2 className="mm-section__title">
            Esgotados agora <span className="column__count">{itensEsgotados.length}</span>
          </h2>
          <div className="mm-chips">
            {itensEsgotados.map((i) => (
              <button key={i.id} type="button" className="mm-chip" onClick={() => alternar(i.id)} disabled={salvando === i.id}>
                {i.name} <Icone name="close" size={14} stroke={2.6} />
              </button>
            ))}
          </div>
        </section>
      )}

      {categorias.map((c) => (
        <section key={c.id} className="mm-section">
          <h2 className="mm-section__title">{c.name}</h2>
          <ul className="mm-list">
            {c.items.map((i) => {
              const saida = soldOut.includes(i.id)
              return (
                <li key={i.id}>
                  <button
                    type="button"
                    className={`mm-row ${saida ? 'is-out' : ''}`}
                    onClick={() => alternar(i.id)}
                    disabled={salvando === i.id}
                    aria-pressed={saida}
                  >
                    <span className="mm-row__name">{i.name}</span>
                    <span className={`mm-switch ${saida ? 'is-out' : ''}`}>
                      <span className="mm-switch__knob" />
                    </span>
                    <span className="mm-row__state">{salvando === i.id ? 'Salvando…' : saida ? 'Esgotado' : 'Disponível'}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
