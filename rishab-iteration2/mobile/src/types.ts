export interface User {
  id: number
  full_name: string
  email: string
  phone: string | null
  role: 'user' | 'admin'
}

export interface Product {
  id: number
  name: string
  description: string | null
  price: string | null
  unit: string
  brand: string | null
  grade: string | null
  min_order_qty: number
  supplier: { id: number; name: string }
  category: { id: number; name: string }
}

export interface OrderItem {
  id: number
  product_name: string
  supplier_name: string
  unit_price: string
  unit: string
  quantity: number
  line_total: string
}

export interface Order {
  id: number
  status: 'pending' | 'paid'
  total_amount: string
  created_at: string
  delivery_address: string | null
  delivery_city: string | null
  delivery_district: string | null
  items: OrderItem[]
}

export interface Payment {
  id: number
  status: 'pending' | 'succeeded' | 'failed'
}

export interface Supplier {
  id: number
  name: string
}

export interface Quote {
  id: number
  status: 'requested' | 'quoted' | 'accepted'
  product: Product
  quantity: number
  quoted_unit_price: string | null
  quoted_total: string | null
  supplier_note: string | null
  order_id: number | null
}
