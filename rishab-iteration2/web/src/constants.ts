import { formatINR } from './api'
import type { Product } from './types'

export const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'GittiMitti Marketplace'

// Districts named on gittimitti.com; "Other" keeps delivery open until the client defines service areas.
export const DISTRICTS = ['Samastipur', 'Darbhanga', 'Begusarai', 'Muzaffarpur', 'Other']

// Same options as the enquiry form on gittimitti.com.
export const ENQUIRY_CATEGORIES = [
  'Building Materials (Cement, Bricks, Steel)',
  'House Construction',
  'Commercial Building',
  'Renovation / Repair',
  'Interior Finishing',
  'Government Contract / PMAY',
  'Other',
]

export const emptyDelivery = { delivery_address: '', delivery_city: '', delivery_district: DISTRICTS[0] }

export const priceLabel = (p: Product) => (p.price === null ? 'Price on request' : `${formatINR(p.price)} / ${p.unit}`)
