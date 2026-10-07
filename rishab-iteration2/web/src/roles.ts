import type { Role } from './types'

export const dashboardPath = (role: Role) =>
  role === 'admin' ? '/admin' : role === 'supplier' ? '/supplier' : '/dashboard'

export const canBuy = (role?: Role) => role !== 'supplier'
