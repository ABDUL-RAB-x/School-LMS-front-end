import { useState } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Pencil, Pin, Plus, Trash2 } from 'lucide-react'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  ExportMenu,
  Field,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  Select,
  Skeleton,
  Tabs,
  Textarea,
  Toast,
} from './ui/index.jsx'
import endpoints from '../lib/api.js'
import useApi, { useDebounced, useMutation } from '../lib/useApi.js'
import { useAuth } from '../context/AuthContext.jsx'
import { cx, formatDate, todayISO } from '../lib/utils.js'
import { fadeUp, hoverLift, stagger } from '../lib/motion.js'

const AUDIENCE_TONE = { All: 'accent', Students: 'info', Teachers: 'warning' }

// The notice board for every panel
export default function AnnouncementsBoard({ canCompose = false, title, subtitle }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [query, setQuery] = useState('')
  const search = useDebounced(query, 350)
  const [tab, setTab] = useState('all')
  const [editing, setEditing] = useState(null) // null | 'new' | announcement
  const [confirm, setConfirm] = useState(null)
  const [form, setForm] = useState({})
  const [toast, setToast] = useState('')

  const { data, loading, error, refetch } = useApi(
    () => endpoints.announcements.list({ search, pinned: tab === 'pinned' ? 'true' : undefined, limit: 100 }),
    [search, tab],
  )
  const rows = data?.data ?? []

  const canManage = (a) => isAdmin || (canCompose && String(a.createdBy) === String(user?.id))

  const save = useMutation(
    (body) => (editing === 'new' ? endpoints.announcements.create(body) : endpoints.announcements.update(editing._id, body)),
    {
      onSuccess: (res) => {
        setToast(res.message)
        setEditing(null)
        refetch()
      },
    },
  )

  const remove = useMutation((id) => endpoints.announcements.remove(id), {
    onSuccess: (res) => {
      setToast(res.message)
      setConfirm(null)
      refetch()
    },
  })

  const openNew = () => {
    setForm({ title: '', body: '', audience: isAdmin ? 'All' : 'Students', publishDate: todayISO(), pinned: false })
    save.setError(null)
    save.setFields({})
    setEditing('new')
  }

  const openEdit = (a) => {
    setForm({
      title: a.title,
      body: a.body,
      audience: a.audience,
      publishDate: a.publishDate ? new Date(a.publishDate).toISOString().slice(0, 10) : todayISO(),
      pinned: Boolean(a.pinned),
    })
    save.setError(null)
    save.setFields({})
    setEditing(a)
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  if (error) return <ErrorState error={error} onRetry={refetch} />

  return (
    <div>
      <PageHeader
        title={title || 'Announcements'}
        subtitle={subtitle || 'Notices published to the school notice board'}
        actions={
          canCompose && (
            <button className="btn-primary" onClick={openNew}>
              <Plus className="h-4 w-4" />
              New announcement
            </button>
          )
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={query} onChange={setQuery} placeholder="Search announcements…" className="sm:max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            tabs={[
              { key: 'all', label: 'All' },
              { key: 'pinned', label: 'Pinned' },
            ]}
            active={tab}
            onChange={setTab}
          />
          <ExportMenu
            title="Announcements"
            columns={[
              { header: 'Date', value: (a) => formatDate(a.publishDate) },
              { header: 'Audience', value: (a) => a.audience },
              { header: 'Title', value: (a) => a.title },
              { header: 'Message', value: (a) => a.body },
              { header: 'Posted by', value: (a) => a.author },
              { header: 'Pinned', value: (a) => (a.pinned ? 'Yes' : '') },
            ]}
            getRows={() => rows}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-3 h-5 w-2/3" />
              <Skeleton className="mt-3 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-4/5" />
            </Card>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={Megaphone}
            title={query ? 'No matching announcements' : 'No announcements yet'}
            description={query ? 'Try a different search term.' : 'New notices will appear here as they are published.'}
            action={
              canCompose &&
              !query && (
                <button className="btn-primary" onClick={openNew}>
                  <Plus className="h-4 w-4" />
                  New announcement
                </button>
              )
            }
          />
        </Card>
      ) : (
        <motion.div variants={stagger()} initial="hidden" animate="show" className="space-y-4">
          {rows.map((a) => (
            <motion.article
              key={a._id}
              variants={fadeUp}
              whileHover={hoverLift}
              className={cx('card p-6', a.pinned && 'border-l-[3px] border-l-accent')}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={AUDIENCE_TONE[a.audience]}>{a.audience}</Badge>
                {a.pinned && (
                  <Badge tone="warning">
                    <Pin className="h-3 w-3" />
                    Pinned
                  </Badge>
                )}
                <span className="text-[12px] text-ink-faint">{formatDate(a.publishDate)}</span>
                {canManage(a) && (
                  <div className="ml-auto flex gap-1">
                    <button
                      onClick={() => openEdit(a)}
                      className="rounded-btn p-2 text-ink-faint transition-colors hover:bg-surface-muted hover:text-info"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirm(a)}
                      className="rounded-btn p-2 text-ink-faint transition-colors hover:bg-red-50 hover:text-danger"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="mt-3 font-display text-[17px] font-semibold text-ink">{a.title}</h3>
              <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-ink-muted">{a.body}</p>
              <p className="mt-4 text-[12px] font-semibold text-ink-faint">Posted by {a.author}</p>
            </motion.article>
          ))}
        </motion.div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New announcement' : 'Edit announcement'}
        subtitle={isAdmin ? 'Publish a notice to the board' : 'Teachers publish notices to students'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditing(null)} disabled={save.busy}>
              Cancel
            </button>
            <button className="btn-primary" onClick={() => save.mutate(form)} disabled={save.busy}>
              {save.busy ? 'Saving…' : editing === 'new' ? 'Publish' : 'Save changes'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title" required error={save.fields.title}>
            <Input value={form.title ?? ''} onChange={set('title')} placeholder="e.g. Annual Sports Day — 17 September" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Audience" required error={save.fields.audience}>
              <Select value={form.audience ?? 'All'} onChange={set('audience')} disabled={!isAdmin}>
                {isAdmin && <option>All</option>}
                <option>Students</option>
                {isAdmin && <option>Teachers</option>}
              </Select>
            </Field>
            <Field label="Publish date" error={save.fields.publishDate}>
              <Input type="date" value={form.publishDate ?? ''} onChange={set('publishDate')} />
            </Field>
          </div>
          <Field label="Message" required error={save.fields.body}>
            <Textarea rows={5} value={form.body ?? ''} onChange={set('body')} placeholder="Write the notice…" />
          </Field>
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-muted">
            <input
              type="checkbox"
              checked={Boolean(form.pinned)}
              onChange={set('pinned')}
              className="h-4 w-4 rounded border-field accent-[#0F766E] focus:ring-accent/30"
            />
            Pin to the top of the board
          </label>
          {save.error && (
            <p className="rounded-btn border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-danger">{save.error}</p>
          )}
        </div>
      </Modal>

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Delete announcement?"
        subtitle={confirm?.title}
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
        <p className="text-sm text-ink-muted">The notice is removed from every board. This cannot be undone.</p>
        {remove.error && (
          <p className="mt-4 rounded-btn border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-danger">{remove.error}</p>
        )}
      </Modal>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
