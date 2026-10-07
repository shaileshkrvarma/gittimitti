import { formatINR } from '../../api'
import StatusChip from '../../components/StatusChip'
import type { Category, Product, Supplier } from '../../types'
import ResourceTable from './ResourceTable'
import { useList } from './useList'

const active = (v?: boolean) => <StatusChip status={v ? 'active' : 'inactive'} />

export function SuppliersTab() {
  return (
    <ResourceTable<Supplier>
      title="supplier"
      path="/admin/suppliers"
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'email', label: 'Email' },
        { name: 'phone', label: 'Phone' },
        { name: 'address', label: 'Address', type: 'multiline' },
        { name: 'is_active', label: 'Active', type: 'boolean' },
      ]}
      columns={[
        { label: 'ID', render: (s) => s.id },
        { label: 'Name', render: (s) => s.name },
        { label: 'Email', render: (s) => s.email ?? '—' },
        { label: 'Phone', render: (s) => s.phone ?? '—' },
        { label: 'Status', render: (s) => active(s.is_active) },
      ]}
      toForm={(s) => ({ ...s, email: s.email ?? '', phone: s.phone ?? '', address: s.address ?? '' })}
    />
  )
}

export function CategoriesTab() {
  return (
    <ResourceTable<Category>
      title="category"
      path="/admin/categories"
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'description', label: 'Description', type: 'multiline' },
        { name: 'is_active', label: 'Active', type: 'boolean' },
      ]}
      columns={[
        { label: 'ID', render: (c) => c.id },
        { label: 'Name', render: (c) => c.name },
        { label: 'Description', render: (c) => c.description ?? '—' },
        { label: 'Status', render: (c) => active(c.is_active) },
      ]}
      toForm={(c) => ({ ...c, description: c.description ?? '' })}
    />
  )
}

export function ProductsTab() {
  const suppliers = useList<Supplier>('/admin/suppliers').items
  const categories = useList<Category>('/admin/categories').items
  return (
    <ResourceTable<Product>
      title="product"
      path="/admin/products"
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'description', label: 'Description', type: 'multiline' },
        { name: 'price', label: 'Price per unit (INR), leave empty for "Price on request"', type: 'number' },
        { name: 'unit', label: 'Unit (bag, tonne, piece, trolley, sq ft…)', required: true },
        { name: 'brand', label: 'Brand' },
        { name: 'grade', label: 'Grade / size' },
        { name: 'min_order_qty', label: 'Minimum order quantity', type: 'number', required: true },
        { name: 'image_url', label: 'Image URL' },
        { name: 'supplier_id', label: 'Supplier', type: 'select', required: true, options: suppliers.map((s) => ({ value: s.id, label: s.name })) },
        { name: 'category_id', label: 'Category', type: 'select', required: true, options: categories.map((c) => ({ value: c.id, label: c.name })) },
        { name: 'is_active', label: 'Active', type: 'boolean' },
      ]}
      columns={[
        { label: 'ID', render: (p) => p.id },
        { label: 'Name', render: (p) => p.name },
        { label: 'Supplier', render: (p) => p.supplier.name },
        { label: 'Category', render: (p) => p.category.name },
        { label: 'Price', render: (p) => (p.price === null ? 'On request' : `${formatINR(p.price)} / ${p.unit}`) },
        { label: 'Min order', render: (p) => `${p.min_order_qty} ${p.unit}` },
        { label: 'Status', render: (p) => active(p.is_active) },
      ]}
      toForm={(p) => ({
        name: p.name,
        description: p.description ?? '',
        price: p.price ?? '',
        unit: p.unit,
        brand: p.brand ?? '',
        grade: p.grade ?? '',
        min_order_qty: p.min_order_qty,
        image_url: p.image_url ?? '',
        supplier_id: p.supplier.id,
        category_id: p.category.id,
        is_active: p.is_active,
      })}
    />
  )
}
