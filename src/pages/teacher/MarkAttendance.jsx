import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Check, CheckCheck, Clock3, Save, X } from 'lucide-react'
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  ExportMenu,
  Input,
  PageHeader,
  ProgressBar,
  SearchInput,
  Select,
  Skeleton,
  Toast,
} from '../../components/ui/index.jsx'
import endpoints from '../../lib/api.js'
import useApi, { useMutation } from '../../lib/useApi.js'
import { cx, formatDate, initials, todayISO } from '../../lib/utils.js'
import { fadeUp, stagger } from '../../lib/motion.js'

const STATES = [
  { key: 'present', label: 'Present', icon: Check, active: 'bg-success text-white border-success' },
  { key: 'late', label: 'Late', icon: Clock3, active: 'bg-warning text-white border-warning' },
  { key: 'absent', label: 'Absent', icon: X, active: 'bg-danger text-white border-danger' },
]
const LABEL = { present: 'Present', late: 'Late', absent: 'Absent' }

export default function TeacherMarkAttendance() {
  const classes = useApi(() => endpoints.teachers.myClasses(), [])
  const { data: settingsData } = useApi(() => endpoints.settings.get(), [])
  const periodsPerDay = settingsData?.data?.academic?.periodsPerDay ?? 6
  const myClasses = classes.data?.data ?? []

  const [klass, setKlass] = useState('')
  const [date, setDate] = useState(todayISO())
  const [period, setPeriod] = useState(1)
  const [query, setQuery] = useState('')
  const [marks, setMarks] = useState({})
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!klass && myClasses.length) setKlass(myClasses[0]._id)
  }, [myClasses, klass])

  const register = useApi(
    () => endpoints.attendance.register({ classRoom: klass, date, period }),
    [klass, date, period],
    { skip: !klass },
  )
  const roster = register.data?.data?.students ?? []
  const already = register.data?.data?.alreadySubmitted

  // Load whatever is already saved for this class/date/period (defaults to present)
  useEffect(() => {
    setMarks(Object.fromEntries(roster.map((s) => [s._id, s.status])))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register.data])

  const save = useMutation(
    () =>
      endpoints.attendance.mark({
        classRoom: klass,
        date,
        period: Number(period),
        records: roster.map((s) => ({ student: s._id, status: marks[s._id] ?? 'present' })),
      }),
    {
      onSuccess: (res) => {
        setToast(res.message)
        register.refetch()
      },
      onError: (err) => setToast(err.message),
    },
  )

  const counts = useMemo(() => {
    const c = { present: 0, late: 0, absent: 0 }
    roster.forEach((s) => {
      c[marks[s._id] ?? 'present'] += 1
    })
    return c
  }, [marks, roster])

  if (classes.error) return <ErrorState error={classes.error} onRetry={classes.refetch} />

  const selected = myClasses.find((c) => c._id === klass)
  const total = roster.length
  const rate = total ? Math.round((counts.present / total) * 1000) / 10 : 0
  const q = query.trim().toLowerCase()
  const rows = q ? roster.filter((s) => `${s.name} ${s.roll} ${s.studentId}`.toLowerCase().includes(q)) : roster

  const markAll = (state) => setMarks(Object.fromEntries(roster.map((s) => [s._id, state])))

  if (!classes.loading && myClasses.length === 0) {
    return (
      <div>
        <PageHeader title="Mark Attendance" subtitle="Take the register for one class and date" />
        <Card>
          <EmptyState title="No classes assigned" description="Ask the office to assign you to a class before taking registers." />
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Mark Attendance"
        subtitle="Take the register for one class, date and period"
        actions={
          <>
            <ExportMenu
              title={`Attendance register — ${selected?.label ?? ''}`}
              filename={`Register ${selected?.label ?? ''} ${date} P${period}`}
              stamp={false}
              subtitle={`${formatDate(date)} · Period ${period}`}
              columns={[
                { header: 'Roll', value: (s) => s.roll, align: 'center' },
                { header: 'Student ID', value: (s) => s.studentId },
                { header: 'Name', value: (s) => s.name },
                { header: 'Status', value: (s) => LABEL[marks[s._id] ?? 'present'] },
              ]}
              getRows={() => roster}
              summary={[
                ['Present', String(counts.present)],
                ['Late', String(counts.late)],
                ['Absent', String(counts.absent)],
                ['Saved', already ? 'Yes' : 'Not yet'],
              ]}
            />
            <button className="btn-secondary" onClick={() => markAll('present')} disabled={!total}>
              <CheckCheck className="h-4 w-4" />
              Mark all present
            </button>
            <button className="btn-primary" onClick={() => save.mutate()} disabled={save.busy || !total}>
              <Save className="h-4 w-4" />
              {save.busy ? 'Saving…' : already ? 'Update register' : 'Save register'}
            </button>
          </>
        }
      />

      <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <motion.div variants={fadeUp} className="xl:col-span-3">
          <Card>
            <CardBody className="grid grid-cols-1 gap-4 py-5 sm:grid-cols-3">
              <div>
                <label className="field-label">Class</label>
                <Select value={klass} onChange={(e) => setKlass(e.target.value)} disabled={classes.loading}>
                  {myClasses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="field-label">Date</label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                  <Input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className="pl-11" />
                </div>
              </div>
              <div>
                <label className="field-label">Period</label>
                <Select value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
                  {Array.from({ length: periodsPerDay }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Period {i + 1}
                    </option>
                  ))}
                </Select>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <CardBody className="py-5">
              <p className="text-[13px] font-medium text-ink-muted">Attendance rate</p>
              <p className="mt-2 font-display text-[28px] font-semibold leading-none text-ink">{rate}%</p>
              <div className="mt-3">
                <ProgressBar value={rate} height="h-1.5" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="success">{counts.present} present</Badge>
                <Badge tone="warning">{counts.late} late</Badge>
                <Badge tone="danger">{counts.absent} absent</Badge>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mt-6">
        <Card>
          <CardHeader
            title={`${selected?.label ?? 'Class'} register`}
            subtitle={
              register.loading
                ? 'Loading roster…'
                : `${total} students · ${formatDate(date)} · Period ${period}${already ? ' · already saved — changes overwrite it' : ''}`
            }
            action={<SearchInput value={query} onChange={setQuery} placeholder="Find student…" className="w-56" />}
          />
          <CardBody className="pt-2">
            {register.error ? (
              <ErrorState error={register.error} onRetry={register.refetch} />
            ) : register.loading || classes.loading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-[62px] w-full rounded-item" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <EmptyState title={q ? 'No matching students' : 'No students in this class'} description={q ? 'Try another name.' : 'Students appear once the office enrols them.'} />
            ) : (
              <ul className="space-y-2">
                {rows.map((s) => (
                  <li
                    key={s._id}
                    className="flex flex-col gap-3 rounded-item border border-line p-3 transition-colors hover:border-field sm:flex-row sm:items-center"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">
                      {initials(s.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-ink">{s.name}</p>
                      <p className="text-[12px] text-ink-muted">
                        Roll {s.roll} · {s.studentId}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      {STATES.map((st) => {
                        const active = (marks[s._id] ?? 'present') === st.key
                        const Icon = st.icon
                        return (
                          <button
                            key={st.key}
                            onClick={() => setMarks((m) => ({ ...m, [s._id]: st.key }))}
                            className={cx(
                              'flex items-center gap-1.5 rounded-btn border px-3 py-2 text-[12px] font-semibold transition-all duration-200',
                              active ? st.active : 'border-line bg-white text-ink-muted hover:border-field hover:text-ink',
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {st.label}
                          </button>
                        )
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </motion.div>

      <Toast message={toast} tone={save.error ? 'danger' : 'success'} onDone={() => setToast('')} />
    </div>
  )
}
