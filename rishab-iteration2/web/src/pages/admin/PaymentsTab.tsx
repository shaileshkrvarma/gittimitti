import { Alert, Paper, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { formatINR } from '../../api'
import StatusChip from '../../components/StatusChip'
import type { Payment } from '../../types'
import { useList } from './useList'

export default function PaymentsTab() {
  const { items, error } = useList<Payment>('/admin/payments')
  return (
    <Paper>
      {error && <Alert severity="error">{error}</Alert>}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Order</TableCell>
            <TableCell>Provider</TableCell>
            <TableCell>Reference</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.id}</TableCell>
              <TableCell>#{p.order_id}</TableCell>
              <TableCell>{p.provider}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{p.provider_reference}</TableCell>
              <TableCell align="right">{formatINR(p.amount)}</TableCell>
              <TableCell>{new Date(p.created_at).toLocaleString()}</TableCell>
              <TableCell><StatusChip status={p.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}
