import { useState } from 'react'
import { useCarrinho } from '../contexto/ContextoCarrinho'
import { moeda } from '../lib/formatacao'
import Icone from './Icone'
import Gaveta from './Gaveta'
import ArteItem from './ArteItem'

export default function GavetaItem({ item, onClose, onAdded }) {
  const { adicionar } = useCarrinho()
  const [variacao, setVariacao] = useState(item.variants ? item.variants[item.variants.length - 1] : null)
  const [opcoes, setOpcoes] = useState(() =>
    Object.fromEntries((item.options || []).map((o) => [o.label, o.choices[0]])),
  )
  const [adicionais, setAdicionais] = useState([])
  const [observacao, setObservacao] = useState('')
  const [qtd, setQtd] = useState(1)

  const precoUnitario = (variacao ? variacao.price : item.price) + adicionais.reduce((s, e) => s + e.price, 0)

  const alternarAdicional = (e) =>
    setAdicionais((anterior) => (anterior.some((x) => x.id === e.id) ? anterior.filter((x) => x.id !== e.id) : [...anterior, e]))

  const enviar = () => {
    adicionar({
      itemId: item.id,
      name: item.name,
      variant: variacao && { id: variacao.id, label: variacao.label },
      options: opcoes,
      extras: adicionais,
      note: observacao.trim(),
      qty: qtd,
      unitPrice: precoUnitario,
    })
    onAdded?.(item.name)
    onClose()
  }

  return (
    <Gaveta onClose={onClose} label={item.name}>
      <div className="item-sheet">
        <ArteItem item={item} large />
        <div className="item-sheet__body">
          <h2 className="item-sheet__title">{item.name}</h2>
          {item.desc && <p className="item-sheet__desc">{item.desc}</p>}
          {item.units && <span className="badge">{item.units}</span>}

          {item.variants && (
            <fieldset className="field-group">
              <legend>Escolha a porção</legend>
              <div className="choice-grid">
                {item.variants.map((v) => (
                  <label key={v.id} className={`choice ${variacao.id === v.id ? 'is-on' : ''}`}>
                    <input type="radio" name="variant" checked={variacao.id === v.id} onChange={() => setVariacao(v)} />
                    <span className="choice__label">{v.label}</span>
                    <span className="choice__price">{moeda(v.price)}</span>
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
                  <label key={c} className={`pill ${opcoes[o.label] === c ? 'is-on' : ''}`}>
                    <input
                      type="radio"
                      name={o.id}
                      checked={opcoes[o.label] === c}
                      onChange={() => setOpcoes((anterior) => ({ ...anterior, [o.label]: c }))}
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
                  const marcado = adicionais.some((x) => x.id === e.id)
                  return (
                    <label key={e.id} className={`extra ${marcado ? 'is-on' : ''}`}>
                      <input type="checkbox" checked={marcado} onChange={() => alternarAdicional(e)} />
                      <span className="extra__box">{marcado && <Icone name="check" size={14} stroke={3} />}</span>
                      <span>{e.label}</span>
                      <span className="extra__price">+ {moeda(e.price)}</span>
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
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </label>
        </div>

        <div className="item-sheet__footer">
          <div className="stepper" aria-label="Quantidade">
            <button type="button" onClick={() => setQtd((q) => Math.max(1, q - 1))} aria-label="Diminuir" disabled={qtd <= 1}>
              <Icone name="minus" size={18} />
            </button>
            <span>{qtd}</span>
            <button type="button" onClick={() => setQtd((q) => q + 1)} aria-label="Aumentar">
              <Icone name="plus" size={18} />
            </button>
          </div>
          <button type="button" className="btn btn--primary btn--grow" onClick={enviar}>
            Adicionar · {moeda(precoUnitario * qtd)}
          </button>
        </div>
      </div>
    </Gaveta>
  )
}
