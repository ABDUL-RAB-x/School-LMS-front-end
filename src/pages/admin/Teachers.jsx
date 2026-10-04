import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, GraduationCap, Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge, DataTable, Modal, PageHeader, Toast } from '../../components/ui/index.jsx'
import endpoints, { fetchAll } from '../../lib/api.js'
import useApi, { useMutation } from '../../lib/useApi.js'
import { initials, toneFor } from '../../lib/utils.js'

const PAGE_SIZE = 8

export default function AdminTeachers() {
  const navigate = useNavigate()
  const [query, setQuery] = useState({ search: '', filters: {}, page: 1 })
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState('')

  const { data, loading, error, refetch } = useApi(
    () =>
      endpoints.teachers.list({
        search: query.search,
        department: query.filters.department,
        status: query.filters.status,
        page: query.page,
        limit: PAGE_SIZE,
      }),
    [query.search, query.filters.department, query.filters.status, query.page],
  )

  const onQueryChange = useCallback((q) => {
    setQuery((prev) =>
      prev.search === q.search &&
      prev.page === q.page &&
      JSON.stringify(prev.filters) === JSON.stringify(q.filters)
        ? prev
        : q,
    )
  }, [])

  const remove = useMutation((id) => endpoints.teachers.remove(id), {
    onSuccess: (res) => {
      setToast(res.message)
      setConfirm(null)
      refetch()
    },
  })

  const columns = [
    {
      key: 'name',
      header: 'Teacher',
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-white">
            {initials(r.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{r.name}</p>
            <p className="truncate text-[12px] text-ink-muted">{r.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'staffId', header: 'Staff ID', render: (r) => <span className="font-mono text-[13px] text-ink-muted">{r.staffId}</span> },
    { key: 'subject', header: 'Subject', render: (r) => <span className="text-[13px]">{r.subject?.name ?? '—'}</span> },
    { key: 'department', header: 'Department', render: (r) => <span className="text-[13px] text-ink-muted">{r.department}</span> },
    {
      key: 'classes',
      header: 'Classes',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {(r.classes ?? []).slice(0, 2).map((c) => (
            <Badge key={c._id} tone="neutral">
              {c.name} · {c.section}
            </Badge>
          ))}
          {(r.classes?.length ?? 0) > 2 && <Badge tone="neutral">+{r.classes.length - 2}</Badge>}
          {(r.classes?.length ?? 0) === 0 && <span className="text-[13px] text-ink-faint">—</span>}
        </div>
      ),
    },
    {
      key: 'experience',
      header: 'Experience',
      align: 'center',
      render: (r) => <span className="text-[13px] font-semibold">{r.experience} yrs</span>,
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
              navigate(`/admin/teachers/${r._id}`)
            }}
            className="rounded-btn p-2 text-ink-faint transition-colors hover:bg-surface-muted hover:text-accent"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/admin/teachers/${r._id}/edit`)
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
        title="Manage Teachers"
        subtitle={total != null ? `${total} teaching staff` : 'Loading staff…'}
        actions={
          <Link to="/admin/teachers/new" className="btn-primary">
            <Plus className="h-4 w-4" />
            Add teacher
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
        searchPlaceholder="Search by name, subject or ID…"
        filters={[
          { key: 'department', label: 'Department', options: ['Sciences', 'Humanities', 'Technology', 'Arts'] },
          { key: 'status', label: 'Status', options: ['Active', 'On Leave', 'Inactive'] },
        ]}
        onRowClick={(r) => navigate(`/admin/teachers/${r._id}`)}
        exportConfig={{
          title: 'Teaching Staff',
          filename: 'Teachers',
          columns: [
            { header: 'Staff ID', value: (r) => r.staffId },
            { header: 'Name', value: (r) => r.name },
            { header: 'Email', value: (r) => r.email },
            { header: 'Phone', value: (r) => r.phone },
            { header: 'Subject', value: (r) => r.subject?.name },
            { header: 'Department', value: (r) => r.department },
            { header: 'Classes', value: (r) => (r.classes ?? []).map((c) => `${c.name} ${c.section}`).join('; ') },
            { header: 'Experience (yrs)', value: (r) => r.experience },
            { header: 'Status', value: (r) => r.status },
          ],
          getRows: ({ search, filters }) => fetchAll(endpoints.teachers.list, { search, ...filters }),
        }}
        emptyTitle="No teachers yet"
        emptyDescription="Add teaching staff to assign them to classes and subjects."
        emptyAction={
          <Link to="/admin/teachers/new" className="btn-primary">
            <Plus className="h-4 w-4" />
            Add teacher
          </Link>
        }
      />

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Remove teacher?"
        subtitle={confirm ? `${confirm.name} · ${confirm.staffId}` : ''}
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
            <GraduationCap className="h-5 w-5" />
          </span>
          <p className="text-sm text-ink-muted">
            This deletes the staff record and their login account, and clears them from any timetable slot. A teacher
            who is still a class teacher cannot be removed until that class is reassigned.
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
