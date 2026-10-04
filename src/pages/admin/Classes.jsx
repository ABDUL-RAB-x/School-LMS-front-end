import { useState } from 'react'
import { motion } from 'framer-motion'
import { DoorOpen, Layers, Pencil, Plus, Trash2, Users } from 'lucide-react'
import {
  Badge,
  Card,
  CardSkeleton,
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
  Toast,
} from '../../components/ui/index.jsx'
import endpoints from '../../lib/api.js'
import useApi, { useDebounced, useMutation } from '../../lib/useApi.js'
import { fadeUp, hoverLift, stagger } from '../../lib/motion.js'

const GRADES = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
const SECTIONS = ['A', 'B', 'C', 'D']

const BLANK = { name: 'Grade 9', section: 'A', classTeacher: '', room: '', capacity: 40 }

export default function AdminClasses() {
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search, 350)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [toast, setToast] = useState('')

  const { data, loading, error, refetch } = useApi(
    () => endpoints.classes.list({ search: debounced }),
    [debounced],
  )
  const { data: teacherData } = useApi(() => endpoints.teachers.list({ limit: 100 }), [])
  const teachers = teacherData?.data ?? []
  const rows = data?.data ?? []

  const save = useMutation(
    (body) => (editing ? endpoints.classes.update(editing._id, body) : endpoints.classes.create(body)),
    {
      onSuccess: (res) => {
        setToast(res.message)
        setOpen(false)
        refetch()
      },
    },
  )

  const remove = useMutation((id) => endpoints.classes.remove(id), {
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

  const openEdit = (c) => {
    setEditing(c)
    setForm({
      name: c.name,
      section: c.section,
      classTeacher: c.classTeacher?._id ?? '',
      room: c.room ?? '',
      capacity: c.capacity,
    })
    save.setError(null)
    save.setFields({})
    setOpen(true)
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = () => {
    const body = { ...form, capacity: Number(form.capacity) }
    if (!body.classTeacher) delete body.classTeacher
    save.mutate(body)
  }

  const totalStudents = rows.reduce((s, c) => s + (c.students ?? 0), 0)
  const totalSeats = rows.reduce((s, c) => s + c.capacity, 0)

  if (error) return <ErrorState error={error} onRetry={refetch} />

  return (
    <div>
      <PageHeader
        title="Classes & Sections"
        subtitle={loading ? 'Loading classes…' : `${rows.length} sections running this term`}
        actions={
          <button className="btn-primary" onClick={openNew}>
            <Plus className="h-4 w-4" />
            New class
          </button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search class, teacher or room…" className="sm:max-w-sm" />
        {!loading && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{totalStudents} students placed</Badge>
            <Badge tone="neutral">{totalSeats} total seats</Badge>
            <ExportMenu
              title="Classes & Sections"
              filename="Classes"
              columns={[
                { header: 'Class', value: (c) => c.name },
                { header: 'Section', value: (c) => c.section },
                { header: 'Class teacher', value: (c) => c.classTeacher?.name ?? '' },
                { header: 'Room', value: (c) => c.room },
                { header: 'Students', value: (c) => c.students ?? 0, align: 'center' },
                { header: 'Capacity', value: (c) => c.capacity, align: 'center' },
                { header: 'Session', value: (c) => c.session },
              ]}
              getRows={() => rows}
              summary={[
                ['Sections', rows.length],
                ['Students placed', totalStudents],
                ['Total seats', totalSeats],
              ]}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={Layers}
            title={search ? `No classes match “${search}”` : 'No classes yet'}
            description={search ? 'Try a different grade, teacher or room.' : 'Create your first class to start placing students.'}
            action={
              !search && (
                <button className="btn-primary" onClick={openNew}>
                  <Plus className="h-4 w-4" />
                  New class
                </button>
              )
            }
          />
        </Card>
      ) : (
        <motion.div
          variants={stagger()}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {rows.map((c) => (
            <motion.div key={c._id} variants={fadeUp} whileHover={hoverLift} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold text-ink">
                    {c.name} <span className="text-ink-faint">·</span> {c.section}
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink-muted">{c.classTeacher?.name ?? 'No class teacher'}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(c)}
                    className="rounded-btn p-2 text-ink-faint transition-colors hover:bg-surface-muted hover:text-accent"
                    title="Edit class"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirm(c)}
                    className="rounded-btn p-2 text-ink-faint transition-colors hover:bg-red-50 hover:text-danger"
                    title="Delete class"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="neutral">
                  <DoorOpen className="h-3 w-3" />
                  Room {c.room || '—'}
                </Badge>
                <Badge tone="neutral">
                  <Layers className="h-3 w-3" />
                  {c.subjects?.length ?? 0} subjects
                </Badge>
                <Badge tone={c.occupancy > 90 ? 'warning' : 'accent'}>
                  <Users className="h-3 w-3" />
                  {c.students}/{c.capacity}
                </Badge>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-[12px]">
                  <span className="text-ink-muted">Seat occupancy</span>
                  <span className="font-semibold text-ink">{c.occupancy}%</span>
                </div>
                <ProgressBar value={c.occupancy} color={c.occupancy > 90 ? '#D97706' : '#0F766E'} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit class' : 'New class'}
        subtitle={editing ? `${editing.name} · ${editing.section}` : 'Create a section and assign a class teacher'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)} disabled={save.busy}>
              Cancel
            </button>
            <button className="btn-primary" onClick={submit} disabled={save.busy}>
              {save.busy ? 'Saving…' : editing ? 'Save changes' : 'Create class'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Grade" required error={save.fields.name}>
            <Select value={form.name} onChange={set('name')}>
              {GRADES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </Select>
          </Field>
          <Field label="Section" required error={save.fields.section}>
            <Select value={form.section} onChange={set('section')}>
              {SECTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Class teacher" error={save.fields.classTeacher} className="sm:col-span-2">
            <Select value={form.classTeacher} onChange={set('classTeacher')}>
              <option value="">Not assigned</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Room">
            <Input value={form.room} onChange={set('room')} placeholder="e.g. B-201" />
          </Field>
          <Field label="Seat capacity" error={save.fields.capacity}>
            <Input type="number" min="1" max="200" value={form.capacity} onChange={set('capacity')} />
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
        title="Delete class?"
        subtitle={confirm ? `${confirm.name} · ${confirm.section}` : ''}
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
          This also removes the class timetable. A class that still has students cannot be deleted — move them to
          another section first.
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
