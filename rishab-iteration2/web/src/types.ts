export type Role = 'user' | 'supplier' | 'admin'

export interface User {
  id: number
  full_name: string
  email: string
  phone: string | null
  role: Role
  is_active: boolean
  created_at: string
}

export interface Supplier {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  is_active?: boolean
}

export interface Category {
  id: number
  name: string
  description: string | null
  is_active: boolean
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
  image_url: string | null
  is_active: boolean
  supplier: { id: number; name: string }
  category: Category
}

export interface OrderItem {
  id: number
  product_id: number
  supplier_id: number
  product_name: string
  supplier_name: string
  unit_price: string
  unit: string
  quantity: number
  line_total: string
}

export interface Delivery {
  delivery_address: string | null
  delivery_city: string | null
  delivery_district: string | null
}

export interface Order extends Delivery {
  id: number
  user_id: number
  status: 'pending' | 'paid'
  total_amount: string
  currency: string
  created_at: string
  items: OrderItem[]
  user?: User
}

export interface Payment {
  id: number
  order_id: number
  provider: string
  provider_reference: string
  amount: string
  currency: string
  status: 'pending' | 'succeeded' | 'failed'
  created_at: string
}

export interface Notification {
  id: number
  user_id: number
  channel: 'email' | 'sms' | 'whatsapp'
  event: string
  recipient: string | null
  message: string
  status: 'sent' | 'failed' | 'skipped'
  error: string | null
  created_at: string
}

export interface AdminStats {
  users: number
  suppliers: number
  categories: number
  products: number
  orders: number
  paid_orders: number
  revenue: string
}

export interface SupplierOrder extends Delivery {
  id: number
  status: 'pending' | 'paid'
  created_at: string
  customer_name: string
  items: OrderItem[]
  supplier_total: string
}

export interface Quote {
  id: number
  status: 'requested' | 'quoted' | 'accepted'
  product: Product
  customer_name: string
  quantity: number
  delivery_address: string
  delivery_city: string
  delivery_district: string
  message: string | null
  quoted_unit_price: string | null
  quoted_total: string | null
  supplier_note: string | null
  order_id: number | null
  created_at: string
}

export interface Enquiry {
  id: number
  name: string
  phone: string
  city: string | null
  category: string
  message: string | null
  status: 'new' | 'contacted' | 'closed'
  created_at: string
}
