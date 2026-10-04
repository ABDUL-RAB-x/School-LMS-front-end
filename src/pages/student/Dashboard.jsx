import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, CalendarClock, ClipboardCheck, ClipboardList, Megaphone, TrendingUp, Wallet } from 'lucide-react'
import StatCard from '../../components/ui/StatCard.jsx'
import { Badge, Card, CardBody, CardHeader, CardSkeleton, EmptyState, ErrorState, Skeleton } from '../../components/ui/index.jsx'
import endpoints from '../../lib/api.js'
import useApi from '../../lib/useApi.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { fadeUp, hoverLift, slideInLeft, stagger } from '../../lib/motion.js'
import { currency, formatDate } from '../../lib/utils.js'

const STAT_ICONS = {
  attendance: ClipboardCheck,
  courses: BookOpen,
  assignments: ClipboardList,
  average: TrendingUp,
}
const COLORS = ['#0F766E', '#2563EB', '#0891B2', '#16A34A', '#D97706', '#7C3AED', '#DB2777', '#334155']

export default function StudentDashboard() {
  const { profile } = useAuth()
  const { data, loading, error, refetch } = useApi(() => endpoints.dashboard.student(), [])

  if (error) return <ErrorState error={error} onRetry={refetch} />

  const d = data?.data
  const room = profile?.classRoom
  const first = profile?.name?.split(' ')[0] ?? ''

  return (
    <div>
      <motion.div variants={slideInLeft} initial="hidden" animate="show" className="mb-6 rounded-card border border-line bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[13px] font-medium text-ink-muted">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">Hi {first}, welcome back</h1>
            <p className="mt-2 text-[14px] text-ink-muted">
              {room ? `${room.name} · Section ${room.section}` : '—'}
              {profile?.roll ? ` · Roll ${profile.roll}` : ''}
              {profile?.studentId ? ` · ${profile.studentId}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/student/assignments" className="btn-secondary">
              <ClipboardList className="h-4 w-4" />
              {loading ? 'Assignments' : `${d.dueAssignments.length} due`}
            </Link>
            <Link to="/student/exams" className="btn-primary">
              <CalendarClock className="h-4 w-4" />
              Upcoming exams
            </Link>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {d.stats.map((s) => (
            <StatCard key={s.id} label={s.label} value={s.value} icon={STAT_ICONS[s.id]} />
          ))}
        </motion.div>
      )}

      <div className="mt-8 mb-4">
        <h2 className="font-display text-lg font-semibold text-ink">My subjects</h2>
        <p className="text-[13px] text-ink-muted">{loading ? '…' : `${d.courses.length} subjects for your grade`}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : d.courses.length === 0 ? (
        <Card>
          <EmptyState title="No subjects yet" description="Subjects appear once the office sets up the curriculum for your grade." />
        </Card>
      ) : (
        <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {d.courses.map((c, i) => {
            const color = COLORS[i % COLORS.length]
            return (
              <motion.div key={c.id} variants={fadeUp} whileHover={hoverLift} className="card overflow-hidden p-5" style={{ borderTop: `3px solid ${color}` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-[16px] font-semibold text-ink">{c.subject}</p>
                    <p className="mt-0.5 text-[13px] text-ink-muted">{c.teacher}</p>
                  </div>
                  <Badge tone="neutral">{c.code}</Badge>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      <motion.div variants={stagger(0.1)} initial="hidden" animate="show" className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader
              title="Assignment deadlines"
              subtitle="Not yet handed in"
              action={
                <Link to="/student/assignments" className="text-[13px] font-semibold text-accent hover:underline">
                  All
                </Link>
              }
            />
            <CardBody className="pt-2">
              {loading ? (
                <Skeleton className="h-[160px] w-full" />
              ) : d.dueAssignments.length === 0 ? (
                <p className="text-[13px] text-ink-muted">You are all caught up.</p>
              ) : (
                <ul className="space-y-3">
                  {d.dueAssignments.map((a) => (
                    <li key={a.id} className="rounded-item border border-line p-4">
                      <p className="truncate text-[14px] font-semibold text-ink">{a.title}</p>
                      <p className="mt-0.5 text-[12px] text-ink-muted">{a.subject}</p>
                      <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-ink-faint">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Due {formatDate(a.due)}
                      </p>
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
              title="Upcoming exams"
              subtitle="Next on your schedule"
              action={
                <Link to="/student/exams" className="text-[13px] font-semibold text-accent hover:underline">
                  All
                </Link>
              }
            />
            <CardBody className="pt-2">
              {loading ? (
                <Skeleton className="h-[160px] w-full" />
              ) : d.upcomingExams.length === 0 ? (
                <p className="text-[13px] text-ink-muted">Nothing scheduled yet.</p>
              ) : (
                <ul className="space-y-3">
                  {d.upcomingExams.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 rounded-item border border-line p-4">
                      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-item bg-surface-muted">
                        <span className="text-[10px] font-semibold uppercase text-ink-muted">
                          {new Date(e.date).toLocaleDateString('en-GB', { month: 'short' })}
                        </span>
                        <span className="font-display text-[15px] font-semibold leading-none text-ink">{new Date(e.date).getDate()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-ink">{e.subject}</p>
                        <p className="text-[12px] text-ink-muted">{[e.exam, e.time, e.room].filter(Boolean).join(' · ')}</p>
                      </div>
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
              title="Fees"
              subtitle="Your balance with the accounts office"
              action={
                <Link to="/student/fees" className="text-[13px] font-semibold text-accent hover:underline">
                  Details
                </Link>
              }
            />
            <CardBody className="pt-2">
              {loading ? (
                <Skeleton className="h-[120px] w-full" />
              ) : (
                <div className="rounded-item border border-line p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-item bg-accent-soft text-accent">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <p className="mt-3 text-[13px] text-ink-muted">Outstanding</p>
                  <p className={`mt-1 font-display text-[26px] font-semibold ${d.fees.outstanding ? 'text-warning' : 'text-success'}`}>
                    {currency(d.fees.outstanding)}
                  </p>
                  <p className="mt-1 text-[12px] text-ink-faint">{d.fees.invoices} invoices on record</p>
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mt-6">
        <Card>
          <CardHeader
            title="Recent announcements"
            subtitle="Latest notices for students"
            action={
              <Link to="/student/announcements" className="text-[13px] font-semibold text-accent hover:underline">
                View board
              </Link>
            }
          />
          <CardBody className="pt-2">
            {loading ? (
              <Skeleton className="h-[120px] w-full" />
            ) : d.announcements.length === 0 ? (
              <p className="text-[13px] text-ink-muted">No announcements yet.</p>
            ) : (
              <ul className="grid gap-3 lg:grid-cols-3">
                {d.announcements.map((a) => (
                  <li key={a._id} className="rounded-item border border-line p-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-item bg-accent-soft text-accent">
                      <Megaphone className="h-4 w-4" />
                    </span>
                    <p className="mt-3 text-[14px] font-semibold text-ink">{a.title}</p>
                    <p className="mt-1.5 line-clamp-2 text-[13px] text-ink-muted">{a.body}</p>
                    <p className="mt-3 text-[11px] text-ink-faint">
                      {a.author} · {formatDate(a.publishDate)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </motion.div>
    </div>
  )
}
