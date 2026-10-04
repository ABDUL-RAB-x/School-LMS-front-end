import { useCallback, useEffect, useRef, useState } from 'react'

// Runs an async loader and tracks { data, loading, error }
export default function useApi(loader, deps = [], { skip = false, initial = null } = {}) {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(!skip)
  const [error, setError] = useState(null)
  const alive = useRef(true)
  const runId = useRef(0)

  const run = useCallback(async () => {
    const id = ++runId.current
    setLoading(true)
    setError(null)
    try {
      const result = await loader()
      // Ignore results from a request that a newer one has superseded
      if (alive.current && id === runId.current) setData(result)
      return result
    } catch (err) {
      if (alive.current && id === runId.current) setError(err)
      return null
    } finally {
      if (alive.current && id === runId.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    alive.current = true
    if (skip) {
      setLoading(false)
      return undefined
    }
    run()
    return () => {
      alive.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, skip])

  return { data, loading, error, refetch: run, setData }
}

// For buttons that fire a mutation: tracks the in-flight state and surfaces
export function useMutation(fn, { onSuccess, onError } = {}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [fields, setFields] = useState({})

  const mutate = useCallback(
    async (...args) => {
      setBusy(true)
      setError(null)
      setFields({})
      try {
        const result = await fn(...args)
        onSuccess?.(result)
        return result
      } catch (err) {
        setError(err.message)
        if (err.fields) setFields(err.fields)
        onError?.(err)
        return null
      } finally {
        setBusy(false)
      }
    },
    [fn, onSuccess, onError],
  )

  return { mutate, busy, error, fields, setError, setFields }
}

// Debounces a value: used so typing in a search box doesn't fire a request per keystroke
export function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
