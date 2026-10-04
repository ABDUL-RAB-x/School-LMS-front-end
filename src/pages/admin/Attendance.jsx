import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, ClipboardCheck, TrendingDown } from 'lucide-react'
import StatCard from '../../components/ui/StatCard.jsx'
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  DataTable,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  ProgressBar,
  Skeleton,
} from '../../components/ui/index.jsx'
import { ChartLegend, DonutChart } from '../../components/charts/index.jsx'
import endpoints from '../../lib/api.js'
import useApi from '../../lib/useApi.js'
import { fadeUp, stagger } from '../../lib/motion.js'
import { formatDate, todayISO as today } from '../../lib/utils.js'

export default function AdminAttendance() {
  const [date, setDate] = useState(today())

  const { data, loading, error, refetch } = useApi(
    () => endpoints.attendance.overview({ date }),
    [date],
  )

  if (error) return <ErrorState error={error} onRetry={refetch} />

  const d = data?.data
  const split = d?.split ?? []
  const marked = split.reduce((s, x) => s + x.value, 0)
  const presentPct = marked ? ((split[0].value / marked) * 100).toFixed(1) : null

  const stats = [
    { id: 'rate', label: 'Attendance Rate', value: presentPct != null ? `${presentPct}%` : '—', hint: 'for this date' },
    { id: 'present', label: 'Present', value: split[0]?.value ?? 0, hint: 'students' },
    { id: 'late', label: 'Late Arrivals', value: split[1]?.value ?? 0, hint: 'students' },
    { id: 'absent', label: 'Absent', value: split[2]?.value ?? 0, hint: 'students' },
  ]

  const columns = [
    {
      key: 'className',
      header: 'Class',
      render: (r) => (
        <div>
          <p className="font-semibold text-ink">{r.className}</p>
          <p className="text-[12px] text-ink-muted">{r.classTeacher}</p>
        </div>
      ),
    },
    { key: 'strength', header: 'Strength', align: 'center' },
    {
      key: 'present',
      header: 'Present',
      align: 'center',
      render: (r) => (r.submitted ? <span className="font-semibold text-success">{r.present}</span> : <span className="text-ink-faint">—</span>),
    },
    {
      key: 'late',
      header: 'Late',
      align: 'center',
      render: (r) => (r.submitted ? <span className="font-semibold text-warning">{r.late}</span> : <span className="text-ink-faint">—</span>),
    },
    {
      key: 'absent',
      header: 'Absent',
      align: 'center',
      render: (r) => (r.submitted ? <span className="font-semibold text-danger">{r.absent}</span> : <span className="text-ink-faint">—</span>),
    },
    {
      key: 'rate',
      header: 'Rate',
      render: (r) =>
        r.rate == null ? (
          <span className="text-[13px] text-ink-faint">Not submitted</span>
        ) : (
          <div className="flex min-w-[9rem] items-center gap-3">
            <ProgressBar
              value={r.rate}
              color={r.rate >= 90 ? '#0F766E' : r.rate >= 85 ? '#D97706' : '#DC2626'}
              height="h-1.5"
            />
            <span className="w-12 shrink-0 text-right text-[13px] font-semibold text-ink">{r.rate}%</span>
          </div>
        ),
    },
    {
      key: 'flag',
      header: 'Flag',
      align: 'center',
      render: (r) =>
        !r.submitted ? (
          <Badge tone="neutral">Awaiting</Badge>
        ) : r.rate < 90 ? (
          <Badge tone="warning">
            <TrendingDown className="h-3 w-3" />
            Below target
          </Badge>
        ) : (
          <Badge tone="success">On track</Badge>
        ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Attendance Overview"
        subtitle="School-wide attendance for the selected date"
        actions={
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input
              type="date"
              value={date}
              max={today()}
              onChange={(e) => setDate(e.target.value)}
              className="h-[42px] w-[190px] pl-10"
            />
          </div>
        }
      />

      <motion.div
        variants={stagger()}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((s) => (
          <StatCard key={s.id} label={s.label} value={s.value} hint={s.hint} />
        ))}
      </motion.div>

      <motion.div variants={stagger(0.1)} initial="hidden" animate="show" className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <motion.div variants={fadeUp} className="xl:col-span-2">
          <Card className="h-full">
            <CardHeader title="Class breakdown" subtitle="Every class, with its register status" />
            <CardBody className="space-y-3 pt-2">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
              ) : d.rows.length === 0 ? (
                <EmptyState title="No classes yet" description="Create classes to track attendance." />
              ) : (
                d.rows.map((r) => (
                  <div key={r.id}>
                    <div className="mb-1.5 flex items-center justify-between text-[13px]">
                      <span className="truncate text-ink-muted">{r.className}</span>
                      <span className="font-semibold text-ink">{r.rate != null ? `${r.rate}%` : 'Awaiting'}</span>
                    </div>
                    <ProgressBar
                      value={r.rate ?? 0}
                      height="h-1.5"
                      color={r.rate == null ? '#CBD5E1' : r.rate >= 90 ? '#0F766E' : r.rate >= 85 ? '#D97706' : '#DC2626'}
                    />
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader title="Split for this date" subtitle="All grades combined" />
            <CardBody className="pt-0">
              {loading ? (
                <Skeleton className="mx-auto h-[230px] w-[230px] rounded-full" />
              ) : marked === 0 ? (
                <EmptyState
                  icon={ClipboardCheck}
                  title="No registers submitted"
                  description="Nothing was recorded for this date."
                />
              ) : (
                <>
                  <DonutChart data={split} centerValue={`${presentPct}%`} centerLabel="Present" />
                  <div className="mt-4">
                    <ChartLegend items={split.map((x) => ({ label: x.name, color: x.color, value: x.value }))} />
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={d?.rows ?? []}
          loading={loading}
          pageSize={8}
          rowKey={(r) => r.id}
          searchKeys={['className', 'classTeacher']}
          searchPlaceholder="Search class or class teacher…"
          exportConfig={{
            title: 'Attendance Overview',
            filename: `Attendance ${date}`,
            stamp: false,
            subtitle: formatDate(date),
            columns: [
              { header: 'Class', value: (r) => r.className },
              { header: 'Class teacher', value: (r) => r.classTeacher },
              { header: 'Strength', value: (r) => r.strength, align: 'center' },
              { header: 'Present', value: (r) => (r.submitted ? r.present : ''), align: 'center' },
              { header: 'Late', value: (r) => (r.submitted ? r.late : ''), align: 'center' },
              { header: 'Absent', value: (r) => (r.submitted ? r.absent : ''), align: 'center' },
              { header: 'Rate', value: (r) => (r.rate == null ? 'Not submitted' : `${r.rate}%`), align: 'center' },
            ],
            summary: [
              ['Date', formatDate(date)],
              ['Attendance rate', presentPct != null ? `${presentPct}%` : '—'],
              ['Present / Late / Absent', `${split[0]?.value ?? 0} / ${split[1]?.value ?? 0} / ${split[2]?.value ?? 0}`],
            ],
          }}
          emptyTitle="No attendance recorded"
          emptyDescription="Attendance appears here once teachers submit their registers."
        />
      </div>
    </div>
  )
}
