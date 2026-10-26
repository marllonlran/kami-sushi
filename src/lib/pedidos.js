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
export const FLUXO = {
  entrega: ['novo', 'preparo', 'saiu', 'concluido'],
  retirada: ['novo', 'preparo', 'pronto', 'concluido'],
  mesa: ['novo', 'preparo', 'pronto', 'concluido'],
}

export const ROTULO_TIPO = { entrega: 'Entrega', retirada: 'Retirada', mesa: 'Mesa' }
export const ROTULO_PAGAMENTO = { cartao: 'Cartão (maquininha)', dinheiro: 'Dinheiro', pix: 'Pix' }

/* ---------- Supabase ---------- */

const num = (v) => (v == null ? null : Number(v))

function deRegistro(r) {
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

const remoto = {
  async criarPedido(dados) {
    const { data: registro, error } = await supabase.rpc('create_order', { payload: dados })
    if (error) throw error
    return deRegistro(registro)
  },

  async obterPedido(id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null
    const { data: registro, error } = await supabase.rpc('get_order', { order_id: id })
    if (error) throw error
    return registro ? deRegistro(registro) : null
  },

  // Pedidos das últimas 36 horas (o painel só mostra os em andamento e os de hoje).
  async listarPedidos() {
    const desde = new Date(Date.now() - 36 * 3600 * 1000).toISOString()
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', desde)
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) throw error
    return data.map(deRegistro)
  },

  // Para o relatório: todos os pedidos desde `desde` (busca em páginas de 1000).
  async listarPedidosDesde(desde) {
    const TAMANHO_PAGINA = 1000
    const registros = []
    for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', desde.toISOString())
        .order('created_at', { ascending: true })
        .range(inicio, inicio + TAMANHO_PAGINA - 1)
      if (error) throw error
      registros.push(...data)
      if (data.length < TAMANHO_PAGINA) break
    }
    return registros.map(deRegistro)
  },

  async atualizarStatus(id, status) {
    const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
  },

  // Tempo real para a equipe logada; consulta a cada 10 s como reserva
  // (e para o cliente, que não tem acesso à tabela).
  assinar(cb) {
    const ch = supabase
      .channel(`orders-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => cb())
      .subscribe()
    const temporizador = setInterval(cb, 10000)
    return () => {
      clearInterval(temporizador)
      supabase.removeChannel(ch)
    }
  },
}

/* ---------- Local (teste) ---------- */

const CHAVE = 'kami:orders'
const EVENTO_LOCAL = 'kami:orders-changed'
const canal = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('kami-orders') : null

function ler() {
  try {
    // Pedidos antigos não tinham `code`: usa o id.
    return (JSON.parse(localStorage.getItem(CHAVE)) || []).map((o) => ({ code: o.id, ...o }))
  } catch {
    return []
  }
}

function gravar(pedidos) {
  localStorage.setItem(CHAVE, JSON.stringify(pedidos))
  canal?.postMessage('changed')
  window.dispatchEvent(new Event(EVENTO_LOCAL))
}

const local = {
  async criarPedido(dados) {
    const pedidos = ler()
    let codigo
    do codigo = String(Math.floor(1000 + Math.random() * 9000))
    while (pedidos.some((o) => o.id === codigo))
    const pedido = { ...dados, id: codigo, code: codigo, status: 'novo', createdAt: new Date().toISOString() }
    gravar([pedido, ...pedidos])
    return pedido
  },

  async obterPedido(id) {
    return ler().find((o) => o.id === id) || null
  },

  async listarPedidos() {
    return ler()
  },

  async listarPedidosDesde(desde) {
    return ler().filter((o) => new Date(o.createdAt) >= desde)
  },

  async atualizarStatus(id, status) {
    gravar(ler().map((o) => (o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o)))
  },

  // Avisa mudanças nesta aba e nas outras abas do mesmo navegador.
  assinar(cb) {
    const aoMudarArmazenamento = (e) => e.key === CHAVE && cb()
    const aoReceberMensagem = () => cb()
    window.addEventListener('storage', aoMudarArmazenamento)
    window.addEventListener(EVENTO_LOCAL, aoReceberMensagem)
    canal?.addEventListener('message', aoReceberMensagem)
    return () => {
      window.removeEventListener('storage', aoMudarArmazenamento)
      window.removeEventListener(EVENTO_LOCAL, aoReceberMensagem)
      canal?.removeEventListener('message', aoReceberMensagem)
    }
  },
}

const backend = supabase ? remoto : local

export const naNuvem = !!supabase
export const criarPedido = (dados) => backend.criarPedido(dados)
export const obterPedido = (id) => backend.obterPedido(id)
export const listarPedidos = () => backend.listarPedidos()
export const listarPedidosDesde = (desde) => backend.listarPedidosDesde(desde)
export const atualizarStatus = (id, status) => backend.atualizarStatus(id, status)
export const assinar = (cb) => backend.assinar(cb)
