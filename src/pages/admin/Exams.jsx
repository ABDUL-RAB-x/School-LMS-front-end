import { useCallback, useState } from 'react'
import { CalendarPlus, Pencil, Trash2 } from 'lucide-react'
import {
  Badge,
  DataTable,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Tabs,
  Toast,
} from '../../components/ui/index.jsx'
import endpoints, { fetchAll } from '../../lib/api.js'
import useApi, { useMutation } from '../../lib/useApi.js'
import { formatDate, toneFor } from '../../lib/utils.js'

const PAGE_SIZE = 8
const BLANK = {
  name: 'Midterm Examination',
  term: 'Term 1',
  classRoom: '',
  subject: '',
  date: '',
  time: '09:00',
  room: '',
  maxMarks: 100,
  status: 'Scheduled',
}

const dateInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '')

export default function AdminExams() {
  const [tab, setTab] = useState('schedule')
  const [examQuery, setExamQuery] = useState({ search: '', filters: {}, page: 1 })
  const [resultQuery, setResultQuery] = useState({ search: '', filters: {}, page: 1 })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [toast, setToast] = useState('')

  const { data: classData } = useApi(() => endpoints.classes.list(), [])
  const { data: subjectData } = useApi(() => endpoints.subjects.list(), [])
  const classes = classData?.data ?? []
  const subjects = subjectData?.data ?? []

  const exams = useApi(
    () =>
      endpoints.exams.list({
        search: examQuery.search,
        status: examQuery.filters.status,
        classRoom: examQuery.filters.classRoom,
        page: examQuery.page,
        limit: PAGE_SIZE,
      }),
    [examQuery.search, examQuery.filters.status, examQuery.filters.classRoom, examQuery.page],
  )

  const results = useApi(
    () =>
      endpoints.results.list({
        search: resultQuery.search,
        grade: resultQuery.filters.grade,
        classRoom: resultQuery.filters.classRoom,
        page: resultQuery.page,
        limit: PAGE_SIZE,
      }),
    [resultQuery.search, resultQuery.filters.grade, resultQuery.filters.classRoom, resultQuery.page],
    { skip: tab !== 'results' },
  )

  // Only accept a query object that actually differs, so the table cannot loop
  const same = (prev, q) =>
    prev.search === q.search && prev.page === q.page && JSON.stringify(prev.filters) === JSON.stringify(q.filters)

  const onExamQuery = useCallback((q) => setExamQuery((prev) => (same(prev, q) ? prev : q)), [])
  const onResultQuery = useCallback((q) => setResultQuery((prev) => (same(prev, q) ? prev : q)), [])

  const save = useMutation(
    (body) => (editing ? endpoints.exams.update(editing._id, body) : endpoints.exams.create(body)),
    {
      onSuccess: (res) => {
        setToast(res.message)
        setOpen(false)
        exams.refetch()
      },
    },
  )

  const remove = useMutation((id) => endpoints.exams.remove(id), {
    onSuccess: (res) => {
      setToast(res.message)
      setConfirm(null)
      exams.refetch()
    },
  })

  const openNew = () => {
    setEditing(null)
    setForm({ ...BLANK, classRoom: classes[0]?._id ?? '', subject: subjects[0]?._id ?? '' })
    save.setError(null)
    save.setFields({})
    setOpen(true)
  }

  const openEdit = (e) => {
    setEditing(e)
    setForm({
      name: e.name,
      term: e.term,
      classRoom: e.classRoom?._id ?? '',
      subject: e.subject?._id ?? '',
      date: dateInput(e.date),
      time: e.time,
      room: e.room ?? '',
      maxMarks: e.maxMarks,
      status: e.status,
    })
    save.setError(null)
    save.setFields({})
    setOpen(true)
  }

  const set = (k) => (ev) => setForm((f) => ({ ...f, [k]: ev.target.value }))
  const submit = () => save.mutate({ ...form, maxMarks: Number(form.maxMarks) })

  const examColumns = [
    {
      key: 'name',
      header: 'Examination',
      render: (r) => (
        <div>
          <p className="font-semibold text-ink">{r.name}</p>
          <p className="text-[12px] text-ink-muted">{r.term}</p>
        </div>
      ),
    },
    {
      key: 'classRoom',
      header: 'Class',
      render: (r) => (r.classRoom ? `${r.classRoom.name} · ${r.classRoom.section}` : '—'),
    },
    { key: 'subject', header: 'Subject', render: (r) => <span className="text-[13px] text-ink-muted">{r.subject?.name ?? '—'}</span> },
    {
      key: 'date',
      header: 'Date & time',
      render: (r) => (
        <div>
          <p className="text-[13px] font-medium text-ink">{formatDate(r.date)}</p>
          <p className="text-[12px] text-ink-muted">
            {r.time} · {r.room || '—'}
          </p>
        </div>
      ),
    },
    { key: 'maxMarks', header: 'Max marks', align: 'center' },
    { key: 'status', header: 'Status', align: 'center', render: (r) => <Badge tone={toneFor(r.status)}>{r.status}</Badge> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openEdit(r)}
            className="rounded-btn p-2 text-ink-faint transition-colors hover:bg-surface-muted hover:text-info"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setConfirm(r)}
            className="rounded-btn p-2 text-ink-faint transition-colors hover:bg-red-50 hover:text-danger"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const resultColumns = [
    {
      key: 'student',
      header: 'Student',
      render: (r) => (
        <div>
          <p className="font-semibold text-ink">{r.student?.name ?? '—'}</p>
          <p className="font-mono text-[12px] text-ink-muted">{r.student?.studentId ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'classRoom',
      header: 'Class',
      render: (r) =>
        r.student?.classRoom ? `${r.student.classRoom.name} · ${r.student.classRoom.section}` : '—',
    },
    { key: 'subject', header: 'Subject', render: (r) => r.exam?.subject?.name ?? '—' },
    { key: 'exam', header: 'Examination', render: (r) => <span className="text-[13px] text-ink-muted">{r.exam?.name ?? '—'}</span> },
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
      key: 'grade',
      header: 'Grade',
      align: 'center',
      render: (r) => (
        <Badge tone={r.grade?.startsWith('A') ? 'success' : r.grade?.startsWith('B') ? 'info' : 'warning'}>
          {r.grade}
        </Badge>
      ),
    },
  ]

  const classOptions = classes.map((c) => ({ value: c._id, label: `${c.name} · ${c.section}` }))

  return (
    <div>
      <PageHeader
        title="Exams & Results"
        subtitle="Schedule examinations and review published results"
        actions={
          <button className="btn-primary" onClick={openNew} disabled={!classes.length || !subjects.length}>
            <CalendarPlus className="h-4 w-4" />
            Schedule exam
          </button>
        }
      >
        <Tabs
          tabs={[
            { key: 'schedule', label: 'Schedule' },
            { key: 'results', label: 'Results' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </PageHeader>

      {tab === 'schedule' ? (
        <DataTable
          key="schedule"
          remote
          columns={examColumns}
          rows={exams.data?.data ?? []}
          pagination={exams.data?.pagination}
          loading={exams.loading}
          error={exams.error}
          onRetry={exams.refetch}
          onQueryChange={onExamQuery}
          pageSize={PAGE_SIZE}
          rowKey={(r) => r._id}
          searchKeys={['name']}
          searchPlaceholder="Search examination, term or room…"
          filters={[
            { key: 'status', label: 'Status', options: ['Draft', 'Scheduled', 'Grading', 'Results published'] },
            { key: 'classRoom', label: 'Class', options: classOptions },
          ]}
          exportConfig={{
            title: 'Examination Schedule',
            filename: 'Exam schedule',
            columns: [
              { header: 'Examination', value: (r) => r.name },
              { header: 'Term', value: (r) => r.term },
              { header: 'Class', value: (r) => (r.classRoom ? `${r.classRoom.name} ${r.classRoom.section}` : '') },
              { header: 'Subject', value: (r) => r.subject?.name ?? '' },
              { header: 'Date', value: (r) => formatDate(r.date) },
              { header: 'Time', value: (r) => r.time },
              { header: 'Room', value: (r) => r.room },
              { header: 'Max marks', value: (r) => r.maxMarks, align: 'center' },
              { header: 'Status', value: (r) => r.status },
            ],
            getRows: ({ search, filters }) => fetchAll(endpoints.exams.list, { search, ...filters }),
          }}
          emptyTitle="No examinations scheduled"
          emptyDescription="Schedule an examination to see it listed here."
          emptyAction={
            <button className="btn-primary" onClick={openNew} disabled={!classes.length || !subjects.length}>
              <CalendarPlus className="h-4 w-4" />
              Schedule exam
            </button>
          }
        />
      ) : (
        <DataTable
          key="results"
          remote
          columns={resultColumns}
          rows={results.data?.data ?? []}
          pagination={results.data?.pagination}
          loading={results.loading}
          error={results.error}
          onRetry={results.refetch}
          onQueryChange={onResultQuery}
          pageSize={PAGE_SIZE}
          rowKey={(r) => r._id}
          searchKeys={['student']}
          searchPlaceholder="Search student name or ID…"
          filters={[
            { key: 'grade', label: 'Grade', options: ['A+', 'A', 'A-', 'B+', 'B', 'C', 'D', 'F'] },
            { key: 'classRoom', label: 'Class', options: classOptions },
          ]}
          exportConfig={{
            title: 'Examination Results',
            filename: 'Results',
            columns: [
              { header: 'Student ID', value: (r) => r.student?.studentId ?? '' },
              { header: 'Student', value: (r) => r.student?.name ?? '' },
              {
                header: 'Class',
                value: (r) => (r.student?.classRoom ? `${r.student.classRoom.name} ${r.student.classRoom.section}` : ''),
              },
              { header: 'Subject', value: (r) => r.exam?.subject?.name ?? '' },
              { header: 'Examination', value: (r) => r.exam?.name ?? '' },
              { header: 'Marks', value: (r) => `${r.marks}/${r.maxMarks}`, align: 'center' },
              { header: 'Percent', value: (r) => `${Math.round((r.marks / r.maxMarks) * 100)}%`, align: 'center' },
              { header: 'Grade', value: (r) => r.grade, align: 'center' },
            ],
            getRows: ({ search, filters }) => fetchAll(endpoints.results.list, { search, ...filters }),
          }}
          emptyTitle="No results published"
          emptyDescription="Results appear once teachers submit their marks."
        />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit examination' : 'Schedule examination'}
        subtitle={editing ? `${editing.name}` : 'Set the date, class and subject'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)} disabled={save.busy}>
              Cancel
            </button>
            <button className="btn-primary" onClick={submit} disabled={save.busy}>
              {save.busy ? 'Saving…' : editing ? 'Save changes' : 'Schedule'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Examination name" required error={save.fields.name} className="sm:col-span-2">
            <Input value={form.name} onChange={set('name')} placeholder="e.g. Midterm Examination" />
          </Field>
          <Field label="Class" required error={save.fields.classRoom}>
            <Select value={form.classRoom} onChange={set('classRoom')}>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} · {c.section}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Subject" required error={save.fields.subject}>
            <Select value={form.subject} onChange={set('subject')}>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date" required error={save.fields.date}>
            <Input type="date" value={form.date} onChange={set('date')} />
          </Field>
          <Field label="Start time" error={save.fields.time}>
            <Input type="time" value={form.time} onChange={set('time')} />
          </Field>
          <Field label="Room">
            <Input value={form.room} onChange={set('room')} placeholder="e.g. Hall A" />
          </Field>
          <Field label="Maximum marks" error={save.fields.maxMarks}>
            <Input type="number" min="1" value={form.maxMarks} onChange={set('maxMarks')} />
          </Field>
          <Field label="Term">
            <Select value={form.term} onChange={set('term')}>
              <option>Term 1</option>
              <option>Term 2</option>
              <option>Term 3</option>
            </Select>
          </Field>
          <Field label="Status" error={save.fields.status}>
            <Select value={form.status} onChange={set('status')}>
              <option>Draft</option>
              <option>Scheduled</option>
              <option>Grading</option>
              <option>Results published</option>
            </Select>
          </Field>
        </div>
        {save.error && (
          <p className="mt-4 rounded-btn border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-danger">
            {save.error}
          </p>
        )}
      </Modal>

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Delete examination?"
        subtitle={confirm?.name}
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
        <p className="text-sm text-ink-muted">
          Every result recorded against this examination is deleted with it. This cannot be undone.
        </p>
        {remove.error && (
          <p className="mt-4 rounded-btn border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-danger">
            {remove.error}
          </p>
        )}
      </Modal>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
