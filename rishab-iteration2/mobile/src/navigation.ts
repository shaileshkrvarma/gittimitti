import type { Product } from './types'

export type RootStackParamList = {
  Login: undefined
  Register: undefined
  Products: undefined
  Quote: { product: Product }
  Dashboard: undefined
  Order: { id: number }
}
