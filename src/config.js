// Dados da loja. Edite aqui para mudar horário, Pix, mesas etc.
export const STORE = {
  name: 'Kami Sushi',
  tagline: 'Culinária japonesa feita na hora',
  whatsapp: '5583993703432',
  whatsappDisplay: '(83) 99370-3432',
  pixKey: '83993703432',
  pixKeyDisplay: '(83) 99370-3432',
  pixKeyType: 'Telefone',
  tables: 12,
  timeZone: 'America/Fortaleza',
  // Abre todos os dias das 19h às 23h.
  hours: { open: 19, close: 23 },
  // Taxa de entrega por cidade. fee: null = valor a combinar pelo WhatsApp.
  deliveryZones: [
    { id: 'inga', name: 'Ingá', fee: 3 },
    { id: 'itatuba', name: 'Itatuba', fee: 15 },
    { id: 'outra', name: 'Outra cidade', fee: null },
  ],
  minOrder: 0,
  // PIN temporário do painel. Será trocado por login real (Supabase).
  adminPin: '1234',
}
