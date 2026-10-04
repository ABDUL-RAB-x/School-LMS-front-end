import { motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'
import { fadeUp } from '../../lib/motion.js'

export default function AuthShell({ children, footer }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-muted px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mb-7 flex items-center gap-3"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-item bg-primary text-white">
          <GraduationCap className="h-6 w-6" strokeWidth={2.2} />
        </span>
        <div>
          <p className="font-display text-lg font-semibold leading-tight text-ink">Scholaris</p>
          <p className="text-[12px] text-ink-muted">School Management System</p>
        </div>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="w-full max-w-[440px] rounded-card border border-line bg-white p-7 shadow-card sm:p-8"
      >
        {children}
      </motion.div>

      {footer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="mt-6 w-full max-w-[440px]"
        >
          {footer}
        </motion.div>
      )}

      <p className="mt-8 text-[12px] text-ink-faint">© 2026 Scholaris. All rights reserved.</p>
    </div>
  )
}
