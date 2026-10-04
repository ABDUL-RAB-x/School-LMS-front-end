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
import { fadeUp, stagger } from '../../lib/motion.js'

const BLANK = {
  name: '',
  email: '',
  phone: '',
  gender: 'Prefer not to say',
  dob: '',
  bloodGroup: '',
  classRoom: '',
  roll: '',
  admissionDate: '',
  address: '',
  notes: '',
  guardian: { name: '', phone: '', relationship: '' },
  password: '',
}

// ISO timestamp → yyyy-mm-dd for <input type="date">
const dateInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '')

export default function AdminStudentForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(BLANK)
  const [toast, setToast] = useState('')

  const { data: classData } = useApi(() => endpoints.classes.list(), [])
  const classes = classData?.data ?? []

  const { data: existing, loading, error, refetch } = useApi(
    () => endpoints.students.get(id),
    [id],
    { skip: !isEdit },
  )

  useEffect(() => {
    if (!existing?.data) return
    const s = existing.data
    setForm({
      ...BLANK,
      ...s,
      dob: dateInput(s.dob),
      admissionDate: dateInput(s.admissionDate),
      classRoom: s.classRoom?._id ?? s.classRoom ?? '',
      guardian: { ...BLANK.guardian, ...(s.guardian || {}) },
      password: '',
    })
  }, [existing])

  // Default to the first class once the list arrives
  useEffect(() => {
    if (!isEdit && !form.classRoom && classes.length) {
      setForm((f) => ({ ...f, classRoom: classes[0]._id }))
    }
  }, [classes, isEdit, form.classRoom])

  const save = useMutation(
    (body) => (isEdit ? endpoints.students.update(id, body) : endpoints.students.create(body)),
    {
      onSuccess: (res) => {
        setToast(res.message)
        setTimeout(() => navigate('/admin/students'), 800)
      },
    },
  )

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setGuardian = (k) => (e) =>
    setForm((f) => ({ ...f, guardian: { ...f.guardian, [k]: e.target.value } }))

  const onSubmit = (e) => {
    e.preventDefault()
    const body = { ...form }
    if (!body.password) delete body.password
    if (!body.dob) delete body.dob
    if (!body.admissionDate) delete body.admissionDate
    if (isEdit) {
      delete body.studentId
      delete body._id
    }
    save.mutate(body)
  }

  if (isEdit && error) return <ErrorState error={error} onRetry={refetch} />

  const fieldError = (name) => save.fields[name]

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
        title={isEdit ? 'Edit Student' : 'Add Student'}
        subtitle={
          isEdit
            ? existing?.data
              ? `${existing.data.name} · ${existing.data.studentId}`
              : 'Loading…'
            : 'Create a student record and assign them to a class'
        }
      />

      {isEdit && loading ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Skeleton className="h-[520px] rounded-card xl:col-span-2" />
          <Skeleton className="h-[260px] rounded-card" />
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <motion.div
            variants={stagger()}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 xl:grid-cols-3"
          >
            <motion.div variants={fadeUp} className="xl:col-span-2 xl:row-span-2">
              <Card className="h-full">
                <CardHeader title="Personal information" subtitle="Basic identity and contact details" />
                <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Full name" required error={fieldError('name')} className="sm:col-span-2">
                    <Input value={form.name} onChange={set('name')} placeholder="e.g. Maya Rahman" />
                  </Field>
                  <Field label="Email address" required error={fieldError('email')}>
                    <Input type="email" value={form.email} onChange={set('email')} placeholder="student@scholaris.edu" />
                  </Field>
                  <Field label="Phone number" error={fieldError('phone')}>
                    <Input value={form.phone} onChange={set('phone')} placeholder="+92 300 1234567" />
                  </Field>
                  <Field label="Gender" error={fieldError('gender')}>
                    <Select value={form.gender} onChange={set('gender')}>
                      <option>Female</option>
                      <option>Male</option>
                      <option>Prefer not to say</option>
                    </Select>
                  </Field>
                  <Field label="Date of birth" error={fieldError('dob')}>
                    <Input type="date" value={form.dob} onChange={set('dob')} />
                  </Field>
                  <Field label="Blood group">
                    <Select value={form.bloodGroup} onChange={set('bloodGroup')}>
                      <option value="">Select</option>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Admission date" error={fieldError('admissionDate')}>
                    <Input type="date" value={form.admissionDate} onChange={set('admissionDate')} />
                  </Field>
                  <Field label="Residential address" className="sm:col-span-2">
                    <Textarea value={form.address} onChange={set('address')} rows={3} placeholder="Street, city, postcode" />
                  </Field>
                </CardBody>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader title="Academic placement" subtitle="Class, section and roll" />
                <CardBody className="grid grid-cols-1 gap-4">
                  <Field label="Class" required error={fieldError('classRoom')}>
                    <Select value={form.classRoom} onChange={set('classRoom')}>
                      {classes.length === 0 && <option value="">No classes available</option>}
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} · {c.section} ({c.students}/{c.capacity})
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field
                    label="Roll number"
                    required
                    error={fieldError('roll')}
                    hint="Must be unique within the class."
                  >
                    <Input value={form.roll} onChange={set('roll')} placeholder="e.g. 14" />
                  </Field>
                </CardBody>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader title="Guardian" subtitle="Primary contact for this student" />
                <CardBody className="grid grid-cols-1 gap-4">
                  <Field label="Guardian name" required error={fieldError('guardian.name')}>
                    <Input value={form.guardian.name} onChange={setGuardian('name')} placeholder="e.g. Imran Rahman" />
                  </Field>
                  <Field label="Guardian phone">
                    <Input value={form.guardian.phone} onChange={setGuardian('phone')} placeholder="+92 300 1234567" />
                  </Field>
                  <Field label="Relationship">
                    <Input value={form.guardian.relationship} onChange={setGuardian('relationship')} placeholder="e.g. Father" />
                  </Field>
                </CardBody>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp} className="xl:col-span-3">
              <Card>
                <CardHeader
                  title="Portal access & notes"
                  subtitle={isEdit ? 'Password changes are made by the student from their profile' : 'Optional — creates a student login'}
                />
                <CardBody className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Field
                    label="Initial password"
                    error={fieldError('password')}
                    hint={
                      isEdit
                        ? 'Not editable here — the student sets this from their own profile.'
                        : 'Leave blank to create the record without portal access. Minimum 8 characters.'
                    }
                  >
                    <Input
                      type="password"
                      value={form.password}
                      onChange={set('password')}
                      disabled={isEdit}
                      placeholder="••••••••"
                      className={isEdit ? 'bg-surface-muted' : ''}
                    />
                  </Field>
                  <Field label="Internal notes" hint="Only visible to administrators.">
                    <Textarea value={form.notes} onChange={set('notes')} rows={4} placeholder="Anything the office should know…" />
                  </Field>
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
            <Link to="/admin/students" className="btn-secondary h-[50px] justify-center sm:w-32">
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
                  {isEdit ? 'Save changes' : 'Add student'}
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
