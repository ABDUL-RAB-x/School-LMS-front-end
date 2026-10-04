import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, MapPin, Pencil, Phone } from 'lucide-react'
import {
  Avatar,
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from '../../components/ui/index.jsx'
import endpoints from '../../lib/api.js'
import useApi from '../../lib/useApi.js'
import { fadeUp, stagger } from '../../lib/motion.js'
import { formatDate, toneFor } from '../../lib/utils.js'

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="text-[13px] text-ink-muted">{label}</span>
      <span className="text-right text-[13px] font-semibold text-ink">{value || '—'}</span>
    </div>
  )
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function AdminTeacherDetail() {
  const { id } = useParams()
  const { data, loading, error, refetch } = useApi(() => endpoints.teachers.get(id), [id])

  if (error) return <ErrorState error={error} onRetry={refetch} />

  if (loading) {
    return (
      <div>
        <Skeleton className="mb-6 h-10 w-64" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Skeleton className="h-[360px] rounded-card" />
          <Skeleton className="h-[360px] rounded-card xl:col-span-2" />
        </div>
      </div>
    )
  }

  const t = data.data
  const schedule = [...(t.schedule ?? [])].sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.period - b.period,
  )

  return (
    <div>
      <Link
        to="/admin/teachers"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to teachers
      </Link>

      <PageHeader
        title={t.name}
        subtitle={`${t.staffId} · ${t.subject?.name ?? 'No subject'} · ${t.department}`}
        actions={
          <Link to={`/admin/teachers/${t._id}/edit`} className="btn-primary">
            <Pencil className="h-4 w-4" />
            Edit teacher
          </Link>
        }
      />

      <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardBody className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar name={t.name} size="xl" />
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{t.name}</h3>
                <p className="text-[13px] text-ink-muted">{t.qualification}</p>
                <Badge tone={toneFor(t.status)} dot className="mt-3">
                  {t.status}
                </Badge>
              </div>
              <div className="mt-6 space-y-2.5">
                <p className="flex items-center gap-2.5 text-[13px] text-ink-muted">
                  <Mail className="h-4 w-4 shrink-0 text-ink-faint" />
                  <span className="truncate">{t.email}</span>
                </p>
                <p className="flex items-center gap-2.5 text-[13px] text-ink-muted">
                  <Phone className="h-4 w-4 shrink-0 text-ink-faint" />
                  {t.phone || '—'}
                </p>
                <p className="flex items-start gap-2.5 text-[13px] text-ink-muted">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
                  {t.address || '—'}
                </p>
              </div>
              {t.bio && <p className="mt-5 border-t border-line pt-4 text-[13px] text-ink-muted">{t.bio}</p>}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="xl:col-span-2">
          <Card className="h-full">
            <CardHeader title="Staff record" subtitle="Employment details" />
            <CardBody className="grid grid-cols-1 gap-x-8 pt-1 sm:grid-cols-2">
              <div>
                <InfoRow label="Staff ID" value={t.staffId} />
                <InfoRow label="Employee ID" value={t.employeeId} />
                <InfoRow label="Primary subject" value={t.subject?.name} />
                <InfoRow label="Department" value={t.department} />
              </div>
              <div>
                <InfoRow label="Experience" value={`${t.experience} years`} />
                <InfoRow label="Date joined" value={formatDate(t.joined)} />
                <InfoRow label="Assigned classes" value={t.classes?.length ?? 0} />
                <InfoRow label="Portal access" value={t.user ? 'Enabled' : 'Not set up'} />
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader title="Assigned classes" subtitle="Current term" />
            <CardBody className="space-y-3 pt-2">
              {!t.classes?.length ? (
                <EmptyState title="No classes assigned" description="Assign classes from the edit screen." />
              ) : (
                t.classes.map((c) => (
                  <div key={c._id} className="rounded-item border border-line p-4">
                    <p className="text-[14px] font-semibold text-ink">
                      {c.name} · {c.section}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink-muted">Room {c.room || '—'}</p>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader title="Teaching schedule" subtitle={`${schedule.length} periods per week`} />
            <CardBody className="pt-2">
              {schedule.length === 0 ? (
                <EmptyState title="Not timetabled yet" description="Build a timetable to see their periods." />
              ) : (
                <ul className="divide-y divide-line">
                  {schedule.slice(0, 8).map((p, i) => (
                    <li key={`${p.day}-${p.period}-${i}`} className="flex items-center gap-3 py-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-item bg-surface-muted text-[11px] font-semibold text-ink-muted">
                        {p.day.slice(0, 3)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-ink">{p.subject}</p>
                        <p className="text-[12px] text-ink-muted">
                          {p.classRoom} · {p.time}
                        </p>
                      </div>
                      <Badge tone="neutral">{p.room || '—'}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader title="Assignments set" subtitle="Homework they have published" />
            <CardBody className="pt-2">
              {!t.assignments?.length ? (
                <EmptyState title="Nothing set yet" description="Assignments they publish appear here." />
              ) : (
                <ul className="divide-y divide-line">
                  {t.assignments.slice(0, 8).map((a) => (
                    <li key={a._id} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-ink">{a.title}</p>
                        <p className="text-[12px] text-ink-muted">
                          {a.classRoom ? `${a.classRoom.name} · ${a.classRoom.section}` : '—'} · due{' '}
                          {formatDate(a.dueDate)}
                        </p>
                      </div>
                      <Badge tone={toneFor(a.status)}>{a.status}</Badge>
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
