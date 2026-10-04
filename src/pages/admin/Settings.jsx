import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Save, ShieldCheck } from 'lucide-react'
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
  Tabs,
  Textarea,
  Toast,
} from '../../components/ui/index.jsx'
import endpoints from '../../lib/api.js'
import useApi, { useMutation } from '../../lib/useApi.js'
import { fadeUp, stagger } from '../../lib/motion.js'
import { forgetSchoolInfo } from '../../lib/school.js'

const TABS = [
  { key: 'school', label: 'School' },
  { key: 'academic', label: 'Academic' },
  { key: 'security', label: 'Security' },
]

const dateInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '')

export default function AdminSettings() {
  const [tab, setTab] = useState('school')
  const [toast, setToast] = useState({ message: '', tone: 'success' })
  const [school, setSchool] = useState(null)
  const [academic, setAcademic] = useState(null)

  const { data, loading, error, refetch } = useApi(() => endpoints.settings.get(), [])

  useEffect(() => {
    const s = data?.data
    if (!s) return
    setSchool({
      name: s.school?.name ?? '',
      email: s.school?.email ?? '',
      phone: s.school?.phone ?? '',
      website: s.school?.website ?? '',
      registrationNumber: s.school?.registrationNumber ?? '',
      address: s.school?.address ?? '',
    })
    setAcademic({
      session: s.academic?.session ?? '2026 – 2027',
      term: s.academic?.term ?? 'Term 1',
      sessionStart: dateInput(s.academic?.sessionStart),
      sessionEnd: dateInput(s.academic?.sessionEnd),
      passingMarks: s.academic?.passingMarks ?? 40,
      minimumAttendance: s.academic?.minimumAttendance ?? 75,
      periodsPerDay: s.academic?.periodsPerDay ?? 6,
    })
  }, [data])

  const save = useMutation(
    () =>
      endpoints.settings.update({
        school,
        academic: {
          ...academic,
          sessionStart: academic.sessionStart || null,
          sessionEnd: academic.sessionEnd || null,
          passingMarks: Number(academic.passingMarks),
          minimumAttendance: Number(academic.minimumAttendance),
          periodsPerDay: Number(academic.periodsPerDay),
        },
        // Amounts everywhere in the system are Pakistani Rupees
        preferences: { currency: 'PKR (Rs)', timezone: 'UTC+05:00 · Pakistan' },
      }),
    {
      onSuccess: (res) => {
        setToast({ message: res.message, tone: 'success' })
        forgetSchoolInfo()
        refetch()
      },
      onError: (err) => setToast({ message: err.message, tone: 'danger' }),
    },
  )

  if (error) return <ErrorState error={error} onRetry={refetch} />

  const setS = (k) => (e) => setSchool((s) => ({ ...s, [k]: e.target.value }))
  const setA = (k) => (e) => setAcademic((a) => ({ ...a, [k]: e.target.value }))

  const pct = (v) => Number(v) >= 0 && Number(v) <= 100
  const invalid =
    academic &&
    (!school?.name?.trim() ||
      !pct(academic.passingMarks) ||
      !pct(academic.minimumAttendance) ||
      Number(academic.periodsPerDay) < 1 ||
      Number(academic.periodsPerDay) > 12 ||
      (academic.sessionStart && academic.sessionEnd && academic.sessionStart > academic.sessionEnd))

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="School profile and academic year"
        actions={
          <button className="btn-primary" onClick={() => save.mutate()} disabled={loading || !school || save.busy || invalid}>
            <Save className="h-4 w-4" />
            {save.busy ? 'Saving…' : 'Save changes'}
          </button>
        }
      />

      <Tabs tabs={TABS} active={tab} onChange={setTab} className="mb-4" />

      {loading || !school ? (
        <Skeleton className="h-[320px] w-full rounded-card" />
      ) : (
        <motion.div key={tab} variants={stagger()} initial="hidden" animate="show">
          {tab === 'school' && (
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader title="School profile" subtitle="Printed on every PDF — receipts, marksheets, reports — and used as the author of admin notices" />
                <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="School name" required error={!school.name.trim() ? 'The school name is required.' : undefined} className="sm:col-span-2">
                    <Input value={school.name} onChange={setS('name')} />
                  </Field>
                  <Field label="Contact email">
                    <Input type="email" value={school.email} onChange={setS('email')} />
                  </Field>
                  <Field label="Phone number">
                    <Input value={school.phone} onChange={setS('phone')} placeholder="+92 …" />
                  </Field>
                  <Field label="Website">
                    <Input value={school.website} onChange={setS('website')} placeholder="https://" />
                  </Field>
                  <Field label="Registration number">
                    <Input value={school.registrationNumber} onChange={setS('registrationNumber')} />
                  </Field>
                  <Field label="Address" className="sm:col-span-2">
                    <Textarea rows={3} value={school.address} onChange={setS('address')} />
                  </Field>
                  <Field label="Currency" hint="All fees and amounts are recorded in Pakistani Rupees.">
                    <Input value="PKR (Rs)" disabled className="bg-surface-muted" />
                  </Field>
                </CardBody>
              </Card>
            </motion.div>
          )}

          {tab === 'academic' && (
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader title="Academic year" subtitle="Terms, pass mark and attendance threshold used across the school" />
                <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Current session">
                    <Select value={academic.session} onChange={setA('session')}>
                      {['2025 – 2026', '2026 – 2027', '2027 – 2028'].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Current term">
                    <Select value={academic.term} onChange={setA('term')}>
                      <option>Term 1</option>
                      <option>Term 2</option>
                      <option>Term 3</option>
                    </Select>
                  </Field>
                  <Field label="Session start">
                    <Input type="date" value={academic.sessionStart} onChange={setA('sessionStart')} />
                  </Field>
                  <Field
                    label="Session end"
                    error={academic.sessionStart && academic.sessionEnd && academic.sessionStart > academic.sessionEnd ? 'The session must end after it starts.' : undefined}
                  >
                    <Input type="date" value={academic.sessionEnd} onChange={setA('sessionEnd')} />
                  </Field>
                  <Field label="Pass mark (%)" hint="Minimum percentage to pass a subject." error={pct(academic.passingMarks) ? undefined : 'Enter 0–100.'}>
                    <Input type="number" min={0} max={100} value={academic.passingMarks} onChange={setA('passingMarks')} />
                  </Field>
                  <Field
                    label="Minimum attendance (%)"
                    hint="Students see a warning below this."
                    error={pct(academic.minimumAttendance) ? undefined : 'Enter 0–100.'}
                  >
                    <Input type="number" min={0} max={100} value={academic.minimumAttendance} onChange={setA('minimumAttendance')} />
                  </Field>
                  <Field
                    label="Periods per day"
                    hint="Rows on the timetable and choices on the attendance register."
                    error={Number(academic.periodsPerDay) >= 1 && Number(academic.periodsPerDay) <= 12 ? undefined : 'Enter 1–12.'}
                  >
                    <Input type="number" min={1} max={12} value={academic.periodsPerDay} onChange={setA('periodsPerDay')} />
                  </Field>
                </CardBody>
              </Card>
            </motion.div>
          )}

          {tab === 'security' && (
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader title="Security" subtitle="How every account signs in" />
                <CardBody className="space-y-3">
                  {[
                    ['Email verification code', 'Every sign-in needs a 6-digit code sent by email.'],
                    ['Sign-in alerts', 'Each account gets an email after every successful sign-in, with the time, device and IP address.'],
                    ['Account lockout', 'Too many wrong passwords lock the account for a while and email its owner.'],
                    ['Audit log', 'Sign-ins and every change made through the system are recorded under Audit Log.'],
                  ].map(([title, body]) => (
                    <div key={title} className="flex items-start gap-3 rounded-item border border-line bg-surface-muted p-4">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <div>
                        <p className="text-[13px] font-semibold text-ink">{title}</p>
                        <p className="mt-0.5 text-[12px] text-ink-muted">{body}</p>
                      </div>
                    </div>
                  ))}
                  <p className="text-[12px] text-ink-muted">These are set on the server (server/.env) by whoever hosts the system.</p>
                </CardBody>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}

      <Toast message={toast.message} tone={toast.tone} onDone={() => setToast({ message: '', tone: 'success' })} />
    </div>
  )
}
