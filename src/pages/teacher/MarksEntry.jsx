import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Save, Upload } from 'lucide-react'
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  ExportMenu,
  PageHeader,
  ProgressBar,
  SearchInput,
  Select,
  Skeleton,
  Toast,
} from '../../components/ui/index.jsx'
import endpoints from '../../lib/api.js'
import useApi, { useMutation } from '../../lib/useApi.js'
import { cx, formatDate, initials } from '../../lib/utils.js'
import { fadeUp, stagger } from '../../lib/motion.js'

// Same bands the API uses when it stores the grade
function gradeFor(pct) {
  if (pct >= 90) return { grade: 'A+', tone: 'success' }
  if (pct >= 80) return { grade: 'A', tone: 'success' }
  if (pct >= 75) return { grade: 'A-', tone: 'success' }
  if (pct >= 70) return { grade: 'B+', tone: 'info' }
  if (pct >= 60) return { grade: 'B', tone: 'info' }
  if (pct >= 50) return { grade: 'C', tone: 'warning' }
  if (pct >= 40) return { grade: 'D', tone: 'warning' }
  return { grade: 'F', tone: 'danger' }
}

// Minimal CSV reader: handles quoted cells and both comma/semicolon separators
function parseCsv(text) {
  const sep = (text.split(/\r?\n/)[0].match(/;/g)?.length ?? 0) > (text.split(/\r?\n/)[0].match(/,/g)?.length ?? 0) ? ';' : ','
  return text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((line) => {
      const out = []
      let cur = ''
      let quoted = false
      for (let i = 0; i < line.length; i += 1) {
        const ch = line[i]
        if (quoted) {
          if (ch === '"' && line[i + 1] === '"') {
            cur += '"'
            i += 1
          } else if (ch === '"') quoted = false
          else cur += ch
        } else if (ch === '"') quoted = true
        else if (ch === sep) {
          out.push(cur.trim())
          cur = ''
        } else cur += ch
      }
      out.push(cur.trim())
      return out
    })
}

