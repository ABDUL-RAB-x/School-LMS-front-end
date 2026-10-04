import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, Download } from 'lucide-react'
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardSkeleton,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  ProgressBar,
  Tabs,
  Toast,
} from '../../components/ui/index.jsx'
import { GradeBarChart } from '../../components/charts/index.jsx'
import endpoints from '../../lib/api.js'
import useApi from '../../lib/useApi.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { fadeUp, hoverLift, stagger } from '../../lib/motion.js'
import { formatDate } from '../../lib/utils.js'
import { marksheetPdf } from '../../lib/documents.js'

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'results', label: 'Results' },
]

const GRADE_RANK = ['A+', 'A', 'A-', 'B+', 'B', 'C', 'D', 'F']
const daysUntil = (date) => Math.ceil((new Date(date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000)

export default function StudentExams() {
  const { profile } = useAuth()
  const [tab, setTab] = useState('upcoming')
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)
  const { data, loading, error, refetch } = useApi(() => endpoints.exams.mine(), [])

  if (error) return <ErrorState error={error} onRetry={refetch} />

  const exams = data?.data?.exams ?? []
  const average = data?.data?.average
  const upcoming = exams.filter((e) => e.status === 'Upcoming' && daysUntil(e.date) >= 0)
  const completed = exams.filter((e) => e.status === 'Completed')
  const best = completed.map((e) => e.grade).sort((a, b) => GRADE_RANK.indexOf(a) - GRADE_RANK.indexOf(b))[0]

  const chartData = completed.map((e) => ({ grade: e.subject.split(' ')[0], students: e.percent }))

  const downloadMarksheet = async () => {
    setBusy(true)
    try {
      await marksheetPdf({ student: profile, results: completed, average })
    } catch (err) {
      setToast(err.message || 'The download failed.')
    } finally {
      setBusy(false)
    }
  }

  const resultColumns = [
    { key: 'subject', header: 'Subject', render: (r) => <span className="font-semibold text-ink">{r.subject}</span> },
    { key: 'exam', header: 'Examination', render: (r) => <span className="text-[13px] text-ink-muted">{r.exam}</span> },
    { key: 'date', header: 'Date', render: (r) => <span className="text-[13px]">{formatDate(r.date)}</span> },
    {
      key: 'marks',
      header: 'Marks',
      align: 'center',
      render: (r) => (
        <span className="font-semibold text-ink">
          {r.marks}
          <span className="text-ink-faint">/{r.maxMarks}</span>
        </span>
      ),
    },
    {
      key: 'percent',
      header: 'Percent',
      render: (r) => (
        <div className="flex min-w-[8rem] items-center gap-3">
          <ProgressBar value={r.percent} height="h-1.5" color={r.percent >= 80 ? '#0F766E' : r.percent >= 60 ? '#2563EB' : '#D97706'} />
          <span className="w-10 shrink-0 text-right text-[13px] font-semibold">{r.percent}%</span>
        </div>
      ),
    },
    {
      key: 'grade',
      header: 'Grade',
      align: 'center',
      render: (r) => <Badge tone={r.grade?.startsWith('A') ? 'success' : r.grade === 'F' ? 'danger' : 'info'}>{r.grade}</Badge>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Exams & Results"
        subtitle="Your examination schedule and published marks"
        actions={
          <button className="btn-secondary" onClick={downloadMarksheet} disabled={loading || busy || !completed.length}>
            <Download className="h-4 w-4" />
            {busy ? 'Preparing…' : 'Download marksheet'}
          </button>
        }
      >
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </PageHeader>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : tab === 'upcoming' ? (
        upcoming.length === 0 ? (
          <Card>
            <EmptyState
              icon={CalendarClock}
              title="No upcoming examinations"
              description="Your next exam schedule will appear here once it is published."
            />
          </Card>
        ) : (
          <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {upcoming.map((e) => {
              const days = daysUntil(e.date)
              return (
                <motion.div key={e.id} variants={fadeUp} whileHover={hoverLift} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-[16px] font-semibold text-ink">{e.subject}</p>
                      <p className="mt-0.5 text-[13px] text-ink-muted">{e.exam}</p>
                    </div>
                    <Badge tone={days <= 7 ? 'warning' : 'info'}>{days === 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`}</Badge>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Date', value: formatDate(e.date) },
                      { label: 'Time', value: e.time || '—' },
                      { label: 'Room', value: e.room || '—' },
                    ].map((x) => (
                      <div key={x.label} className="rounded-item bg-surface-muted p-3">
                        <p className="text-[11px] text-ink-muted">{x.label}</p>
                        <p className="mt-0.5 text-[13px] font-semibold text-ink">{x.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-[12px] text-ink-faint">Maximum marks: {e.maxMarks}</p>
                </motion.div>
              )
            })}
          </motion.div>
        )
      ) : (
        <>
          <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <CardHeader title="Overall average" subtitle="Across all published results" />
                <CardBody className="pt-2">
                  <p className="font-display text-[40px] font-semibold leading-none tracking-tight text-ink">
                    {average != null ? `${average}%` : '—'}
                  </p>
                  <div className="mt-4">
                    <ProgressBar value={average ?? 0} />
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-item bg-surface-muted p-3">
                      <p className="text-[11px] text-ink-muted">Assessments</p>
                      <p className="mt-0.5 font-display text-lg font-semibold text-ink">{completed.length}</p>
                    </div>
                    <div className="rounded-item bg-surface-muted p-3">
                      <p className="text-[11px] text-ink-muted">Best grade</p>
                      <p className="mt-0.5 font-display text-lg font-semibold text-success">{best ?? '—'}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp} className="xl:col-span-2">
              <Card className="h-full">
                <CardHeader title="Score by subject" subtitle="Percentage achieved in each assessment" />
                <CardBody className="pt-2">
                  {chartData.length ? (
                    <GradeBarChart data={chartData} color="#0F766E" />
                  ) : (
                    <EmptyState title="No results yet" description="Scores appear once results are published." />
                  )}
                </CardBody>
              </Card>
            </motion.div>
          </motion.div>

          <div className="mt-6">
            <DataTable
              columns={resultColumns}
              rows={completed}
              pageSize={8}
              rowKey={(r) => r.id}
              searchKeys={['subject', 'exam']}
              searchPlaceholder="Search subject or examination…"
              filters={[{ key: 'grade', label: 'Grade', options: GRADE_RANK }]}
              emptyTitle="No results published"
              emptyDescription="Marks appear here once your teachers publish them."
            />
          </div>
        </>
      )}

      <Toast message={toast} tone="danger" onDone={() => setToast('')} />
    </div>
  )
}
