import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, DoorOpen, Download } from 'lucide-react'
import { Badge, Card, CardBody, CardHeader, ErrorState, PageHeader, Skeleton, Toast } from '../../components/ui/index.jsx'
import TimetableGrid, { DAYS } from '../../components/TimetableGrid.jsx'
import endpoints from '../../lib/api.js'
import useApi from '../../lib/useApi.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { cx } from '../../lib/utils.js'
import { timetablePdf } from '../../lib/documents.js'
import { fadeUp, stagger } from '../../lib/motion.js'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function StudentTimetable() {
  const { profile } = useAuth()
  const { data, loading, error, refetch } = useApi(() => endpoints.timetable.mine(), [])
  const [toast, setToast] = useState('')

  if (error) return <ErrorState error={error} onRetry={refetch} />

  const grid = data?.data?.grid ?? {}
  const jsDay = DAY_NAMES[new Date().getDay()]
  const today = DAYS.includes(jsDay) ? jsDay : 'Monday'
  const slots = grid[today] ?? []
  const room = profile?.classRoom
  const label = room ? `${room.name} · Section ${room.section}` : 'My class'

  const download = () =>
    timetablePdf({ title: `Timetable — ${label}`, subtitle: 'Weekly class schedule', grid }).catch((err) =>
      setToast(err.message || 'The download failed.'),
    )

  return (
    <div>
      <PageHeader
        title="My Timetable"
        subtitle={`${label} — weekly schedule`}
        actions={
          <button className="btn-secondary" onClick={download} disabled={loading}>
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        }
      />

      <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader
              title={jsDay === today ? 'Today' : `Next school day — ${today}`}
              subtitle={`${slots.filter((s) => !s.free).length} classes scheduled`}
            />
            <CardBody className="space-y-2 pt-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[70px] w-full rounded-item" />)
              ) : slots.length === 0 ? (
                <p className="text-[13px] text-ink-muted">No classes scheduled.</p>
              ) : (
                slots.map((s, i) => (
                  <div
                    key={`${s.period}-${i}`}
                    className={cx('rounded-item border p-3', s.free ? 'border-dashed border-line bg-surface-muted' : 'border-line')}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-ink">{s.subject}</p>
                      <Badge tone="neutral">P{s.period}</Badge>
                    </div>
                    {!s.free && <p className="mt-0.5 text-[12px] text-ink-muted">{s.teacher}</p>}
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-ink-faint">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {s.time}
                      </span>
                      {!s.free && s.room && (
                        <span className="flex items-center gap-1">
                          <DoorOpen className="h-3 w-3" />
                          {s.room}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="xl:col-span-3">
          {loading ? <Skeleton className="h-[420px] w-full rounded-card" /> : <TimetableGrid grid={grid} highlightDay={today} />}
        </motion.div>
      </motion.div>

      <Toast message={toast} tone="danger" onDone={() => setToast('')} />
    </div>
  )
}
