import { Alert, Badge, Box, Paper, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { api, formatINR } from '../../api'
import { useAuth } from '../../auth'
import OrderItemsTable from '../../components/OrderItemsTable'
import QuotesTable from '../../components/QuotesTable'
import StatusChip from '../../components/StatusChip'
import type { Category, Product, Quote, Supplier, SupplierOrder } from '../../types'
import ResourceTable from '../admin/ResourceTable'
import { useList } from '../admin/useList'

function MyItemsTab() {
  const { items: categories } = useList<Category>('/categories')
  return (
    <ResourceTable<Product>
      title="item"
      path="/supplier/products"
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'description', label: 'Description', type: 'multiline' },
        { name: 'price', label: 'Price per unit (INR), leave empty for "Price on request"', type: 'number' },
        { name: 'unit', label: 'Unit (bag, tonne, piece, trolley, sq ft…)', required: true },
        { name: 'brand', label: 'Brand' },
        { name: 'grade', label: 'Grade / size' },
        { name: 'min_order_qty', label: 'Minimum order quantity', type: 'number', required: true },
        { name: 'image_url', label: 'Image URL' },
        { name: 'category_id', label: 'Category', type: 'select', required: true, options: categories.map((c) => ({ value: c.id, label: c.name })) },
        { name: 'is_active', label: 'Active', type: 'boolean' },
      ]}
      columns={[
        { label: 'ID', render: (p) => p.id },
        { label: 'Name', render: (p) => p.name },
        { label: 'Category', render: (p) => p.category.name },
        { label: 'Price', render: (p) => (p.price === null ? 'On request' : `${formatINR(p.price)} / ${p.unit}`) },
        { label: 'Min order', render: (p) => `${p.min_order_qty} ${p.unit}` },
        { label: 'Status', render: (p) => <StatusChip status={p.is_active ? 'active' : 'inactive'} /> },
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
        category_id: p.category.id,
        is_active: p.is_active,
      })}
    />
  )
}

function OrdersTab() {
  const { items: orders, error } = useList<SupplierOrder>('/supplier/orders')
  return (
    <Paper sx={{ p: 2 }}>
      {error && <Alert severity="error">{error}</Alert>}
      {orders.length === 0 ? (
        <Typography color="text.secondary">No orders for your items yet.</Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Deliver to</TableCell>
              <TableCell>Your items</TableCell>
              <TableCell align="right">Your total</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id} sx={{ verticalAlign: 'top' }}>
                <TableCell>#{o.id}</TableCell>
                <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{o.customer_name}</TableCell>
                <TableCell>{o.delivery_address ? `${o.delivery_address}, ${o.delivery_city} (${o.delivery_district})` : '—'}</TableCell>
                <TableCell sx={{ minWidth: 360 }}><OrderItemsTable items={o.items} /></TableCell>
                <TableCell align="right">{formatINR(o.supplier_total)}</TableCell>
                <TableCell><StatusChip status={o.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Paper>
  )
}


export default function SupplierPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Supplier | null>(null)
  const current = useLocation().pathname.split('/')[2] ?? 'items'
  const [newQuotes, setNewQuotes] = useState(0)

  useEffect(() => {
    api<Supplier>('/supplier/profile').then(setProfile).catch(() => {})
  }, [])
  const countNew = useCallback(() => {
    api<Quote[]>('/supplier/quotes')
      .then((qs) => setNewQuotes(qs.filter((q) => q.status === 'requested').length))
      .catch(() => {})
  }, [])
  useEffect(countNew, [countNew, current])

  const tabs = [
    { path: 'items', label: 'My items', element: <MyItemsTab /> },
    { path: 'quotes', label: 'Quote requests', element: <QuotesTable path="/supplier/quotes" onChange={countNew} /> },
    { path: 'orders', label: 'Orders', element: <OrdersTab /> },
  ]

  return (
    <>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5">{profile?.name ?? 'Supplier dashboard'}</Typography>
        <Typography color="text.secondary">
          {user?.full_name} · {user?.email}
        </Typography>
      </Paper>
      <Tabs value={tabs.some((t) => t.path === current) ? current : 'items'} sx={{ mb: 2 }}>
        {tabs.map((t) => (
          <Tab
            key={t.path}
            value={t.path}
            label={t.path === 'quotes' && newQuotes ? <Badge color="error" badgeContent={newQuotes} sx={{ pr: 1.5 }}>{t.label}</Badge> : t.label}
            component={RouterLink}
            to={`/supplier/${t.path}`}
          />
        ))}
      </Tabs>
      <Box>
        <Routes>
          {tabs.map((t) => (
            <Route key={t.path} path={t.path} element={t.element} />
          ))}
          <Route path="*" element={<Navigate to="items" replace />} />
        </Routes>
      </Box>
    </>
  )
}
