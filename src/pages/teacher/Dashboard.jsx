import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, ClipboardCheck, ClipboardList, Clock, DoorOpen, Plus, Users } from 'lucide-react'
import StatCard from '../../components/ui/StatCard.jsx'
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardSkeleton,
  EmptyState,
  ErrorState,
  ProgressBar,
  Skeleton,
} from '../../components/ui/index.jsx'
import { GradeBarChart } from '../../components/charts/index.jsx'
import { DAYS } from '../../components/TimetableGrid.jsx'
import endpoints from '../../lib/api.js'
import useApi from '../../lib/useApi.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { fadeUp, hoverLift, slideInLeft, stagger } from '../../lib/motion.js'
import { cx, formatDate, toneFor } from '../../lib/utils.js'

const STAT_ICONS = {
  classes: BookOpen,
  students: Users,
  pending: ClipboardList,
  attendance: ClipboardCheck,
}
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// done / now / upcoming from "08:00 – 08:45" against the current time
function slotState(time, isToday) {
  if (!isToday) return 'upcoming'
  const [start, end] = (time || '').split(/\s*[–-]\s*/)
  const now = new Date()
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  if (end && hhmm >= end) return 'done'
  if (start && hhmm >= start) return 'now'
  return 'upcoming'
}

const SLOT_STYLE = {
  done: 'border-line bg-white opacity-70',
  now: 'border-accent bg-accent-soft',
  upcoming: 'border-line bg-white',
}

