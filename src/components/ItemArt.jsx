// Arte do item: usa a foto se existir (item.image), senão um bloco
// com o ideograma da categoria. Quando tiverem fotos dos pratos,
// basta colocar em /public/fotos e preencher `image` no menu.js.
const KANJI = {
  entradas: '前', niguiris: '握', sashimis: '刺', gunkas: '軍', joys: '喜', hossomakis: '細',
  uramakis: '裏', temakis: '手', 'hot-dogs': '犬', hots: '熱', doces: '甘', 'sushi-burguers': '寿',
  combinados: '盛', combos: '組', barcas: '舟', 'pratos-quentes': '麺', petiscos: '肴', lanches: '肉', bebidas: '飲',
}

export default function ItemArt({ item, large = false }) {
  const cls = `art ${large ? 'art--large' : ''} art--${item.categoryId || 'x'}`
  if (item.image) {
    return (
      <div className={cls}>
        <img src={item.image} alt={item.name} loading="lazy" />
      </div>
    )
  }
  return (
    <div className={cls} aria-hidden="true">
      <span className="art__kanji">{KANJI[item.categoryId] || '神'}</span>
    </div>
  )
}
