import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  Badge,
  DataTable,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
  Toast,
} from '../../components/ui/index.jsx'
import endpoints from '../../lib/api.js'
import useApi, { useMutation } from '../../lib/useApi.js'
import { cx } from '../../lib/utils.js'

const GRADES = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
const BLANK = { code: '', name: '', department: 'Sciences', credits: 3, leadTeacher: '', grades: [], description: '' }

export default function AdminSubjects() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [toast, setToast] = useState('')

  const { data, loading, error, refetch } = useApi(() => endpoints.subjects.list(), [])
  const { data: teacherData } = useApi(() => endpoints.teachers.list({ limit: 100 }), [])
  const teachers = teacherData?.data ?? []
  const rows = data?.data ?? []

  const save = useMutation(
    (body) => (editing ? endpoints.subjects.update(editing._id, body) : endpoints.subjects.create(body)),
    {
      onSuccess: (res) => {
        setToast(res.message)
        setOpen(false)
        refetch()
      },
    },
  )

  const remove = useMutation((id) => endpoints.subjects.remove(id), {
    onSuccess: (res) => {
      setToast(res.message)
      setConfirm(null)
      refetch()
    },
  })

  const openNew = () => {
    setEditing(null)
    setForm(BLANK)
    save.setError(null)
    save.setFields({})
    setOpen(true)
  }

  const openEdit = (s) => {
    setEditing(s)
    setForm({
      code: s.code,
      name: s.name,
      department: s.department,
      credits: s.credits,
      leadTeacher: s.leadTeacher?._id ?? '',
      grades: s.grades ?? [],
      description: s.description ?? '',
    })
    save.setError(null)
    save.setFields({})
    setOpen(true)
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const toggleGrade = (g) =>
    setForm((f) => ({ ...f, grades: f.grades.includes(g) ? f.grades.filter((x) => x !== g) : [...f.grades, g] }))

  const submit = () => {
    const body = { ...form, credits: Number(form.credits) }
    if (!body.leadTeacher) delete body.leadTeacher
    save.mutate(body)
  }

  const columns = [
    {
      key: 'name',
      header: 'Subject',
      render: (r) => (
        <div>
          <p className="font-semibold text-ink">{r.name}</p>
          <p className="text-[12px] text-ink-muted">{r.department}</p>
        </div>
      ),
    },
    { key: 'code', header: 'Code', render: (r) => <Badge tone="accent">{r.code}</Badge> },
    {
      key: 'leadTeacher',
      header: 'Lead teacher',
      render: (r) => <span className="text-[13px]">{r.leadTeacher?.name ?? '—'}</span>,
    },
    {
      key: 'grades',
      header: 'Taught in',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {(r.grades ?? []).map((g) => (
            <Badge key={g} tone="neutral">
              {g}
            </Badge>
          ))}
          {(r.grades?.length ?? 0) === 0 && <span className="text-[13px] text-ink-faint">—</span>}
        </div>
      ),
    },
    { key: 'credits', header: 'Credits', align: 'center', render: (r) => <span className="font-semibold">{r.credits}</span> },
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

  return (
    <div>
      <PageHeader
        title="Manage Subjects"
        subtitle={loading ? 'Loading curriculum…' : `${rows.length} subjects in the curriculum`}
        actions={
          <button className="btn-primary" onClick={openNew}>
            <Plus className="h-4 w-4" />
            New subject
          </button>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        onRetry={refetch}
        pageSize={8}
        rowKey={(r) => r._id}
        searchKeys={['name', 'code']}
        searchPlaceholder="Search subject or code…"
        filters={[{ key: 'department', label: 'Department', options: ['Sciences', 'Humanities', 'Technology', 'Arts'] }]}
        exportConfig={{
          title: 'Curriculum — Subjects',
          filename: 'Subjects',
          columns: [
            { header: 'Code', value: (r) => r.code },
            { header: 'Subject', value: (r) => r.name },
            { header: 'Department', value: (r) => r.department },
            { header: 'Lead teacher', value: (r) => r.leadTeacher?.name ?? '' },
            { header: 'Taught in', value: (r) => (r.grades ?? []).join(', ') },
            { header: 'Credits', value: (r) => r.credits, align: 'center' },
          ],
        }}
        emptyTitle="No subjects yet"
        emptyDescription="Add subjects to build out the curriculum."
        emptyAction={
          <button className="btn-primary" onClick={openNew}>
            <Plus className="h-4 w-4" />
            New subject
          </button>
        }
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit subject' : 'New subject'}
        subtitle={editing ? editing.code : 'Add a subject to the curriculum'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)} disabled={save.busy}>
              Cancel
            </button>
            <button className="btn-primary" onClick={submit} disabled={save.busy}>
              {save.busy ? 'Saving…' : editing ? 'Save changes' : 'Create subject'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Subject name" required error={save.fields.name} className="sm:col-span-2">
            <Input value={form.name} onChange={set('name')} placeholder="e.g. Mathematics" />
          </Field>
          <Field label="Subject code" required error={save.fields.code}>
            <Input value={form.code} onChange={set('code')} placeholder="e.g. MATH-101" />
          </Field>
          <Field label="Credits" error={save.fields.credits}>
            <Input type="number" min="1" max="10" value={form.credits} onChange={set('credits')} />
          </Field>
          <Field label="Department" required error={save.fields.department}>
            <Select value={form.department} onChange={set('department')}>
              <option>Sciences</option>
              <option>Humanities</option>
              <option>Technology</option>
              <option>Arts</option>
            </Select>
          </Field>
          <Field label="Lead teacher" error={save.fields.leadTeacher}>
            <Select value={form.leadTeacher} onChange={set('leadTeacher')}>
              <option value="">Not assigned</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Taught in grades" className="sm:col-span-2" hint="Students in these grades see this subject.">
            <div className="flex flex-wrap gap-2">
              {GRADES.map((g) => {
                const active = form.grades.includes(g)
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGrade(g)}
                    className={cx(
                      'rounded-item border px-3.5 py-2 text-[13px] font-semibold transition-all duration-200',
                      active
                        ? 'border-accent bg-accent text-white'
                        : 'border-line bg-white text-ink-muted hover:border-field hover:text-ink',
                    )}
                  >
                    {g}
                  </button>
                )
              })}
            </div>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea rows={3} value={form.description} onChange={set('description')} placeholder="Short syllabus summary…" />
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
        title="Delete subject?"
        subtitle={confirm ? `${confirm.name} · ${confirm.code}` : ''}
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
          The subject is removed from every class and teacher that references it. Subjects with examinations still
          pending cannot be deleted.
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
