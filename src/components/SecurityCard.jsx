import { useState } from 'react'
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react'
import { Card, CardBody, CardHeader, Field, Input, Toast } from './ui/index.jsx'
import PasswordRules, { meetsPolicy } from '../pages/auth/PasswordRules.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const BLANK = { currentPassword: '', newPassword: '', confirmPassword: '' }

// Change password (PATCH /api/auth/password) and sign out of every device
export default function SecurityCard({ email }) {
  const { user, changePassword, logoutAll } = useAuth()
  const [form, setForm] = useState(BLANK)
  const [fields, setFields] = useState({})
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState({ message: '', tone: 'success' })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const mismatch = form.confirmPassword && form.confirmPassword !== form.newPassword

  const submit = async () => {
    if (!form.currentPassword || !meetsPolicy(form.newPassword) || mismatch || !form.confirmPassword) {
      setFields({
        currentPassword: form.currentPassword ? '' : 'Enter your current password.',
        newPassword: meetsPolicy(form.newPassword) ? '' : 'The password does not meet every requirement yet.',
        confirmPassword: form.confirmPassword && !mismatch ? '' : 'Both passwords must match.',
      })
      return
    }
    setBusy(true)
    setFields({})
    try {
      const res = await changePassword(form)
      setForm(BLANK)
      setToast({ message: res.message || 'Password updated.', tone: 'success' })
    } catch (err) {
      if (err.fields) setFields(err.fields)
      setToast({ message: err.message, tone: 'danger' })
    } finally {
      setBusy(false)
    }
  }

  if (user?.isDemo) {
    return (
      <Card className="h-full">
        <CardHeader title="Security" subtitle="Password and verification" />
        <CardBody>
          <div className="flex items-start gap-3 rounded-item border border-line bg-surface-muted p-4">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p className="text-[13px] text-ink-muted">
              This is a shared demo account, so its password cannot be changed. Real accounts change their password
              here, and every real sign-in needs a 6-digit code sent by email.
            </p>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader title="Security" subtitle="Password and verification" />
      <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Current password" required error={fields.currentPassword} className="sm:col-span-2">
          <Input type="password" autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} />
        </Field>
        <Field label="New password" required error={fields.newPassword}>
          <Input type="password" autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} />
        </Field>
        <Field label="Confirm new password" required error={fields.confirmPassword || (mismatch ? 'Both passwords must match.' : '')}>
          <Input type="password" autoComplete="new-password" value={form.confirmPassword} onChange={set('confirmPassword')} />
        </Field>
        <div className="sm:col-span-2">
          <PasswordRules password={form.newPassword} />
        </div>
        <button className="btn-primary sm:col-span-2" onClick={submit} disabled={busy}>
          <KeyRound className="h-4 w-4" />
          {busy ? 'Updating…' : 'Update password'}
        </button>

        <div className="sm:col-span-2">
          <div className="flex items-start gap-3 rounded-item border border-line bg-surface-muted p-4">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div>
              <p className="text-[13px] font-semibold text-ink">Email verification is on</p>
              <p className="mt-0.5 text-[12px] text-ink-muted">
                A 6-digit code is sent to {email || 'your email'} every time you sign in, and you get an email after each
                successful sign-in.
              </p>
            </div>
          </div>
        </div>
        <button
          className="btn-secondary sm:col-span-2"
          onClick={() => {
            if (window.confirm('Sign out of Scholaris on every device, including this one?')) logoutAll().catch(() => {})
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out of all devices
        </button>
      </CardBody>
      <Toast message={toast.message} tone={toast.tone} onDone={() => setToast({ message: '', tone: 'success' })} />
    </Card>
  )
}
