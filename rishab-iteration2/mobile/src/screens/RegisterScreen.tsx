import { useState } from 'react'
import { ScrollView, Text } from 'react-native'
import { api } from '../api'
import { useAuth } from '../auth'
import { Button, ErrorText, Input, styles } from '../ui'

export default function RegisterScreen() {
  const { login } = useAuth()
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v })

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      const body = { ...form, email: form.email.trim(), phone: form.phone.trim() || null }
      await api('/auth/register', { method: 'POST', body })
      await login(body.email, form.password)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScrollView style={styles.screen}>
      <Text style={[styles.title, { marginBottom: 12 }]}>Register</Text>
      <ErrorText message={error} />
      <Input placeholder="Full name" autoCapitalize="words" value={form.full_name} onChangeText={set('full_name')} />
      <Input placeholder="Email" keyboardType="email-address" value={form.email} onChangeText={set('email')} />
      <Input placeholder="Mobile (optional) e.g. +919876543210" keyboardType="phone-pad" value={form.phone} onChangeText={set('phone')} />
      <Input placeholder="Password (min 8 chars)" secureTextEntry value={form.password} onChangeText={set('password')} />
      <Button title="Create account" onPress={submit} disabled={busy} />
    </ScrollView>
  )
}
