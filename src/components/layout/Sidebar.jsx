import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, LogOut, X } from 'lucide-react'
import { NAV, ROLE_LABEL } from './nav.js'
import { cx, initials } from '../../lib/utils.js'
import { useAuth } from '../../context/AuthContext.jsx'

function SidebarContent({ role, onNavigate }) {
  const { user, logout, logoutAll } = useAuth()
  const items = NAV[role] || []

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-item bg-primary text-white">
          <GraduationCap className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <p className="font-display text-[15px] font-semibold leading-tight text-ink">Scholaris</p>
          <p className="truncate text-[12px] text-ink-muted">{ROLE_LABEL[role]} Panel</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4">
        <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Menu</p>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) => cx('sidebar-item', isActive && 'sidebar-item-active')}
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cx('h-[18px] w-[18px] shrink-0', isActive ? 'text-white' : 'text-ink-faint')}
                      strokeWidth={2}
                    />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Account */}
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-item px-3 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">
            {initials(user?.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink">{user?.name}</p>
            <p className="truncate text-[11px] text-ink-muted">{user?.email}</p>
          </div>
          <button
            onClick={() => logout()}
            title="Sign out"
            aria-label="Sign out"
            className="rounded-btn p-2 text-ink-faint transition-colors hover:bg-surface-muted hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        {!user?.isDemo && (
          <button
            onClick={() => {
              if (window.confirm('Sign out on every device, including this one?')) logoutAll()
            }}
            className="mt-1 w-full rounded-btn px-3 py-1.5 text-left text-[12px] font-medium text-ink-faint transition-colors hover:bg-surface-muted hover:text-danger"
          >
            Sign out of all devices
          </button>
        )}
      </div>
    </div>
  )
}

export default function Sidebar({ role, mobileOpen, onCloseMobile }) {
  return (
    <>
      {/* Desktop: fixed left */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-line lg:block">
        <SidebarContent role={role} />
      </aside>

      {/* Mobile: slide-in drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="absolute inset-0 bg-primary-dark/40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 w-[264px] border-r border-line shadow-lift"
            >
              <button
                onClick={onCloseMobile}
                aria-label="Close menu"
                className="absolute right-3 top-6 rounded-btn p-2 text-ink-muted hover:bg-surface-muted"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent role={role} onNavigate={onCloseMobile} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
