import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Download } from 'lucide-react'
import { Badge, Card, CardBody, CardHeader, ErrorState, PageHeader, Skeleton, Toast } from '../../components/ui/index.jsx'
import TimetableGrid, { DAYS } from '../../components/TimetableGrid.jsx'
import endpoints from '../../lib/api.js'
import useApi from '../../lib/useApi.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { timetablePdf } from '../../lib/documents.js'
import { fadeUp, stagger } from '../../lib/motion.js'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function TeacherTimetable() {
  const { user } = useAuth()
  const { data, loading, error, refetch } = useApi(() => endpoints.timetable.mine(), [])
  const [toast, setToast] = useState('')

  if (error) return <ErrorState error={error} onRetry={refetch} />

  const grid = data?.data?.grid ?? {}
  const jsDay = DAY_NAMES[new Date().getDay()]
  const today = DAYS.includes(jsDay) ? jsDay : 'Monday'
  const slots = grid[today] ?? []
  const weekly = DAYS.reduce((n, d) => n + (grid[d]?.length ?? 0), 0)

  const download = () =>
    timetablePdf({ title: `Teaching Timetable — ${user?.name ?? ''}`, subtitle: `${weekly} periods a week`, grid, showClass: true }).catch(
      (err) => setToast(err.message || 'The download failed.'),
    )

  return (
    <div>
      <PageHeader
        title="My Timetable"
        subtitle={loading ? 'Weekly teaching schedule' : `Weekly teaching schedule · ${weekly} periods a week`}
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
              subtitle={`${slots.length} period${slots.length === 1 ? '' : 's'} to teach`}
            />
            <CardBody className="space-y-2 pt-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[70px] w-full rounded-item" />)
              ) : slots.length === 0 ? (
                <p className="text-[13px] text-ink-muted">No teaching periods.</p>
              ) : (
                slots.map((s, i) => (
                  <div key={`${s.period}-${i}`} className="rounded-item border border-line p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-ink">{s.subject}</p>
                      <Badge tone="neutral">P{s.period}</Badge>
                    </div>
                    <p className="mt-0.5 text-[12px] text-ink-muted">{[s.classRoom, s.room].filter(Boolean).join(' · ')}</p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ink-faint">
                      <Clock className="h-3 w-3" />
                      {s.time}
                    </p>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="xl:col-span-3">
          {loading ? <Skeleton className="h-[420px] w-full rounded-card" /> : <TimetableGrid grid={grid} showClass highlightDay={today} />}
        </motion.div>
      </motion.div>

      <Toast message={toast} tone="danger" onDone={() => setToast('')} />
    </div>
  )
}
