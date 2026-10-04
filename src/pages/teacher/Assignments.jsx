import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, ClipboardList, ExternalLink, Eye, Plus, Trash2 } from 'lucide-react'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  ExportMenu,
  Field,
  Input,
  Modal,
  PageHeader,
  ProgressBar,
  SearchInput,
  Select,
  Skeleton,
  Tabs,
  Textarea,
  Toast,
} from '../../components/ui/index.jsx'
import endpoints from '../../lib/api.js'
import useApi, { useMutation } from '../../lib/useApi.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { fadeUp, hoverLift, stagger } from '../../lib/motion.js'
import { formatDate, todayISO, toneFor } from '../../lib/utils.js'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'Open', label: 'Open' },
  { key: 'Grading', label: 'Grading' },
  { key: 'Graded', label: 'Graded' },
]

const plusDays = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const isWebLink = (u) => /^https?:\/\/\S+$/i.test(u || '')
const label = (c) => (c ? `${c.name} · ${c.section}` : '—')

export default function TeacherAssignments() {
  const { profile } = useAuth()
  const list = useApi(() => endpoints.assignments.list({ limit: 100 }), [])
  const { data: classData } = useApi(() => endpoints.teachers.myClasses(), [])
  const { data: subjectData } = useApi(() => endpoints.subjects.list(), [])
  const myClasses = classData?.data ?? []
  const subjects = subjectData?.data ?? []

  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [grades, setGrades] = useState({})
  const [toast, setToast] = useState({ message: '', tone: 'success' })

  const detail = useApi(() => endpoints.assignments.get(detailId), [detailId], { skip: !detailId })
  const d = detail.data?.data

  const create = useMutation((body) => endpoints.assignments.create(body), {
    onSuccess: (res) => {
      setToast({ message: res.message, tone: 'success' })
      setForm(null)
      list.refetch()
    },
  })

  const remove = useMutation((id) => endpoints.assignments.remove(id), {
    onSuccess: (res) => {
      setToast({ message: res.message, tone: 'success' })
      setConfirm(null)
      list.refetch()
    },
  })

  const grade = useMutation(({ student, marks, feedback }) => endpoints.assignments.grade(detailId, { student, marks, feedback }), {
    onSuccess: (res) => {
      setToast({ message: `${res.message} (${res.data.graded}/${res.data.roster} graded)`, tone: 'success' })
      detail.refetch()
      list.refetch()
    },
    onError: (err) => setToast({ message: err.message, tone: 'danger' }),
  })

  if (list.error) return <ErrorState error={list.error} onRetry={list.refetch} />

  const items = list.data?.data ?? []
  let rows = tab === 'all' ? items : items.filter((a) => a.status === tab)
  const q = query.trim().toLowerCase()
  if (q) rows = rows.filter((a) => `${a.title} ${a.subject?.name} ${label(a.classRoom)}`.toLowerCase().includes(q))

  const openNew = () => {
    create.setError(null)
    create.setFields({})
    setForm({
      title: '',
      description: '',
      classRoom: myClasses[0]?._id ?? '',
      subject: profile?.subject?._id ?? subjects[0]?._id ?? '',
      assignedOn: todayISO(),
      dueDate: plusDays(7),
      maxMarks: 20,
      submissionType: 'File upload',
    })
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const openDetail = (a) => {
    setGrades({})
    setDetailId(a._id)
  }

  // Unsaved edits per student, falling back to what is already recorded
  const saved = (s) => ({ marks: s.marks ?? '', feedback: s.feedback ?? '' })
  const gradeValue = (s) => grades[s.student?._id] ?? saved(s)
  const setGrade = (s, k, v) =>
    setGrades((g) => ({ ...g, [s.student?._id]: { ...(g[s.student?._id] ?? saved(s)), [k]: v } }))

  return (
    <div>
      <PageHeader
        title="Assignments & Homework"
        subtitle={list.loading ? 'Loading…' : `${items.length} assignments across your classes`}
        actions={
          <>
            <ExportMenu
              title="My Assignments"
              filename="Assignments"
              columns={[
                { header: 'Title', value: (a) => a.title },
                { header: 'Class', value: (a) => label(a.classRoom) },
                { header: 'Subject', value: (a) => a.subject?.name ?? '' },
                { header: 'Assigned', value: (a) => formatDate(a.assignedOn) },
                { header: 'Due', value: (a) => formatDate(a.dueDate) },
                { header: 'Submitted', value: (a) => `${a.submitted}/${a.total}`, align: 'center' },
                { header: 'Max marks', value: (a) => a.maxMarks, align: 'center' },
                { header: 'Status', value: (a) => a.status },
              ]}
              getRows={() => rows}
            />
            <button className="btn-primary" onClick={openNew} disabled={!myClasses.length}>
              <Plus className="h-4 w-4" />
              New assignment
            </button>
          </>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={query} onChange={setQuery} placeholder="Search assignment, subject or class…" className="sm:max-w-sm" />
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {list.loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-5 w-2/3 animate-pulse rounded bg-slate-200" />
              <div className="mt-4 h-2 w-full animate-pulse rounded bg-slate-200" />
            </Card>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title={q ? 'No matching assignments' : 'Nothing here yet'}
            description={q ? 'Try a different search term.' : 'Create an assignment to share it with your class.'}
            action={
              !q && (
                <button className="btn-primary" onClick={openNew} disabled={!myClasses.length}>
                  <Plus className="h-4 w-4" />
                  New assignment
                </button>
              )
            }
          />
        </Card>
      ) : (
        <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {rows.map((a) => {
            const pct = a.total ? Math.round((a.submitted / a.total) * 100) : 0
            return (
              <motion.div key={a._id} variants={fadeUp} whileHover={hoverLift} className="card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="accent">{a.subject?.name ?? '—'}</Badge>
                  <Badge tone="neutral">{label(a.classRoom)}</Badge>
                  <Badge tone={toneFor(a.status)}>{a.status}</Badge>
                </div>
                <h3 className="mt-3 font-display text-[16px] font-semibold text-ink">{a.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-[13px] text-ink-muted">{a.description || 'No instructions.'}</p>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <span className="text-ink-muted">Submissions</span>
                    <span className="font-semibold text-ink">
                      {a.submitted}/{a.total} · {pct}%
                    </span>
                  </div>
                  <ProgressBar value={pct} height="h-1.5" color={pct >= 75 ? '#16A34A' : pct >= 40 ? '#D97706' : '#DC2626'} />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-1.5 text-[12px] text-ink-muted">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Due {formatDate(a.dueDate)}
                  </p>
                  <div className="flex gap-1">
                    <button onClick={() => openDetail(a)} className="btn-ghost h-9 !px-3 text-[13px]">
                      <Eye className="h-3.5 w-3.5" />
                      View & grade
                    </button>
                    <button
                      onClick={() => setConfirm(a)}
                      className="rounded-btn p-2 text-ink-faint transition-colors hover:bg-red-50 hover:text-danger"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Create */}
      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title="New assignment"
        subtitle="Share homework with one of your classes"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setForm(null)} disabled={create.busy}>
              Cancel
            </button>
            <button className="btn-primary" onClick={() => create.mutate({ ...form, maxMarks: Number(form.maxMarks) })} disabled={create.busy}>
              {create.busy ? 'Publishing…' : 'Publish assignment'}
            </button>
          </>
        }
      >
        {form && (
          <div className="space-y-4">
            <Field label="Title" required error={create.fields.title}>
              <Input value={form.title} onChange={set('title')} placeholder="e.g. Quadratic Equations — Worksheet 5" />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Class" required error={create.fields.classRoom}>
                <Select value={form.classRoom} onChange={set('classRoom')}>
                  {myClasses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Subject" required error={create.fields.subject}>
                <Select value={form.subject} onChange={set('subject')}>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Assigned on" error={create.fields.assignedOn}>
                <Input type="date" value={form.assignedOn} onChange={set('assignedOn')} />
              </Field>
              <Field label="Due date" required error={create.fields.dueDate}>
                <Input type="date" value={form.dueDate} min={form.assignedOn} onChange={set('dueDate')} />
              </Field>
              <Field label="Maximum marks" error={create.fields.maxMarks}>
                <Input type="number" min="1" value={form.maxMarks} onChange={set('maxMarks')} />
              </Field>
              <Field label="Submission type">
                <Select value={form.submissionType} onChange={set('submissionType')}>
                  <option>File upload</option>
                  <option>Written (in class)</option>
                  <option>Online quiz</option>
                </Select>
              </Field>
            </div>
            <Field label="Instructions" error={create.fields.description}>
              <Textarea rows={4} value={form.description} onChange={set('description')} placeholder="What should students do?" />
            </Field>
            {create.error && (
              <p className="rounded-btn border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-danger">{create.error}</p>
            )}
          </div>
        )}
      </Modal>

      {/* Detail + grading */}
      <Modal
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        size="lg"
        title={d?.title ?? 'Assignment'}
        subtitle={d ? `${label(d.classRoom)} · ${d.subject?.name ?? ''} · out of ${d.maxMarks}` : ''}
        footer={
          <button className="btn-secondary" onClick={() => setDetailId(null)}>
            Close
          </button>
        }
      >
        {detail.loading || !d ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge tone={toneFor(d.status)}>{d.status}</Badge>
              <Badge tone="neutral">Assigned {formatDate(d.assignedOn)}</Badge>
              <Badge tone="warning">Due {formatDate(d.dueDate)}</Badge>
            </div>
            {d.description && <p className="whitespace-pre-line text-[14px] leading-relaxed text-ink-muted">{d.description}</p>}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Submitted', value: d.submitted, tone: 'text-success' },
                { label: 'Not yet', value: Math.max(0, d.pending), tone: 'text-warning' },
                { label: 'Graded', value: d.graded, tone: 'text-info' },
              ].map((s) => (
                <div key={s.label} className="rounded-item border border-line p-4 text-center">
                  <p className={`font-display text-xl font-semibold ${s.tone}`}>{s.value}</p>
                  <p className="mt-1 text-[12px] text-ink-muted">{s.label}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Submissions</p>
              {d.submissions.length === 0 ? (
                <p className="text-[13px] text-ink-muted">No one has submitted yet.</p>
              ) : (
                <ul className="space-y-3">
                  {d.submissions.map((s) => {
                    const sid = s.student?._id
                    const v = gradeValue(s)
                    const over = v.marks !== '' && (Number(v.marks) > d.maxMarks || Number(v.marks) < 0)
                    return (
                      <li key={sid} className="rounded-item border border-line p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-[14px] font-semibold text-ink">{s.student?.name ?? 'Removed student'}</p>
                            <p className="text-[12px] text-ink-muted">
                              Roll {s.student?.roll ?? '—'} · {formatDate(s.submittedAt)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {s.late && <Badge tone="danger">Late</Badge>}
                            {s.marks != null && (
                              <Badge tone="success">
                                {s.marks}/{d.maxMarks}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {s.note && <p className="mt-2 whitespace-pre-line text-[13px] text-ink-muted">{s.note}</p>}
                        {isWebLink(s.fileUrl) && (
                          <a
                            href={s.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open submitted work
                          </a>
                        )}
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[110px_1fr_auto]">
                          <Input
                            type="number"
                            min="0"
                            max={d.maxMarks}
                            value={v.marks}
                            onChange={(e) => setGrade(s, 'marks', e.target.value)}
                            placeholder={`/ ${d.maxMarks}`}
                            aria-label="Marks"
                            className={over ? 'border-danger' : ''}
                          />
                          <Input value={v.feedback} onChange={(e) => setGrade(s, 'feedback', e.target.value)} placeholder="Feedback (optional)" />
                          <button
                            className="btn-primary"
                            disabled={grade.busy || v.marks === '' || over}
                            onClick={() => grade.mutate({ student: sid, marks: Number(v.marks), feedback: v.feedback })}
                          >
                            {s.marks != null ? 'Update' : 'Grade'}
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Delete assignment?"
        subtitle={confirm?.title}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setConfirm(null)} disabled={remove.busy}>
              Cancel
            </button>
            <button className="btn-danger" onClick={() => remove.mutate(confirm._id)} disabled={remove.busy}>
              <Trash2 className="h-4 w-4" />
              {remove.busy ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">Every submission and grade for this assignment is deleted with it. This cannot be undone.</p>
        {remove.error && (
          <p className="mt-4 rounded-btn border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-danger">{remove.error}</p>
        )}
      </Modal>

      <Toast message={toast.message} tone={toast.tone} onDone={() => setToast({ message: '', tone: 'success' })} />
    </div>
  )
}
