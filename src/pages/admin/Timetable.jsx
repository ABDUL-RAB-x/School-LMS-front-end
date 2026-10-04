import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, RotateCcw, Save, Trash2 } from 'lucide-react'
import {
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  Field,
  Input,
  Modal,
  PageHeader,
  ProgressBar,
  Select,
  Skeleton,
  Toast,
} from '../../components/ui/index.jsx'
import TimetableGrid, { DAYS } from '../../components/TimetableGrid.jsx'
import endpoints from '../../lib/api.js'
import useApi, { useMutation } from '../../lib/useApi.js'
import { timetablePdf } from '../../lib/documents.js'
import { fadeUp, stagger } from '../../lib/motion.js'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const FREE = '__free__'
const idOf = (v) => (v && typeof v === 'object' ? v._id : v) || ''

// API slot (populated) → editable slot (ids only)
const toEditable = (s) => ({
  day: s.day,
  period: s.period,
  startTime: s.startTime,
  endTime: s.endTime,
  subject: idOf(s.subject) || null,
  teacher: idOf(s.teacher) || null,
  room: s.room ?? '',
  isFree: Boolean(s.isFree),
  freeLabel: s.freeLabel ?? '',
})

export default function AdminTimetable() {
  const [classId, setClassId] = useState('')
  const [slots, setSlots] = useState([])
  const [dirty, setDirty] = useState(false)
  const [editing, setEditing] = useState(null) // { day, period, form }
  const [toast, setToast] = useState('')

  const { data: classData, loading: classesLoading } = useApi(() => endpoints.classes.list(), [])
  const { data: subjectData } = useApi(() => endpoints.subjects.list(), [])
  const { data: teacherData } = useApi(() => endpoints.teachers.list({ limit: 100 }), [])
  const { data: settingsData } = useApi(() => endpoints.settings.get(), [])
  const classes = classData?.data ?? []
  const subjects = subjectData?.data ?? []
  const teachers = teacherData?.data ?? []
  const periodsPerDay = settingsData?.data?.academic?.periodsPerDay ?? 6

  useEffect(() => {
    if (!classId && classes.length) setClassId(classes[0]._id)
  }, [classes, classId])

  const tt = useApi(() => endpoints.timetable.get(classId), [classId], { skip: !classId })

  useEffect(() => {
    setSlots((tt.data?.data?.slots ?? []).map(toEditable))
    setDirty(false)
  }, [tt.data])

  const save = useMutation(() => endpoints.timetable.save(classId, { slots }), {
    onSuccess: (res) => {
      setToast(res.message)
      tt.setData(res)
    },
    onError: (err) => setToast(err.message),
  })

  const subjectName = (id) => subjects.find((s) => s._id === id)?.name ?? '—'
  const teacherName = (id) => teachers.find((t) => t._id === id)?.name ?? '—'

  // Same shape the API's grid uses, built from the local (possibly unsaved) slots
  const grid = useMemo(() => {
    const g = Object.fromEntries(DAYS.map((d) => [d, []]))
    slots.forEach((s) =>
      g[s.day]?.push({
        period: s.period,
        time: `${s.startTime} – ${s.endTime}`,
        subject: s.isFree ? s.freeLabel || 'Study Hall' : subjectName(s.subject),
        teacher: s.isFree ? '—' : teacherName(s.teacher),
        room: s.isFree ? '—' : s.room,
        free: s.isFree,
      }),
    )
    DAYS.forEach((d) => g[d].sort((a, b) => a.period - b.period))
    return g
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, subjects, teachers])

  const { teaching, free, load } = useMemo(() => {
    const counts = {}
    slots.forEach((s) => {
      if (!s.isFree && s.teacher) counts[s.teacher] = (counts[s.teacher] || 0) + 1
    })
    return {
      teaching: slots.filter((s) => !s.isFree).length,
      free: slots.filter((s) => s.isFree).length,
      load: Object.entries(counts).sort((a, b) => b[1] - a[1]),
    }
  }, [slots])
  const maxLoad = load[0]?.[1] || 1

  const openCell = (day, period, slot) => {
    const existing = slots.find((s) => s.day === day && s.period === period)
    const sameRow = slots.find((s) => s.period === period)
    setEditing({
      day,
      period,
      isNew: !slot,
      form: existing
        ? { ...existing, subject: existing.isFree ? FREE : existing.subject ?? '', teacher: existing.teacher ?? '' }
        : {
            day,
            period,
            startTime: sameRow?.startTime ?? '',
            endTime: sameRow?.endTime ?? '',
            subject: subjects[0]?._id ?? '',
            teacher: '',
            room: classes.find((c) => c._id === classId)?.room ?? '',
            isFree: false,
            freeLabel: '',
          },
    })
  }

  const setField = (k) => (e) => setEditing((ed) => ({ ...ed, form: { ...ed.form, [k]: e.target.value } }))

  const timeOk = (t) => /^\d{2}:\d{2}$/.test(t || '')
  const formError = editing
    ? !timeOk(editing.form.startTime) || !timeOk(editing.form.endTime)
      ? 'Enter a start and end time.'
      : editing.form.startTime >= editing.form.endTime
        ? 'The period must end after it starts.'
        : null
    : null

  const applyCell = () => {
    const f = editing.form
    const isFree = f.subject === FREE
    const next = {
      day: editing.day,
      period: editing.period,
      startTime: f.startTime,
      endTime: f.endTime,
      subject: isFree ? null : f.subject || null,
      teacher: isFree ? null : f.teacher || null,
      room: isFree ? '' : f.room,
      isFree,
      freeLabel: isFree ? f.freeLabel || 'Study Hall' : '',
    }
    setSlots((all) => [...all.filter((s) => !(s.day === editing.day && s.period === editing.period)), next])
    setDirty(true)
    setEditing(null)
  }

  const removeCell = () => {
    setSlots((all) => all.filter((s) => !(s.day === editing.day && s.period === editing.period)))
    setDirty(true)
    setEditing(null)
  }

  const current = classes.find((c) => c._id === classId)
  const label = current ? `${current.name} · Section ${current.section}` : ''
  const today = DAY_NAMES[new Date().getDay()]

  if (tt.error) return <ErrorState error={tt.error} onRetry={tt.refetch} />

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="Click any period to change it, then save the week"
        actions={
          <>
            <Select
              value={classId}
              onChange={(e) => {
                if (dirty && !window.confirm('Discard unsaved changes to this timetable?')) return
                setClassId(e.target.value)
              }}
              className="h-[42px] w-auto min-w-[10rem] py-0 text-[13px]"
              disabled={classesLoading}
            >
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} · {c.section}
                </option>
              ))}
            </Select>
            <button
              className="btn-secondary"
              disabled={!slots.length}
              onClick={() =>
                timetablePdf({ title: `Timetable — ${label}`, subtitle: 'Weekly class schedule', grid }).catch((err) =>
                  setToast(err.message),
                )
              }
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
            {dirty && (
              <button className="btn-secondary" onClick={() => tt.refetch()} disabled={save.busy}>
                <RotateCcw className="h-4 w-4" />
                Discard
              </button>
            )}
            <button className="btn-primary" onClick={() => save.mutate()} disabled={!dirty || save.busy || !classId}>
              <Save className="h-4 w-4" />
              {save.busy ? 'Saving…' : 'Save timetable'}
            </button>
          </>
        }
      />

      <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardHeader title="Week overview" subtitle={label || 'Select a class'} />
            <CardBody className="space-y-5 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-item bg-surface-muted p-3 text-center">
                  <p className="font-display text-lg font-semibold text-ink">{teaching}</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">Teaching periods</p>
                </div>
                <div className="rounded-item bg-surface-muted p-3 text-center">
                  <p className="font-display text-lg font-semibold text-ink">{free}</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">Study halls</p>
                </div>
              </div>

              <div>
                <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Teacher load</p>
                {load.length === 0 ? (
                  <p className="text-[13px] text-ink-muted">No teachers assigned yet.</p>
                ) : (
                  <div className="space-y-3">
                    {load.map(([id, count]) => (
                      <div key={id}>
                        <div className="mb-1 flex items-center justify-between text-[13px]">
                          <span className="truncate text-ink">{teacherName(id)}</span>
                          <span className="shrink-0 text-ink-muted">{count} / wk</span>
                        </div>
                        <ProgressBar value={(count / maxLoad) * 100} height="h-1.5" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {dirty && (
                <p className="rounded-item border border-amber-200 bg-amber-50 p-3 text-[12px] font-medium text-warning">
                  You have unsaved changes.
                </p>
              )}
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="xl:col-span-3">
          {tt.loading || !classId ? (
            <Skeleton className="h-[420px] w-full rounded-card" />
          ) : (
            <TimetableGrid grid={grid} highlightDay={today} onCellClick={openCell} minPeriods={periodsPerDay} />
          )}
        </motion.div>
      </motion.div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `${editing.day} · Period ${editing.period}` : ''}
        subtitle={label}
        footer={
          <>
            {editing && !editing.isNew && (
              <button className="btn-secondary mr-auto text-danger" onClick={removeCell}>
                <Trash2 className="h-4 w-4" />
                Clear period
              </button>
            )}
            <button className="btn-secondary" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={applyCell} disabled={Boolean(formError)}>
              Apply
            </button>
          </>
        }
      >
        {editing && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Subject" required className="sm:col-span-2">
              <Select value={editing.form.subject} onChange={setField('subject')}>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
                <option value={FREE}>Free period / Study hall</option>
              </Select>
            </Field>
            {editing.form.subject === FREE ? (
              <Field label="Label" className="sm:col-span-2">
                <Input value={editing.form.freeLabel} onChange={setField('freeLabel')} placeholder="Study Hall" />
              </Field>
            ) : (
              <>
                <Field label="Teacher">
                  <Select value={editing.form.teacher} onChange={setField('teacher')}>
                    <option value="">— Not assigned —</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                        {t.subject?.name ? ` (${t.subject.name})` : ''}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Room">
                  <Input value={editing.form.room} onChange={setField('room')} placeholder="e.g. 204" />
                </Field>
              </>
            )}
            <Field label="Starts" required>
              <Input type="time" value={editing.form.startTime} onChange={setField('startTime')} />
            </Field>
            <Field label="Ends" required>
              <Input type="time" value={editing.form.endTime} onChange={setField('endTime')} />
            </Field>
            {formError && <p className="text-[13px] font-medium text-danger sm:col-span-2">{formError}</p>}
            <p className="text-[12px] text-ink-muted sm:col-span-2">
              Changes are kept on this page until you press “Save timetable”. Saving checks that no teacher is booked
              in two classes at once.
            </p>
          </div>
        )}
      </Modal>

      <Toast message={toast} tone={save.error ? 'danger' : 'success'} onDone={() => setToast('')} />
    </div>
  )
}
