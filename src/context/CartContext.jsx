import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const KEY = 'kami:cart'

// Uma linha do carrinho = item + escolhas. Mesmas escolhas somam quantidade.
export function lineKey(l) {
  return [l.itemId, l.variant?.id, JSON.stringify(l.options), l.extras.map((e) => e.id).join(','), l.note].join('|')
}

export function CartProvider({ children }) {
  const [lines, setLines] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines))
    } catch {}
  }, [lines])

  const api = useMemo(() => {
    const add = (line) =>
      setLines((prev) => {
        const key = lineKey(line)
        const found = prev.find((l) => l.key === key)
        if (found) return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + line.qty } : l))
        return [...prev, { ...line, key }]
      })
    const setQty = (key, qty) =>
      setLines((prev) => (qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty } : l))))
    const clear = () => setLines([])
    const count = lines.reduce((s, l) => s + l.qty, 0)
    const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)
    return { lines, add, setQty, clear, count, subtotal }
  }, [lines])

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
