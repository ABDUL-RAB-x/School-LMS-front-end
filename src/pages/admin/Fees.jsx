import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, FileDown, Plus, Receipt, Send, Trash2, Wallet } from 'lucide-react'
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardSkeleton,
  DataTable,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  Toast,
} from '../../components/ui/index.jsx'
import { ChartLegend, RevenueBarChart } from '../../components/charts/index.jsx'
import endpoints, { fetchAll } from '../../lib/api.js'
import useApi, { useMutation } from '../../lib/useApi.js'
import { currency, formatDate, toneFor } from '../../lib/utils.js'
import { feeReceiptPdf } from '../../lib/documents.js'
import { fadeUp, hoverLift, stagger } from '../../lib/motion.js'

const PAGE_SIZE = 8
const BLANK = {
  student: '',
  description: 'Tuition Fee',
  term: 'Term 1 · 2026',
  amount: '',
  dueDate: '',
  status: 'Pending',
}

export default function AdminFees() {
  const [query, setQuery] = useState({ search: '', filters: {}, page: 1 })
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [toast, setToast] = useState('')

  const fees = useApi(
    () =>
      endpoints.fees.list({
        search: query.search,
        status: query.filters.status,
        classRoom: query.filters.classRoom,
        page: query.page,
        limit: PAGE_SIZE,
      }),
    [query.search, query.filters.status, query.filters.classRoom, query.page],
  )

  const summary = useApi(() => endpoints.fees.summary(), [])
  const { data: classData } = useApi(() => endpoints.classes.list(), [])
  const { data: studentData } = useApi(() => endpoints.students.list({ limit: 100 }), [])
  const classes = classData?.data ?? []
  const students = studentData?.data ?? []

  const onQueryChange = useCallback((q) => {
    setQuery((prev) =>
      prev.search === q.search && prev.page === q.page && JSON.stringify(prev.filters) === JSON.stringify(q.filters)
        ? prev
        : q,
    )
  }, [])

  const refreshAll = () => {
    fees.refetch()
    summary.refetch()
  }

  const create = useMutation((body) => endpoints.fees.create(body), {
    onSuccess: (res) => {
      setToast(res.message)
      setOpen(false)
      refreshAll()
    },
  })

  const markPaid = useMutation((id) => endpoints.fees.update(id, { status: 'Paid', method: 'Bank transfer' }), {
    onSuccess: (res) => {
      setToast(res.message)
      refreshAll()
    },
  })

  const remind = useMutation((id) => endpoints.fees.remind(id), {
    onSuccess: (res) => setToast(res.message),
    onError: (err) => setToast(err.message),
  })

  const remove = useMutation((id) => endpoints.fees.remove(id), {
    onSuccess: (res) => {
      setToast(res.message)
      setConfirm(null)
      refreshAll()
    },
  })

  const openNew = () => {
    setForm({ ...BLANK, student: students[0]?._id ?? '' })
    create.setError(null)
    create.setFields({})
    setOpen(true)
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const s = summary.data?.data
  const cards = [
    { label: 'Total Billed', value: currency(s?.billed ?? 0), hint: `${s?.invoices ?? 0} invoices`, color: '#1E293B', width: '100%' },
    { label: 'Collected', value: currency(s?.collected ?? 0), hint: `${s?.collectionRate ?? 0}% of billed`, color: '#0F766E', width: `${s?.collectionRate ?? 0}%` },
    { label: 'Outstanding', value: currency(s?.outstanding ?? 0), hint: 'pending + overdue', color: '#D97706', width: s?.billed ? `${Math.round((s.outstanding / s.billed) * 100)}%` : '0%' },
    { label: 'Overdue', value: currency(s?.overdue ?? 0), hint: `${s?.overdueCount ?? 0} invoices`, color: '#DC2626', width: s?.billed ? `${Math.round((s.overdue / s.billed) * 100)}%` : '0%' },
  ]

  const columns = [
    { key: 'invoiceNo', header: 'Invoice', render: (r) => <span className="font-mono text-[13px] font-semibold text-ink">{r.invoiceNo}</span> },
    {
      key: 'student',
      header: 'Student',
      render: (r) => (
        <div>
          <p className="font-semibold text-ink">{r.student?.name ?? '—'}</p>
          <p className="text-[12px] text-ink-muted">
            {r.student?.classRoom ? `${r.student.classRoom.name} · ${r.student.classRoom.section}` : '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (r) => (
        <div>
          <p className="text-[13px] font-medium text-ink">{r.description}</p>
          <p className="text-[12px] text-ink-muted">{r.term}</p>
        </div>
      ),
    },
    { key: 'amount', header: 'Amount', align: 'right', render: (r) => <span className="whitespace-nowrap font-semibold text-ink">{currency(r.amount)}</span> },
    { key: 'dueDate', header: 'Due date', render: (r) => <span className="text-[13px]">{formatDate(r.dueDate)}</span> },
    { key: 'status', header: 'Status', align: 'center', render: (r) => <Badge tone={toneFor(r.status)} dot>{r.status}</Badge> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          {r.status !== 'Paid' && (
            <>
              <button
                onClick={() => markPaid.mutate(r._id)}
                disabled={markPaid.busy}
                className="btn-ghost h-9 !px-2.5 text-[13px]"
                title="Mark as paid"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Paid
              </button>
              <button
                onClick={() => remind.mutate(r._id)}
                disabled={remind.busy}
                className="btn-ghost h-9 !px-2.5 text-[13px]"
                title="Email a reminder"
              >
                <Send className="h-3.5 w-3.5" />
                Remind
              </button>
            </>
          )}
          <button
            onClick={() => feeReceiptPdf(r)}
            className="rounded-btn p-2 text-ink-faint transition-colors hover:bg-surface-muted hover:text-accent"
            title={r.status === 'Paid' ? 'Download receipt (PDF)' : 'Download invoice (PDF)'}
          >
            <FileDown className="h-4 w-4" />
          </button>
          <button
            onClick={() => setConfirm(r)}
            className="rounded-btn p-2 text-ink-faint transition-colors hover:bg-red-50 hover:text-danger"
            title="Delete invoice"
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
        title="Fee Management"
        subtitle="Invoices, collections and outstanding balances"
        actions={
          <button className="btn-primary" onClick={openNew} disabled={!students.length}>
            <Plus className="h-4 w-4" />
            New invoice
          </button>
        }
      />

      {summary.loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          variants={stagger()}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {cards.map((c) => (
            <motion.div key={c.label} variants={fadeUp} whileHover={hoverLift} className="card p-5">
              <p className="text-[13px] font-medium text-ink-muted">{c.label}</p>
              <p className="mt-3 font-display text-[26px] font-semibold leading-none tracking-tight text-ink">{c.value}</p>
              <p className="mt-2.5 text-[12px] text-ink-faint">{c.hint}</p>
              <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: c.width, background: c.color }} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mt-6">
        <Card>
          <CardHeader
            title="Collection trend"
            subtitle="Collected vs. outstanding by due month, in thousands"
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
            {summary.loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : !s?.trend?.length ? (
              <EmptyState icon={Wallet} title="No invoices yet" description="Issue invoices to start tracking collection." />
            ) : (
              <RevenueBarChart data={s.trend} />
            )}
          </CardBody>
        </Card>
      </motion.div>

      <div className="mt-6">
        <DataTable
          remote
          columns={columns}
          rows={fees.data?.data ?? []}
          pagination={fees.data?.pagination}
          loading={fees.loading}
          error={fees.error}
          onRetry={fees.refetch}
          onQueryChange={onQueryChange}
          pageSize={PAGE_SIZE}
          rowKey={(r) => r._id}
          searchKeys={['invoiceNo']}
          searchPlaceholder="Search invoice number or student…"
          filters={[
            { key: 'status', label: 'Status', options: ['Paid', 'Pending', 'Overdue'] },
            { key: 'classRoom', label: 'Class', options: classes.map((c) => ({ value: c._id, label: `${c.name} · ${c.section}` })) },
          ]}
          exportConfig={{
            title: 'Fee Invoices',
            filename: 'Fees',
            columns: [
              { header: 'Invoice', value: (r) => r.invoiceNo },
              { header: 'Student ID', value: (r) => r.student?.studentId ?? '' },
              { header: 'Student', value: (r) => r.student?.name ?? '' },
              {
                header: 'Class',
                value: (r) => (r.student?.classRoom ? `${r.student.classRoom.name} ${r.student.classRoom.section}` : ''),
              },
              { header: 'Fee type', value: (r) => r.description },
              { header: 'Term', value: (r) => r.term },
              { header: 'Amount (PKR)', value: (r) => r.amount, align: 'right' },
              { header: 'Due date', value: (r) => formatDate(r.dueDate) },
              { header: 'Status', value: (r) => r.status },
              { header: 'Paid on', value: (r) => (r.paidAt ? formatDate(r.paidAt) : '') },
              { header: 'Method', value: (r) => (r.method === '—' ? '' : r.method) },
            ],
            getRows: ({ search, filters }) => fetchAll(endpoints.fees.list, { search, ...filters }),
            summary: (rows) => {
              const sum = (pred) => rows.filter(pred).reduce((t, f) => t + f.amount, 0)
              return [
                ['Invoices', String(rows.length)],
                ['Total billed', currency(sum(() => true))],
                ['Collected', currency(sum((f) => f.status === 'Paid'))],
                ['Outstanding', currency(sum((f) => f.status !== 'Paid'))],
              ]
            },
          }}
          emptyTitle="No invoices yet"
          emptyDescription="Generate invoices to start tracking fee collection."
          emptyAction={
            <button className="btn-primary" onClick={openNew} disabled={!students.length}>
              <Plus className="h-4 w-4" />
              New invoice
            </button>
          }
        />
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New invoice"
        subtitle="Bill a student for the current term"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)} disabled={create.busy}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={() => create.mutate({ ...form, amount: Number(form.amount) })}
              disabled={create.busy}
            >
              <Receipt className="h-4 w-4" />
              {create.busy ? 'Creating…' : 'Create invoice'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Student" required error={create.fields.student} className="sm:col-span-2">
            <Select value={form.student} onChange={set('student')}>
              {students.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.name} · {st.classRoom ? `${st.classRoom.name} ${st.classRoom.section}` : '—'}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fee type" required error={create.fields.description}>
            <Select value={form.description} onChange={set('description')}>
              <option>Tuition Fee</option>
              <option>Laboratory Fee</option>
              <option>Transport Fee</option>
              <option>Examination Fee</option>
              <option>Other</option>
            </Select>
          </Field>
          <Field label="Term" required error={create.fields.term}>
            <Input value={form.term} onChange={set('term')} placeholder="e.g. Term 1 · 2026" />
          </Field>
          <Field label="Amount (PKR)" required error={create.fields.amount}>
            <Input type="number" min="0" value={form.amount} onChange={set('amount')} placeholder="15000" />
          </Field>
          <Field label="Due date" required error={create.fields.dueDate}>
            <Input type="date" value={form.dueDate} onChange={set('dueDate')} />
          </Field>
        </div>
        {create.error && (
          <p className="mt-4 rounded-btn border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-danger">
            {create.error}
          </p>
        )}
      </Modal>

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Delete invoice?"
        subtitle={confirm?.invoiceNo}
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
          The invoice is removed from the student's fee history. This cannot be undone.
        </p>
      </Modal>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
