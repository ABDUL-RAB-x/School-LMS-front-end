import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AlertCircle, KeyRound, Loader2, LogOut } from 'lucide-react'
import AuthShell from './AuthShell.jsx'
import PasswordRules, { meetsPolicy } from './PasswordRules.jsx'
import { Field, Input } from '../../components/ui/index.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { ROLE_HOME } from '../../components/layout/nav.js'

// /change-password: shown when an account still has a temporary password set by an administrator
export default function ChangePassword() {
  const navigate = useNavigate()
  const { user, booting, changePassword, logout } = useAuth()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState({})

  if (booting) return null
  if (!user) return <Navigate to="/login" replace />
  if (!user.mustChangePassword) return <Navigate to={ROLE_HOME[user.role]} replace />

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const mismatch = form.confirmPassword && form.confirmPassword !== form.newPassword

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.currentPassword || !meetsPolicy(form.newPassword) || mismatch) {
      setFields({
        currentPassword: form.currentPassword ? '' : 'Enter the temporary password you were given.',
        newPassword: meetsPolicy(form.newPassword) ? '' : 'The password does not meet every requirement yet.',
        confirmPassword: mismatch ? 'Both passwords must match.' : '',
      })
      return
    }
    setBusy(true)
    setError('')
    setFields({})
    try {
      const res = await changePassword(form)
      navigate(ROLE_HOME[res.data.user.role], { replace: true })
    } catch (err) {
      setError(err.message)
      if (err.fields) setFields(err.fields)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-item bg-accent-soft text-accent">
        <KeyRound className="h-6 w-6" />
      </span>
      <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">Set your own password</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Hi {user.name.split(' ')[0]} — your account was set up with a temporary password. Choose a new one to continue.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <Field label="Temporary password" required error={fields.currentPassword}>
          <Input type="password" autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} />
        </Field>
        <Field label="New password" required error={fields.newPassword}>
          <Input type="password" autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} />
        </Field>
        <PasswordRules password={form.newPassword} />
        <Field label="Confirm new password" required error={fields.confirmPassword || (mismatch ? 'Both passwords must match.' : '')}>
          <Input type="password" autoComplete="new-password" value={form.confirmPassword} onChange={set('confirmPassword')} />
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
              Saving…
            </>
          ) : (
            'Save and continue'
          )}
        </button>
      </form>

      <button
        type="button"
        onClick={() => logout()}
        className="mt-5 inline-flex w-full items-center justify-center gap-1.5 text-[13px] font-semibold text-ink-muted hover:text-danger"
      >
        <LogOut className="h-4 w-4" />
        Sign out instead
      </button>
    </AuthShell>
  )
}
