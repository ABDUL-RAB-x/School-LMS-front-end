import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, ClipboardList, FileUp, MessageSquare } from 'lucide-react'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  Tabs,
  Textarea,
  Toast,
} from '../../components/ui/index.jsx'
import endpoints from '../../lib/api.js'
import useApi, { useMutation } from '../../lib/useApi.js'
import { fadeUp, hoverLift, stagger } from '../../lib/motion.js'
import { formatDate, toneFor } from '../../lib/utils.js'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Submitted', label: 'Submitted' },
  { key: 'Graded', label: 'Graded' },
]

export default function StudentAssignments() {
  const { data, loading, error, refetch } = useApi(() => endpoints.assignments.mine(), [])
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [submitting, setSubmitting] = useState(null)
  const [form, setForm] = useState({ note: '', fileUrl: '' })
  const [toast, setToast] = useState('')

  const submit = useMutation((a) => endpoints.assignments.submit(a.id, form), {
    onSuccess: (res) => {
      setToast(res.message)
      setSubmitting(null)
      refetch()
    },
  })

  if (error) return <ErrorState error={error} onRetry={refetch} />

  const items = data?.data ?? []
  // "Late" means not handed in and past due: it still belongs with Pending
  let rows = tab === 'all' ? items : items.filter((a) => a.status === tab || (tab === 'Pending' && a.status === 'Late'))
  const q = query.trim().toLowerCase()
  if (q) rows = rows.filter((a) => `${a.title} ${a.subject} ${a.teacher}`.toLowerCase().includes(q))

  const open = (a) => {
    setForm({ note: '', fileUrl: '' })
    submit.setError(null)
    setSubmitting(a)
  }

  const linkInvalid = form.fileUrl && !/^https?:\/\/\S+$/i.test(form.fileUrl.trim())

  return (
    <div>
      <PageHeader
        title="Assignments & Homework"
        subtitle={loading ? 'Loading…' : `${items.filter((a) => a.status === 'Pending' || a.status === 'Late').length} still to hand in`}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={query} onChange={setQuery} placeholder="Search assignment, subject or teacher…" className="sm:max-w-sm" />
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-5 w-2/3 animate-pulse rounded bg-slate-200" />
              <div className="mt-4 h-3 w-1/3 animate-pulse rounded bg-slate-200" />
            </Card>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title={q ? 'No matching assignments' : 'You are all caught up'}
            description={q ? 'Try a different search term.' : 'Nothing is waiting for you in this category.'}
          />
        </Card>
      ) : (
        <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {rows.map((a) => (
            <motion.div key={a.id} variants={fadeUp} whileHover={hoverLift} className="card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="accent">{a.subject}</Badge>
                <Badge tone={a.status === 'Late' ? 'danger' : toneFor(a.status)}>{a.status === 'Late' ? 'Past due' : a.status}</Badge>
                {a.marks && <Badge tone="success">{a.marks}</Badge>}
              </div>
              <h3 className="mt-3 font-display text-[16px] font-semibold text-ink">{a.title}</h3>
              <p className="mt-1 text-[13px] text-ink-muted">
                Set by {a.teacher} · {a.submissionType} · out of {a.maxMarks}
              </p>
              {a.description && <p className="mt-2 line-clamp-3 text-[13px] text-ink-muted">{a.description}</p>}
              {a.feedback && (
                <p className="mt-3 flex items-start gap-2 rounded-item bg-surface-muted p-3 text-[12px] text-ink-muted">
                  <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  {a.feedback}
                </p>
              )}

              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-[12px] text-ink-muted">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Due {formatDate(a.due)}
                </p>
                {a.status === 'Pending' || a.status === 'Late' ? (
                  <button className="btn-primary h-9 !px-3 text-[13px]" onClick={() => open(a)}>
                    <FileUp className="h-3.5 w-3.5" />
                    Submit work
                  </button>
                ) : a.status === 'Submitted' ? (
                  <button className="btn-ghost h-9 !px-3 text-[13px]" onClick={() => open(a)} title="Replace your submission">
                    Resubmit
                  </button>
                ) : (
                  <span className="text-[12px] font-semibold text-ink-faint">Marked</span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal
        open={Boolean(submitting)}
        onClose={() => setSubmitting(null)}
        title="Submit assignment"
        subtitle={submitting ? `${submitting.title} · ${submitting.subject}` : ''}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setSubmitting(null)} disabled={submit.busy}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={() => submit.mutate(submitting)}
              disabled={submit.busy || linkInvalid || (!form.note.trim() && !form.fileUrl.trim())}
            >
              <FileUp className="h-4 w-4" />
              {submit.busy ? 'Submitting…' : 'Submit'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="Link to your work"
            hint="Share it from Google Drive, OneDrive or similar and paste the link here."
            error={linkInvalid ? 'Enter a full link starting with https://' : undefined}
          >
            <Input
              type="url"
              value={form.fileUrl}
              onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
              placeholder="https://drive.google.com/…"
            />
          </Field>
          <Field label="Note for your teacher" hint="Add a link, a note, or both.">
            <Textarea
              rows={3}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Anything you want to mention…"
            />
          </Field>
          {submitting?.status === 'Late' && (
            <p className="rounded-btn border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-medium text-warning">
              This assignment is past its due date. It will be recorded as a late submission.
            </p>
          )}
          {submit.error && (
            <p className="rounded-btn border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-danger">{submit.error}</p>
          )}
        </div>
      </Modal>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
