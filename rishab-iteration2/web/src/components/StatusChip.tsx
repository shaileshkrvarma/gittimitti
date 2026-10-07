import { Chip } from '@mui/material'

const colors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  paid: 'success',
  succeeded: 'success',
  sent: 'success',
  pending: 'warning',
  requested: 'warning',
  quoted: 'default',
  accepted: 'success',
  new: 'warning',
  contacted: 'default',
  closed: 'success',
  skipped: 'default',
  failed: 'error',
  active: 'success',
}

export default function StatusChip({ status }: { status: string }) {
  return <Chip size="small" label={status} color={colors[status] ?? 'default'} />
}
