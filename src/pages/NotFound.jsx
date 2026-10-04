import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-muted px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-card border border-line bg-white p-10 shadow-card"
      >
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-item bg-surface-muted ring-1 ring-line">
          <Compass className="h-6 w-6 text-ink-faint" />
        </span>
        <h1 className="font-display text-2xl font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-ink-muted">
          The page you are looking for doesn&rsquo;t exist or has been moved.
        </p>
        <Link to="/" className="btn-primary mt-6 h-[50px] w-full">
          Back to dashboard
        </Link>
      </motion.div>
    </div>
  )
}
