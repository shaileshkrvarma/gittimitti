import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api'

export function useList<T>(path: string) {
  const [items, setItems] = useState<T[]>([])
  const [error, setError] = useState('')
  const reload = useCallback(() => {
    api<T[]>(path)
      .then((data) => {
        setItems(data)
        setError('')
      })
      .catch((e) => setError(e.message))
  }, [path])
  useEffect(reload, [reload])
  return { items, error, reload, setError }
}
