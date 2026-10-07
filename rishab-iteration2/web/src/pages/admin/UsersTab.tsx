import { Alert, Paper, Switch, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { api } from '../../api'
import type { User } from '../../types'
import { useList } from './useList'

export default function UsersTab() {
  const { items, error, reload, setError } = useList<User>('/admin/users')
  const toggle = async (u: User) => {
    try {
      await api(`/admin/users/${u.id}`, { method: 'PATCH', body: { is_active: !u.is_active } })
      reload()
    } catch (e) {
      setError((e as Error).message)
    }
  }
  return (
    <Paper>
      {error && <Alert severity="error">{error}</Alert>}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Registered</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.id}</TableCell>
              <TableCell>{u.full_name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.phone ?? '—'}</TableCell>
              <TableCell>{u.role}</TableCell>
              <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <Switch checked={u.is_active} onChange={() => toggle(u)} slotProps={{ input: { 'aria-label': `active-${u.id}` } }} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}
