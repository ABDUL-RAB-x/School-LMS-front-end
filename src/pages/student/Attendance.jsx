import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import StatCard from '../../components/ui/StatCard.jsx'
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  ProgressBar,
  Skeleton,
  Toast,
} from '../../components/ui/index.jsx'
import { ChartLegend, StackedAttendanceChart } from '../../components/charts/index.jsx'
import endpoints from '../../lib/api.js'
import useApi from '../../lib/useApi.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { fadeUp, stagger } from '../../lib/motion.js'
import { formatDate, toneFor } from '../../lib/utils.js'
import { attendanceReportPdf } from '../../lib/documents.js'

const COLORS = ['#0F766E', '#2563EB', '#0891B2', '#16A34A', '#D97706', '#7C3AED', '#DB2777', '#334155']

export default function StudentAttendance() {
  const { profile } = useAuth()
  const { data, loading, error, refetch } = useApi(() => endpoints.attendance.mine(), [])
  const { data: settingsData } = useApi(() => endpoints.settings.get(), [])
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)

  const d = data?.data
  const log = d?.log ?? []
  const totals = d?.totals ?? { present: 0, late: 0, absent: 0 }
  const minimum = settingsData?.data?.academic?.minimumAttendance ?? 75

  const bySubject = useMemo(() => {
    const map = new Map()
    log.forEach((e) => {
      const acc = map.get(e.subject) || { present: 0, total: 0 }
      acc.total += 1
      if (e.status === 'Present') acc.present += 1
      map.set(e.subject, acc)
    })
    return [...map.entries()].map(([subject, a]) => ({ subject, rate: Math.round((a.present / a.total) * 100) }))
  }, [log])

  if (error) return <ErrorState error={error} onRetry={refetch} />

  const stats = [
    { id: 'rate', label: 'Attendance', value: d?.rate != null ? `${d.rate}%` : '—', hint: `minimum ${minimum}%` },
    { id: 'present', label: 'Present', value: totals.present, hint: `of ${log.length} registers` },
    { id: 'late', label: 'Late Arrivals', value: totals.late, hint: 'registers' },
    { id: 'absent', label: 'Absent', value: totals.absent, hint: 'registers' },
  ]

  const below = bySubject.filter((s) => s.rate < minimum)

  const download = async () => {
    setBusy(true)
    try {
      await attendanceReportPdf({ student: profile, log, totals, rate: d?.rate })
    } catch (err) {
      setToast(err.message || 'The download failed.')
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    { key: 'date', header: 'Date', render: (r) => <span className="font-medium text-ink">{formatDate(r.date)}</span> },
    { key: 'period', header: 'Period', align: 'center', render: (r) => <span className="text-[13px] text-ink-muted">P{r.period}</span> },
    { key: 'subject', header: 'Subject', render: (r) => <span className="text-[13px] text-ink-muted">{r.subject}</span> },
    { key: 'status', header: 'Status', align: 'center', render: (r) => <Badge tone={toneFor(r.status)} dot>{r.status}</Badge> },
    { key: 'remark', header: 'Remark', render: (r) => <span className="text-[13px] text-ink-muted">{r.remark}</span> },
  ]

  return (
    <div>
      <PageHeader
        title="My Attendance"
        subtitle="Every register your teachers have submitted"
        actions={
          <button className="btn-secondary" onClick={download} disabled={loading || busy}>
            <Download className="h-4 w-4" />
            {busy ? 'Preparing…' : 'Download report'}
          </button>
        }
      />

      <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.id} label={s.label} value={loading ? '…' : s.value} hint={s.hint} />
        ))}
      </motion.div>

      <motion.div variants={stagger(0.1)} initial="hidden" animate="show" className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <motion.div variants={fadeUp} className="xl:col-span-2">
          <Card className="h-full">
            <CardHeader
              title="Monthly breakdown"
              subtitle="Registers by attendance status"
              action={
                <ChartLegend
                  items={[
                    { label: 'Present', color: '#0F766E' },
                    { label: 'Late', color: '#D97706' },
                    { label: 'Absent', color: '#DC2626' },
                  ]}
                />
              }
            />
            <CardBody className="pt-2">
              {loading ? (
                <Skeleton className="h-[240px] w-full" />
              ) : d?.months?.length ? (
                <StackedAttendanceChart data={d.months} />
              ) : (
                <EmptyState title="No attendance yet" description="Your record appears once teachers submit registers." />
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader title="Attendance by subject" subtitle="Percentage of registers marked present" />
            <CardBody className="space-y-4 pt-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
              ) : bySubject.length === 0 ? (
                <p className="text-[13px] text-ink-muted">Nothing recorded yet.</p>
              ) : (
                bySubject.map((s, i) => (
                  <div key={s.subject}>
                    <div className="mb-1.5 flex items-center justify-between text-[13px]">
                      <span className="truncate text-ink-muted">{s.subject}</span>
                      <span className="font-semibold text-ink">{s.rate}%</span>
                    </div>
                    <ProgressBar value={s.rate} color={s.rate < minimum ? '#DC2626' : COLORS[i % COLORS.length]} height="h-1.5" />
                  </div>
                ))
              )}
              {!loading && bySubject.length > 0 && (
                <div className="rounded-item bg-surface-muted p-3 text-[12px] text-ink-muted">
                  Minimum required attendance is <span className="font-semibold text-ink">{minimum}%</span>.{' '}
                  {below.length
                    ? `You are below it in ${below.map((s) => s.subject).join(', ')}.`
                    : 'You are above it in every subject.'}
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={log}
          loading={loading}
          pageSize={10}
          rowKey={(r, i) => `${r.date}-${r.period}-${i}`}
          searchKeys={['subject', 'status', 'remark']}
          searchPlaceholder="Search by subject or status…"
          filters={[{ key: 'status', label: 'Status', options: ['Present', 'Late', 'Absent'] }]}
          exportConfig={{
            title: 'My Attendance',
            filename: 'My attendance',
            subtitle: profile?.name,
            columns: [
              { header: 'Date', value: (r) => formatDate(r.date) },
              { header: 'Period', value: (r) => r.period, align: 'center' },
              { header: 'Subject', value: (r) => r.subject },
              { header: 'Status', value: (r) => r.status },
              { header: 'Remark', value: (r) => r.remark },
            ],
          }}
          emptyTitle="No attendance recorded"
          emptyDescription="Your attendance appears here once teachers submit the register."
        />
      </div>

      <Toast message={toast} tone="danger" onDone={() => setToast('')} />
    </div>
  )
}
