import { Alert, Box, MenuItem, Paper, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import ProductCard from '../components/ProductCard'
import { groupBySupplier, type SearchMode } from '../marketplace'
import { canBuy } from '../roles'
import type { Category, Product, Supplier } from '../types'

export default function MarketplacePage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const mode: SearchMode = params.get('by') === 'supplier' ? 'supplier' : 'product'
  const query = params.get('q') ?? ''
  const categoryId = params.get('category') ? Number(params.get('category')) : null
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api<Supplier[]>('/suppliers'), api<Product[]>('/products'), api<Category[]>('/categories')])
      .then(([s, p, c]) => {
        setSuppliers(s)
        setProducts(p)
        setCategories(c)
      })
      .catch((e) => setError(e.message))
  }, [])

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    setParams(next, { replace: true })
  }

  const groups = useMemo(
    () => groupBySupplier(suppliers, products, mode, query, categoryId),
    [suppliers, products, mode, query, categoryId],
  )
  const itemCount = groups.reduce((n, g) => n + g.items.length, 0)
  const showQuote = canBuy(user?.role)

  return (
    <>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" gutterBottom>Building materials marketplace</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            color="primary"
            value={mode}
            onChange={(_, v) => v && update({ by: v === 'supplier' ? 'supplier' : '' })}
          >
            <ToggleButton value="product">Search by product</ToggleButton>
            <ToggleButton value="supplier">Search by supplier</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            size="small"
            sx={{ minWidth: 280, flexGrow: 1 }}
            label={mode === 'supplier' ? 'Supplier name' : 'Product, brand or grade'}
            placeholder={mode === 'supplier' ? 'e.g. GittiMitti' : 'e.g. cement, UltraTech, Fe-500D'}
            value={query}
            onChange={(e) => update({ q: e.target.value })}
          />
          <TextField select size="small" label="Category" sx={{ minWidth: 200 }} value={categoryId ?? ''} onChange={(e) => update({ category: e.target.value })}>
            <MenuItem value="">All categories</MenuItem>
            {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {itemCount} item{itemCount === 1 ? '' : 's'} from {groups.length} supplier{groups.length === 1 ? '' : 's'}.
          {showQuote && ' Request a quote on any item; the supplier replies with the final price.'}
        </Typography>
      </Paper>
      {error && <Alert severity="error">{error}</Alert>}
      {groups.length === 0 && !error && <Typography color="text.secondary">Nothing matches your search.</Typography>}
      {groups.map(({ supplier, items }) => (
        <Paper key={supplier.id} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6">{supplier.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {items.length} item{items.length === 1 ? '' : 's'}
          </Typography>
          {items.length === 0 ? (
            <Typography color="text.secondary">No items listed yet.</Typography>
          ) : (
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {items.map((p) => <ProductCard key={p.id} product={p} showQuote={showQuote} />)}
            </Box>
          )}
        </Paper>
      ))}
    </>
  )
}
