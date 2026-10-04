import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Loader2, Mail, MailCheck } from 'lucide-react'
import AuthShell from './AuthShell.jsx'
import { loginPath } from './portals.js'
import { Field, Input } from '../../components/ui/index.jsx'
import endpoints from '../../lib/api.js'

// /forgot-password: always answers the same way, whether or not the email has an account
export default function ForgotPassword() {
  const [params] = useSearchParams()
  const back = loginPath(params.get('role'))
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [sent, setSent] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setFieldError('Email is required.')
      return
    }
    setBusy(true)
    setError('')
    setFieldError('')
    try {
      const res = await endpoints.auth.forgotPassword({ email })
      setSent(res.message)
    } catch (err) {
      setError(err.message)
      if (err.fields?.email) setFieldError(err.fields.email)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <Link to={back} className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-muted transition-colors hover:text-accent">
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>

      {sent ? (
        <div role="status">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-item bg-green-50 text-success">
            <MailCheck className="h-6 w-6" />
          </span>
          <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">Check your email</h1>
          <p className="mt-2 text-sm text-ink-muted">{sent}</p>
          <p className="mt-4 text-[13px] text-ink-muted">Didn&rsquo;t get it? Check your spam folder, or ask the school office to confirm the email on your account.</p>
        </div>
      ) : (
        <>
          <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">Reset your password</h1>
          <p className="mt-1 text-sm text-ink-muted">Enter the email on your account and we&rsquo;ll send you a link to choose a new password.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <Field label="Email address" required error={fieldError}>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-faint" />
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  className="pl-11"
                  aria-invalid={Boolean(fieldError)}
                />
              </div>
            </Field>

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-btn border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-danger">
                <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-primary h-[50px] w-full">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending link…
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  )
}
