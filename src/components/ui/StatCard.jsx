import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cx } from '../../lib/utils.js'
import { fadeUp, hoverLift } from '../../lib/motion.js'

const TREND = {
  up: { icon: ArrowUpRight, cls: 'text-success bg-green-50 ring-green-100' },
  down: { icon: ArrowDownRight, cls: 'text-danger bg-red-50 ring-red-100' },
  flat: { icon: Minus, cls: 'text-ink-muted bg-slate-100 ring-slate-200' },
}

export default function StatCard({ label, value, delta, trend = 'flat', hint, icon: Icon, accent = '#0F766E' }) {
  const t = TREND[trend] || TREND.flat
  const TrendIcon = t.icon

  return (
    <motion.div variants={fadeUp} whileHover={hoverLift} className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-ink-muted">{label}</p>
        {Icon && (
          <span
            className="flex h-9 w-9 items-center justify-center rounded-item"
            style={{ background: `${accent}14`, color: accent }}
          >
            <Icon className="h-4.5 w-4.5" strokeWidth={2} />
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-[28px] font-semibold leading-none tracking-tight text-ink">{value}</p>
      <div className="mt-3 flex items-center gap-2">
        {delta && (
          <span className={cx('chip ring-1 ring-inset', t.cls)}>
            <TrendIcon className="h-3 w-3" />
            {delta}
          </span>
        )}
        {hint && <span className="truncate text-[12px] text-ink-faint">{hint}</span>}
      </div>
    </motion.div>
  )
}
