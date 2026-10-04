import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Receipt, Wallet } from 'lucide-react'
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardSkeleton,
  DataTable,
  ErrorState,
  Modal,
  PageHeader,
  ProgressBar,
  Toast,
} from '../../components/ui/index.jsx'
import endpoints from '../../lib/api.js'
import useApi from '../../lib/useApi.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { currency, formatDate, toneFor } from '../../lib/utils.js'
import { feeReceiptPdf, feeStatementPdf } from '../../lib/documents.js'
import { fadeUp, hoverLift, stagger } from '../../lib/motion.js'

export default function StudentFees() {
  const { profile } = useAuth()
  const { data, loading, error, refetch } = useApi(() => endpoints.fees.mine(), [])
  const [receipt, setReceipt] = useState(null)
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)

  if (error) return <ErrorState error={error} onRetry={refetch} />

  const invoices = data?.data?.invoices ?? []
  const s = data?.data?.summary ?? { billed: 0, paid: 0, outstanding: 0, overdue: 0, percentPaid: 0 }
  const nextDue = invoices
    .filter((f) => f.status !== 'Paid')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]

  const download = async (fn) => {
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      setToast(err.message || 'The download failed.')
    } finally {
      setBusy(false)
    }
  }

  const cards = [
    { label: 'Total Billed', value: currency(s.billed), hint: `${invoices.length} invoices`, color: '#1E293B' },
    { label: 'Paid', value: currency(s.paid), hint: `${invoices.filter((f) => f.status === 'Paid').length} invoices`, color: '#0F766E' },
    { label: 'Outstanding', value: currency(s.outstanding), hint: nextDue ? `next due ${formatDate(nextDue.dueDate)}` : 'nothing due', color: '#D97706' },
    { label: 'Overdue', value: currency(s.overdue), hint: s.overdue ? 'please settle soon' : 'nothing overdue', color: s.overdue ? '#DC2626' : '#16A34A' },
  ]

  const columns = [
    { key: 'invoiceNo', header: 'Invoice', render: (r) => <span className="font-mono text-[13px] font-semibold text-ink">{r.invoiceNo}</span> },
    {
      key: 'description',
      header: 'Description',
      render: (r) => (
        <div>
          <p className="font-semibold text-ink">{r.description}</p>
          <p className="text-[12px] text-ink-muted">{r.term}</p>
        </div>
      ),
    },
    { key: 'amount', header: 'Amount', align: 'right', render: (r) => <span className="whitespace-nowrap font-semibold text-ink">{currency(r.amount)}</span> },
    { key: 'dueDate', header: 'Due date', render: (r) => <span className="text-[13px]">{formatDate(r.dueDate)}</span> },
    { key: 'method', header: 'Method', render: (r) => <span className="text-[13px] text-ink-muted">{r.method}</span> },
    { key: 'status', header: 'Status', align: 'center', render: (r) => <Badge tone={toneFor(r.status)} dot>{r.status}</Badge> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <button onClick={() => setReceipt(r)} className="btn-ghost h-9 !px-3 text-[13px]">
          <Receipt className="h-3.5 w-3.5" />
          {r.status === 'Paid' ? 'Receipt' : 'Details'}
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Fee Status"
        subtitle="Your invoices, payments and outstanding balance"
        actions={
          <button
            className="btn-secondary"
            disabled={loading || busy}
            onClick={() => download(() => feeStatementPdf({ student: profile, invoices, summary: s }))}
          >
            <Download className="h-4 w-4" />
            {busy ? 'Preparing…' : 'Download statement'}
          </button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((c) => (
            <motion.div key={c.label} variants={fadeUp} whileHover={hoverLift} className="card p-5">
              <p className="text-[13px] font-medium text-ink-muted">{c.label}</p>
              <p className="mt-3 font-display text-[26px] font-semibold leading-none tracking-tight text-ink">{c.value}</p>
              <p className="mt-2.5 text-[12px] text-ink-faint">{c.hint}</p>
              <div className="mt-4 h-1 w-full rounded-full" style={{ background: c.color }} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {!loading && invoices.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="mt-6">
          <Card>
            <CardHeader title="Payment progress" subtitle="Percentage of total fees settled" />
            <CardBody className="pt-2">
              <div className="mb-2 flex items-center justify-between text-[13px]">
                <span className="text-ink-muted">
                  {currency(s.paid)} paid of {currency(s.billed)}
                </span>
                <span className="font-semibold text-ink">{s.percentPaid}%</span>
              </div>
              <ProgressBar value={s.percentPaid} height="h-2.5" />
              {s.outstanding > 0 && nextDue && (
                <div className="mt-5 flex items-start gap-3 rounded-item border border-amber-200 bg-amber-50 p-4">
                  <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <div>
                    <p className="text-[13px] font-semibold text-warning">{currency(s.outstanding)} is still outstanding</p>
                    <p className="mt-0.5 text-[12px] text-ink-muted">
                      {nextDue.description} ({nextDue.term}) is due on {formatDate(nextDue.dueDate)}. Pay at the school
                      accounts office or by bank transfer, then keep your receipt.
                    </p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>
      )}

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={invoices}
          loading={loading}
          pageSize={8}
          rowKey={(r) => r._id}
          searchKeys={['invoiceNo', 'description', 'term']}
          searchPlaceholder="Search invoice or description…"
          filters={[{ key: 'status', label: 'Status', options: ['Paid', 'Pending', 'Overdue'] }]}
          exportConfig={{
            title: 'My Fee Invoices',
            filename: 'My fees',
            subtitle: profile?.name,
            columns: [
              { header: 'Invoice', value: (r) => r.invoiceNo },
              { header: 'Fee type', value: (r) => r.description },
              { header: 'Term', value: (r) => r.term },
              { header: 'Amount (PKR)', value: (r) => r.amount, align: 'right' },
              { header: 'Due date', value: (r) => formatDate(r.dueDate) },
              { header: 'Status', value: (r) => r.status },
              { header: 'Paid on', value: (r) => (r.paidAt ? formatDate(r.paidAt) : '') },
            ],
          }}
          emptyTitle="No invoices yet"
          emptyDescription="Your fee invoices will appear here once the office issues them."
        />
      </div>

      <Modal
        open={Boolean(receipt)}
        onClose={() => setReceipt(null)}
        title={receipt?.status === 'Paid' ? 'Payment receipt' : 'Invoice details'}
        subtitle={receipt?.invoiceNo}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setReceipt(null)}>
              Close
            </button>
            <button className="btn-primary" disabled={busy} onClick={() => download(() => feeReceiptPdf(receipt, profile))}>
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </>
        }
      >
        {receipt && (
          <div className="space-y-1">
            {[
              ['Invoice number', receipt.invoiceNo],
              ['Description', receipt.description],
              ['Term', receipt.term],
              ['Amount', currency(receipt.amount)],
              ['Due date', formatDate(receipt.dueDate)],
              ['Payment method', receipt.method],
              ...(receipt.paidAt ? [['Paid on', formatDate(receipt.paidAt)]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 border-b border-line py-2.5 last:border-0">
                <span className="text-[13px] text-ink-muted">{k}</span>
                <span className="text-[13px] font-semibold text-ink">{v}</span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 pt-3">
              <span className="text-[13px] text-ink-muted">Status</span>
              <Badge tone={toneFor(receipt.status)} dot>
                {receipt.status}
              </Badge>
            </div>
          </div>
        )}
      </Modal>

      <Toast message={toast} tone="danger" onDone={() => setToast('')} />
    </div>
  )
}
