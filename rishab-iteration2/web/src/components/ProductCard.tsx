import { Box, Button, Card, CardActions, CardContent, CardMedia, Chip, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { priceLabel } from '../constants'
import type { Product } from '../types'

export default function ProductCard({ product: p, showQuote }: { product: Product; showQuote?: boolean }) {
  const navigate = useNavigate()
  return (
    <Card sx={{ display: 'flex', flexDirection: 'column' }}>
      {p.image_url && <CardMedia component="img" height="160" image={p.image_url} alt={p.name} />}
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6">{p.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {p.category.name} · by {p.supplier.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
          {p.brand && <Chip size="small" label={p.brand} />}
          {p.grade && <Chip size="small" variant="outlined" label={p.grade} />}
        </Box>
        {p.description && <Typography variant="body2" sx={{ mt: 1 }}>{p.description}</Typography>}
        <Typography variant="h6" sx={{ mt: 1 }}>{priceLabel(p)}</Typography>
        {p.price !== null && (
          <Typography variant="caption" color="text.secondary" component="div">
            Listed price; final price comes in the quote.
          </Typography>
        )}
        {p.min_order_qty > 1 && (
          <Typography variant="caption" color="text.secondary">
            Minimum order: {p.min_order_qty} {p.unit}
          </Typography>
        )}
      </CardContent>
      {showQuote && (
        <CardActions>
          <Button variant="contained" onClick={() => navigate(`/quote/${p.id}`)}>
            Request quote
          </Button>
        </CardActions>
      )}
    </Card>
  )
}
