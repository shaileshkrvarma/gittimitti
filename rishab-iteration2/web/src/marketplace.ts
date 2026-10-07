import type { Product, Supplier } from './types'

export type SearchMode = 'product' | 'supplier'

export interface SupplierGroup {
  supplier: Supplier
  items: Product[]
}

const has = (text: string | null | undefined, q: string) => !!text && text.toLowerCase().includes(q)

/** Group the catalogue by supplier, filtered by a product search or a supplier search. */
export function groupBySupplier(
  suppliers: Supplier[],
  products: Product[],
  mode: SearchMode,
  query: string,
  categoryId: number | null,
): SupplierGroup[] {
  const q = query.trim().toLowerCase()
  const inCategory = (p: Product) => categoryId === null || p.category.id === categoryId
  const productMatches = (p: Product) =>
    !q || [p.name, p.brand, p.grade, p.category.name, p.description].some((t) => has(t, q))

  return suppliers
    .filter((s) => mode === 'product' || !q || has(s.name, q))
    .map((supplier) => ({
      supplier,
      items: products.filter(
        (p) => p.supplier.id === supplier.id && inCategory(p) && (mode === 'supplier' || productMatches(p)),
      ),
    }))
    .filter((g) => g.items.length > 0 || (mode === 'supplier' && q !== '' && categoryId === null))
}
