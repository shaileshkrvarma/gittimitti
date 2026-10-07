import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import DeliveryFields from '../components/DeliveryFields'
import { emptyDelivery, priceLabel } from '../constants'
import type { Product, Quote } from '../types'

export default function QuoteRequestPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState('')
  const [delivery, setDelivery] = useState(emptyDelivery)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api<Product>(`/products/${productId}`)
      .then((p) => {
        setProduct(p)
        setQuantity(String(p.min_order_qty))
      })
      .catch((e) => setError(e.message))
  }, [productId])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api<Quote>('/quotes', {
        method: 'POST',
        body: { product_id: Number(productId), quantity: Number(quantity), message: message || null, ...delivery },
      })
      navigate('/dashboard', { replace: true, state: { quoteSent: true } })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 560, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>Get a quote</Typography>
      {product && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">{product.name}</Typography>
          <Typography color="text.secondary">
            {[product.brand, product.grade, `by ${product.supplier.name}`].filter(Boolean).join(' · ')}
          </Typography>
          <Typography>{priceLabel(product)}</Typography>
        </Box>
      )}
      <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label={`Quantity${product ? ` (${product.unit})` : ''}`}
          type="number"
          required
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          helperText={product && product.min_order_qty > 1 ? `Minimum ${product.min_order_qty} ${product.unit}` : undefined}
          slotProps={{ htmlInput: { min: product?.min_order_qty ?? 1 } }}
        />
        <DeliveryFields value={delivery} onChange={setDelivery} />
        <TextField label="Message (optional)" multiline minRows={2} value={message} onChange={(e) => setMessage(e.target.value)} />
        <Button type="submit" variant="contained" disabled={busy || !product}>Send quote request</Button>
      </Box>
    </Paper>
  )
}
