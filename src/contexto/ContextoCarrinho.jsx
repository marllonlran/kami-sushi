import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ContextoCarrinho = createContext(null)
const CHAVE = 'kami:cart'

// Uma linha do carrinho = item + escolhas. Mesmas escolhas somam quantidade.
export function chaveLinha(l) {
  return [l.itemId, l.variant?.id, JSON.stringify(l.options), l.extras.map((e) => e.id).join(','), l.note].join('|')
}

export function ProvedorCarrinho({ children }) {
  const [linhas, setLinhas] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CHAVE)) || []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(linhas))
    } catch {}
  }, [linhas])

  const api = useMemo(() => {
    const adicionar = (linha) =>
      setLinhas((anterior) => {
        const chave = chaveLinha(linha)
        const encontrada = anterior.find((l) => l.key === chave)
        if (encontrada) return anterior.map((l) => (l.key === chave ? { ...l, qty: l.qty + linha.qty } : l))
        return [...anterior, { ...linha, key: chave }]
      })
    const setQtd = (chave, qtd) =>
      setLinhas((anterior) => (qtd <= 0 ? anterior.filter((l) => l.key !== chave) : anterior.map((l) => (l.key === chave ? { ...l, qty: qtd } : l))))
    const limpar = () => setLinhas([])
    const contagem = linhas.reduce((s, l) => s + l.qty, 0)
    const subtotal = linhas.reduce((s, l) => s + l.qty * l.unitPrice, 0)
    return { linhas, adicionar, setQtd, limpar, contagem, subtotal }
  }, [linhas])

  return <ContextoCarrinho.Provider value={api}>{children}</ContextoCarrinho.Provider>
}

export const useCarrinho = () => useContext(ContextoCarrinho)
