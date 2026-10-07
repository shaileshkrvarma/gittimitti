import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { api, formatINR } from '../api'
import { useAuth } from '../auth'
import type { RootStackParamList } from '../navigation'
import type { Order, Quote } from '../types'
import { Button, ErrorText, styles } from '../ui'

export default function OrdersScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Dashboard'>) {
  const { user, logout } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [error, setError] = useState('')

  const load = useCallback(() => {
    api<Order[]>('/orders').then(setOrders).catch((e) => setError(e.message))
    api<Quote[]>('/quotes').then(setQuotes).catch((e) => setError(e.message))
  }, [])
  useFocusEffect(load)

  const accept = async (q: Quote) => {
    try {
      const res = await api<Quote>(`/quotes/${q.id}/accept`, { method: 'POST' })
      navigation.navigate('Order', { id: res.order_id! })
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.title}>Welcome, {user?.full_name}</Text>
      <Text style={[styles.muted, { marginBottom: 12 }]}>{user?.email}</Text>
      <ErrorText message={error} />
      <Text style={[styles.title, { marginBottom: 8 }]}>My quote requests</Text>
      {quotes.length === 0 ? <Text style={styles.muted}>No quote requests yet.</Text> : null}
      {quotes.map((q) => (
        <View key={q.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.title}>{q.product.name}</Text>
            <Text>{q.status}</Text>
          </View>
          <Text style={styles.muted}>{q.product.supplier.name} · {q.quantity} {q.product.unit}</Text>
          <Text>{q.quoted_total ? `Quoted ${formatINR(q.quoted_total)} (${formatINR(q.quoted_unit_price!)} / ${q.product.unit})` : 'Waiting for price'}</Text>
          {q.supplier_note ? <Text style={styles.muted}>{q.supplier_note}</Text> : null}
          {q.status === 'quoted' ? <Button title="Accept & order" onPress={() => accept(q)} /> : null}
          {q.order_id ? <Button title={`View order #${q.order_id}`} variant="outline" onPress={() => navigation.navigate('Order', { id: q.order_id! })} /> : null}
        </View>
      ))}
      <Text style={[styles.title, { marginVertical: 8 }]}>My orders</Text>
      {orders.length === 0 ? <Text style={styles.muted}>No orders yet.</Text> : null}
      {orders.map((o) => (
        <Pressable key={o.id} style={styles.card} onPress={() => navigation.navigate('Order', { id: o.id })}>
          <View style={styles.row}>
            <Text style={styles.title}>Order #{o.id}</Text>
            <Text>{o.status}</Text>
          </View>
          <Text style={styles.muted}>{new Date(o.created_at).toLocaleDateString()} · {formatINR(o.total_amount)}</Text>
        </Pressable>
      ))}
      <Button title="Logout" variant="outline" onPress={logout} />
    </ScrollView>
  )
}
