// Cardápio Kami Sushi.
// Regra de unidades: o preço do cardápio é o da porção cheia (8 ou 10 un.);
// a meia porção (4 ou 5 un.) custa metade.

const pecas = (preco, metade, completo) => [
  { id: `${metade}`, label: `${metade} un.`, price: preco / 2 },
  { id: `${completo}`, label: `${completo} un.`, price: preco },
]
const p4 = (preco) => pecas(preco, 4, 8)
const p5 = (preco) => pecas(preco, 5, 10)
const tamanhos = (p, g) => [
  { id: 'P', label: 'Pequeno (P)', price: p },
  { id: 'G', label: 'Grande (G)', price: g },
]

const SALMAO_PREPARO = {
  id: 'preparo',
  label: 'Salmão',
  choices: ['Fresco', 'Flambado'],
}

const ADICIONAIS_BURGER = [
  { id: 'carne', label: 'Carne bovina', price: 7 },
  { id: 'bacon', label: 'Bacon', price: 5 },
  { id: 'cheddar', label: 'Cheddar', price: 5 },
]

export const CATEGORIAS = [
  {
    id: 'entradas',
    name: 'Entradas',
    jp: '前菜',
    items: [
      { id: 'sunomono-simples', name: 'Sunomono Simples', desc: 'Pepino japonês, kani e gergelim moído', price: 15 },
      { id: 'sunomono-especial', name: 'Sunomono Especial', desc: 'Pepino japonês, kani, camarão, salmão e gergelim moído', price: 22 },
      { id: 'ceviche-especial', name: 'Ceviche Especial', desc: 'Salmão, kani, camarão e cebola roxa marinados em molho cítrico', price: 25 },
      { id: 'bolinho-salmao', name: 'Bolinho de Salmão', desc: 'Salmão temperado com cream cheese', variants: p5(30) },
      {
        id: 'poke',
        name: 'Poke',
        desc: 'Salmão ou camarão, arroz, kani, fruta, cebolinha, cream cheese e pepino japonês',
        price: 40,
        options: [
          { id: 'proteina', label: 'Proteína', choices: ['Salmão', 'Camarão'] },
          { id: 'fruta', label: 'Fruta', choices: ['Manga', 'Morango', 'Abacaxi'] },
        ],
      },
      { id: 'rolinho-primavera', name: 'Rolinho Primavera', desc: 'Patê de salmão ou camarão, cream cheese, envoltos na massa de harumaki, cebolinha e gergelim', price: 25, units: '2 un.', options: [{ id: 'recheio', label: 'Recheio', choices: ['Salmão', 'Camarão'] }] },
    ],
  },
  {
    id: 'niguiris',
    name: 'Niguiris',
    jp: '握り',
    items: [
      { id: 'niguiri-salmao-fresco', name: 'Niguiri Salmão Fresco', desc: 'Lâmina de salmão com arroz', price: 10, units: '2 un.' },
      { id: 'niguiri-salmao-flambado', name: 'Niguiri Salmão Flambado', desc: 'Lâmina de salmão flambado com arroz', price: 10, units: '2 un.' },
      { id: 'niguiri-camarao', name: 'Niguiri de Camarão', desc: 'Camarão cozido com arroz', price: 10, units: '2 un.' },
      { id: 'niguiri-kani', name: 'Niguiri de Kani Kama', desc: 'Kani kama com arroz', price: 8, units: '2 un.' },
      { id: 'niguiri-skin', name: 'Niguiri de Skin', desc: 'Salmão temperado com cream cheese', price: 6, units: '2 un.' },
    ],
  },
  {
    id: 'sashimis',
    name: 'Sashimis',
    jp: '刺身',
    items: [
      { id: 'sashimi-fresco', name: 'Sashimi Salmão Fresco', desc: 'Lâminas de salmão fresco com gergelim', variants: p5(40) },
      { id: 'sashimi-flambado', name: 'Sashimi Salmão Flambado', desc: 'Lâminas de salmão flambado com gergelim', variants: p5(40) },
    ],
  },
  {
    id: 'gunkas',
    name: 'Gunkas',
    jp: '軍艦',
    items: [
      { id: 'gunka-abacaxi', name: 'Gunka Abacaxi', desc: 'Arroz, salmão, cream cheese, abacaxi e gergelim', variants: p4(40), options: [SALMAO_PREPARO] },
      { id: 'gunka-salmao-fresco', name: 'Gunka Salmão Fresco', desc: 'Arroz, salmão fresco, cream cheese, cebolinha e gergelim', variants: p4(40) },
      { id: 'gunka-salmao-flambado', name: 'Gunka Salmão Flambado', desc: 'Arroz, salmão flambado com cream cheese, cebolinha e gergelim', variants: p4(40) },
      { id: 'gunka-ebitem-jhelly', name: 'Gunka Ebitem Jhelly', desc: 'Lâminas de salmão, camarão empanado, cream cheese e geleia de pimenta', variants: p4(40), options: [SALMAO_PREPARO] },
      { id: 'gunka-camarao-empanado', name: 'Gunka Camarão Empanado', desc: 'Lâminas de salmão, arroz, cream cheese, camarão empanado e geleia de pimenta', variants: p4(40), options: [SALMAO_PREPARO] },
      { id: 'gunka-camarao', name: 'Gunka Camarão', desc: 'Arroz, salmão, cream cheese e camarão', variants: p4(40), options: [SALMAO_PREPARO] },
    ],
  },
  {
    id: 'joys',
    name: 'Joys',
    jp: 'ジョイ',
    items: [
      { id: 'joy-salmao', name: 'Joy de Salmão', desc: 'Lâminas de salmão flambado, cream cheese e gergelim', variants: p4(35) },
      { id: 'joy-kani', name: 'Joy de Kani Kama', desc: 'Lâminas de salmão flambado, kani, cream cheese e gergelim', variants: p4(35) },
      { id: 'joy-camarao-empanado', name: 'Joy de Camarão Empanado', desc: 'Lâminas de salmão flambado, camarão empanado, gergelim e cream cheese', variants: p4(35) },
      { id: 'joy-camarao', name: 'Joy de Camarão', desc: 'Lâminas de salmão flambado, camarão fresco, cream cheese e gergelim', variants: p4(35) },
      { id: 'joy-salmao-jhelly', name: 'Joy Salmão Jhelly', desc: 'Lâminas de salmão flambado, geleia de pimenta, flocos de harumaki e gergelim', variants: p4(35) },
    ],
  },
  {
    id: 'hossomakis',
    name: 'Hossomakis',
    jp: '細巻',
    items: [
      { id: 'hosso-salmao-fresco', name: 'Hossomaki Salmão Fresco', desc: 'Nori, arroz e salmão fresco', variants: p5(25) },
      { id: 'hosso-salmao-grelhado', name: 'Hossomaki Salmão Grelhado', desc: 'Nori, arroz e salmão grelhado', variants: p5(25) },
      { id: 'hosso-camarao', name: 'Hossomaki Camarão', desc: 'Nori, arroz e camarão cozido', variants: p5(25) },
      { id: 'hosso-camarao-empanado', name: 'Hossomaki Camarão Empanado', desc: 'Nori, arroz e camarão empanado', variants: p5(25) },
      { id: 'hosso-kani', name: 'Hossomaki Kani Kama', desc: 'Nori, arroz e kani kama', variants: p5(22) },
    ],
  },
  {
    id: 'uramakis',
    name: 'Uramakis',
    jp: '裏巻',
    items: [
      { id: 'ura-filadelfia', name: 'Uramaki Filadélfia', desc: 'Salmão fresco, arroz, nori, gergelim, cream cheese e cebolinha', variants: p5(30) },
      { id: 'ura-camarao', name: 'Uramaki Camarão', desc: 'Camarão cozido, arroz, nori, gergelim, cream cheese e cebolinha', variants: p5(26) },
      { id: 'ura-ebitem', name: 'Uramaki Ebitem', desc: 'Camarão empanado, arroz, nori, gergelim, cream cheese e cebolinha', variants: p5(28) },
      { id: 'ura-skin', name: 'Uramaki Skin', desc: 'Pele de salmão empanada, arroz, nori, gergelim, cream cheese e cebolinha', variants: p5(22) },
      { id: 'ura-kani', name: 'Uramaki Kani Kama', desc: 'Kani kama, arroz, nori, gergelim, cream cheese e cebolinha', variants: p5(24) },
      { id: 'ura-salmao-grelhado', name: 'Uramaki Salmão Grelhado', desc: 'Salmão grelhado, arroz, nori, gergelim, cream cheese e cebolinha', variants: p5(26) },
      { id: 'ura-salmao-empanado', name: 'Uramaki Salmão Empanado', desc: 'Salmão empanado, arroz, nori, gergelim, cream cheese e cebolinha', variants: p5(26) },
      { id: 'ura-especial-jhelly', name: 'Uramaki Especial Jhelly', desc: 'Salmão fresco, arroz, nori, gergelim, cream cheese, lâminas de salmão e geleia de pimenta', variants: p5(30) },
      { id: 'ura-ebitem-especial', name: 'Uramaki Ebitem Especial', desc: 'Camarão empanado, arroz, nori, gergelim, cream cheese e lâminas de salmão', variants: p5(30) },
      { id: 'ura-kani-sake', name: 'Uramaki Kani Sake', desc: 'Kani kama, cream cheese e salmão fresco', variants: p5(24) },
      { id: 'kani-queijo', name: 'Kani Queijo', desc: 'Kani kama e cream cheese', variants: p5(25) },
    ],
  },
  {
    id: 'temakis',
    name: 'Temakis',
    jp: '手巻',
    items: [
      { id: 'temaki-filadelfia', name: 'Temaki Filadélfia', desc: 'Salmão fresco, arroz, nori, gergelim e cebolinha', price: 30 },
      { id: 'temaki-salmao-flambado', name: 'Temaki Salmão Flambado', desc: 'Salmão flambado, arroz, nori, gergelim e cream cheese', price: 30 },
      { id: 'temaki-salmao-grelhado', name: 'Temaki Salmão Grelhado', desc: 'Salmão grelhado, arroz, nori, gergelim e cream cheese', price: 26 },
      { id: 'temaki-camarao', name: 'Temaki Camarão', desc: 'Camarão cozido, arroz, nori, gergelim, cream cheese e cebolinha', price: 28 },
      { id: 'temaki-ebitem', name: 'Temaki Ebitem', desc: 'Camarão empanado, arroz, nori, gergelim, cream cheese e cebolinha', price: 28 },
      { id: 'temaki-kani', name: 'Temaki Kani Kama', desc: 'Kani kama, arroz, nori, gergelim, cream cheese e cebolinha', price: 22 },
      { id: 'temaki-skin', name: 'Temaki Skin', desc: 'Pele de salmão empanado, arroz, nori, gergelim, cream cheese e cebolinha', price: 22 },
      { id: 'temaki-hot-salmao', name: 'Temaki Hot Salmão', desc: 'Salmão grelhado, arroz, nori, cream cheese, gergelim e cebolinha (empanado)', price: 28 },
      { id: 'temaki-hot-camarao', name: 'Temaki Hot Camarão', desc: 'Camarão cozido, arroz, nori, cream cheese, gergelim e cebolinha (empanado)', price: 28 },
      { id: 'temaki-hot-harumaki', name: 'Temaki Hot Harumaki', desc: 'Salmão grelhado, cream cheese, gergelim e cebolinha envoltos na massa de harumaki empanada', price: 35 },
      { id: 'temaki-supremo', name: 'Temaki Supremo', desc: 'Camarão empanado, arroz, cream cheese e cebolinha envoltos de salmão flambado', price: 50, featured: true },
      { id: 'temaki-kani-sake', name: 'Temaki Kani Sake', desc: 'Salmão, kani, arroz, nori, cebolinha, gergelim e cream cheese', price: 28 },
      { id: 'temaki-sake-ebi', name: 'Temaki Sake Ebi', desc: 'Salmão, camarão cozido, arroz, nori, cream cheese, cebolinha e gergelim', price: 28 },
      { id: 'temaki-ebi-jhelly', name: 'Temaki Ebi Jhelly', desc: 'Camarão empanado, arroz, nori, cebolinha, cream cheese, gergelim e geleia de pimenta', price: 28 },
      { id: 'temaki-furikake', name: 'Temaki Furikake', desc: 'Salmão, camarão, arroz, cream cheese, nori, cebolinha, gergelim e furikake', price: 28 },
    ],
  },
  {
    id: 'hot-dogs',
    name: 'Hot Dogs',
    jp: 'ホットドッグ',
    items: [
      { id: 'hd-filadelfia', name: 'Hot Dog Filadélfia', desc: 'Salmão fresco, nori, arroz, cream cheese, gergelim e cebolinha', price: 25 },
      { id: 'hd-salmao-grelhado', name: 'Hot Dog Salmão Grelhado', desc: 'Salmão grelhado, arroz, nori, cream cheese, gergelim e cebolinha', price: 25 },
      { id: 'hd-camarao', name: 'Hot Dog Camarão', desc: 'Camarão cozido, arroz, nori, gergelim, cream cheese e cebolinha', price: 25 },
      { id: 'hd-ebitem', name: 'Hot Dog Ebitem', desc: 'Camarão empanado, arroz, nori, gergelim, cream cheese e cebolinha', price: 25 },
      { id: 'hd-skin', name: 'Hot Dog Skin', desc: 'Pele de salmão empanado, arroz, nori, gergelim, cream cheese e cebolinha', price: 20 },
      { id: 'hd-kani', name: 'Hot Dog Kani Kama', desc: 'Kani kama, arroz, nori, gergelim, cream cheese e cebolinha', price: 20 },
      { id: 'big-dog', name: 'Big Dog Especial', desc: 'Salmão fresco, camarão, arroz, nori, gergelim, cream cheese e cebolinha', price: 30, featured: true },
      { id: 'hd-morango-nutella', name: 'Hot Dog Morango c/ Nutella', desc: 'Morango, arroz, nori, cream cheese e Nutella', price: 25 },
      { id: 'hd-banana-doce', name: 'Hot Dog Banana c/ Doce de Leite', desc: 'Banana, arroz, nori, cream cheese e doce de leite', price: 22 },
    ],
  },
  {
    id: 'hots',
    name: 'Hots',
    jp: 'ホット',
    items: [
      { id: 'hot-filadelfia', name: 'Hot Filadélfia', desc: 'Salmão, arroz, nori, cream cheese, gergelim e cebolinha', price: 22 },
      { id: 'hot-kani-salmao', name: 'Hot Kani Salmão', desc: 'Kani, cream cheese, salmão grelhado, gergelim e cebolinha', price: 30 },
      { id: 'hot-kani', name: 'Hot Kani Kama', desc: 'Kani kama, arroz, nori, cream cheese, gergelim e cebolinha', price: 18 },
      { id: 'hot-camarao', name: 'Hot Camarão Cozido', desc: 'Camarão cozido, nori, arroz, cream cheese, gergelim e cebolinha', price: 22 },
      { id: 'hot-hool', name: 'Hot Hool', desc: 'Nori, salmão, kani kama, camarão, cream cheese, gergelim e cebolinha', price: 28 },
      { id: 'hot-kani-queijo', name: 'Hot Kani Queijo', desc: 'Kani kama, cream cheese e gergelim', price: 30 },
      { id: 'hot-camarao-maki', name: 'Hot Camarão Maki', desc: 'Camarão e cream cheese envoltos na massa de harumaki, cebolinha e gergelim', price: 24 },
      { id: 'hot-salmao-maki', name: 'Hot Salmão Maki', desc: 'Salmão, cream cheese, gergelim e cebolinha envoltos na massa de harumaki', price: 26 },
      { id: 'hot-maki-casa', name: 'Hot Maki da Casa', desc: 'Salmão grelhado, arroz, nori, cream cheese, gergelim, cebolinha e geleia de pimenta', price: 25, featured: true },
    ],
  },
  {
    id: 'doces',
    name: 'Hots Doces',
    jp: '甘味',
    items: [
      { id: 'hot-morango-nutella', name: 'Hot Morango c/ Nutella', desc: 'Hot doce de morango com Nutella', price: 24 },
      { id: 'hot-banana-doce', name: 'Hot Banana c/ Doce de Leite', desc: 'Hot doce de banana com doce de leite', price: 22 },
      { id: 'hot-banana-nutella', name: 'Hot Banana c/ Nutella', desc: 'Hot doce de banana com Nutella', price: 22 },
      { id: 'harumaki-morango', name: 'Harumaki Morango c/ Nutella', desc: 'Harumaki crocante de morango com Nutella', price: 26 },
      { id: 'harumaki-banana', name: 'Harumaki Banana c/ Doce de Leite', desc: 'Harumaki crocante de banana com doce de leite', price: 24 },
      { id: 'banana-empanada', name: 'Banana Empanada', desc: 'Com Nutella ou doce de leite', price: 22, options: [{ id: 'cobertura', label: 'Cobertura', choices: ['Nutella', 'Doce de leite'] }] },
    ],
  },
  {
    id: 'sushi-burguers',
    name: 'Sushi Burguers',
    jp: '寿司バーガー',
    items: [
      { id: 'sb-salmao', name: 'Sushi Burguer Salmão', desc: 'Salmão fresco, arroz, cream cheese, gergelim e cebolinha', price: 30 },
      { id: 'sb-salmao-grelhado', name: 'Sushi Burguer Salmão Grelhado', desc: 'Salmão grelhado, camarão cozido, nori, arroz, cream cheese, gergelim e cebolinha', price: 30 },
      { id: 'sb-camarao', name: 'Sushi Burguer Camarão', desc: 'Camarão cozido, arroz, cream cheese, gergelim e cebolinha', price: 30 },
      { id: 'sb-ebitem', name: 'Sushi Burguer Ebitem', desc: 'Camarão empanado, arroz, cream cheese, gergelim e cebolinha', price: 30 },
      { id: 'sb-kani', name: 'Sushi Burguer Kani Kama', desc: 'Kani kama, arroz, cream cheese, gergelim e cebolinha', price: 26 },
      { id: 'sb-skin', name: 'Sushi Burguer Skin', desc: 'Pele de salmão empanada, arroz e cream cheese', price: 23 },
    ],
  },
  {
    id: 'combinados',
    name: 'Combinados Especiais',
    jp: '盛り合わせ',
    items: [
      { id: 'combo-hot-salmao', name: 'Combo Hot Salmão', desc: '10 hot filadélfia + 1 temaki hot salmão', price: 43 },
      { id: 'combo-hot-camarao', name: 'Combo Hot Camarão', desc: '10 hot camarão + 1 temaki hot camarão', price: 43 },
      { id: 'combo-skin', name: 'Combo Skin', desc: '10 uramaki skin + 1 temaki skin', price: 30 },
      { id: 'combo-salmao-grelhado', name: 'Combo Salmão Grelhado', desc: '10 uramaki salmão grelhado + 1 temaki salmão grelhado', price: 47 },
      { id: 'combo-salmao-fresco', name: 'Combo Salmão Fresco', desc: '10 uramaki filadélfia + 1 temaki filadélfia', price: 47 },
    ],
  },
  {
    id: 'combos',
    name: 'Combos',
    jp: 'コンボ',
    items: [
      { id: 'combo-da-casa', name: 'Combo da Casa', desc: '5 uramaki skin · 5 uramaki kani kama · 5 uramaki especial jhelly · 4 joy de camarão flambado · 10 hot filadélfia', price: 55, units: '29 peças', featured: true },
      { id: 'combo-hots', name: 'Combo Hots', desc: '10 hot camarão · 10 hot filadélfia · 5 hot kani · 5 hot kani queijo', price: 45, units: '30 peças' },
      { id: 'combo-30', name: 'Combo 30', desc: '5 uramaki salmão grelhado · 5 uramaki kani · 10 uramaki skin · 10 hot filadélfia', price: 45, units: '30 peças' },
      { id: 'combo-house', name: 'Combo House', desc: '5 kani queijo · 4 gunka de camarão · 5 sashimis salmão · 5 uramaki camarão · 5 uramaki filadélfia', price: 60, units: '24 peças' },
    ],
  },
  {
    id: 'barcas',
    name: 'Super Barcas',
    jp: '舟盛り',
    items: [
      { id: 'barca-39', name: 'Barca 39', desc: '4 joy camarão flambado · 5 hot filadélfia · 5 hot de kani · 5 uramaki filadélfia · 5 uramaki especial jhelly · 5 kani saquê · 10 uramaki skin', price: 80, units: '39 peças', featured: true },
      { id: 'barca-sushi-familia', name: 'Barca Sushi Família', desc: '10 uramaki salmão grelhado · 10 uramaki filadélfia · 10 uramaki skin · 10 uramaki kani kama · 10 hot filadélfia', price: 80, units: '50 peças' },
      { id: 'barca-familia-hots', name: 'Barca Família Hots', desc: '10 hot kani queijo · 10 hot filadélfia · 10 hot camarão · 10 hot kani kama · 10 hot hool', price: 70, units: '50 peças' },
      { id: 'barca-especial', name: 'Barca Especial', desc: '5 sashimis de salmão · 4 gunka de salmão fresco · 10 hossomaki de camarão · 10 uramaki de salmão grelhado · 10 hot filadélfia', price: 80, units: '39 peças' },
      { id: 'barca-49', name: 'Barca 49', desc: '10 hossomaki camarão · 10 hot filadélfia · 10 kani queijo · 10 uramaki de camarão · 5 sashimi fresco · 4 gunka salmão fresco', price: 90, units: '49 peças', featured: true },
    ],
  },
  {
    id: 'pratos-quentes',
    name: 'Pratos Quentes',
    jp: '温かい料理',
    items: [
      { id: 'yakissoba-misto', name: 'Yakissoba Misto', desc: 'Carne, frango, macarrão e legumes', variants: tamanhos(15, 30) },
      { id: 'yakissoba-especial', name: 'Yakissoba Especial', desc: 'Carne, frango, camarão, macarrão e legumes', variants: tamanhos(25, 50) },
      { id: 'yakissoba-frutos-mar', name: 'Yakissoba de Frutos do Mar', desc: 'Camarão, salmão, macarrão e legumes', variants: tamanhos(20, 40) },
      { id: 'parmegiana-frango', name: 'Parmegiana de Frango', desc: 'Arroz temperado, batata frita e frango empanado ao molho', variants: tamanhos(30, 50) },
      { id: 'parmegiana-carne', name: 'Parmegiana de Carne', desc: 'Arroz temperado, batata frita e carne de boi empanada ao molho', variants: tamanhos(35, 55) },
      { id: 'parmegiana-camarao', name: 'Parmegiana de Camarão', desc: 'Arroz temperado, batata frita e camarão empanado ao molho', variants: tamanhos(40, 60) },
    ],
  },
  {
    id: 'petiscos',
    name: 'Petiscos',
    jp: 'おつまみ',
    items: [
      { id: 'camarao-empanado', name: 'Camarão Empanado', desc: 'Porção de camarão empanado crocante', price: 45 },
      { id: 'camarao-alho-oleo', name: 'Camarão Alho e Óleo', desc: 'Porção de camarão no alho e óleo', price: 30 },
      { id: 'batata-cheddar-bacon', name: 'Batata Frita com Cheddar e Bacon', desc: 'Batata frita coberta com cheddar e bacon', price: 25 },
      { id: 'batata-frita', name: 'Batata Frita', desc: 'Porção de batata frita', price: 15 },
    ],
  },
  {
    id: 'lanches',
    name: 'Lanches',
    jp: 'バーガー',
    items: [
      { id: 'classico-burguer', name: 'Clássico Burguer', desc: 'Blend bovino, cheddar fatiado, alface, tomate e pão brioche', price: 15, extras: ADICIONAIS_BURGER },
      { id: 'tradicional-burguer', name: 'Tradicional Burguer', desc: 'Blend bovino, mussarela, alface, tomate e pão brioche', price: 15, extras: ADICIONAIS_BURGER },
      { id: 'bacon-crock', name: 'Bacon Crock', desc: 'Blend bovino, creme de cheddar, bacon crocante e pão brioche', price: 17, extras: ADICIONAIS_BURGER },
      { id: 'cheddar-burguer', name: 'Cheddar Burguer', desc: 'Blend bovino, creme de cheddar, farofa de bacon e pão brioche', price: 17, extras: ADICIONAIS_BURGER },
      { id: 'super-burguer', name: 'Super Burguer', desc: 'Blend bovino, creme de cheddar e batata no meio do pão brioche', price: 20, extras: ADICIONAIS_BURGER },
      { id: 'onion-burguer', name: 'Onion Burguer', desc: 'Blend bovino, creme de cheddar, onion e pão brioche', price: 22, extras: ADICIONAIS_BURGER },
      { id: 'nordestino-burguer', name: 'Nordestino Burguer', desc: 'Blend bovino, creme de cheddar, cebola caramelizada, carne, cebolinha e pão brioche', price: 25, extras: ADICIONAIS_BURGER, featured: true },
      { id: 'queijo-crock', name: 'Queijo Crock', desc: 'Blend bovino, creme de cheddar, blend de queijo empanado (coalho e mussarela), bacon e geleia de pimenta', price: 25, extras: ADICIONAIS_BURGER },
      { id: 'cheddar-duplo', name: 'Cheddar Duplo', desc: 'Blend bovino duplo, farofa de bacon, cheddar e pão brioche', price: 32, extras: ADICIONAIS_BURGER },
      { id: 'combo-cheddar-familia', name: 'Combo Cheddar Família', desc: '3 cheddar burguer + batata frita', price: 66 },
    ],
  },
  {
    id: 'bebidas',
    name: 'Bebidas',
    jp: '飲み物',
    items: [
      {
        id: 'suco',
        name: 'Suco',
        desc: 'Limão, laranja, caju, maracujá, morango, graviola ou abacaxi',
        variants: [
          { id: 'agua', label: 'Com água', price: 6 },
          { id: 'leite', label: 'Com leite', price: 8 },
        ],
        options: [{ id: 'sabor', label: 'Sabor', choices: ['Limão', 'Laranja', 'Caju', 'Maracujá', 'Morango', 'Graviola', 'Abacaxi'] }],
      },
      { id: 'caipirinha-limao', name: 'Caipirinha de Limão', desc: '', price: 12 },
      { id: 'caipirinha-vinho', name: 'Caipirinha de Vinho', desc: '', price: 12 },
      { id: 'caipirinha-morango', name: 'Caipirinha de Morango', desc: '', price: 15 },
      { id: 'antarctica-600', name: 'Antarctica 600 ml', desc: 'Cerveja', price: 10 },
      { id: 'antarctica-350', name: 'Antarctica 350 ml', desc: 'Cerveja', price: 6 },
      { id: 'coca-lata', name: 'Coca-Cola Lata', desc: '', price: 6 },
      { id: 'coca-zero-lata', name: 'Coca-Cola Zero Lata', desc: '', price: 6 },
      { id: 'coca-1l', name: 'Coca-Cola 1L', desc: '', price: 10 },
      { id: 'guarana-lata', name: 'Guaraná Lata', desc: '', price: 6 },
      { id: 'guarana-zero-lata', name: 'Guaraná Zero Lata', desc: '', price: 6 },
      { id: 'guarana-1l', name: 'Guaraná 1L', desc: '', price: 10 },
      { id: 'fanta-lata', name: 'Fanta Lata', desc: '', price: 5 },
      { id: 'h2o-limoneto', name: 'H2O Limoneto', desc: '', price: 6 },
      { id: 'h2o-limao', name: 'H2O Limão', desc: '', price: 6 },
      { id: 'redbull', name: 'Red Bull', desc: '', price: 15 },
      { id: 'agua-com-gas', name: 'Água com Gás', desc: '', price: 4 },
      { id: 'agua-sem-gas', name: 'Água sem Gás', desc: '', price: 3 },
    ],
  },
]

export const TODOS_ITENS = CATEGORIAS.flatMap((c) =>
  c.items.map((item) => ({ ...item, categoryId: c.id, categoryName: c.name })),
)

// Sugestões do carrinho ("Que tal adicionar?"), por grupo e em ordem de preferência.
// Só itens sem escolhas (porção, sabor...), para entrar no carrinho com um toque.
export const SUGESTOES = [
  { group: 'bebidas', items: ['coca-lata', 'guarana-lata', 'h2o-limao'] },
  { group: 'doces', items: ['hot-morango-nutella', 'hot-banana-nutella'] },
  { group: 'petiscos', items: ['batata-frita', 'batata-cheddar-bacon'] },
]

// Menor preço do item (para exibir "a partir de").
export function precoBase(item) {
  if (item.variants) return Math.min(...item.variants.map((v) => v.price))
  return item.price
}
