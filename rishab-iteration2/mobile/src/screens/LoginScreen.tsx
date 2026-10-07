import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { useAuth } from '../auth'
import type { RootStackParamList } from '../navigation'
import { Button, ErrorText, Input, styles } from '../ui'

export default function LoginScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Login'>) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      await login(email.trim(), password)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={[styles.title, { marginBottom: 12 }]}>Login</Text>
      <ErrorText message={error} />
      <Input placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <Input placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <Button title="Login" onPress={submit} disabled={busy || !email || !password} />
      <Button title="Create an account" variant="outline" onPress={() => navigation.navigate('Register')} />
    </View>
  )
}
