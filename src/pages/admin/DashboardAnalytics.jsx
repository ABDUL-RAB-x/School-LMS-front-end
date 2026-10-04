import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, Award, ClipboardCheck, Download, TrendingUp, UserPlus, Wallet } from 'lucide-react'
import StatCard from '../../components/ui/StatCard.jsx'
import { Badge, Card, CardBody, CardHeader, CardSkeleton, EmptyState, ErrorState, ProgressBar, Skeleton, Tabs, Toast } from '../../components/ui/index.jsx'
import { AdmissionsChart, ChartLegend, GradeBarChart, HorizontalBarChart, RevenueBarChart, TrendLineChart } from '../../components/charts/index.jsx'
import endpoints from '../../lib/api.js'
import useApi from '../../lib/useApi.js'
import { downloadDocumentPdf } from '../../lib/documents.js'
import { currency } from '../../lib/utils.js'
import { fadeUp, stagger } from '../../lib/motion.js'

const RANGES = [
  { key: '3', label: '3 months' },
  { key: '6', label: '6 months' },
  { key: '12', label: '12 months' },
]

const rateColor = (v, min) => (v >= 90 ? '#0F766E' : v >= min ? '#D97706' : '#DC2626')
const scoreTone = (v) => (v >= 80 ? 'success' : v >= 60 ? 'info' : 'warning')
const fmtPct = (v) => (v == null ? '—' : `${v}%`)

function analyticsPdf(a, months) {
  return downloadDocumentPdf({
    filename: `Analytics report ${months} months`,
    title: 'School Analytics Report',
    subtitle: `Last ${months} months`,
    sections: [
      {
        heading: 'Key figures',
        pairs: [
          ['Attendance rate', fmtPct(a.kpis.attendanceRate)],
          ['Average exam score', fmtPct(a.kpis.averageScore)],
          ['Fee collection rate', fmtPct(a.kpis.collectionRate)],
          [`Students below ${a.minimumAttendance}% attendance`, String(a.kpis.belowMinimum)],
          ['New admissions', String(a.kpis.newAdmissions)],
          ['Fees billed / collected', `${currency(a.fees.billed)} / ${currency(a.fees.collected)}`],
          ['Outstanding (overdue)', `${currency(a.fees.outstanding)} (${currency(a.fees.overdue)})`],
        ],
      },
      {
        heading: 'Top performing students',
        columns: [
          { header: '#', value: (r) => r.rank, align: 'center' },
          { header: 'Student', value: (r) => r.name },
          { header: 'ID', value: (r) => r.studentId },
          { header: 'Class', value: (r) => r.className },
          { header: 'Average', value: (r) => `${r.average}%`, align: 'center' },
          { header: 'Exams', value: (r) => r.exams, align: 'center' },
        ],
        rows: a.topStudents.map((r, i) => ({ ...r, rank: i + 1 })),
      },
      {
        heading: `Low attendance (below ${a.minimumAttendance}%)`,
        columns: [
          { header: 'Student', value: (r) => r.name },
          { header: 'ID', value: (r) => r.studentId },
          { header: 'Class', value: (r) => r.className },
          { header: 'Attendance', value: (r) => `${r.rate}%`, align: 'center' },
          { header: 'Absences', value: (r) => r.absences, align: 'center' },
          { header: 'Registers', value: (r) => r.registers, align: 'center' },
        ],
        rows: a.lowAttendance,
      },
      {
        heading: 'Subject performance',
        columns: [
          { header: 'Subject', value: (r) => r.subject },
          { header: 'Code', value: (r) => r.code },
          { header: 'Average', value: (r) => `${r.average}%`, align: 'center' },
          { header: `Pass rate (${a.passingMarks}%+)`, value: (r) => `${r.passRate}%`, align: 'center' },
          { header: 'Results', value: (r) => r.results, align: 'center' },
        ],
        rows: a.subjectPerformance,
      },
      {
        heading: 'Attendance by month',
        columns: [
          { header: 'Month', value: (r) => r.month },
          { header: 'Rate', value: (r) => fmtPct(r.rate), align: 'center' },
          { header: 'Present', value: (r) => r.present, align: 'center' },
          { header: 'Late', value: (r) => r.late, align: 'center' },
          { header: 'Absent', value: (r) => r.absent, align: 'center' },
        ],
        rows: a.attendanceTrend,
      },
      {
        heading: 'Monthly admissions',
        columns: [
          { header: 'Month', value: (r) => r.month },
          { header: 'New admissions', value: (r) => r.students, align: 'center' },
          { header: 'Students on roll', value: (r) => r.total, align: 'center' },
        ],
        rows: a.monthlyAdmissions,
      },
      {
        heading: 'Fee collection by class',
        columns: [
          { header: 'Class', value: (r) => r.className },
          { header: 'Invoices', value: (r) => r.invoices, align: 'center' },
          { header: 'Billed', value: (r) => currency(r.billed), align: 'right' },
          { header: 'Collected', value: (r) => currency(r.collected), align: 'right' },
          { header: 'Rate', value: (r) => `${r.rate}%`, align: 'center' },
        ],
        rows: a.fees.byClass,
      },
    ],
  })
}

