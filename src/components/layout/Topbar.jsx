import { useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Menu, Search } from 'lucide-react'
import { NAV, ROLE_LABEL } from './nav.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { initials } from '../../lib/utils.js'
import useApi from '../../lib/useApi.js'
import endpoints from '../../lib/api.js'

export default function Topbar({ role, onOpenMobile }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [openNotifs, setOpenNotifs] = useState(false)
  const [search, setSearch] = useState('')

  // Latest notices double as the notification feed
  const { data: notices } = useApi(() => endpoints.announcements.list({ limit: 5 }), [])
  const items = notices?.data ?? []

  const current = useMemo(() => {
    const items = NAV[role] || []
    const match = items
      .filter((i) => pathname === i.to || pathname.startsWith(`${i.to}/`))
      .sort((a, b) => b.to.length - a.to.length)[0]
    return match?.label || 'Dashboard'
  }, [pathname, role])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/85 backdrop-blur-sm">
      <div className="flex h-[68px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onOpenMobile}
          aria-label="Open menu"
          className="rounded-btn p-2 text-ink-muted transition-colors hover:bg-surface-muted lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
            {ROLE_LABEL[role]}
          </p>
          <h2 className="truncate font-display text-[17px] font-semibold text-ink">{current}</h2>
        </div>

        {role === 'admin' && (
          <form
            className="relative hidden xl:block"
            onSubmit={(e) => {
              e.preventDefault()
              const q = search.trim()
              navigate(q ? `/admin/students?search=${encodeURIComponent(q)}` : '/admin/students')
            }}
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students… (Enter)"
              aria-label="Search students"
              className="h-[42px] w-[280px] rounded-input border border-field bg-surface-muted pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/15"
            />
          </form>
        )}

        <p className="hidden text-[13px] text-ink-muted md:block">{today}</p>

        <div className="relative">
          <button
            onClick={() => setOpenNotifs((v) => !v)}
            aria-label="Notifications"
            className="relative rounded-btn p-2.5 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <Bell className="h-[18px] w-[18px]" />
            {items.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-white" />}
          </button>

          <AnimatePresence>
            {openNotifs && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpenNotifs(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute right-0 z-20 mt-2 w-[320px] overflow-hidden rounded-card border border-line bg-white shadow-lift"
                >
                  <div className="border-b border-line px-4 py-3">
                    <p className="text-[13px] font-semibold text-ink">Notifications</p>
                  </div>
                  {items.length === 0 ? (
                    <p className="px-4 py-6 text-center text-[13px] text-ink-muted">Nothing new right now.</p>
                  ) : (
                    <ul className="divide-y divide-line">
                      {items.map((n) => (
                        <li key={n._id} className="px-4 py-3">
                          <p className="text-[13px] font-semibold text-ink">{n.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-[12px] text-ink-muted">{n.body}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-white">
          {initials(user?.name)}
        </span>
      </div>
    </header>
  )
}
