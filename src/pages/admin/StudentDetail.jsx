import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileDown, Mail, MapPin, Pencil, Phone, Receipt } from 'lucide-react'
import {
  Avatar,
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  PageHeader,
  ProgressBar,
  Skeleton,
  Toast,
} from '../../components/ui/index.jsx'
import endpoints, { fetchAll } from '../../lib/api.js'
import useApi from '../../lib/useApi.js'
import { fadeUp, stagger } from '../../lib/motion.js'
import { formatDate, toneFor } from '../../lib/utils.js'
import { downloadDocumentPdf, feeStatementPdf } from '../../lib/documents.js'

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="text-[13px] text-ink-muted">{label}</span>
      <span className="text-right text-[13px] font-semibold text-ink">{value || '—'}</span>
    </div>
  )
}

// Every invoice billed to this student, with the same totals the student sees
async function statement(s) {
  const all = await fetchAll(endpoints.fees.list, { search: s.studentId })
  const invoices = all.filter((f) => String(f.student?._id) === String(s._id))
  const sum = (pred) => invoices.filter(pred).reduce((t, f) => t + f.amount, 0)
  return feeStatementPdf({
    student: s,
    invoices,
    summary: {
      billed: sum(() => true),
      paid: sum((f) => f.status === 'Paid'),
      outstanding: sum((f) => f.status !== 'Paid'),
      overdue: sum((f) => f.status === 'Overdue'),
    },
  })
}

function profilePdf(s) {
  return downloadDocumentPdf({
    filename: `Student ${s.studentId}`,
    title: 'Student Profile',
    subtitle: `${s.name} · ${s.studentId}`,
    sections: [
      {
        heading: 'Student record',
        pairs: [
          ['Name', s.name],
          ['Student ID', s.studentId],
          ['Class', s.classRoom ? `${s.classRoom.name} · Section ${s.classRoom.section}` : '—'],
          ['Roll number', s.roll],
          ['Gender', s.gender],
          ['Date of birth', formatDate(s.dob)],
          ['Admission date', formatDate(s.admissionDate)],
          ['Blood group', s.bloodGroup || '—'],
          ['Email', s.email],
          ['Phone', s.phone || '—'],
          ['Address', s.address || '—'],
          ['Status', s.status],
        ],
      },
      {
        heading: 'Guardian',
        pairs: [
          ['Name', s.guardian?.name || '—'],
          ['Relationship', s.guardian?.relationship || '—'],
          ['Phone', s.guardian?.phone || '—'],
        ],
      },
      {
        heading: 'Attendance & fees',
        pairs: [
          ['Overall attendance', s.attendance == null ? '—' : `${s.attendance}%`],
          ['Fee status', s.feeStatus || '—'],
        ],
      },
      {
        heading: 'Recent results',
        columns: [
          { header: 'Subject', value: (r) => r.exam?.subject?.name ?? '—' },
          { header: 'Examination', value: (r) => r.exam?.name ?? '—' },
          { header: 'Date', value: (r) => formatDate(r.exam?.date) },
          { header: 'Marks', value: (r) => `${r.marks} / ${r.maxMarks}`, align: 'center' },
          { header: 'Grade', value: (r) => r.grade, align: 'center' },
        ],
        rows: s.results ?? [],
      },
    ],
  })
}

