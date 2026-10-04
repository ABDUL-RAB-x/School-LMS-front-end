import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import endpoints, { setUnauthorizedHandler } from '../lib/api.js'

const AuthContext = createContext(null)
const PENDING_KEY = 'scholaris.pending'

// Authentication against the API
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [booting, setBooting] = useState(true)

  const [pending, setPending] = useState(() => {
    try {
      const raw = sessionStorage.getItem(PENDING_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    try {
      if (pending) sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))
      else sessionStorage.removeItem(PENDING_KEY)
    } catch {
      // storage unavailable: the pending sign-in just won't survive a reload
    }
  }, [pending])

  // Restore the session on load: the cookie is sent automatically
  useEffect(() => {
    let cancelled = false
    endpoints.auth
      .me()
      .then((res) => {
        if (cancelled) return
        setUser(res.data.user)
        setProfile(res.data.profile)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setBooting(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // A session that cannot be renewed has ended: clear it everywhere
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      setProfile(null)
    })
  }, [])

  const login = useCallback(async ({ email, password, role, remember }) => {
    const res = await endpoints.auth.login({ email, password, role, remember: Boolean(remember) })

    // Demo accounts are signed in straight away: there is no code step
    if (res.data.otpRequired === false) {
      setUser(res.data.user)
      setProfile(res.data.profile)
      setPending(null)
      return { signedIn: true, user: res.data.user }
    }

    const next = {
      role,
      remember: Boolean(remember),
      email: res.data.email,
      maskedEmail: res.data.maskedEmail,
      resendInSeconds: res.data.resendInSeconds ?? 30,
      expiresInMinutes: res.data.expiresInMinutes,
      // Present only while the API runs with MAIL_PREVIEW_ONLY=true (never in production)
      previewCode: res.data.previewCode ?? null,
    }
    setPending(next)
    return next
  }, [])

  const verifyOtp = useCallback(
    async (code) => {
      if (!pending) throw new Error('Your session expired. Please sign in again.')
      const res = await endpoints.auth.verifyOtp({ email: pending.email, code, remember: pending.remember })
      setUser(res.data.user)
      setProfile(res.data.profile)
      setPending(null)
      return res.data.user
    },
    [pending],
  )

  const resendOtp = useCallback(async () => {
    if (!pending) throw new Error('Your session expired. Please sign in again.')
    const res = await endpoints.auth.resendOtp({ email: pending.email })
    setPending((p) => ({ ...p, previewCode: res.data.previewCode ?? null }))
    return res.data
  }, [pending])

  const changePassword = useCallback(async (body) => {
    const res = await endpoints.auth.changePassword(body)
    setUser(res.data.user)
    return res
  }, [])

  const clearLocal = useCallback(() => {
    setUser(null)
    setProfile(null)
    setPending(null)
  }, [])

  const logout = useCallback(async () => {
    try {
      if (user) await endpoints.auth.logout()
      else await endpoints.auth.endSession()
    } catch {
      // Signing out locally matters more than the server acknowledging it
      await endpoints.auth.endSession().catch(() => {})
    }
    clearLocal()
  }, [user, clearLocal])

  const logoutAll = useCallback(async () => {
    await endpoints.auth.logoutAll()
    clearLocal()
  }, [clearLocal])

  const refreshProfile = useCallback(async () => {
    const res = await endpoints.auth.me()
    setUser(res.data.user)
    setProfile(res.data.profile)
    return res.data
  }, [])

  const value = useMemo(
    () => ({ user, profile, pending, booting, login, verifyOtp, resendOtp, changePassword, logout, logoutAll, refreshProfile }),
    [user, profile, pending, booting, login, verifyOtp, resendOtp, changePassword, logout, logoutAll, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
