import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FlaskConical, GraduationCap, Loader2 } from 'lucide-react'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { ROLE_HOME } from './nav.js'
import { pageTransition } from '../../lib/motion.js'

// Shown while the stored token is validated against GET /api/auth/me
function BootScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-muted">
      <span className="flex h-11 w-11 items-center justify-center rounded-item bg-primary text-white">
        <GraduationCap className="h-6 w-6" strokeWidth={2.2} />
      </span>
      <p className="mt-4 flex items-center gap-2 text-[13px] font-medium text-ink-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Restoring your session…
      </p>
    </div>
  )
}

export default function DashboardLayout({ role }) {
  const { user, booting } = useAuth()
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (booting) return <BootScreen />
  if (!user) return <Navigate to={`/${role}/login`} replace state={{ from: pathname }} />
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role]} replace />
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />

  return (
    <div className="min-h-screen bg-surface-muted">
      <Sidebar role={role} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="lg:pl-[264px]">
        <Topbar role={role} onOpenMobile={() => setMobileOpen(true)} />
        <motion.main
          key={pathname}
          initial={pageTransition.initial}
          animate={pageTransition.animate}
          className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          {user.isDemo && (
            <div className="mb-5 flex items-start gap-3 rounded-item border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-warning">
              <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <span className="font-semibold">Demo account.</span> Try anything you like — deleting records, changing
                the password and changing settings are turned off. Other visitors share this account.
              </p>
            </div>
          )}
          <Outlet />
        </motion.main>
      </div>
    </div>
  )
}
