import { Alert, Box, Button, Paper, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { api, formatINR } from '../api'
import OrderItemsTable from '../components/OrderItemsTable'
import StatusChip from '../components/StatusChip'
import type { Order, Payment } from '../types'

export default function OrderPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setOrder(await api<Order>(`/orders/${id}`))
      setPayments(await api<Payment[]>(`/orders/${id}/payments`))
    } catch (err) {
      setError((err as Error).message)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const pay = async (outcome: 'success' | 'failure') => {
    setBusy(true)
    setError('')
    try {
      const payment = await api<Payment>(`/orders/${id}/payments`, { method: 'POST' })
      await api<Payment>(`/payments/${payment.id}/confirm`, { method: 'POST', body: { mock_outcome: outcome } })
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (error && !order) return <Alert severity="error">{error}</Alert>
  if (!order) return null

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h5">Order #{order.id}</Typography>
        <StatusChip status={order.status} />
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {order.delivery_address && (
        <Typography sx={{ mb: 2 }} color="text.secondary">
          Deliver to: {order.delivery_address}, {order.delivery_city} ({order.delivery_district})
        </Typography>
      )}
      <OrderItemsTable items={order.items} />
      <Typography variant="h6" sx={{ mt: 2, textAlign: 'right' }}>Total: {formatINR(order.total_amount)}</Typography>

      {order.status === 'pending' && (
        <Box sx={{ mt: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Demo payment gateway — no real money is charged. Choose the outcome to simulate.
          </Alert>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" color="success" disabled={busy} onClick={() => pay('success')}>
              Pay {formatINR(order.total_amount)} (simulate success)
            </Button>
            <Button variant="outlined" color="error" disabled={busy} onClick={() => pay('failure')}>
              Simulate failure
            </Button>
          </Box>
        </Box>
      )}
      {order.status === 'paid' && <Alert severity="success" sx={{ mt: 2 }}>Payment received. Thank you!</Alert>}

      {payments.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1">Payment attempts</Typography>
          {payments.map((p) => (
            <Box key={p.id} sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 0.5 }}>
              <Typography variant="body2">#{p.id} · {new Date(p.created_at).toLocaleString()}</Typography>
              <StatusChip status={p.status} />
            </Box>
          ))}
        </Box>
      )}
      <Button component={RouterLink} to="/dashboard" sx={{ mt: 2 }}>Back to dashboard</Button>
    </Paper>
  )
}
