import { Alert, Box, Button, MenuItem, Paper, TextField, Typography } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { api } from '../api'
import { ENQUIRY_CATEGORIES } from '../constants'

const empty = { name: '', phone: '', city: '', category: '', message: '' }

export default function EnquiryPage() {
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/enquiries', { method: 'POST', body: { ...form, city: form.city || null, message: form.message || null } })
      setSent(true)
      setForm(empty)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 560, mx: 'auto' }}>
      <Typography variant="h5">Send an enquiry</Typography>
      <Typography color="text.secondary" gutterBottom>
        Building materials, house construction, renovation, interiors or government projects. Tell us what you need.
      </Typography>
      {sent ? (
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Alert severity="success">Enquiry received. Our team will contact you soon.</Alert>
          <Button onClick={() => setSent(false)}>Send another enquiry</Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Your name" required value={form.name} onChange={set('name')} />
          <TextField label="Mobile number" required value={form.phone} onChange={set('phone')} placeholder="+919876543210" />
          <TextField label="City / village" value={form.city} onChange={set('city')} />
          <TextField select label="I need help with" required value={form.category} onChange={set('category')}>
            {ENQUIRY_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <TextField label="Message / requirements" multiline minRows={3} value={form.message} onChange={set('message')} />
          <Button type="submit" variant="contained" disabled={busy}>Submit enquiry</Button>
        </Box>
      )}
    </Paper>
  )
}
