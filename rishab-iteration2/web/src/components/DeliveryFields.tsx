import { MenuItem, TextField } from '@mui/material'
import { DISTRICTS } from '../constants'

export interface DeliveryForm {
  delivery_address: string
  delivery_city: string
  delivery_district: string
}

export default function DeliveryFields({ value, onChange }: { value: DeliveryForm; onChange: (v: DeliveryForm) => void }) {
  return (
    <>
      <TextField label="Delivery address (site / house, landmark)" required multiline minRows={2} value={value.delivery_address} onChange={(e) => onChange({ ...value, delivery_address: e.target.value })} />
      <TextField label="City / village" required value={value.delivery_city} onChange={(e) => onChange({ ...value, delivery_city: e.target.value })} />
      <TextField select label="District" required value={value.delivery_district} onChange={(e) => onChange({ ...value, delivery_district: e.target.value })}>
        {DISTRICTS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
      </TextField>
    </>
  )
}
