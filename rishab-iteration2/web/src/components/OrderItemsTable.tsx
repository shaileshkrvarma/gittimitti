import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { formatINR } from '../api'
import type { OrderItem } from '../types'

export default function OrderItemsTable({ items }: { items: OrderItem[] }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Product</TableCell>
          <TableCell>Supplier</TableCell>
          <TableCell align="right">Unit price</TableCell>
          <TableCell align="right">Qty</TableCell>
          <TableCell align="right">Total</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((i) => (
          <TableRow key={i.id}>
            <TableCell>{i.product_name}</TableCell>
            <TableCell>{i.supplier_name}</TableCell>
            <TableCell align="right">{formatINR(i.unit_price)} / {i.unit}</TableCell>
            <TableCell align="right">{i.quantity} {i.unit}</TableCell>
            <TableCell align="right">{formatINR(i.line_total)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
