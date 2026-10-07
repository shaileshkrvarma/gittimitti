import { describe, expect, it } from 'vitest'
import { groupBySupplier } from './marketplace'
import type { Product, Supplier } from './types'

const cement = { id: 1, name: 'Cement' }
const bricks = { id: 2, name: 'Bricks' }
const suppliers: Supplier[] = [
  { id: 1, name: 'GittiMitti Infratech' },
  { id: 2, name: 'Sample Kiln' },
  { id: 3, name: 'Empty Traders' },
]
const product = (id: number, name: string, supplier: Supplier, category: { id: number; name: string }, brand: string | null = null): Product => ({
  id,
  name,
  description: null,
  price: null,
  unit: 'bag',
  brand,
  grade: null,
  min_order_qty: 1,
  image_url: null,
  is_active: true,
  supplier: { id: supplier.id, name: supplier.name },
  category: { ...category, description: null, is_active: true },
})
const products = [
  product(1, 'OPC 53 Cement', suppliers[0], cement, 'UltraTech'),
  product(2, 'Red Clay Bricks', suppliers[1], bricks),
  product(3, 'PPC Cement', suppliers[1], cement, 'ACC'),
]
const names = (gs: ReturnType<typeof groupBySupplier>) => gs.map((g) => [g.supplier.name, g.items.map((i) => i.name)])

describe('groupBySupplier', () => {
  it('shows every supplier with items when there is no search', () => {
    expect(names(groupBySupplier(suppliers, products, 'product', '', null))).toEqual([
      ['GittiMitti Infratech', ['OPC 53 Cement']],
      ['Sample Kiln', ['Red Clay Bricks', 'PPC Cement']],
    ])
  })

  it('product search finds matching items across suppliers (name or brand)', () => {
    expect(names(groupBySupplier(suppliers, products, 'product', 'cement', null))).toEqual([
      ['GittiMitti Infratech', ['OPC 53 Cement']],
      ['Sample Kiln', ['PPC Cement']],
    ])
    expect(names(groupBySupplier(suppliers, products, 'product', 'ultratech', null))).toEqual([
      ['GittiMitti Infratech', ['OPC 53 Cement']],
    ])
  })

  it('supplier search shows all items of matching suppliers', () => {
    expect(names(groupBySupplier(suppliers, products, 'supplier', 'kiln', null))).toEqual([
      ['Sample Kiln', ['Red Clay Bricks', 'PPC Cement']],
    ])
    expect(names(groupBySupplier(suppliers, products, 'supplier', 'empty', null))).toEqual([['Empty Traders', []]])
  })

  it('applies the category filter', () => {
    expect(names(groupBySupplier(suppliers, products, 'supplier', 'kiln', bricks.id))).toEqual([
      ['Sample Kiln', ['Red Clay Bricks']],
    ])
  })
})
