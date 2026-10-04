import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, MailCheck } from 'lucide-react'
import AuthShell from './AuthShell.jsx'
import { loginPath } from './portals.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { ROLE_HOME } from '../../components/layout/nav.js'
import { cx } from '../../lib/utils.js'

const LENGTH = 6

export default function VerifyCode() {
  const navigate = useNavigate()
  const { user, booting, pending, verifyOtp, resendOtp, logout } = useAuth()

  const [digits, setDigits] = useState(Array(LENGTH).fill(''))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(pending?.resendInSeconds ?? 30)
  const [resending, setResending] = useState(false)
  const inputs = useRef([])

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (countdown <= 0) return undefined
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  if (!booting && user) return <Navigate to={ROLE_HOME[user.role]} replace />
  if (!booting && !pending) return <Navigate to="/login" replace />
  if (!pending) return null

  const code = digits.join('')

  const setDigit = (idx, value) => {
    const v = value.replace(/\D/g, '')
    setError('')
    setDigits((prev) => {
      const next = [...prev]
      if (v.length > 1) {
        // paste / fast typing: spread across the boxes
        v.split('').forEach((ch, i) => {
          if (idx + i < LENGTH) next[idx + i] = ch
        })
        const land = Math.min(idx + v.length, LENGTH - 1)
        requestAnimationFrame(() => inputs.current[land]?.focus())
      } else {
        next[idx] = v
        if (v && idx < LENGTH - 1) requestAnimationFrame(() => inputs.current[idx + 1]?.focus())
      }
      return next
    })
  }

  const onKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) inputs.current[idx - 1]?.focus()
    if (e.key === 'ArrowLeft' && idx > 0) inputs.current[idx - 1]?.focus()
    if (e.key === 'ArrowRight' && idx < LENGTH - 1) inputs.current[idx + 1]?.focus()
  }

  const onSubmit = async (e) => {
    e?.preventDefault()
    if (busy || success) return
    setBusy(true)
    setError('')
    try {
      const account = await verifyOtp(code)
      setSuccess(true)
      setTimeout(() => navigate(ROLE_HOME[account.role], { replace: true }), 700)
    } catch (err) {
      setError(err.fields?.code || err.message)
      setDigits(Array(LENGTH).fill(''))
      inputs.current[0]?.focus()
    } finally {
      setBusy(false)
    }
  }

  const onResend = async () => {
    if (countdown > 0 || resending) return
    setResending(true)
    setError('')
    try {
      const res = await resendOtp()
      setCountdown(res.resendInSeconds ?? 30)
      setDigits(Array(LENGTH).fill(''))
      inputs.current[0]?.focus()
    } catch (err) {
      setError(err.message)
      // The API tells us how long is left on the cooldown
      if (err.status === 429) setCountdown((c) => (c > 0 ? c : 30))
    } finally {
      setResending(false)
    }
  }

  const goBack = async () => {
    const back = loginPath(pending.role)
    await logout()
    navigate(back, { replace: true })
  }

  return (
    <AuthShell>
      <button
        onClick={goBack}
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </button>

      <span
        className={cx(
          'mb-4 flex h-12 w-12 items-center justify-center rounded-item transition-colors',
          success ? 'bg-green-50 text-success' : 'bg-accent-soft text-accent',
        )}
      >
        {success ? <CheckCircle2 className="h-6 w-6" /> : <MailCheck className="h-6 w-6" />}
      </span>

      <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">Verify your email</h1>
      <p className="mt-1 text-sm text-ink-muted">
        We sent a code to <span className="font-semibold text-ink">{pending.email}</span>
      </p>

      <form onSubmit={onSubmit} className="mt-6">
        <div className="flex justify-between gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={LENGTH}
              aria-label={`Digit ${i + 1}`}
              disabled={success}
              className={cx(
                'h-[58px] w-full rounded-[12px] border bg-white text-center font-display text-xl font-semibold text-ink',
                'transition-all duration-200 focus:outline-none focus:ring-2',
                success
                  ? 'border-success text-success ring-0'
                  : error
                    ? 'border-danger focus:border-danger focus:ring-danger/15'
                    : 'border-field focus:border-accent focus:ring-accent/15',
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="err"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex items-start gap-2 rounded-btn border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-danger"
            >
              <AlertCircle className="mt-px h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              key="ok"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex items-start gap-2 rounded-btn border border-green-200 bg-green-50 px-4 py-3 text-[13px] font-medium text-success"
            >
              <CheckCircle2 className="mt-px h-4 w-4 shrink-0" />
              Verified — taking you to your dashboard…
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={code.length < LENGTH || busy || success}
          className="btn-primary mt-5 h-[50px] w-full"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </>
          ) : (
            'Verify & Continue'
          )}
        </button>
      </form>

      <div className="mt-5 text-center text-[13px] text-ink-muted">
        Didn&rsquo;t get the code?{' '}
        <button
          type="button"
          onClick={onResend}
          disabled={countdown > 0 || resending}
          className={cx(
            'font-semibold transition-colors',
            countdown > 0 || resending ? 'cursor-not-allowed text-ink-faint' : 'text-accent hover:underline',
          )}
        >
          {resending ? 'Sending…' : countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
        </button>
      </div>

      {/* Only present while the API runs with MAIL_PREVIEW_ONLY=true. */}
      {pending.previewCode && (
        <p className="mt-5 rounded-btn border border-amber-200 bg-amber-50 px-4 py-3 text-center text-[12px] text-warning">
          Mail preview mode — your code is{' '}
          <span className="font-mono text-[13px] font-bold tracking-widest">{pending.previewCode}</span>
          <br />
          Set <span className="font-mono">MAIL_PREVIEW_ONLY=false</span> to send it by email instead.
        </p>
      )}
    </AuthShell>
  )
}
