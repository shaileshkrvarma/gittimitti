import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton,
  MenuItem, Paper, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { useState, type ReactNode } from 'react'
import { api } from '../../api'
import { useList } from './useList'

export interface Field {
  name: string
  label: string
  type?: 'text' | 'number' | 'boolean' | 'select' | 'multiline'
  required?: boolean
  options?: { value: number; label: string }[]
}

export interface Column<T> {
  label: string
  render: (row: T) => ReactNode
}

interface Props<T> {
  path: string
  fields: Field[]
  columns: Column<T>[]
  toForm: (row: T) => Record<string, unknown>
  title: string
}

type FormState = Record<string, unknown>

function emptyForm(fields: Field[]): FormState {
  return Object.fromEntries(fields.map((f) => [f.name, f.type === 'boolean' ? true : '']))
}

export default function ResourceTable<T extends { id: number }>({ path, fields, columns, toForm, title }: Props<T>) {
  const { items, error, reload, setError } = useList<T>(path)
  const [editing, setEditing] = useState<T | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>({})
  const [formError, setFormError] = useState('')

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm(fields))
    setFormError('')
    setOpen(true)
  }
  const openEdit = (row: T) => {
    setEditing(row)
    setForm({ ...emptyForm(fields), ...toForm(row) })
    setFormError('')
    setOpen(true)
  }
  const save = async () => {
    const body = Object.fromEntries(
      fields.map((f) => {
        const v = form[f.name]
        if (f.type === 'boolean') return [f.name, Boolean(v)]
        if (v === '' || v === undefined) return [f.name, null]
        if (f.type === 'select') return [f.name, Number(v)]
        return [f.name, v]
      }),
    )
    try {
      if (editing) await api(`${path}/${editing.id}`, { method: 'PATCH', body })
      else await api(path, { method: 'POST', body })
      setOpen(false)
      reload()
    } catch (e) {
      setFormError((e as Error).message)
    }
  }
  const remove = async (row: T) => {
    if (!window.confirm('Delete this record?')) return
    try {
      await api(`${path}/${row.id}`, { method: 'DELETE' })
      reload()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Button variant="contained" onClick={openNew}>Add {title}</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((c) => <TableCell key={c.label}>{c.label}</TableCell>)}
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id}>
              {columns.map((c) => <TableCell key={c.label}>{c.render(row)}</TableCell>)}
              <TableCell align="right">
                <IconButton aria-label="edit" onClick={() => openEdit(row)}><EditIcon /></IconButton>
                <IconButton aria-label="delete" onClick={() => remove(row)}><DeleteIcon /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? `Edit ${title}` : `Add ${title}`}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          {fields.map((f) =>
            f.type === 'boolean' ? (
              <FormControlLabel
                key={f.name}
                label={f.label}
                control={<Switch checked={Boolean(form[f.name])} onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })} />}
              />
            ) : (
              <TextField
                key={f.name}
                label={f.label}
                required={f.required}
                select={f.type === 'select'}
                multiline={f.type === 'multiline'}
                type={f.type === 'number' ? 'number' : 'text'}
                value={form[f.name] ?? ''}
                onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
              >
                {f.options?.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            ),
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
