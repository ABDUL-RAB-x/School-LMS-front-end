import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { cx } from '../lib/utils.js'
import { fadeUp, stagger } from '../lib/motion.js'

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const PALETTE = ['#0F766E', '#2563EB', '#0891B2', '#16A34A', '#D97706', '#7C3AED', '#DB2777', '#334155']
function colorFor(name = '') {
  let h = 0
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

// Period numbers and their times, from whatever slots exist across the week
function periodsOf(grid, minimum = 0) {
  const map = new Map()
  DAYS.forEach((d) => (grid?.[d] ?? []).forEach((s) => map.has(s.period) || map.set(s.period, s.time)))
  for (let p = 1; p <= minimum; p += 1) if (!map.has(p)) map.set(p, '')
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([period, time]) => ({ period, time }))
}

// Weekly grid
export default function TimetableGrid({ grid, showClass = false, highlightDay, onCellClick, minPeriods = 0 }) {
  const periods = periodsOf(grid, minPeriods)

  if (!periods.length) {
    return (
      <div className="table-wrap flex min-h-[200px] items-center justify-center p-8 text-center">
        <p className="text-[13px] text-ink-muted">No timetable has been published yet.</p>
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-surface-muted">
              <th className="w-[132px] border-b border-r border-line px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
                Period
              </th>
              {DAYS.map((d) => (
                <th
                  key={d}
                  className={cx(
                    'border-b border-line px-5 py-3 text-[12px] font-semibold uppercase tracking-wide',
                    highlightDay === d ? 'bg-accent-soft text-accent' : 'text-ink-muted',
                  )}
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <motion.tbody variants={stagger(0, 0.04)} initial="hidden" animate="show">
            {periods.map((p, rowIdx) => (
              <motion.tr key={p.period} variants={fadeUp} className={cx(rowIdx % 2 === 1 && 'bg-surface-muted/60')}>
                <td className="border-b border-r border-line px-5 py-3 align-middle">
                  <p className="text-[13px] font-semibold text-ink">Period {p.period}</p>
                  <p className="text-[11px] text-ink-muted">{p.time || '—'}</p>
                </td>
                {DAYS.map((d) => {
                  // Usually one slot; a teacher's week can show two if they were double-booked
                  const cellSlots = (grid?.[d] ?? []).filter((s) => s.period === p.period)
                  const clickable = Boolean(onCellClick)
                  const Wrapper = clickable ? 'button' : 'div'
                  return (
                    <td
                      key={d}
                      className={cx('space-y-1.5 border-b border-line px-3 py-2.5 align-middle', highlightDay === d && 'bg-accent-soft/40')}
                    >
                      {cellSlots.length === 0 ? (
                        clickable ? (
                          <button
                            type="button"
                            onClick={() => onCellClick(d, p.period, null)}
                            className="flex w-full items-center justify-center gap-1 rounded-item border border-dashed border-line px-3 py-3 text-[12px] font-medium text-ink-faint transition-colors hover:border-accent hover:text-accent"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add
                          </button>
                        ) : (
                          <span className="block px-3 text-[13px] text-ink-faint">—</span>
                        )
                      ) : (
                        cellSlots.map((slot, i) =>
                          slot.free ? (
                            <Wrapper
                              key={i}
                              type={clickable ? 'button' : undefined}
                              onClick={clickable ? () => onCellClick(d, p.period, slot) : undefined}
                              className="block w-full rounded-item border border-dashed border-line px-3 py-2.5 text-left"
                            >
                              <p className="text-[13px] font-medium text-ink-faint">{slot.subject}</p>
                            </Wrapper>
                          ) : (
                            <Wrapper
                              key={i}
                              type={clickable ? 'button' : undefined}
                              onClick={clickable ? () => onCellClick(d, p.period, slot) : undefined}
                              className="block w-full rounded-item px-3 py-2.5 text-left transition-transform duration-200 hover:-translate-y-0.5"
                              style={{ background: `${colorFor(slot.subject)}0F`, borderLeft: `3px solid ${colorFor(slot.subject)}` }}
                            >
                              <p className="text-[13px] font-semibold text-ink">{slot.subject}</p>
                              <p className="text-[11px] text-ink-muted">
                                {[showClass ? slot.classRoom : slot.teacher, slot.room].filter((x) => x && x !== '—').join(' · ') || '—'}
                              </p>
                            </Wrapper>
                          ),
                        )
                      )}
                    </td>
                  )
                })}
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </div>
  )
}
