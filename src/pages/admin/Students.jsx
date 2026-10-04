import { useCallback, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { Badge, DataTable, Modal, PageHeader, Toast } from '../../components/ui/index.jsx'
import endpoints, { fetchAll } from '../../lib/api.js'
import useApi, { useMutation } from '../../lib/useApi.js'
import { initials, toneFor } from '../../lib/utils.js'

const PAGE_SIZE = 8

export default function AdminStudents() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState({ search: searchParams.get('search') ?? '', filters: {}, page: 1 })
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState('')

  // Search, filters and pagination all happen server-side
  const { data, loading, error, refetch } = useApi(
    () =>
      endpoints.students.list({
        search: query.search,
        className: query.filters.className,
        section: query.filters.section,
        status: query.filters.status,
        page: query.page,
        limit: PAGE_SIZE,
      }),
    [query.search, query.filters.className, query.filters.section, query.filters.status, query.page],
  )

  const { data: classData } = useApi(() => endpoints.classes.list(), [])
  const classes = classData?.data ?? []
  const grades = [...new Set(classes.map((c) => c.name))]
  const sections = [...new Set(classes.map((c) => c.section))]

  const onQueryChange = useCallback((q) => {
    setQuery((prev) =>
      prev.search === q.search &&
      prev.page === q.page &&
      JSON.stringify(prev.filters) === JSON.stringify(q.filters)
        ? prev
        : q,
    )
  }, [])

  const remove = useMutation((id) => endpoints.students.remove(id), {
    onSuccess: (res) => {
      setToast(res.message)
      setConfirm(null)
      refetch()
    },
  })

  const columns = [
    {
      key: 'name',
      header: 'Student',
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">
            {initials(r.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{r.name}</p>
            <p className="truncate text-[12px] text-ink-muted">{r.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'studentId',
      header: 'Student ID',
      render: (r) => <span className="font-mono text-[13px] text-ink-muted">{r.studentId}</span>,
    },
    {
      key: 'classRoom',
      header: 'Class',
      render: (r) => (
        <span className="text-[13px] font-medium text-ink">
          {r.classRoom ? `${r.classRoom.name} · ${r.classRoom.section}` : '—'}
        </span>
      ),
    },
    {
      key: 'guardian',
      header: 'Guardian',
      render: (r) => <span className="text-[13px] text-ink-muted">{r.guardian?.name || '—'}</span>,
    },
    {
      key: 'attendance',
      header: 'Attendance',
      align: 'center',
      render: (r) =>
        r.attendance == null ? (
          <span className="text-[13px] text-ink-faint">—</span>
        ) : (
          <span
            className={
              r.attendance >= 90
                ? 'font-semibold text-success'
                : r.attendance >= 80
                  ? 'font-semibold text-warning'
                  : 'font-semibold text-danger'
            }
          >
            {r.attendance}%
          </span>
        ),
    },
    {
      key: 'feeStatus',
      header: 'Fees',
      align: 'center',
      render: (r) => <Badge tone={toneFor(r.feeStatus)}>{r.feeStatus}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (r) => (
        <Badge tone={toneFor(r.status)} dot>
          {r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/admin/students/${r._id}`)
            }}
            className="rounded-btn p-2 text-ink-faint transition-colors hover:bg-surface-muted hover:text-accent"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/admin/students/${r._id}/edit`)
            }}
            className="rounded-btn p-2 text-ink-faint transition-colors hover:bg-surface-muted hover:text-info"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setConfirm(r)
            }}
            className="rounded-btn p-2 text-ink-faint transition-colors hover:bg-red-50 hover:text-danger"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const total = data?.pagination?.total

  return (
    <div>
      <PageHeader
        title="Manage Students"
        subtitle={total != null ? `${total} students on the roll` : 'Loading the roll…'}
        actions={
          <Link to="/admin/students/new" className="btn-primary">
            <Plus className="h-4 w-4" />
            Add student
          </Link>
        }
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
        searchKeys={['name']}
        initialSearch={searchParams.get('search') ?? ''}
        searchPlaceholder="Search by name, email or ID…"
        filters={[
          { key: 'className', label: 'Class', options: grades },
          { key: 'section', label: 'Section', options: sections },
          { key: 'status', label: 'Status', options: ['Active', 'Inactive'] },
        ]}
        onRowClick={(r) => navigate(`/admin/students/${r._id}`)}
        exportConfig={{
          title: 'Student Roll',
          filename: 'Students',
          columns: [
            { header: 'Student ID', value: (r) => r.studentId },
            { header: 'Name', value: (r) => r.name },
            { header: 'Class', value: (r) => (r.classRoom ? `${r.classRoom.name} ${r.classRoom.section}` : '') },
            { header: 'Roll', value: (r) => r.roll },
            { header: 'Email', value: (r) => r.email },
            { header: 'Phone', value: (r) => r.phone },
            { header: 'Guardian', value: (r) => r.guardian?.name },
            { header: 'Guardian phone', value: (r) => r.guardian?.phone },
            { header: 'Attendance', value: (r) => (r.attendance == null ? '' : `${r.attendance}%`) },
            { header: 'Fees', value: (r) => r.feeStatus },
            { header: 'Status', value: (r) => r.status },
          ],
          getRows: ({ search, filters }) => fetchAll(endpoints.students.list, { search, ...filters }),
        }}
        emptyTitle="No students yet"
        emptyDescription="Add your first student to start building the roll."
        emptyAction={
          <Link to="/admin/students/new" className="btn-primary">
            <Plus className="h-4 w-4" />
            Add student
          </Link>
        }
      />

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Remove student?"
        subtitle={confirm ? `${confirm.name} · ${confirm.studentId}` : ''}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setConfirm(null)} disabled={remove.busy}>
              Cancel
            </button>
            <button className="btn-danger" onClick={() => remove.mutate(confirm._id)} disabled={remove.busy}>
              <Trash2 className="h-4 w-4" />
              {remove.busy ? 'Removing…' : 'Remove'}
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-item bg-red-50 text-danger">
            <Users className="h-5 w-5" />
          </span>
          <p className="text-sm text-ink-muted">
            This permanently deletes the student along with their results, invoices, attendance records and login
            account. This cannot be undone.
          </p>
        </div>
        {remove.error && (
          <p className="mt-4 rounded-btn border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-danger">
            {remove.error}
          </p>
        )}
      </Modal>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
