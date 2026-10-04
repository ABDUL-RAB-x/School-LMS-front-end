import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from 'lucide-react'
import AuthShell from './AuthShell.jsx'
import PasswordRules, { meetsPolicy } from './PasswordRules.jsx'
import { loginPath } from './portals.js'
import { Field, Input } from '../../components/ui/index.jsx'
import endpoints from '../../lib/api.js'

// /reset-password?token=…: the link from the reset email
export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState({})
  const [doneRole, setDoneRole] = useState(null)

  const mismatch = confirm && confirm !== password

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!meetsPolicy(password) || password !== confirm) {
      setFields({
        password: meetsPolicy(password) ? '' : 'The password does not meet every requirement yet.',
        confirmPassword: password === confirm ? '' : 'Both passwords must match.',
      })
      return
    }
    setBusy(true)
    setError('')
    setFields({})
    try {
      const res = await endpoints.auth.resetPassword({ token, password, confirmPassword: confirm })
      setDoneRole(res.data?.role || '')
    } catch (err) {
      setError(err.fields?.token || err.message)
      if (err.fields) setFields(err.fields)
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <AuthShell>
        <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">This link is incomplete</h1>
        <p className="mt-2 text-sm text-ink-muted">Open the link from your reset email again, or request a new one.</p>
        <Link to="/forgot-password" className="btn-primary mt-6 h-[50px] w-full">Request a new link</Link>
      </AuthShell>
    )
  }

  if (doneRole !== null) {
    return (
      <AuthShell>
        <div role="status">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-item bg-green-50 text-success">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">Password updated</h1>
          <p className="mt-2 text-sm text-ink-muted">You&rsquo;ve been signed out everywhere. Sign in with your new password.</p>
          <Link to={loginPath(doneRole)} className="btn-primary mt-6 h-[50px] w-full">Go to sign in</Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-item bg-accent-soft text-accent">
        <KeyRound className="h-6 w-6" />
      </span>
      <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">Choose a new password</h1>
      <p className="mt-1 text-sm text-ink-muted">This link works once. After saving, every device signed in to your account is signed out.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <Field label="New password" required error={fields.password}>
          <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <PasswordRules password={password} />
        <Field label="Confirm new password" required error={fields.confirmPassword || (mismatch ? 'Both passwords must match.' : '')}>
          <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-btn border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-danger">
            <AlertCircle className="mt-px h-4 w-4 shrink-0" />
            <span>
              {error}{' '}
              <Link to="/forgot-password" className="underline">Request a new link</Link>
            </span>
          </div>
        )}

        <button type="submit" disabled={busy} className="btn-primary h-[50px] w-full">
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Save new password'
          )}
        </button>
      </form>
    </AuthShell>
  )
}
