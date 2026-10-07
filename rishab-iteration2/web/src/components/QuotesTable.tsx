import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { api, formatINR } from '../api'
import type { Quote } from '../types'
import StatusChip from './StatusChip'
import { useList } from '../pages/admin/useList'

/** Quote requests for a supplier or admin, who can reply with a price. */
export default function QuotesTable({ path, onChange }: { path: string; onChange?: () => void }) {
  const { items, error, reload } = useList<Quote>(path)
  const [editing, setEditing] = useState<Quote | null>(null)
  const [price, setPrice] = useState('')
  const [note, setNote] = useState('')
  const [formError, setFormError] = useState('')

  const open = (q: Quote) => {
    setEditing(q)
    setPrice(q.quoted_unit_price ?? q.product.price ?? '')
    setNote(q.supplier_note ?? '')
    setFormError('')
  }
  const save = async () => {
    if (!editing) return
    try {
      await api(`${path}/${editing.id}/respond`, { method: 'POST', body: { unit_price: price, note: note || null } })
      setEditing(null)
      reload()
      onChange?.()
    } catch (e) {
      setFormError((e as Error).message)
    }
  }

  return (
    <Paper sx={{ p: 2 }}>
      {error && <Alert severity="error">{error}</Alert>}
      {items.length === 0 ? (
        <Typography color="text.secondary">No quote requests yet.</Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Item</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell>Deliver to</TableCell>
              <TableCell>Message</TableCell>
              <TableCell align="right">Quoted</TableCell>
              <TableCell>Status</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((q) => (
              <TableRow key={q.id} sx={{ verticalAlign: 'top' }}>
                <TableCell>{q.id}</TableCell>
                <TableCell>{new Date(q.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{q.customer_name}</TableCell>
                <TableCell>{q.product.name}<br /><Typography variant="caption" color="text.secondary">{q.product.supplier.name}</Typography></TableCell>
                <TableCell align="right">{q.quantity} {q.product.unit}</TableCell>
                <TableCell>{q.delivery_address}, {q.delivery_city} ({q.delivery_district})</TableCell>
                <TableCell>{q.message ?? '—'}</TableCell>
                <TableCell align="right">
                  {q.quoted_total ? <>{formatINR(q.quoted_total)}<br /><Typography variant="caption">{formatINR(q.quoted_unit_price!)} / {q.product.unit}</Typography></> : '—'}
                </TableCell>
                <TableCell><StatusChip status={q.status} /></TableCell>
                <TableCell>
                  {q.status === 'accepted' ? (
                    q.order_id && <Typography variant="body2">Order #{q.order_id}</Typography>
                  ) : (
                    <Button size="small" variant="outlined" onClick={() => open(q)}>{q.status === 'quoted' ? 'Revise' : 'Send price'}</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="xs">
        <DialogTitle>Quote #{editing?.id}: {editing?.quantity} {editing?.product.unit} {editing?.product.name}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField label={`Price per ${editing?.product.unit ?? 'unit'} (INR)`} type="number" required value={price} onChange={(e) => setPrice(e.target.value)} />
          {editing && price && <Typography>Total: {formatINR(Number(price) * editing.quantity)}</Typography>}
          <TextField label="Note to customer (optional)" multiline value={note} onChange={(e) => setNote(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Send</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}

