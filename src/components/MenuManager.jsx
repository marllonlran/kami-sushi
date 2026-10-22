import { useMemo, useState } from 'react'
import { CATEGORIES } from '../data/menu'
import { updateStoreSettings } from '../lib/store'
import Icon from './Icon'

const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Aba "Cardápio" do painel: marca itens como esgotados ou disponíveis.
export default function MenuManager({ soldOut }) {
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(null)

  const categories = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return CATEGORIES
    return CATEGORIES.map((c) => ({ ...c, items: c.items.filter((i) => normalize(`${i.name} ${i.desc}`).includes(q)) })).filter(
      (c) => c.items.length,
    )
  }, [query])

  const soldOutItems = useMemo(() => CATEGORIES.flatMap((c) => c.items).filter((i) => soldOut.includes(i.id)), [soldOut])

  async function toggle(id) {
    const next = soldOut.includes(id) ? soldOut.filter((x) => x !== id) : [...soldOut, id]
    setSaving(id)
    try {
      await updateStoreSettings({ soldOut: next })
    } catch (e) {
      console.error(e)
      alert('Não foi possível salvar. Verifique a internet e tente de novo.')
    }
    setSaving(null)
  }

  return (
    <div className="menu-manager">
      <div className="menu-manager__top">
        <label className="search">
          <Icon name="search" size={18} />
          <input type="search" placeholder="Buscar item" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar item" />
        </label>
        <p className="muted small">Toque no item para marcar como esgotado. O cliente vê na hora.</p>
      </div>

      {soldOutItems.length > 0 && (
        <section className="mm-section mm-section--soldout">
          <h2 className="mm-section__title">
            Esgotados agora <span className="column__count">{soldOutItems.length}</span>
          </h2>
          <div className="mm-chips">
            {soldOutItems.map((i) => (
              <button key={i.id} type="button" className="mm-chip" onClick={() => toggle(i.id)} disabled={saving === i.id}>
                {i.name} <Icon name="close" size={14} stroke={2.6} />
              </button>
            ))}
          </div>
        </section>
      )}

      {categories.map((c) => (
        <section key={c.id} className="mm-section">
          <h2 className="mm-section__title">{c.name}</h2>
          <ul className="mm-list">
            {c.items.map((i) => {
              const out = soldOut.includes(i.id)
              return (
                <li key={i.id}>
                  <button
                    type="button"
                    className={`mm-row ${out ? 'is-out' : ''}`}
                    onClick={() => toggle(i.id)}
                    disabled={saving === i.id}
                    aria-pressed={out}
                  >
                    <span className="mm-row__name">{i.name}</span>
                    <span className={`mm-switch ${out ? 'is-out' : ''}`}>
                      <span className="mm-switch__knob" />
                    </span>
                    <span className="mm-row__state">{saving === i.id ? 'Salvando…' : out ? 'Esgotado' : 'Disponível'}</span>
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