// Admin dashboard › Analytics: attendance, results, admissions and fees over a chosen window
export default function DashboardAnalytics({ gradeDistribution, gradeLoading }) {
  const [months, setMonths] = useState('6')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const { data, loading, error, refetch } = useApi(() => endpoints.dashboard.analytics(months), [months])
  const a = data?.data

  const download = async () => {
    setBusy(true)
    try {
      await analyticsPdf(a, months)
    } catch (err) {
      setToast(err.message || 'The download failed.')
    } finally {
      setBusy(false)
    }
  }

  const kpis = a
    ? [
        { id: 'att', label: 'Attendance', value: fmtPct(a.kpis.attendanceRate), hint: `last ${months} months`, icon: ClipboardCheck },
        { id: 'score', label: 'Average Score', value: fmtPct(a.kpis.averageScore), hint: 'all exams in range', icon: TrendingUp },
        { id: 'fees', label: 'Fee Collection', value: fmtPct(a.kpis.collectionRate), hint: `${currency(a.fees.collected)} collected`, icon: Wallet },
        { id: 'low', label: 'Low Attendance', value: String(a.kpis.belowMinimum), hint: `students below ${a.minimumAttendance}%`, icon: AlertTriangle },
        { id: 'adm', label: 'New Admissions', value: String(a.kpis.newAdmissions), hint: `last ${months} months`, icon: UserPlus },
      ]
    : []

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Analytics</h2>
          <p className="text-[13px] text-ink-muted">Attendance, results, admissions and fee collection</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs tabs={RANGES} active={months} onChange={setMonths} />
          <button className="btn-secondary h-[42px]" onClick={download} disabled={!a || loading || busy}>
            <Download className="h-4 w-4" />
            {busy ? 'Preparing…' : 'Download report'}
          </button>
        </div>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          {loading || !a ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {kpis.map((k) => (
                <StatCard key={k.id} label={k.label} value={k.value} hint={k.hint} icon={k.icon} accent={k.id === 'low' && a.kpis.belowMinimum ? '#DC2626' : undefined} />
              ))}
            </motion.div>
          )}

          <motion.div variants={stagger(0.1)} initial="hidden" animate="show" className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            {/* Monthly admissions */}
            <motion.div variants={fadeUp} className="xl:col-span-2">
              <Card className="h-full">
                <CardHeader
                  title="Monthly admissions"
                  subtitle="New students each month and the size of the roll"
                  action={
                    <ChartLegend
                      items={[
                        { label: 'New admissions', color: '#0F766E' },
                        { label: 'On roll', color: '#2563EB' },
                      ]}
                    />
                  }
                />
                <CardBody className="pt-2">
                  {loading || !a ? <Skeleton className="h-[260px] w-full" /> : <AdmissionsChart data={a.monthlyAdmissions} />}
                </CardBody>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <CardHeader title="Students by grade" subtitle="Current headcount" />
                <CardBody className="pt-2">
                  {gradeLoading ? <Skeleton className="h-[240px] w-full" /> : <GradeBarChart data={gradeDistribution ?? []} />}
                </CardBody>
              </Card>
            </motion.div>

            {/* Attendance */}
            <motion.div variants={fadeUp} className="xl:col-span-2">
              <Card className="h-full">
                <CardHeader title="Attendance percentage" subtitle="Share of register entries marked present, by month" />
                <CardBody className="pt-2">
                  {loading || !a ? (
                    <Skeleton className="h-[230px] w-full" />
                  ) : a.attendanceTrend.every((m) => m.rate == null) ? (
                    <EmptyState icon={ClipboardCheck} title="No registers in this period" description="Attendance appears once teachers take registers." />
                  ) : (
                    <TrendLineChart data={a.attendanceTrend} dataKey="rate" labelKey="month" name="Attendance" />
                  )}
                </CardBody>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <CardHeader
                  title="Low attendance"
                  subtitle={`Below the ${a?.minimumAttendance ?? 75}% minimum (3+ registers)`}
                  action={a?.kpis.belowMinimum > 10 ? <Badge tone="danger">{a.kpis.belowMinimum} total</Badge> : null}
                />
                <CardBody className="pt-1">
                  {loading || !a ? (
                    <Skeleton className="h-[200px] w-full" />
                  ) : a.lowAttendance.length === 0 ? (
                    <EmptyState icon={ClipboardCheck} title="Everyone is above the minimum" description="No student is below the attendance threshold." />
                  ) : (
                    <ul className="divide-y divide-line">
                      {a.lowAttendance.map((s) => (
                        <li key={s.id}>
                          <Link to={`/admin/students/${s.id}`} className="block py-2.5 hover:bg-surface-muted/60">
                            <div className="flex items-center justify-between gap-3 text-[13px]">
                              <span className="min-w-0 truncate font-semibold text-ink">{s.name}</span>
                              <span className="shrink-0 font-semibold text-danger">{s.rate}%</span>
                            </div>
                            <p className="mb-1.5 text-[11px] text-ink-muted">
                              {s.className} · {s.absences} absent of {s.registers}
                            </p>
                            <ProgressBar value={s.rate} height="h-1" color={rateColor(s.rate, a.minimumAttendance)} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </motion.div>

            {/* Results */}
            <motion.div variants={fadeUp} className="xl:col-span-2">
              <Card className="h-full">
                <CardHeader
                  title="Subject performance"
                  subtitle={`Average score and pass rate (${a?.passingMarks ?? 40}%+) per subject`}
                  action={
                    <ChartLegend
                      items={[
                        { label: 'Average', color: '#0F766E' },
                        { label: 'Pass rate', color: '#93C5FD' },
                      ]}
                    />
                  }
                />
                <CardBody className="pt-2">
                  {loading || !a ? (
                    <Skeleton className="h-[260px] w-full" />
                  ) : a.subjectPerformance.length === 0 ? (
                    <EmptyState icon={TrendingUp} title="No results in this period" description="Scores appear once teachers enter marks." />
                  ) : (
                    <HorizontalBarChart
                      data={a.subjectPerformance}
                      labelKey="subject"
                      suffix="%"
                      bars={[
                        { key: 'average', name: 'Average', color: '#0F766E' },
                        { key: 'passRate', name: 'Pass rate', color: '#93C5FD' },
                      ]}
                    />
                  )}
                </CardBody>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <CardHeader title="Top performing students" subtitle="Highest average across exams in this period" />
                <CardBody className="pt-1">
                  {loading || !a ? (
                    <Skeleton className="h-[200px] w-full" />
                  ) : a.topStudents.length === 0 ? (
                    <EmptyState icon={Award} title="No results yet" description="Rankings appear once marks are entered." />
                  ) : (
                    <ol className="divide-y divide-line">
                      {a.topStudents.map((s, i) => (
                        <li key={s.id}>
                          <Link to={`/admin/students/${s.id}`} className="flex items-center gap-3 py-2.5 hover:bg-surface-muted/60">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                                i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-surface-muted text-ink-muted'
                              }`}
                            >
                              {i + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-semibold text-ink">{s.name}</p>
                              <p className="text-[11px] text-ink-muted">
                                {s.className} · {s.exams} exam{s.exams === 1 ? '' : 's'}
                              </p>
                            </div>
                            <Badge tone={scoreTone(s.average)}>{s.average}%</Badge>
                          </Link>
                        </li>
                      ))}
                    </ol>
                  )}
                </CardBody>
              </Card>
            </motion.div>

            {/* Fees */}
            <motion.div variants={fadeUp} className="xl:col-span-2">
              <Card className="h-full">
                <CardHeader
                  title="Fee collection statistics"
                  subtitle="Collected vs. outstanding by due month, in thousands of rupees"
                  action={
                    <ChartLegend
                      items={[
                        { label: 'Collected', color: '#0F766E' },
                        { label: 'Outstanding', color: '#CBD5E1' },
                      ]}
                    />
                  }
                />
                <CardBody className="pt-2">
                  {loading || !a ? (
                    <Skeleton className="h-[260px] w-full" />
                  ) : (
                    <>
                      <RevenueBarChart
                        data={a.fees.byMonth.map((m) => ({
                          month: m.month,
                          collected: Math.round(m.collected / 100) / 10,
                          outstanding: Math.round(m.outstanding / 100) / 10,
                        }))}
                      />
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                          { label: 'Billed', value: currency(a.fees.billed), tone: 'text-ink' },
                          { label: 'Collected', value: currency(a.fees.collected), tone: 'text-success' },
                          { label: 'Outstanding', value: currency(a.fees.outstanding), tone: 'text-warning' },
                          { label: `Overdue (${a.fees.overdueInvoices})`, value: currency(a.fees.overdue), tone: 'text-danger' },
                        ].map((x) => (
                          <div key={x.label} className="rounded-item bg-surface-muted p-3">
                            <p className="text-[11px] text-ink-muted">{x.label}</p>
                            <p className={`mt-0.5 whitespace-nowrap font-display text-[15px] font-semibold ${x.tone}`}>{x.value}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardBody>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <CardHeader title="Collection by class" subtitle="Share of each class's billing collected" />
                <CardBody className="space-y-3.5 pt-2">
                  {loading || !a ? (
                    <Skeleton className="h-[200px] w-full" />
                  ) : a.fees.byClass.length === 0 ? (
                    <EmptyState icon={Wallet} title="No invoices yet" description="Issue invoices to track collection." />
                  ) : (
                    <>
                      {a.fees.byClass.map((c) => (
                        <div key={c.className}>
                          <div className="mb-1.5 flex items-center justify-between gap-2 text-[13px]">
                            <span className="truncate text-ink-muted">{c.className}</span>
                            <span className="shrink-0 font-semibold text-ink">{c.rate}%</span>
                          </div>
                          <ProgressBar value={c.rate} height="h-1.5" color={c.rate >= 80 ? '#0F766E' : c.rate >= 50 ? '#D97706' : '#DC2626'} />
                          <p className="mt-1 text-[11px] text-ink-faint">
                            {currency(c.collected)} of {currency(c.billed)}
                          </p>
                        </div>
                      ))}
                      {a.fees.byMethod.length > 0 && (
                        <div className="border-t border-line pt-3">
                          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Payment methods</p>
                          {a.fees.byMethod.map((m) => (
                            <div key={m.method} className="flex items-center justify-between py-1 text-[13px]">
                              <span className="text-ink-muted">
                                {m.method} · {m.count}
                              </span>
                              <span className="font-semibold text-ink">{currency(m.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          </motion.div>
        </>
      )}

      <Toast message={toast} tone="danger" onDone={() => setToast('')} />
    </section>
  )
}
