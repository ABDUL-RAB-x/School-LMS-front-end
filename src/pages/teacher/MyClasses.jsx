import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DoorOpen, UserRound, Users } from 'lucide-react'
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardSkeleton,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  ProgressBar,
  SearchInput,
  Tabs,
} from '../../components/ui/index.jsx'
import endpoints, { fetchAll } from '../../lib/api.js'
import useApi from '../../lib/useApi.js'
import { fadeUp, hoverLift, stagger } from '../../lib/motion.js'
import { initials } from '../../lib/utils.js'

export default function TeacherMyClasses() {
  const { data, loading, error, refetch } = useApi(() => endpoints.teachers.myClasses(), [])
  const [query, setQuery] = useState('')
  const [view, setView] = useState('grid')
  const [selectedId, setSelectedId] = useState(null)

  const classes = data?.data ?? []
  const selected = classes.find((c) => c._id === selectedId) ?? classes[0]

  const roster = useApi(
    () => fetchAll(endpoints.students.list, { classRoom: selected?._id, status: 'Active' }),
    [selected?._id],
    { skip: view !== 'roster' || !selected },
  )

  if (error) return <ErrorState error={error} onRetry={refetch} />

  const q = query.trim().toLowerCase()
  const rows = q ? classes.filter((c) => `${c.label} ${c.room}`.toLowerCase().includes(q)) : classes
  const totalStudents = classes.reduce((s, c) => s + (c.students ?? 0), 0)

  const rosterColumns = [
    { key: 'roll', header: 'Roll', align: 'center', render: (r) => <span className="font-mono text-[13px] text-ink-muted">{r.roll}</span> },
    {
      key: 'name',
      header: 'Student',
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
            {initials(r.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{r.name}</p>
            <p className="truncate text-[12px] text-ink-muted">{r.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'studentId', header: 'Student ID', render: (r) => <span className="font-mono text-[13px] text-ink-muted">{r.studentId}</span> },
    {
      key: 'guardian',
      header: 'Guardian',
      render: (r) => (
        <div className="text-[13px]">
          <p className="text-ink">{r.guardian?.name || '—'}</p>
          <p className="text-[12px] text-ink-muted">{r.guardian?.phone || ''}</p>
        </div>
      ),
    },
    {
      key: 'attendance',
      header: 'Attendance',
      render: (r) =>
        r.attendance == null ? (
          <span className="text-[13px] text-ink-faint">—</span>
        ) : (
          <div className="flex min-w-[8rem] items-center gap-3">
            <ProgressBar value={r.attendance} height="h-1.5" color={r.attendance >= 90 ? '#0F766E' : r.attendance >= 75 ? '#D97706' : '#DC2626'} />
            <span className="w-10 shrink-0 text-right text-[13px] font-semibold">{r.attendance}%</span>
          </div>
        ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="My Classes"
        subtitle={loading ? 'Loading…' : `${classes.length} section${classes.length === 1 ? '' : 's'} · ${totalStudents} students`}
      >
        <Tabs
          tabs={[
            { key: 'grid', label: 'Classes' },
            { key: 'roster', label: 'Roster' },
          ]}
          active={view}
          onChange={setView}
        />
      </PageHeader>

      {view === 'grid' ? (
        <>
          <SearchInput value={query} onChange={setQuery} placeholder="Search class or room…" className="mb-5 sm:max-w-sm" />

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <Card>
              <EmptyState
                title={q ? 'No classes match your search' : 'No classes assigned yet'}
                description={q ? 'Try a different class or room.' : 'The office assigns teachers to classes.'}
              />
            </Card>
          ) : (
            <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((c) => (
                <motion.div
                  key={c._id}
                  variants={fadeUp}
                  whileHover={hoverLift}
                  onClick={() => {
                    setSelectedId(c._id)
                    setView('roster')
                  }}
                  className="card cursor-pointer p-5 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-[17px] font-semibold text-ink">{c.label}</p>
                      <p className="mt-0.5 text-[13px] text-ink-muted">{c.session}</p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-item bg-accent-soft text-accent">
                      <Users className="h-4.5 w-4.5" />
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge tone="neutral">
                      <Users className="h-3 w-3" />
                      {c.students} students
                    </Badge>
                    {c.room && (
                      <Badge tone="neutral">
                        <DoorOpen className="h-3 w-3" />
                        Room {c.room}
                      </Badge>
                    )}
                    {c.classTeacher?.name && (
                      <Badge tone="accent">
                        <UserRound className="h-3 w-3" />
                        {c.classTeacher.name}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-5">
                    <div className="mb-1.5 flex items-center justify-between text-[12px]">
                      <span className="text-ink-muted">Attendance to date</span>
                      <span className="font-semibold text-ink">{c.attendance != null ? `${c.attendance}%` : '—'}</span>
                    </div>
                    <ProgressBar value={c.attendance ?? 0} height="h-1.5" color="#2563EB" />
                  </div>

                  <div className="mt-5 flex gap-2">
                    <Link to="/teacher/attendance" onClick={(e) => e.stopPropagation()} className="btn-secondary h-9 flex-1 !px-2 text-[13px]">
                      Attendance
                    </Link>
                    <Link to="/teacher/marks" onClick={(e) => e.stopPropagation()} className="btn-primary h-9 flex-1 !px-2 text-[13px]">
                      Enter marks
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      ) : !selected ? (
        <Card>
          <EmptyState title="No classes assigned yet" description="The office assigns teachers to classes." />
        </Card>
      ) : (
        <Card>
          <CardHeader
            title={`${selected.label} — roster`}
            subtitle={`${selected.students} students${selected.room ? ` · Room ${selected.room}` : ''}`}
            action={
              classes.length > 1 && (
                <select
                  value={selected._id}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="h-10 rounded-input border border-field bg-white px-3 text-[13px] font-medium text-ink"
                >
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )
            }
          />
          <CardBody className="px-0 pb-0 pt-2">
            <DataTable
              columns={rosterColumns}
              rows={roster.data ?? []}
              loading={roster.loading}
              error={roster.error}
              onRetry={roster.refetch}
              pageSize={10}
              rowKey={(r) => r._id}
              searchKeys={['name', 'studentId', 'roll', 'email']}
              searchPlaceholder="Search student by name or ID…"
              exportConfig={{
                title: `Class Roster — ${selected.label}`,
                filename: `Roster ${selected.label}`,
                columns: [
                  { header: 'Roll', value: (r) => r.roll, align: 'center' },
                  { header: 'Student ID', value: (r) => r.studentId },
                  { header: 'Name', value: (r) => r.name },
                  { header: 'Email', value: (r) => r.email },
                  { header: 'Guardian', value: (r) => r.guardian?.name },
                  { header: 'Guardian phone', value: (r) => r.guardian?.phone },
                  { header: 'Attendance', value: (r) => (r.attendance == null ? '' : `${r.attendance}%`), align: 'center' },
                ],
              }}
              emptyTitle="No students in this class"
              emptyDescription="Students appear here once the office assigns them."
            />
          </CardBody>
        </Card>
      )}
    </div>
  )
}