export default function AdminStudentDetail() {
  const { id } = useParams()
  const { data, loading, error, refetch } = useApi(() => endpoints.students.get(id), [id])
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  const run = async (fn) => {
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      setToast(err.message || 'The download failed.')
    } finally {
      setBusy(false)
    }
  }

  if (error) return <ErrorState error={error} onRetry={refetch} />

  if (loading) {
    return (
      <div>
        <Skeleton className="mb-6 h-10 w-64" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Skeleton className="h-[380px] rounded-card" />
          <Skeleton className="h-[380px] rounded-card xl:col-span-2" />
        </div>
      </div>
    )
  }

  const s = data.data
  const cap = (v) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : '—')

  return (
    <div>
      <Link
        to="/admin/students"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to students
      </Link>

      <PageHeader
        title={s.name}
        subtitle={`${s.studentId}${s.classRoom ? ` · ${s.classRoom.name} · Section ${s.classRoom.section}` : ''}`}
        actions={
          <>
            <button className="btn-secondary" onClick={() => run(() => profilePdf(s))} disabled={busy}>
              <FileDown className="h-4 w-4" />
              Profile PDF
            </button>
            <button className="btn-secondary" onClick={() => run(() => statement(s))} disabled={busy}>
              <Receipt className="h-4 w-4" />
              Fee statement
            </button>
            <Link to={`/admin/students/${s._id}/edit`} className="btn-primary">
              <Pencil className="h-4 w-4" />
              Edit student
            </Link>
          </>
        }
      />

      <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardBody className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar name={s.name} size="xl" />
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{s.name}</h3>
                <p className="text-[13px] text-ink-muted">Roll {s.roll}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <Badge tone={toneFor(s.status)} dot>
                    {s.status}
                  </Badge>
                  <Badge tone={toneFor(s.feeStatus)}>Fees {s.feeStatus}</Badge>
                </div>
              </div>

              <div className="mt-6 space-y-2.5">
                <p className="flex items-center gap-2.5 text-[13px] text-ink-muted">
                  <Mail className="h-4 w-4 shrink-0 text-ink-faint" />
                  <span className="truncate">{s.email}</span>
                </p>
                <p className="flex items-center gap-2.5 text-[13px] text-ink-muted">
                  <Phone className="h-4 w-4 shrink-0 text-ink-faint" />
                  {s.phone || '—'}
                </p>
                <p className="flex items-start gap-2.5 text-[13px] text-ink-muted">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
                  {s.address || '—'}
                </p>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="xl:col-span-2">
          <Card className="h-full">
            <CardHeader title="Student record" subtitle="Administrative details" />
            <CardBody className="grid grid-cols-1 gap-x-8 pt-1 sm:grid-cols-2">
              <div>
                <InfoRow label="Student ID" value={s.studentId} />
                <InfoRow
                  label="Class"
                  value={s.classRoom ? `${s.classRoom.name} · ${s.classRoom.section}` : '—'}
                />
                <InfoRow label="Room" value={s.classRoom?.room} />
                <InfoRow label="Gender" value={s.gender} />
                <InfoRow label="Date of birth" value={formatDate(s.dob)} />
              </div>
              <div>
                <InfoRow label="Admission date" value={formatDate(s.admissionDate)} />
                <InfoRow label="Guardian" value={s.guardian?.name} />
                <InfoRow label="Guardian phone" value={s.guardian?.phone} />
                <InfoRow label="Blood group" value={s.bloodGroup} />
                <InfoRow label="Portal access" value={s.user ? 'Enabled' : 'Not set up'} />
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="xl:col-span-2">
          <Card className="h-full">
            <CardHeader
              title="Enrolled subjects"
              subtitle={`${s.subjects?.length ?? 0} subjects for ${s.classRoom?.name ?? 'this class'}`}
            />
            <CardBody className="pt-2">
              {!s.subjects?.length ? (
                <EmptyState title="No subjects assigned" description="Assign subjects to this grade first." />
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {s.subjects.map((sub) => (
                    <li key={sub._id} className="rounded-item border border-line p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-semibold text-ink">{sub.name}</p>
                          <p className="text-[12px] text-ink-muted">{sub.leadTeacher?.name ?? 'Unassigned'}</p>
                        </div>
                        <Badge tone="accent">{sub.code}</Badge>
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
            <CardHeader title="Attendance" subtitle="All registers to date" />
            <CardBody className="space-y-5 pt-2">
              {s.attendance == null ? (
                <EmptyState title="No attendance yet" description="Records appear once registers are taken." />
              ) : (
                <div>
                  <div className="mb-2 flex items-center justify-between text-[13px]">
                    <span className="text-ink-muted">Overall attendance</span>
                    <span className="font-semibold text-ink">{s.attendance}%</span>
                  </div>
                  <ProgressBar
                    value={s.attendance}
                    color={s.attendance >= 90 ? '#0F766E' : s.attendance >= 80 ? '#D97706' : '#DC2626'}
                  />
                </div>
              )}

              {s.attendanceLog?.length > 0 && (
                <ul className="divide-y divide-line">
                  {s.attendanceLog.map((a) => (
                    <li key={a.date} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="text-[13px] text-ink-muted">{formatDate(a.date)}</span>
                      <Badge tone={toneFor(cap(a.status))}>{cap(a.status)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="xl:col-span-3">
          <Card>
            <CardHeader title="Exam results" subtitle="Published marks" />
            <CardBody className="pt-2">
              {!s.results?.length ? (
                <EmptyState title="No results published" description="Marks appear once teachers submit them." />
              ) : (
                <ul className="divide-y divide-line">
                  {s.results.map((r) => (
                    <li key={r._id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-ink">
                          {r.exam?.subject?.name ?? '—'}
                        </p>
                        <p className="text-[12px] text-ink-muted">
                          {r.exam?.name ?? '—'} · {formatDate(r.exam?.date)}
                        </p>
                      </div>
                      <span className="text-[13px] font-semibold text-ink">
                        {r.marks}/{r.maxMarks}
                      </span>
                      <Badge tone={r.grade?.startsWith('A') ? 'success' : r.grade?.startsWith('B') ? 'info' : 'warning'}>
                        {r.grade}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>

      <Toast message={toast} tone="danger" onDone={() => setToast('')} />
    </div>
  )
}