export default function TeacherMarksEntry() {
  const classes = useApi(() => endpoints.teachers.myClasses(), [])
  const myClasses = classes.data?.data ?? []
  const [klass, setKlass] = useState('')
  const [examId, setExamId] = useState('')
  const [query, setQuery] = useState('')
  const [marks, setMarks] = useState({})
  const [toast, setToast] = useState({ message: '', tone: 'success' })
  const fileRef = useRef(null)

  useEffect(() => {
    if (!klass && myClasses.length) setKlass(myClasses[0]._id)
  }, [myClasses, klass])

  const exams = useApi(() => endpoints.exams.list({ classRoom: klass, limit: 100 }), [klass], { skip: !klass })
  const examList = (exams.data?.data ?? []).filter((e) => e.status !== 'Draft')

  useEffect(() => {
    if (exams.data) setExamId(examList[0]?._id ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exams.data])

  const sheet = useApi(() => endpoints.results.sheet(examId), [examId], { skip: !examId })
  // A skipped request keeps its last data: ignore it once no exam is selected
  const exam = examId ? sheet.data?.data?.exam : null
  const roster = (examId && sheet.data?.data?.rows) || []
  const maxMarks = exam?.maxMarks ?? 100

  useEffect(() => {
    setMarks(Object.fromEntries(roster.map((r) => [r._id, r.marks ?? ''])))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet.data])

  const save = useMutation(
    (entries) => endpoints.results.save({ exam: examId, entries }),
    {
      onSuccess: (res) => {
        setToast({ message: `${res.message} Exam status: ${res.data.examStatus}.`, tone: 'success' })
        sheet.refetch()
        exams.refetch()
      },
      onError: (err) => setToast({ message: err.message, tone: 'danger' }),
    },
  )

  const valid = (v) => v !== '' && v != null && !Number.isNaN(Number(v))
  const entered = roster.filter((r) => valid(marks[r._id])).length
  const overMax = roster.some((r) => valid(marks[r._id]) && (Number(marks[r._id]) > maxMarks || Number(marks[r._id]) < 0))

  const stats = useMemo(() => {
    const values = roster.map((r) => marks[r._id]).filter(valid).map(Number)
    if (!values.length) return { avg: '—', high: '—', passed: 0 }
    return {
      avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
      high: Math.max(...values),
      passed: values.filter((v) => (v / maxMarks) * 100 >= 40).length,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marks, roster, maxMarks])

  if (classes.error) return <ErrorState error={classes.error} onRetry={classes.refetch} />

  const submit = () => {
    const entries = roster.filter((r) => valid(marks[r._id])).map((r) => ({ student: r._id, marks: Number(marks[r._id]) }))
    if (!entries.length) {
      setToast({ message: 'Enter marks for at least one student first.', tone: 'danger' })
      return
    }
    save.mutate(entries)
  }

  const importCsv = async (file) => {
    if (!file) return
    try {
      const rows = parseCsv(await file.text())
      const header = rows[0].map((h) => h.toLowerCase())
      const hasHeader = header.some((h) => /roll|student|id|name|marks|score/.test(h))
      const body = hasHeader ? rows.slice(1) : rows
      const idCol = hasHeader ? header.findIndex((h) => /student ?id|^id$/.test(h)) : -1
      const rollCol = hasHeader ? header.findIndex((h) => /roll/.test(h)) : 0
      const markCol = hasHeader ? header.findIndex((h) => /marks|score/.test(h)) : 1
      if (markCol < 0 || (idCol < 0 && rollCol < 0)) throw new Error('The file needs a Roll or Student ID column and a Marks column.')

      let matched = 0
      const next = { ...marks }
      body.forEach((cells) => {
        const key = (idCol >= 0 ? cells[idCol] : cells[rollCol])?.toUpperCase()
        const student = roster.find((r) => (idCol >= 0 ? r.studentId?.toUpperCase() : String(r.roll).toUpperCase()) === key)
        const value = cells[markCol]
        if (student && valid(value)) {
          next[student._id] = value
          matched += 1
        }
      })
      setMarks(next)
      setToast({ message: `Imported marks for ${matched} of ${body.length} rows. Review them, then press Save.`, tone: matched ? 'success' : 'danger' })
    } catch (err) {
      setToast({ message: err.message || 'That file could not be read.', tone: 'danger' })
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const q = query.trim().toLowerCase()
  const rows = q ? roster.filter((s) => `${s.name} ${s.roll} ${s.studentId}`.toLowerCase().includes(q)) : roster
  const selectedClass = myClasses.find((c) => c._id === klass)

  return (
    <div>
      <PageHeader
        title="Exams & Marks Entry"
        subtitle="Record marks for an examination — results publish once every student has a mark"
        actions={
          <>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => importCsv(e.target.files?.[0])} />
            <button className="btn-secondary" onClick={() => fileRef.current?.click()} disabled={!roster.length} title="CSV with Roll (or Student ID) and Marks columns">
              <Upload className="h-4 w-4" />
              Import CSV
            </button>
            <ExportMenu
              title={`Marks sheet — ${exam ? `${exam.name} · ${exam.subject?.name ?? ''}` : ''}`}
              filename={`Marks ${selectedClass?.label ?? ''} ${exam?.subject?.name ?? ''}`}
              subtitle={exam ? `${selectedClass?.label ?? ''} · ${formatDate(exam.date)} · out of ${maxMarks}` : ''}
              columns={[
                { header: 'Roll', value: (r) => r.roll, align: 'center' },
                { header: 'Student ID', value: (r) => r.studentId },
                { header: 'Name', value: (r) => r.name },
                { header: 'Marks', value: (r) => (valid(marks[r._id]) ? marks[r._id] : ''), align: 'center' },
                {
                  header: 'Grade',
                  value: (r) => (valid(marks[r._id]) ? gradeFor(Math.round((Number(marks[r._id]) / maxMarks) * 100)).grade : ''),
                  align: 'center',
                },
              ]}
              getRows={() => roster}
            />
            <button className="btn-primary" onClick={submit} disabled={save.busy || !roster.length || overMax}>
              <Save className="h-4 w-4" />
              {save.busy ? 'Saving…' : 'Save marks'}
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
              <div className="sm:col-span-2">
                <label className="field-label">Examination</label>
                <Select value={examId} onChange={(e) => setExamId(e.target.value)} disabled={exams.loading || !examList.length}>
                  {examList.length === 0 && <option value="">No examinations for this class</option>}
                  {examList.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.name} · {e.subject?.name} · {formatDate(e.date)} ({e.status})
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
              <p className="text-[13px] font-medium text-ink-muted">Entry progress</p>
              <p className="mt-2 font-display text-[28px] font-semibold leading-none text-ink">
                {entered}
                <span className="text-ink-faint">/{roster.length}</span>
              </p>
              <div className="mt-3">
                <ProgressBar value={roster.length ? (entered / roster.length) * 100 : 0} height="h-1.5" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-[12px]">
                <div className="rounded-item bg-surface-muted p-2.5">
                  <p className="text-ink-muted">Average</p>
                  <p className="mt-0.5 font-display text-base font-semibold text-ink">{stats.avg}</p>
                </div>
                <div className="rounded-item bg-surface-muted p-2.5">
                  <p className="text-ink-muted">Highest</p>
                  <p className="mt-0.5 font-display text-base font-semibold text-success">{stats.high}</p>
                </div>
                <div className="rounded-item bg-surface-muted p-2.5">
                  <p className="text-ink-muted">Passed</p>
                  <p className="mt-0.5 font-display text-base font-semibold text-ink">{stats.passed}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mt-6">
        <Card>
          <CardHeader
            title={exam ? `${exam.subject?.name ?? ''} — ${exam.name}` : 'Marks sheet'}
            subtitle={exam ? `${selectedClass?.label ?? ''} · ${roster.length} students · out of ${maxMarks} · ${exam.status}` : 'Choose an examination'}
            action={<SearchInput value={query} onChange={setQuery} placeholder="Find student…" className="w-56" />}
          />
          <CardBody className="px-0 pt-2">
            {sheet.error ? (
              <ErrorState error={sheet.error} onRetry={sheet.refetch} />
            ) : sheet.loading || exams.loading || classes.loading ? (
              <div className="space-y-2 px-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-[56px] w-full rounded-item" />
                ))}
              </div>
            ) : !examId ? (
              <EmptyState title="No examination selected" description="The office schedules examinations; they appear here for your classes." />
            ) : rows.length === 0 ? (
              <EmptyState title={q ? 'No matching students' : 'No students in this class'} description={q ? 'Try another name.' : 'Students appear once the office enrols them.'} />
            ) : (
              <div className="scrollbar-thin max-h-[58vh] overflow-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-surface-muted">
                      <th className="w-20 border-b border-line px-6 py-3 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Roll</th>
                      <th className="border-b border-line px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Student</th>
                      <th className="w-40 border-b border-line px-5 py-3 text-center text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Marks</th>
                      <th className="w-28 border-b border-line px-5 py-3 text-center text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Percent</th>
                      <th className="w-28 border-b border-line px-5 py-3 text-center text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((s, i) => {
                      const raw = marks[s._id]
                      const ok = valid(raw)
                      const num = Number(raw)
                      const pct = ok ? Math.round((num / maxMarks) * 100) : null
                      const g = ok ? gradeFor(pct) : null
                      const bad = ok && (num > maxMarks || num < 0)
                      return (
                        <tr key={s._id} className={cx('border-b border-line/70 last:border-0', i % 2 === 1 && 'bg-surface-muted/60')}>
                          <td className="px-6 py-3 font-mono text-[13px] text-ink-muted">{s.roll}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
                                {initials(s.name)}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-ink">{s.name}</p>
                                <p className="font-mono text-[11px] text-ink-faint">{s.studentId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <input
                              type="number"
                              min="0"
                              max={maxMarks}
                              step="0.5"
                              value={raw ?? ''}
                              onChange={(e) => setMarks((m) => ({ ...m, [s._id]: e.target.value }))}
                              placeholder="—"
                              aria-label={`Marks for ${s.name}`}
                              className={cx(
                                'h-11 w-full rounded-input border bg-white px-3 text-center text-sm font-semibold text-ink',
                                'focus:outline-none focus:ring-2',
                                bad ? 'border-danger focus:border-danger focus:ring-danger/15' : 'border-field focus:border-accent focus:ring-accent/15',
                              )}
                            />
                          </td>
                          <td className="px-5 py-3 text-center text-[13px] font-semibold text-ink">
                            {ok ? `${pct}%` : <span className="text-ink-faint">—</span>}
                          </td>
                          <td className="px-5 py-3 text-center">
                            {g ? <Badge tone={g.tone}>{g.grade}</Badge> : <span className="text-[13px] text-ink-faint">—</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {overMax && (
              <p className="mx-6 mt-3 rounded-btn border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-danger">
                Marks must be between 0 and {maxMarks}. Fix the highlighted boxes before saving.
              </p>
            )}
          </CardBody>
        </Card>
      </motion.div>

      <Toast message={toast.message} tone={toast.tone} onDone={() => setToast({ message: '', tone: 'success' })} />
    </div>
  )
}
