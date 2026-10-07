import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCallback, useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { api, formatINR } from '../api'
import type { RootStackParamList } from '../navigation'
import type { Order, Payment } from '../types'
import { Button, ErrorText, styles } from '../ui'

export default function OrderScreen({ route }: NativeStackScreenProps<RootStackParamList, 'Order'>) {
  const { id } = route.params
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    api<Order>(`/orders/${id}`).then(setOrder).catch((e) => setError(e.message))
  }, [id])

  useEffect(load, [load])

  const pay = async (outcome: 'success' | 'failure') => {
    setBusy(true)
    setError('')
    try {
      const payment = await api<Payment>(`/orders/${id}/payments`, { method: 'POST' })
      const result = await api<Payment>(`/payments/${payment.id}/confirm`, { method: 'POST', body: { mock_outcome: outcome } })
      if (result.status === 'failed') setError('Payment failed. You can try again.')
      load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (!order) {
    return (
      <View style={styles.screen}>
        <ErrorText message={error} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.row}>
        <Text style={styles.title}>Order #{order.id}</Text>
        <Text>{order.status}</Text>
      </View>
      <ErrorText message={error} />
      {order.items.map((i) => (
        <View key={i.id} style={styles.card}>
          <Text style={{ fontWeight: '600' }}>{i.product_name}</Text>
          <Text style={styles.muted}>by {i.supplier_name}</Text>
          <Text>{formatINR(i.unit_price)} × {i.quantity} {i.unit} = {formatINR(i.line_total)}</Text>
        </View>
      ))}
      <Text style={styles.title}>Total: {formatINR(order.total_amount)}</Text>
      {order.status === 'pending' ? (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.muted}>Demo payment gateway — no real money is charged.</Text>
          <Button title="Pay (simulate success)" onPress={() => pay('success')} disabled={busy} />
          <Button title="Simulate failure" variant="danger" onPress={() => pay('failure')} disabled={busy} />
        </View>
      ) : (
        <Text style={{ marginTop: 12, color: '#1b5e20' }}>Payment received. Thank you!</Text>
      )}
    </ScrollView>
  )
}
