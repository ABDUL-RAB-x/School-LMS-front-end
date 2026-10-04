import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, Loader2, Save } from 'lucide-react'
import {
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  Field,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
  Toast,
} from '../../components/ui/index.jsx'
import endpoints from '../../lib/api.js'
import useApi, { useMutation } from '../../lib/useApi.js'
import { cx } from '../../lib/utils.js'
import { fadeUp, stagger } from '../../lib/motion.js'

const BLANK = {
  name: '',
  email: '',
  phone: '',
  employeeId: '',
  subject: '',
  department: 'Sciences',
  qualification: '',
  experience: '',
  joined: '',
  address: '',
  bio: '',
  status: 'Active',
  classes: [],
  password: '',
}

const dateInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '')

export default function AdminTeacherForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(BLANK)
  const [toast, setToast] = useState('')

  const { data: subjectData } = useApi(() => endpoints.subjects.list(), [])
  const { data: classData } = useApi(() => endpoints.classes.list(), [])
  const subjects = subjectData?.data ?? []
  const classes = classData?.data ?? []

  const { data: existing, loading, error, refetch } = useApi(
    () => endpoints.teachers.get(id),
    [id],
    { skip: !isEdit },
  )

  useEffect(() => {
    if (!existing?.data) return
    const t = existing.data
    setForm({
      ...BLANK,
      ...t,
      joined: dateInput(t.joined),
      subject: t.subject?._id ?? t.subject ?? '',
      classes: (t.classes ?? []).map((c) => c._id ?? c),
      password: '',
    })
  }, [existing])

  const save = useMutation(
    (body) => (isEdit ? endpoints.teachers.update(id, body) : endpoints.teachers.create(body)),
    {
      onSuccess: (res) => {
        setToast(res.message)
        setTimeout(() => navigate('/admin/teachers'), 800)
      },
    },
  )

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const toggleClass = (classId) =>
    setForm((f) => ({
      ...f,
      classes: f.classes.includes(classId) ? f.classes.filter((c) => c !== classId) : [...f.classes, classId],
    }))

  const onSubmit = (e) => {
    e.preventDefault()
    const body = { ...form }
    if (!body.password) delete body.password
    if (!body.subject) delete body.subject
    if (!body.joined) delete body.joined
    if (body.experience === '') delete body.experience
    if (isEdit) {
      delete body.staffId
      delete body._id
    }
    save.mutate(body)
  }

  if (isEdit && error) return <ErrorState error={error} onRetry={refetch} />

  const fieldError = (name) => save.fields[name]

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
        title={isEdit ? 'Edit Teacher' : 'Add Teacher'}
        subtitle={
          isEdit
            ? existing?.data
              ? `${existing.data.name} · ${existing.data.staffId}`
              : 'Loading…'
            : 'Create a staff record and assign classes'
        }
      />

      {isEdit && loading ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Skeleton className="h-[460px] rounded-card xl:col-span-2" />
          <Skeleton className="h-[460px] rounded-card" />
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <motion.div
            variants={stagger()}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 xl:grid-cols-3"
          >
            <motion.div variants={fadeUp} className="xl:col-span-2">
              <Card className="h-full">
                <CardHeader title="Personal information" subtitle="Identity and contact details" />
                <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Full name" required error={fieldError('name')} className="sm:col-span-2">
                    <Input value={form.name} onChange={set('name')} placeholder="e.g. Daniel Okafor" />
                  </Field>
                  <Field label="Email address" required error={fieldError('email')}>
                    <Input type="email" value={form.email} onChange={set('email')} placeholder="teacher@scholaris.edu" />
                  </Field>
                  <Field label="Phone number">
                    <Input value={form.phone} onChange={set('phone')} placeholder="+92 300 1234567" />
                  </Field>
                  <Field label="Employee ID">
                    <Input value={form.employeeId} onChange={set('employeeId')} placeholder="EMP-2026-001" />
                  </Field>
                  <Field label="Date joined" error={fieldError('joined')}>
                    <Input type="date" value={form.joined} onChange={set('joined')} />
                  </Field>
                  <Field label="Residential address" className="sm:col-span-2">
                    <Textarea value={form.address} onChange={set('address')} rows={3} placeholder="Street, city, postcode" />
                  </Field>
                  <Field label="About" className="sm:col-span-2" hint="Shown to students on class pages.">
                    <Textarea value={form.bio} onChange={set('bio')} rows={3} />
                  </Field>
                </CardBody>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <CardHeader title="Professional" subtitle="Subject and qualifications" />
                <CardBody className="grid grid-cols-1 gap-4">
                  <Field label="Primary subject" error={fieldError('subject')}>
                    <Select value={form.subject} onChange={set('subject')}>
                      <option value="">Not assigned</option>
                      {subjects.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Department" required error={fieldError('department')}>
                    <Select value={form.department} onChange={set('department')}>
                      <option>Sciences</option>
                      <option>Humanities</option>
                      <option>Technology</option>
                      <option>Arts</option>
                    </Select>
                  </Field>
                  <Field label="Highest qualification" required error={fieldError('qualification')}>
                    <Input value={form.qualification} onChange={set('qualification')} placeholder="e.g. M.Sc. Mathematics" />
                  </Field>
                  <Field label="Years of experience" error={fieldError('experience')}>
                    <Input type="number" min="0" max="60" value={form.experience} onChange={set('experience')} placeholder="0" />
                  </Field>
                  <Field label="Status">
                    <Select value={form.status} onChange={set('status')}>
                      <option>Active</option>
                      <option>On Leave</option>
                      <option>Inactive</option>
                    </Select>
                  </Field>
                  {!isEdit && (
                    <Field
                      label="Initial password"
                      error={fieldError('password')}
                      hint="Leave blank to create the record without portal access."
                    >
                      <Input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
                    </Field>
                  )}
                </CardBody>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp} className="xl:col-span-3">
              <Card>
                <CardHeader
                  title="Assign classes"
                  subtitle="Select every class this teacher will take"
                  action={<span className="text-[13px] font-semibold text-ink-muted">{form.classes.length} selected</span>}
                />
                <CardBody className="flex flex-wrap gap-2 pt-2">
                  {classes.length === 0 && (
                    <p className="text-[13px] text-ink-muted">
                      No classes exist yet.{' '}
                      <Link to="/admin/classes" className="font-semibold text-accent hover:underline">
                        Create one first
                      </Link>
                      .
                    </p>
                  )}
                  {classes.map((c) => {
                    const active = form.classes.includes(c._id)
                    return (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => toggleClass(c._id)}
                        className={cx(
                          'rounded-item border px-4 py-2.5 text-[13px] font-semibold transition-all duration-200',
                          active
                            ? 'border-accent bg-accent text-white'
                            : 'border-line bg-white text-ink-muted hover:border-field hover:text-ink',
                        )}
                      >
                        {c.name} · {c.section}
                      </button>
                    )
                  })}
                </CardBody>
              </Card>
            </motion.div>
          </motion.div>

          {save.error && (
            <div className="mt-5 flex items-start gap-2 rounded-btn border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-danger">
              <AlertCircle className="mt-px h-4 w-4 shrink-0" />
              {save.error}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link to="/admin/teachers" className="btn-secondary h-[50px] justify-center sm:w-32">
              Cancel
            </Link>
            <button type="submit" disabled={save.busy} className="btn-primary h-[50px] justify-center sm:w-48">
              {save.busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEdit ? 'Save changes' : 'Add teacher'}
                </>
              )}
            </button>
          </div>
        </form>
      )}

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
