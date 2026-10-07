import { Alert, Box, Button, Paper, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { dashboardPath } from '../roles'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', supplier_name: '' })
  const [role, setRole] = useState<'user' | 'supplier'>('user')
  const isSupplier = role === 'supplier'
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api('/auth/register', {
        method: 'POST',
        body: { ...form, role, phone: form.phone || null, supplier_name: isSupplier ? form.supplier_name : null },
      })
      const user = await login(form.email, form.password)
      navigate(dashboardPath(user.role), { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 420, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Register
      </Typography>
      <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <ToggleButtonGroup exclusive fullWidth color="primary" value={role} onChange={(_, v) => v && setRole(v)}>
          <ToggleButton value="user">I am a Customer</ToggleButton>
          <ToggleButton value="supplier">I am a Supplier</ToggleButton>
        </ToggleButtonGroup>
        {isSupplier && (
          <TextField label="Supplier / business name" required value={form.supplier_name} onChange={set('supplier_name')} />
        )}
        <TextField label={isSupplier ? 'Contact person name' : 'Full name'} required value={form.full_name} onChange={set('full_name')} />
        <TextField label="Email" type="email" required value={form.email} onChange={set('email')} />
        <TextField label="Mobile (optional, for SMS/WhatsApp)" value={form.phone} onChange={set('phone')} placeholder="+919876543210" />
        <TextField label="Password (min 8 chars)" type="password" required value={form.password} onChange={set('password')} />
        <Button type="submit" variant="contained" disabled={busy}>
          Create account
        </Button>
        <Typography variant="body2">
          Already registered? <RouterLink to="/login">Login</RouterLink>
        </Typography>
      </Box>
    </Paper>
  )
}
