import { Alert, Box, Card, CardContent, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { api, formatINR } from '../../api'
import type { AdminStats } from '../../types'

export default function OverviewTab() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api<AdminStats>('/admin/stats').then(setStats).catch((e) => setError(e.message))
  }, [])
  if (error) return <Alert severity="error">{error}</Alert>
  if (!stats) return null
  const cards: [string, string | number][] = [
    ['Users', stats.users],
    ['Suppliers', stats.suppliers],
    ['Categories', stats.categories],
    ['Products', stats.products],
    ['Orders', stats.orders],
    ['Paid orders', stats.paid_orders],
    ['Revenue (paid)', formatINR(stats.revenue)],
  ]
  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
      {cards.map(([label, value]) => (
        <Card key={label}>
          <CardContent>
            <Typography color="text.secondary">{label}</Typography>
            <Typography variant="h5">{value}</Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}
