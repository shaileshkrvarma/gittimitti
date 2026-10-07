import { Alert, MenuItem, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { api } from '../../api'
import type { Enquiry } from '../../types'
import { useList } from './useList'

export default function EnquiriesTab() {
  const { items, error, reload, setError } = useList<Enquiry>('/admin/enquiries')
  const setStatus = async (e: Enquiry, status: string) => {
    try {
      await api(`/admin/enquiries/${e.id}`, { method: 'PATCH', body: { status } })
      reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }
  return (
    <Paper sx={{ p: 2 }}>
      {error && <Alert severity="error">{error}</Alert>}
      {items.length === 0 ? (
        <Typography color="text.secondary">No enquiries yet.</Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Mobile</TableCell>
              <TableCell>City / village</TableCell>
              <TableCell>Need help with</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((e) => (
              <TableRow key={e.id} sx={{ verticalAlign: 'top' }}>
                <TableCell>{e.id}</TableCell>
                <TableCell>{new Date(e.created_at).toLocaleString()}</TableCell>
                <TableCell>{e.name}</TableCell>
                <TableCell><a href={`tel:${e.phone}`}>{e.phone}</a></TableCell>
                <TableCell>{e.city ?? '—'}</TableCell>
                <TableCell>{e.category}</TableCell>
                <TableCell sx={{ maxWidth: 280 }}>{e.message ?? '—'}</TableCell>
                <TableCell>
                  <TextField select size="small" value={e.status} onChange={(ev) => setStatus(e, ev.target.value)}>
                    {['new', 'contacted', 'closed'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </TextField>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Paper>
  )
}
