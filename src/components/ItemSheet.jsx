import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { money } from '../lib/format'
import Icon from './Icon'
import Sheet from './Sheet'
import ItemArt from './ItemArt'

export default function ItemSheet({ item, onClose, onAdded }) {
  const { add } = useCart()
  const [variant, setVariant] = useState(item.variants ? item.variants[item.variants.length - 1] : null)
  const [options, setOptions] = useState(() =>
    Object.fromEntries((item.options || []).map((o) => [o.label, o.choices[0]])),
  )
  const [extras, setExtras] = useState([])
  const [note, setNote] = useState('')
  const [qty, setQty] = useState(1)

  const unitPrice = (variant ? variant.price : item.price) + extras.reduce((s, e) => s + e.price, 0)

  const toggleExtra = (e) =>
    setExtras((prev) => (prev.some((x) => x.id === e.id) ? prev.filter((x) => x.id !== e.id) : [...prev, e]))

  const submit = () => {
    add({
      itemId: item.id,
      name: item.name,
      variant: variant && { id: variant.id, label: variant.label },
      options,
      extras,
      note: note.trim(),
      qty,
      unitPrice,
    })
    onAdded?.(item.name)
    onClose()
  }

  return (
    <Sheet onClose={onClose} label={item.name}>
      <div className="item-sheet">
        <ItemArt item={item} large />
        <div className="item-sheet__body">
          <h2 className="item-sheet__title">{item.name}</h2>
          {item.desc && <p className="item-sheet__desc">{item.desc}</p>}
          {item.units && <span className="badge">{item.units}</span>}

          {item.variants && (
            <fieldset className="field-group">
              <legend>Escolha a porção</legend>
              <div className="choice-grid">
                {item.variants.map((v) => (
                  <label key={v.id} className={`choice ${variant.id === v.id ? 'is-on' : ''}`}>
                    <input type="radio" name="variant" checked={variant.id === v.id} onChange={() => setVariant(v)} />
                    <span className="choice__label">{v.label}</span>
                    <span className="choice__price">{money(v.price)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {item.options?.map((o) => (
            <fieldset key={o.id} className="field-group">
              <legend>{o.label}</legend>
              <div className="pill-row">
                {o.choices.map((c) => (
                  <label key={c} className={`pill ${options[o.label] === c ? 'is-on' : ''}`}>
                    <input
                      type="radio"
                      name={o.id}
                      checked={options[o.label] === c}
                      onChange={() => setOptions((prev) => ({ ...prev, [o.label]: c }))}
                    />
                    {c}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          {item.extras && (
            <fieldset className="field-group">
              <legend>
                Adicionais <span className="muted">(opcional)</span>
              </legend>
              <div className="extra-list">
                {item.extras.map((e) => {
                  const on = extras.some((x) => x.id === e.id)
                  return (
                    <label key={e.id} className={`extra ${on ? 'is-on' : ''}`}>
                      <input type="checkbox" checked={on} onChange={() => toggleExtra(e)} />
                      <span className="extra__box">{on && <Icon name="check" size={14} stroke={3} />}</span>
                      <span>{e.label}</span>
                      <span className="extra__price">+ {money(e.price)}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )}

          <label className="field-group">
            <span className="legend">
              Observação <span className="muted">(opcional)</span>
            </span>
            <textarea
              className="input"
              rows={2}
              maxLength={140}
              placeholder="Ex.: sem cebolinha, molho à parte…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </div>

        <div className="item-sheet__footer">
          <div className="stepper" aria-label="Quantidade">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuir" disabled={qty <= 1}>
              <Icon name="minus" size={18} />
            </button>
            <span>{qty}</span>
            <button type="button" onClick={() => setQty((q) => q + 1)} aria-label="Aumentar">
              <Icon name="plus" size={18} />
            </button>
          </div>
          <button type="button" className="btn btn--primary btn--grow" onClick={submit}>
            Adicionar · {money(unitPrice * qty)}
          </button>
        </div>
      </div>
    </Sheet>
  )
}
