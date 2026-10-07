import { Alert, Box, Collapse, IconButton, Paper, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { Fragment, useState } from 'react'
import { formatINR } from '../../api'
import OrderItemsTable from '../../components/OrderItemsTable'
import StatusChip from '../../components/StatusChip'
import type { Order } from '../../types'
import { useList } from './useList'

export default function OrdersTab() {
  const { items, error } = useList<Order>('/admin/orders')
  const [open, setOpen] = useState<number | null>(null)
  return (
    <Paper>
      {error && <Alert severity="error">{error}</Alert>}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Order</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Suppliers</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Total</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((o) => (
            <Fragment key={o.id}>
              <TableRow>
                <TableCell>
                  <IconButton size="small" aria-label="expand" onClick={() => setOpen(open === o.id ? null : o.id)}>
                    {open === o.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </TableCell>
                <TableCell>#{o.id}</TableCell>
                <TableCell>{o.user?.full_name} ({o.user?.email})</TableCell>
                <TableCell>{[...new Set(o.items.map((i) => i.supplier_name))].join(', ')}</TableCell>
                <TableCell>{new Date(o.created_at).toLocaleString()}</TableCell>
                <TableCell align="right">{formatINR(o.total_amount)}</TableCell>
                <TableCell><StatusChip status={o.status} /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 0, borderBottom: open === o.id ? undefined : 'none' }}>
                  <Collapse in={open === o.id} unmountOnExit>
                    <Box sx={{ py: 1 }}>
                      {o.delivery_address && <Box sx={{ mb: 1 }}>Deliver to: {o.delivery_address}, {o.delivery_city} ({o.delivery_district})</Box>}
                      <OrderItemsTable items={o.items} />
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}
