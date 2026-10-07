import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { SectionList, Text, View } from 'react-native'
import { api, formatINR } from '../api'
import type { RootStackParamList } from '../navigation'
import type { Product, Supplier } from '../types'
import { Button, ErrorText, Input, styles } from '../ui'

type Mode = 'product' | 'supplier'

const has = (t: string | null, q: string) => !!t && t.toLowerCase().includes(q)

export default function ProductsScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Products'>) {
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [mode, setMode] = useState<Mode>('product')
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    setRefreshing(true)
    try {
      const [s, p] = await Promise.all([api<Supplier[]>('/suppliers'), api<Product[]>('/products')])
      setSuppliers(s)
      setProducts(p)
      setError('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const sections = useMemo(() => {
    const query = q.trim().toLowerCase()
    return suppliers
      .filter((s) => mode === 'product' || !query || has(s.name, query))
      .map((s) => ({
        title: s.name,
        data: products.filter(
          (p) =>
            p.supplier.id === s.id &&
            (mode === 'supplier' || !query || [p.name, p.brand, p.grade, p.category.name].some((t) => has(t, query))),
        ),
      }))
      .filter((s) => s.data.length > 0)
  }, [suppliers, products, mode, q])

  return (
    <View style={styles.screen}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button title="By product" variant={mode === 'product' ? 'primary' : 'outline'} onPress={() => setMode('product')} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="By supplier" variant={mode === 'supplier' ? 'primary' : 'outline'} onPress={() => setMode('supplier')} />
        </View>
      </View>
      <Input placeholder={mode === 'supplier' ? 'Search suppliers' : 'Search products, brand, grade'} value={q} onChangeText={setQ} />
      <ErrorText message={error} />
      <SectionList
        sections={sections}
        keyExtractor={(p) => String(p.id)}
        refreshing={refreshing}
        onRefresh={load}
        ListEmptyComponent={<Text style={styles.muted}>Nothing matches your search.</Text>}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.title, { backgroundColor: '#fff', paddingVertical: 6 }]}>{section.title} ({section.data.length})</Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.muted}>{item.category.name}</Text>
            {item.brand || item.grade ? <Text>{[item.brand, item.grade].filter(Boolean).join(' · ')}</Text> : null}
            <Text style={[styles.title, { marginTop: 6 }]}>
              {item.price === null ? 'Price on request' : `${formatINR(item.price)} / ${item.unit}`}
            </Text>
            {item.min_order_qty > 1 ? <Text style={styles.muted}>Minimum order: {item.min_order_qty} {item.unit}</Text> : null}
            <Button title="Request quote" onPress={() => navigation.navigate('Quote', { product: item })} />
          </View>
        )}
      />
    </View>
  )
}
