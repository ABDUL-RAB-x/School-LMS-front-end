import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import AuthShell from './AuthShell.jsx'
import { PORTALS, PUBLIC_PORTALS, loginPath } from './portals.js'
import { Field, Input } from '../../components/ui/index.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { ROLE_HOME } from '../../components/layout/nav.js'
import { cx } from '../../lib/utils.js'

// /admin/login, /teacher/login, /student/login: keyed by role so switching portals starts with a clean form
export default function Login({ role }) {
  const portal = PORTALS[role]
  if (!portal) return <Navigate to="/login" replace />
  return <PortalLogin key={portal.key} portal={portal} />
}

function PortalLogin({ portal }) {
  const navigate = useNavigate()
  const { user, booting, login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [touched, setTouched] = useState({})

  if (!booting && user) return <Navigate to={ROLE_HOME[user.role]} replace />

  const Icon = portal.icon
  // Teacher and student pages link to each other; the admin page links to neither, and neither links to it
  const otherPortals = portal.public ? PUBLIC_PORTALS.filter((p) => p.key !== portal.key) : []
  const emailError = fieldErrors.email || (touched.email && !email.trim() ? 'Email is required.' : '')
  const passError = fieldErrors.password || (touched.password && !password ? 'Password is required.' : '')

  const onSubmit = async (e) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    if (!email.trim() || !password) return

    setBusy(true)
    setError('')
    setFieldErrors({})
    try {
      const result = await login({ email, password, role: portal.key, remember })
      navigate(result.signedIn ? ROLE_HOME[result.user.role] : '/verify')
    } catch (err) {
      setError(err.message)
      if (err.fields) setFieldErrors(err.fields)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      {portal.public && (
        <Link
          to="/login"
          className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-muted transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          All sign-in options
        </Link>
      )}

      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-item bg-accent-soft text-accent">
        <Icon className="h-6 w-6" />
      </span>
      <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">{portal.title}</h1>
      <p className="mt-1 text-sm text-ink-muted">{portal.description}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <Field label="Email address" required error={emailError}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-faint" />
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setFieldErrors((f) => ({ ...f, email: '' }))
              }}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              placeholder="you@scholaris.edu"
              className={cx('pl-11', emailError && 'border-danger focus:border-danger focus:ring-danger/15')}
            />
          </div>
        </Field>

        <Field label="Password" required error={passError}>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-faint" />
            <Input
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setFieldErrors((f) => ({ ...f, password: '' }))
              }}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              placeholder="••••••••"
              className={cx('pl-11 pr-12', passError && 'border-danger focus:border-danger focus:ring-danger/15')}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-btn p-2 text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink"
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-muted">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-field accent-[#0F766E] focus:ring-accent/30"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Keep me signed in
          </label>
          <Link to={`/forgot-password?role=${portal.key}`} className="text-[13px] font-semibold text-ink-muted hover:text-accent">
            Forgot password?
          </Link>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 rounded-btn border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-danger"
            >
              <AlertCircle className="mt-px h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <button type="submit" disabled={busy} className="btn-primary h-[50px] w-full">
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending code…
            </>
          ) : (
            <>
              Send Verification Code
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <p className="text-center text-[12px] text-ink-muted">
          We&rsquo;ll email you a 6-digit code to confirm it&rsquo;s you.
        </p>
      </form>

      {otherPortals.length > 0 && (
        <p className="mt-6 border-t border-line pt-5 text-center text-[13px] text-ink-muted">
          Not a {portal.label.toLowerCase()}?{' '}
          {otherPortals.map((p, i) => (
            <span key={p.key}>
              {i > 0 && ' · '}
              <Link to={loginPath(p.key)} className="font-semibold text-accent hover:underline">
                {p.label} sign in
              </Link>
            </span>
          ))}
        </p>
      )}
    </AuthShell>
  )
}
