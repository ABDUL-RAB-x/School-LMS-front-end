import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Library,
  Megaphone,
  Plus,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'
import StatCard from '../../components/ui/StatCard.jsx'
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardSkeleton,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from '../../components/ui/index.jsx'
import { ChartLegend, DonutChart } from '../../components/charts/index.jsx'
import DashboardAnalytics from './DashboardAnalytics.jsx'
import endpoints from '../../lib/api.js'
import useApi from '../../lib/useApi.js'
import { fadeUp, stagger } from '../../lib/motion.js'
import { currency, formatDate, toneFor } from '../../lib/utils.js'

const STAT_ICONS = {
  students: Users,
  teachers: GraduationCap,
  courses: Library,
  attendance: ClipboardCheck,
  revenue: Wallet,
}

export default function AdminDashboard() {
  const { data, loading, error, refetch } = useApi(() => endpoints.dashboard.admin(), [])
  const { data: feeData, loading: feeLoading } = useApi(() => endpoints.fees.summary(), [])

  if (error) return <ErrorState error={error} onRetry={refetch} />

  const d = data?.data
  const fees = feeData?.data
  const split = d?.attendanceSplit ?? []
  const marked = split.reduce((s, x) => s + x.value, 0)
  const presentPct = marked ? ((split[0].value / marked) * 100).toFixed(1) : '—'

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="School-wide overview, live from the database"
        actions={
          <>
            <Link to="/admin/announcements" className="btn-secondary">
              <Megaphone className="h-4 w-4" />
              Post notice
            </Link>
            <Link to="/admin/students/new" className="btn-primary">
              <Plus className="h-4 w-4" />
              Add student
            </Link>
          </>
        }
      />

      {/* Top stats cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          variants={stagger()}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
        >
          {d.stats.map((s) => (
            <StatCard key={s.id} label={s.label} value={s.value} icon={STAT_ICONS[s.id]} />
          ))}
        </motion.div>
      )}

      {/* Today at a glance */}
      <motion.div
        variants={stagger(0.1)}
        initial="hidden"
        animate="show"
        className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3"
      >
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader title="Attendance today" subtitle="Across all grades" />
            <CardBody className="pt-0">
              {loading ? (
                <Skeleton className="mx-auto h-[230px] w-[230px] rounded-full" />
              ) : marked === 0 ? (
                <EmptyState
                  icon={ClipboardCheck}
                  title="No registers submitted today"
                  description="Attendance appears once teachers take the register."
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

        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader title="Fee collection" subtitle="All invoices to date" />
            <CardBody className="space-y-3 pt-2">
              {feeLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                [
                  { label: 'Billed', value: currency(fees?.billed ?? 0), tone: 'text-ink' },
                  { label: 'Collected', value: currency(fees?.collected ?? 0), tone: 'text-success' },
                  { label: 'Outstanding', value: currency(fees?.outstanding ?? 0), tone: 'text-warning' },
                  { label: 'Overdue', value: currency(fees?.overdue ?? 0), tone: 'text-danger' },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between border-b border-line pb-2.5 last:border-0">
                    <span className="text-[13px] text-ink-muted">{r.label}</span>
                    <span className={`font-display text-[15px] font-semibold ${r.tone}`}>{r.value}</span>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader
              title="Academic calendar"
              subtitle="Next scheduled examinations"
              action={<CalendarDays className="h-4 w-4 text-ink-faint" />}
            />
            <CardBody className="pt-2">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-item" />
                  ))}
                </div>
              ) : d.calendar.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title="Nothing scheduled"
                  description="Upcoming examinations will appear here."
                  action={
                    <Link to="/admin/exams" className="btn-secondary">
                      Schedule an exam
                    </Link>
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {d.calendar.slice(0, 3).map((e) => {
                    const when = new Date(e.date)
                    return (
                      <li key={e.id} className="flex items-center gap-3 rounded-item border border-line p-3">
                        <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-item bg-surface-muted">
                          <span className="text-[10px] font-semibold uppercase text-ink-muted">
                            {when.toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className="font-display text-[15px] font-semibold leading-none text-ink">
                            {when.getDate()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-ink">{e.title}</p>
                          <Badge tone="warning" className="mt-1">
                            {e.tag}
                          </Badge>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>

      {/* Analytics */}
      <DashboardAnalytics gradeDistribution={d?.gradeDistribution} gradeLoading={loading} />

      {/* Recent activity */}
      <motion.div
        variants={stagger(0.15)}
        initial="hidden"
        animate="show"
        className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3"
      >
        <motion.div variants={fadeUp} className="xl:col-span-2">
          <Card className="h-full">
            <CardHeader
              title="Recent admissions"
              subtitle="Latest students added to the roll"
              action={
                <Link to="/admin/students" className="text-[13px] font-semibold text-accent hover:underline">
                  View all
                </Link>
              }
            />
            <CardBody className="pt-2">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : d.recentAdmissions.length === 0 ? (
                <EmptyState
                  icon={UserPlus}
                  title="No students yet"
                  description="Add your first student to start building the roll."
                  action={
                    <Link to="/admin/students/new" className="btn-primary">
                      <Plus className="h-4 w-4" />
                      Add student
                    </Link>
                  }
                />
              ) : (
                <ul className="divide-y divide-line">
                  {d.recentAdmissions.map((a) => (
                    <li key={a.id} className="flex items-center gap-4 py-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">
                        {a.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-ink">{a.name}</p>
                        <p className="text-[12px] text-ink-muted">
                          {a.className} · {a.id}
                        </p>
                      </div>
                      <span className="hidden text-[12px] text-ink-muted sm:block">{formatDate(a.date)}</span>
                      <Badge tone={toneFor(a.status)}>{a.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader
              title="Notice board"
              subtitle="Most recent announcements"
              action={
                <Link to="/admin/announcements" className="text-[13px] font-semibold text-accent hover:underline">
                  All
                </Link>
              }
            />
            <CardBody className="pt-2">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : d.announcements.length === 0 ? (
                <EmptyState icon={Megaphone} title="Nothing posted yet" description="Publish a notice to the board." />
              ) : (
                <ul className="space-y-4">
                  {d.announcements.map((a) => (
                    <li key={a._id} className="flex gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-item bg-surface-muted text-ink-muted ring-1 ring-line">
                        <Megaphone className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-ink">{a.title}</p>
                        <p className="line-clamp-2 text-[12px] text-ink-muted">{a.body}</p>
                        <p className="mt-0.5 text-[11px] text-ink-faint">
                          {a.author} · {formatDate(a.publishDate)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