export default function TeacherDashboard() {
  const { user } = useAuth()
  const { data, loading, error, refetch } = useApi(() => endpoints.dashboard.teacher(), [])
  const tt = useApi(() => endpoints.timetable.mine(), [])

  if (error) return <ErrorState error={error} onRetry={refetch} />

  const d = data?.data
  const jsDay = DAY_NAMES[new Date().getDay()]
  const isSchoolDay = DAYS.includes(jsDay)
  const day = isSchoolDay ? jsDay : 'Monday'
  const schedule = tt.data?.data?.grid?.[day] ?? []
  const pending = d?.assignments ?? []
  const toGrade = pending.filter((a) => a.submitted > 0).length

  return (
    <div>
      <motion.div
        variants={slideInLeft}
        initial="hidden"
        animate="show"
        className="mb-6 overflow-hidden rounded-card border border-line bg-primary p-6 sm:p-8"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-medium text-slate-300">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-white sm:text-[28px]">
              {greeting()}, {user?.name?.split(' ')[0] ?? ''}
            </h1>
            <p className="mt-2 max-w-xl text-[14px] text-slate-300">
              {isSchoolDay ? (
                <>
                  You have <span className="font-semibold text-white">{schedule.length} period{schedule.length === 1 ? '' : 's'}</span> today
                </>
              ) : (
                <>No classes today</>
              )}{' '}
              and <span className="font-semibold text-white">{toGrade} assignment{toGrade === 1 ? '' : 's'}</span> with work to grade.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/teacher/attendance" className="btn bg-white text-primary hover:bg-slate-100">
              <ClipboardCheck className="h-4 w-4" />
              Mark attendance
            </Link>
            <Link to="/teacher/assignments" className="btn bg-accent text-white hover:bg-accent-hover">
              <Plus className="h-4 w-4" />
              New assignment
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

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mt-6">
        <Card>
          <CardHeader
            title={isSchoolDay ? "Today's schedule" : `${day}'s schedule`}
            subtitle="Your periods from the published timetable"
            action={
              <Link to="/teacher/timetable" className="text-[13px] font-semibold text-accent hover:underline">
                Full timetable
              </Link>
            }
          />
          <CardBody className="pt-2">
            {tt.loading ? (
              <Skeleton className="h-[110px] w-full" />
            ) : schedule.length === 0 ? (
              <p className="text-[13px] text-ink-muted">No teaching periods scheduled.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {schedule.map((s, i) => {
                  const state = slotState(s.time, isSchoolDay)
                  return (
                    <div key={`${s.period}-${i}`} className={cx('rounded-item border p-4 transition-colors', SLOT_STYLE[state])}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Period {s.period}</span>
                        {state === 'now' && <Badge tone="accent" dot>In progress</Badge>}
                        {state === 'done' && <Badge tone="neutral">Done</Badge>}
                      </div>
                      <p className="mt-2 text-[14px] font-semibold text-ink">{s.subject}</p>
                      <p className="mt-0.5 text-[12px] text-ink-muted">{[s.classRoom, s.room].filter(Boolean).join(' · ')}</p>
                      <p className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-faint">
                        <Clock className="h-3.5 w-3.5" />
                        {s.time}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </motion.div>

      <div className="mt-8 mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">My classes</h2>
          <p className="text-[13px] text-ink-muted">Sections you teach this term</p>
        </div>
        <Link to="/teacher/classes" className="text-[13px] font-semibold text-accent hover:underline">
          View all
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : d.classes.length === 0 ? (
        <Card>
          <EmptyState title="No classes assigned yet" description="The office assigns teachers to classes." />
        </Card>
      ) : (
        <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {d.classes.map((c) => (
            <motion.div key={c.id} variants={fadeUp} whileHover={hoverLift} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-[17px] font-semibold text-ink">{c.className}</p>
                <Badge tone="accent">{c.students} students</Badge>
              </div>
              {c.room && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="neutral">
                    <DoorOpen className="h-3 w-3" />
                    Room {c.room}
                  </Badge>
                </div>
              )}
              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-[12px]">
                  <span className="text-ink-muted">Attendance to date</span>
                  <span className="font-semibold text-ink">{c.attendance != null ? `${c.attendance}%` : '—'}</span>
                </div>
                <ProgressBar value={c.attendance ?? 0} color="#2563EB" height="h-1.5" />
              </div>
              <div className="mt-5 flex gap-2">
                <Link to="/teacher/attendance" className="btn-secondary h-9 flex-1 !px-2 text-[13px]">
                  Attendance
                </Link>
                <Link to="/teacher/marks" className="btn-primary h-9 flex-1 !px-2 text-[13px]">
                  Marks
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <motion.div variants={stagger(0.1)} initial="hidden" animate="show" className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <motion.div variants={fadeUp} className="xl:col-span-2">
          <Card className="h-full">
            <CardHeader
              title="Pending assignments"
              subtitle="Not yet fully graded"
              action={
                <Link to="/teacher/assignments" className="text-[13px] font-semibold text-accent hover:underline">
                  Manage
                </Link>
              }
            />
            <CardBody className="pt-2">
              {loading ? (
                <Skeleton className="h-[160px] w-full" />
              ) : pending.length === 0 ? (
                <p className="text-[13px] text-ink-muted">Everything is graded.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {pending.slice(0, 6).map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-ink">{a.title}</p>
                        <p className="text-[12px] text-ink-muted">
                          {a.className} · {a.subject} · due {formatDate(a.due)}
                        </p>
                      </div>
                      <span className="text-[12px] font-semibold text-ink">{a.submitted} submitted</span>
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
            <CardHeader title="Attendance summary" subtitle="All registers to date" />
            <CardBody className="space-y-4 pt-2">
              {loading ? (
                <Skeleton className="h-[160px] w-full" />
              ) : (
                d.classes.map((c) => (
                  <div key={c.id}>
                    <div className="mb-1.5 flex items-center justify-between text-[13px]">
                      <span className="truncate text-ink-muted">{c.className}</span>
                      <span className="font-semibold text-ink">{c.attendance != null ? `${c.attendance}%` : '—'}</span>
                    </div>
                    <ProgressBar
                      value={c.attendance ?? 0}
                      height="h-1.5"
                      color={c.attendance >= 90 ? '#0F766E' : c.attendance >= 75 ? '#D97706' : '#DC2626'}
                    />
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="xl:col-span-3">
          <Card>
            <CardHeader title="Student performance" subtitle="Score distribution across every mark you have entered" />
            <CardBody className="pt-2">
              {loading ? (
                <Skeleton className="h-[240px] w-full" />
              ) : d.performance.every((p) => p.students === 0) ? (
                <EmptyState title="No marks yet" description="The chart fills in as you enter exam marks." />
              ) : (
                <GradeBarChart data={d.performance} labelKey="band" color="#0F766E" />
              )}
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
