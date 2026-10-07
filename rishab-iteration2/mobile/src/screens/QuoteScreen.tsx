import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useState } from 'react'
import { ScrollView, Text } from 'react-native'
import { api, formatINR } from '../api'
import type { RootStackParamList } from '../navigation'
import { Button, ErrorText, Input, styles } from '../ui'

export default function QuoteScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'Quote'>) {
  const { product } = route.params
  const [quantity, setQuantity] = useState(String(product.min_order_qty))
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('Samastipur')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      await api('/quotes', {
        method: 'POST',
        body: {
          product_id: product.id,
          quantity: Number(quantity),
          delivery_address: address,
          delivery_city: city,
          delivery_district: district,
          message: message || null,
        },
      })
      navigation.replace('Dashboard')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.title}>{product.name}</Text>
      <Text style={styles.muted}>by {product.supplier.name}</Text>
      <Text style={{ marginBottom: 8 }}>
        {product.price === null ? 'Price on request' : `Listed ${formatINR(product.price)} / ${product.unit}`}
      </Text>
      <ErrorText message={error} />
      <Text>Quantity ({product.unit}){product.min_order_qty > 1 ? `, minimum ${product.min_order_qty}` : ''}</Text>
      <Input keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
      <Input placeholder="Delivery address (site / house, landmark)" value={address} onChangeText={setAddress} autoCapitalize="sentences" />
      <Input placeholder="City / village" value={city} onChangeText={setCity} autoCapitalize="words" />
      <Input placeholder="District (Samastipur, Darbhanga, Begusarai, Muzaffarpur, Other)" value={district} onChangeText={setDistrict} autoCapitalize="words" />
      <Input placeholder="Message (optional)" value={message} onChangeText={setMessage} autoCapitalize="sentences" />
      <Button title="Send quote request" onPress={submit} disabled={busy || !address.trim() || !city.trim() || !district.trim()} />
    </ScrollView>
  )
}
