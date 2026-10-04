import { Link, Navigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import AuthShell from './AuthShell.jsx'
import { PUBLIC_PORTALS, loginPath } from './portals.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { ROLE_HOME } from '../../components/layout/nav.js'

// /login: pick the teacher or student portal
export default function LoginPortal() {
  const { user, booting } = useAuth()
  if (!booting && user) return <Navigate to={ROLE_HOME[user.role]} replace />

  return (
    <AuthShell>
      <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">Welcome to Scholaris</h1>
      <p className="mt-1 text-sm text-ink-muted">Choose how you want to sign in.</p>

      <div className="mt-6 space-y-3">
        {PUBLIC_PORTALS.map((p) => {
          const Icon = p.icon
          return (
            <Link
              key={p.key}
              to={loginPath(p.key)}
              className="group flex items-center gap-4 rounded-item border border-line p-4 transition-colors duration-200 hover:border-accent hover:bg-accent-soft/50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-item bg-accent-soft text-accent">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-ink">{p.label}</p>
                <p className="mt-0.5 text-[12px] text-ink-muted">{p.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent" />
            </Link>
          )
        })}
      </div>
    </AuthShell>
  )
}
