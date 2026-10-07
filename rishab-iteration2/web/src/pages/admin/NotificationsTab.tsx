import { Alert, Paper, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import StatusChip from '../../components/StatusChip'
import type { Notification } from '../../types'
import { useList } from './useList'

export default function NotificationsTab() {
  const { items, error } = useList<Notification>('/admin/notifications')
  return (
    <Paper>
      <Alert severity="info">Demo mode: notifications are logged, not actually sent.</Alert>
      {error && <Alert severity="error">{error}</Alert>}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Channel</TableCell>
            <TableCell>Event</TableCell>
            <TableCell>Recipient</TableCell>
            <TableCell>Message</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((n) => (
            <TableRow key={n.id}>
              <TableCell>{new Date(n.created_at).toLocaleString()}</TableCell>
              <TableCell>{n.channel}</TableCell>
              <TableCell>{n.event}</TableCell>
              <TableCell>{n.recipient ?? '—'}</TableCell>
              <TableCell>{n.message}</TableCell>
              <TableCell title={n.error ?? ''}><StatusChip status={n.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}
