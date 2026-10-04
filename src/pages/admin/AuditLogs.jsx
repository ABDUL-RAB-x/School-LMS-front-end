import { useCallback, useState } from 'react'
import { Badge, DataTable, Input, PageHeader } from '../../components/ui/index.jsx'
import endpoints, { fetchAll } from '../../lib/api.js'
import useApi from '../../lib/useApi.js'

const PAGE_SIZE = 25

const EVENT_GROUPS = [
  { value: 'login', label: 'Sign-ins' },
  { value: 'logout', label: 'Sign-outs' },
  { value: 'password', label: 'Passwords' },
  { value: 'account', label: 'Lockouts' },
  { value: 'session', label: 'Sessions' },
  { value: 'students', label: 'Students' },
  { value: 'teachers', label: 'Teachers' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'results', label: 'Results' },
  { value: 'fees', label: 'Fees' },
  { value: 'settings', label: 'Settings' },
]

const when = (iso) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })

// Admin › Audit Log: who did what, when and from where
export default function AdminAuditLogs() {
  const [query, setQuery] = useState({ search: '', filters: {}, page: 1 })
  const [range, setRange] = useState({ from: '', to: '' })

  const { data, loading, error, refetch } = useApi(
    () =>
      endpoints.auditLogs.list({
        search: query.search,
        event: query.filters.event,
        status: query.filters.status,
        from: range.from,
        to: range.to,
        page: query.page,
        limit: PAGE_SIZE,
      }),
    [query.search, query.filters.event, query.filters.status, query.page, range.from, range.to],
  )

  const onQueryChange = useCallback((q) => {
    setQuery((prev) =>
      prev.search === q.search && prev.page === q.page && JSON.stringify(prev.filters) === JSON.stringify(q.filters) ? prev : q,
    )
  }, [])

  const columns = [
    {
      key: 'createdAt',
      header: 'Time',
      render: (r) => <span className="whitespace-nowrap text-[13px] text-ink-muted">{when(r.createdAt)}</span>,
    },
    {
      key: 'event',
      header: 'Event',
      render: (r) => <span className="font-mono text-[12px] text-ink">{r.event}</span>,
    },
    {
      key: 'email',
      header: 'User',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink">{r.email || '—'}</p>
          {r.role && <p className="text-[11px] capitalize text-ink-muted">{r.role}</p>}
        </div>
      ),
    },
    {
      key: 'detail',
      header: 'Detail',
      render: (r) => <span className="text-[12px] text-ink-muted">{r.detail || '—'}</span>,
    },
    {
      key: 'ip',
      header: 'IP address',
      render: (r) => <span className="font-mono text-[12px] text-ink-muted">{r.ip || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Result',
      align: 'center',
      render: (r) => (
        <Badge tone={r.status === 'failure' ? 'danger' : 'success'} dot>
          {r.status === 'failure' ? 'Failed' : 'OK'}
        </Badge>
      ),
    },
  ]

  const total = data?.pagination?.total

  return (
    <div>
      <PageHeader
        title="Audit Log"
        subtitle={total != null ? `${total} recorded events · newest first` : 'Loading events…'}
      />

      <DataTable
        remote
        columns={columns}
        rows={data?.data ?? []}
        pagination={data?.pagination}
        loading={loading}
        error={error}
        onRetry={refetch}
        onQueryChange={onQueryChange}
        pageSize={PAGE_SIZE}
        rowKey={(r) => r._id}
        searchPlaceholder="Search by email, event or detail…"
        filters={[
          { key: 'event', label: 'Type', options: EVENT_GROUPS },
          { key: 'status', label: 'Result', options: [{ value: 'success', label: 'OK' }, { value: 'failure', label: 'Failed' }] },
        ]}
        toolbarExtra={
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="audit-from">From date</label>
            <Input
              id="audit-from"
              type="date"
              value={range.from}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className="h-[42px] w-auto py-0 text-[13px]"
            />
            <span className="text-[13px] text-ink-faint">to</span>
            <label className="sr-only" htmlFor="audit-to">To date</label>
            <Input
              id="audit-to"
              type="date"
              value={range.to}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className="h-[42px] w-auto py-0 text-[13px]"
            />
          </div>
        }
        exportConfig={{
          title: 'Audit Log',
          filename: 'Audit log',
          landscape: true,
          columns: [
            { header: 'Time', value: (r) => when(r.createdAt) },
            { header: 'Event', value: (r) => r.event },
            { header: 'User', value: (r) => r.email },
            { header: 'Role', value: (r) => r.role },
            { header: 'Detail', value: (r) => r.detail },
            { header: 'IP address', value: (r) => r.ip },
            { header: 'Result', value: (r) => (r.status === 'failure' ? 'Failed' : 'OK') },
          ],
          getRows: ({ search, filters }) =>
            fetchAll(endpoints.auditLogs.list, { search, ...filters, from: range.from, to: range.to }),
        }}
        emptyTitle="No events yet"
        emptyDescription="Sign-ins and changes made through the system will appear here."
      />
    </div>
  )
}
