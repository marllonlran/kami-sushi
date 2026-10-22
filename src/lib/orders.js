// Camada de pedidos.
// Com o Supabase configurado (.env), os pedidos ficam na nuvem e chegam ao
// painel da cozinha em qualquer aparelho. Sem ele, ficam só neste navegador
// (modo local de teste).
import { supabase } from './supabase'

export const STATUS = {
  novo: { label: 'Recebido', tone: 'new' },
  preparo: { label: 'Em preparo', tone: 'prep' },
  pronto: { label: 'Pronto', tone: 'ready' },
  saiu: { label: 'Saiu para entrega', tone: 'ready' },
  concluido: { label: 'Concluído', tone: 'done' },
  cancelado: { label: 'Cancelado', tone: 'cancel' },
}

// Etapas de cada tipo de pedido, na ordem.
export const FLOW = {
  entrega: ['novo', 'preparo', 'saiu', 'concluido'],
  retirada: ['novo', 'preparo', 'pronto', 'concluido'],
  mesa: ['novo', 'preparo', 'pronto', 'concluido'],
}

export const TYPE_LABEL = { entrega: 'Entrega', retirada: 'Retirada', mesa: 'Mesa' }
export const PAYMENT_LABEL = { cartao: 'Cartão (maquininha)', dinheiro: 'Dinheiro', pix: 'Pix' }

/* ---------- Supabase ---------- */

const num = (v) => (v == null ? null : Number(v))

function fromRow(r) {
  return {
    id: r.id,
    code: String(r.number),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    status: r.status,
    type: r.type,
    customer: r.customer,
    address: r.address,
    table: r.table_no,
    payment: r.payment,
    changeFor: num(r.change_for),
    notes: r.notes,
    items: r.items,
    subtotal: num(r.subtotal),
    deliveryFee: num(r.delivery_fee),
    total: num(r.total),
  }
}

const remote = {
  async createOrder(data) {
    const { data: row, error } = await supabase.rpc('create_order', { payload: data })
    if (error) throw error
    return fromRow(row)
  },

  async getOrder(id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null
    const { data: row, error } = await supabase.rpc('get_order', { order_id: id })
    if (error) throw error
    return row ? fromRow(row) : null
  },

  // Pedidos das últimas 36 horas (o painel só mostra os em andamento e os de hoje).
  async listOrders() {
    const since = new Date(Date.now() - 36 * 3600 * 1000).toISOString()
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) throw error
    return data.map(fromRow)
  },

  // Para o relatório: todos os pedidos desde `since` (busca em páginas de 1000).
  async listOrdersSince(since) {
    const PAGE = 1000
    const rows = []
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true })
        .range(from, from + PAGE - 1)
      if (error) throw error
      rows.push(...data)
      if (data.length < PAGE) break
    }
    return rows.map(fromRow)
  },

  async updateStatus(id, status) {
    const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
  },

  // Tempo real para a equipe logada; consulta a cada 10 s como reserva
  // (e para o cliente, que não tem acesso à tabela).
  subscribe(cb) {
    const ch = supabase
      .channel(`orders-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => cb())
      .subscribe()
    const timer = setInterval(cb, 10000)
    return () => {
      clearInterval(timer)
      supabase.removeChannel(ch)
    }
  },
}

/* ---------- Local (teste) ---------- */

const KEY = 'kami:orders'
const LOCAL_EVENT = 'kami:orders-changed'
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('kami-orders') : null

function read() {
  try {
    // Pedidos antigos não tinham `code`: usa o id.
    return (JSON.parse(localStorage.getItem(KEY)) || []).map((o) => ({ code: o.id, ...o }))
  } catch {
    return []
  }
}

function write(orders) {
  localStorage.setItem(KEY, JSON.stringify(orders))
  channel?.postMessage('changed')
  window.dispatchEvent(new Event(LOCAL_EVENT))
}

const local = {
  async createOrder(data) {
    const orders = read()
    let code
    do code = String(Math.floor(1000 + Math.random() * 9000))
    while (orders.some((o) => o.id === code))
    const order = { ...data, id: code, code, status: 'novo', createdAt: new Date().toISOString() }
    write([order, ...orders])
    return order
  },

  async getOrder(id) {
    return read().find((o) => o.id === id) || null
  },

  async listOrders() {
    return read()
  },

  async listOrdersSince(since) {
    return read().filter((o) => new Date(o.createdAt) >= since)
  },

  async updateStatus(id, status) {
    write(read().map((o) => (o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o)))
  },

  // Avisa mudanças nesta aba e nas outras abas do mesmo navegador.
  subscribe(cb) {
    const onStorage = (e) => e.key === KEY && cb()
    const onMsg = () => cb()
    window.addEventListener('storage', onStorage)
    window.addEventListener(LOCAL_EVENT, onMsg)
    channel?.addEventListener('message', onMsg)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(LOCAL_EVENT, onMsg)
      channel?.removeEventListener('message', onMsg)
    }
  },
}

const backend = supabase ? remote : local

export const isCloud = !!supabase
export const createOrder = (data) => backend.createOrder(data)
export const getOrder = (id) => backend.getOrder(id)
export const listOrders = () => backend.listOrders()
export const listOrdersSince = (since) => backend.listOrdersSince(since)
export const updateStatus = (id, status) => backend.updateStatus(id, status)
export const subscribe = (cb) => backend.subscribe(cb)
