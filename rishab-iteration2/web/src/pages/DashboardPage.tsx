import { Alert, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { api, formatINR } from '../api'
import { useAuth } from '../auth'
import StatusChip from '../components/StatusChip'
import type { Order, Quote } from '../types'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const quoteSent = (useLocation().state as { quoteSent?: boolean } | null)?.quoteSent
  const [orders, setOrders] = useState<Order[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [error, setError] = useState('')

  const load = () => {
    api<Order[]>('/orders').then(setOrders).catch((e) => setError(e.message))
    api<Quote[]>('/quotes').then(setQuotes).catch((e) => setError(e.message))
  }
  useEffect(load, [])

  const accept = async (q: Quote) => {
    try {
      const res = await api<Quote>(`/quotes/${q.id}/accept`, { method: 'POST' })
      navigate(`/orders/${res.order_id}`)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5">Welcome, {user?.full_name}</Typography>
        <Typography color="text.secondary">{user?.email}{user?.phone ? ` · ${user.phone}` : ''}</Typography>
      </Paper>
      {quoteSent && <Alert severity="success" sx={{ mb: 2 }}>Quote request sent. The supplier will reply with a price.</Alert>}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>My quote requests</Typography>
        {quotes.length === 0 ? (
          <Typography color="text.secondary">No quote requests yet. Use "Get quote" on any item.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Item</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Quoted price</TableCell>
                <TableCell>Supplier note</TableCell>
                <TableCell>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {quotes.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>{q.id}</TableCell>
                  <TableCell>{q.product.name} · {q.product.supplier.name}</TableCell>
                  <TableCell align="right">{q.quantity} {q.product.unit}</TableCell>
                  <TableCell align="right">
                    {q.quoted_total ? `${formatINR(q.quoted_total)} (${formatINR(q.quoted_unit_price!)} / ${q.product.unit})` : 'Waiting for price'}
                  </TableCell>
                  <TableCell>{q.supplier_note ?? '—'}</TableCell>
                  <TableCell><StatusChip status={q.status} /></TableCell>
                  <TableCell>
                    {q.status === 'quoted' && <Button size="small" variant="contained" onClick={() => accept(q)}>Accept & order</Button>}
                    {q.order_id && <RouterLink to={`/orders/${q.order_id}`}>Order #{q.order_id}</RouterLink>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>My orders</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {orders.length === 0 ? (
          <Typography color="text.secondary">No orders yet.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Items</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell><RouterLink to={`/orders/${o.id}`}>#{o.id}</RouterLink></TableCell>
                  <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{o.items.reduce((n, i) => n + i.quantity, 0)}</TableCell>
                  <TableCell align="right">{formatINR(o.total_amount)}</TableCell>
                  <TableCell><StatusChip status={o.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </>
  )
}
