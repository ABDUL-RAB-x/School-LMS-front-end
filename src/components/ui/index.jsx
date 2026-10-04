import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Inbox,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import { cx, initials } from '../../lib/utils.js'
import { fadeUp, hoverLift, stagger } from '../../lib/motion.js'
import { useDebounced } from '../../lib/useApi.js'

// Card
export function Card({ className, children, lift = false, ...rest }) {
  const Comp = lift ? motion.div : 'div'
  const liftProps = lift ? { whileHover: hoverLift } : {}
  return (
    <Comp className={cx('card', className)} {...liftProps} {...rest}>
      {children}
    </Comp>
  )
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cx('flex items-start justify-between gap-4 px-6 pt-5', className)}>
      <div className="min-w-0">
        <h3 className="font-display text-[15px] font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[13px] text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function CardBody({ className, children }) {
  return <div className={cx('px-6 pb-6 pt-4', className)}>{children}</div>
}

// Page header
export function PageHeader({ title, subtitle, actions, children }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {(actions || children) && <div className="flex flex-wrap items-center gap-2">{actions || children}</div>}
    </motion.div>
  )
}

// Badge
const TONES = {
  success: 'bg-green-50 text-success ring-1 ring-inset ring-green-100',
  warning: 'bg-amber-50 text-warning ring-1 ring-inset ring-amber-100',
  danger: 'bg-red-50 text-danger ring-1 ring-inset ring-red-100',
  info: 'bg-blue-50 text-info ring-1 ring-inset ring-blue-100',
  accent: 'bg-accent-soft text-accent ring-1 ring-inset ring-teal-100',
  neutral: 'bg-slate-100 text-ink-muted ring-1 ring-inset ring-slate-200',
}

export function Badge({ tone = 'neutral', children, className, dot = false }) {
  return (
    <span className={cx('chip', TONES[tone] || TONES.neutral, className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

// Avatar
export function Avatar({ name, size = 'md', className }) {
  const sizes = {
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-10 w-10 text-xs',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-xl',
  }
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-white',
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}

// Form controls
export function Field({ label, hint, error, required, children, className }) {
  return (
    <div className={className}>
      {label && (
        <label className="field-label">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-[12px] font-medium text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-[12px] text-ink-muted">{hint}</p>
      )}
    </div>
  )
}

export function Input({ className, ...rest }) {
  return <input className={cx('field', className)} {...rest} />
}

export function Select({ className, children, ...rest }) {
  return (
    <select className={cx('select-field', className)} {...rest}>
      {children}
    </select>
  )
}

export function Textarea({ className, rows = 4, ...rest }) {
  return (
    <textarea
      rows={rows}
      className={cx(
        'w-full rounded-input border border-field bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint',
        'transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15',
        className,
      )}
      {...rest}
    />
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }) {
  return (
    <div className={cx('relative', className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field pl-11"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-faint hover:bg-surface-muted hover:text-ink"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// Empty / loading states
export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className={cx('flex flex-col items-center justify-center px-6 py-16 text-center', className)}
    >
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-card bg-surface-muted ring-1 ring-line">
        <Icon className="h-6 w-6 text-ink-faint" />
      </span>
      <h4 className="font-display text-[15px] font-semibold text-ink">{title}</h4>
      {description && <p className="mt-1 max-w-sm text-[13px] text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  )
}

export function Skeleton({ className }) {
  return <div className={cx('animate-pulse rounded-lg bg-slate-200/70', className)} />
}

function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-6 py-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cx('h-4', c === 0 ? 'w-40' : 'w-24')} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ className }) {
  return (
    <div className={cx('card p-6', className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-8 w-32" />
      <Skeleton className="mt-3 h-3 w-20" />
    </div>
  )
}

// Progress
export function ProgressBar({ value, color = '#0F766E', className, height = 'h-2' }) {
  return (
    <div className={cx('w-full overflow-hidden rounded-full bg-slate-100', height, className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  )
}

// Modal
export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary-dark/40"
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={cx(
              'relative max-h-[88vh] w-full overflow-hidden rounded-card border border-line bg-white shadow-lift',
              widths[size],
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
                {subtitle && <p className="mt-0.5 text-[13px] text-ink-muted">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="rounded-btn p-2 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="scrollbar-thin max-h-[62vh] overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-line bg-surface-muted px-6 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// Toast
export function Toast({ message, tone = 'success', onDone }) {
  useEffect(() => {
    if (!message) return undefined
    const t = setTimeout(() => onDone?.(), 2600)
    return () => clearTimeout(t)
  }, [message, onDone])

  const tones = {
    success: 'border-green-200 bg-white text-success',
    danger: 'border-red-200 bg-white text-danger',
    info: 'border-blue-200 bg-white text-info',
  }

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={cx(
            'fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-btn border px-5 py-3 text-sm font-semibold shadow-lift',
            tones[tone],
          )}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ExportMenu: "Export" button offering Excel
export function ExportMenu({ filename, title, subtitle, columns, getRows, summary, landscape, stamp = true, label = 'Export', className }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const run = async (format) => {
    setOpen(false)
    setBusy(true)
    try {
      const { downloadCsv, downloadTablePdf } = await import('../../lib/export.js')
      const rows = await getRows()
      const sum = typeof summary === 'function' ? summary(rows) : summary
      if (format === 'csv') downloadCsv({ filename: filename || title, columns, rows, stamp })
      else await downloadTablePdf({ filename: filename || title, title, subtitle, columns, rows, summary: sum, landscape, stamp })
    } catch (err) {
      setError(err.message || 'The export failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div ref={ref} className={cx('relative', className)}>
      <button type="button" className="btn-secondary h-[42px]" onClick={() => setOpen((o) => !o)} disabled={busy}>
        {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {busy ? 'Preparing…' : label}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-item border border-line bg-white py-1 shadow-lift"
          >
            <button
              type="button"
              onClick={() => run('csv')}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-ink hover:bg-surface-muted"
            >
              <FileSpreadsheet className="h-4 w-4 text-success" />
              Excel (CSV)
            </button>
            <button
              type="button"
              onClick={() => run('pdf')}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-ink hover:bg-surface-muted"
            >
              <FileText className="h-4 w-4 text-danger" />
              PDF document
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <Toast message={error} tone="danger" onDone={() => setError('')} />
    </div>
  )
}

// Tabs
export function Tabs({ tabs, active, onChange, className }) {
  return (
    <div className={cx('inline-flex rounded-item border border-line bg-white p-1', className)}>
      {tabs.map((t) => {
        const key = typeof t === 'string' ? t : t.key
        const label = typeof t === 'string' ? t : t.label
        const isActive = key === active
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cx(
              'relative rounded-[10px] px-3.5 py-2 text-[13px] font-semibold transition-colors duration-200',
              isActive ? 'text-white' : 'text-ink-muted hover:text-ink',
            )}
          >
            {isActive && (
              <motion.span
                layoutId={`tab-${tabs.map((x) => (typeof x === 'string' ? x : x.key)).join('')}`}
                className="absolute inset-0 rounded-[10px] bg-accent"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

// DataTable: sticky header, zebra rows, rounded container
export function DataTable({
  columns,
  rows,
  loading = false,
  pageSize = 8,
  searchKeys,
  searchPlaceholder = 'Search…',
  filters = [],
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'Records will appear once they are added.',
  emptyAction,
  toolbarExtra,
  rowKey = (r, i) => r.id ?? r._id ?? i,
  onRowClick,
  remote = false,
  pagination: serverPagination,
  onQueryChange,
  error,
  onRetry,
  // exportConfig: { title, columns, getRows? }; remote tables must pass getRows
  exportConfig,
  initialSearch = '',
}) {
  const [query, setQuery] = useState(initialSearch)
  // A new search handed in from outside (e.g. the top bar) replaces the box's contents
  useEffect(() => {
    setQuery(initialSearch)
  }, [initialSearch])
  const [filterValues, setFilterValues] = useState(() =>
    Object.fromEntries(filters.map((f) => [f.key, 'all'])),
  )
  const [page, setPage] = useState(1)

  const debouncedQuery = useDebounced(query, 350)
  const keys = searchKeys || columns.map((c) => c.key)
  const isFiltered = Boolean(query) || Object.values(filterValues).some((v) => v !== 'all')

  // Any change to the search box or a filter starts again from page 1
  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, filterValues])

  // Remote mode: hand the query up so the caller can refetch
  const queryRef = useRef(onQueryChange)
  queryRef.current = onQueryChange
  useEffect(() => {
    if (!remote) return
    queryRef.current?.({ search: debouncedQuery, filters: filterValues, page })
  }, [remote, debouncedQuery, filterValues, page])

  const localFiltered = useMemo(() => {
    if (remote) return rows
    let out = rows
    const q = query.trim().toLowerCase()
    if (q) out = out.filter((r) => keys.some((k) => String(r[k] ?? '').toLowerCase().includes(q)))
    filters.forEach((f) => {
      const v = filterValues[f.key]
      if (v && v !== 'all') out = out.filter((r) => String(r[f.key]) === v)
    })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote, rows, query, filterValues])

  const totalPages = remote
    ? serverPagination?.pages ?? 1
    : Math.max(1, Math.ceil(localFiltered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = remote ? rows : localFiltered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const total = remote ? serverPagination?.total ?? rows.length : localFiltered.length
  const limit = remote ? serverPagination?.limit ?? pageSize : pageSize
  const from = total === 0 ? 0 : (safePage - 1) * limit + 1
  const to = Math.min(safePage * limit, total)

  const hasToolbar = searchKeys !== null || filters.length > 0 || toolbarExtra || exportConfig

  const exportRows = () => {
    if (exportConfig?.getRows) {
      const activeFilters = Object.fromEntries(Object.entries(filterValues).filter(([, v]) => v !== 'all'))
      return exportConfig.getRows({ search: debouncedQuery, filters: activeFilters })
    }
    return localFiltered
  }

  return (
    <div className="table-wrap">
      {hasToolbar && (
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={searchPlaceholder}
            className="w-full lg:max-w-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((f) => (
              <Select
                key={f.key}
                value={filterValues[f.key]}
                onChange={(e) => setFilterValues((s) => ({ ...s, [f.key]: e.target.value }))}
                className="h-[42px] w-auto min-w-[9.5rem] py-0 text-[13px]"
              >
                <option value="all">{f.label}: All</option>
                {f.options.map((o) => (
                  <option key={o.value ?? o} value={o.value ?? o}>
                    {o.label ?? o}
                  </option>
                ))}
              </Select>
            ))}
            {toolbarExtra}
            {exportConfig && <ExportMenu {...exportConfig} getRows={exportRows} />}
          </div>
        </div>
      )}

      {error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Could not load this list"
          description={error.message || String(error)}
          action={
            onRetry && (
              <button className="btn-secondary" onClick={onRetry}>
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            )
          }
        />
      ) : loading ? (
        <TableSkeleton rows={Math.min(pageSize, 8)} cols={columns.length} />
      ) : pageRows.length === 0 ? (
        <EmptyState
          title={isFiltered ? 'No matching records' : emptyTitle}
          description={isFiltered ? 'Try adjusting your search terms or filters.' : emptyDescription}
          action={isFiltered ? null : emptyAction}
        />
      ) : (
        <div className="scrollbar-thin max-h-[62vh] overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface-muted">
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={cx(
                      'whitespace-nowrap border-b border-line px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-ink-muted',
                      c.align === 'right' && 'text-right',
                      c.align === 'center' && 'text-center',
                      c.className,
                    )}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <motion.tbody variants={stagger(0, 0.025)} initial="hidden" animate="show">
              {pageRows.map((row, i) => (
                <motion.tr
                  key={rowKey(row, i)}
                  variants={fadeUp}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cx(
                    'border-b border-line/70 transition-colors last:border-0',
                    i % 2 === 1 && 'bg-surface-muted/60',
                    onRowClick && 'cursor-pointer',
                    'hover:bg-accent-soft/70',
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cx(
                        'px-5 py-3.5 align-middle text-ink',
                        c.align === 'right' && 'text-right',
                        c.align === 'center' && 'text-center',
                        c.cellClassName,
                      )}
                    >
                      {c.render ? c.render(row, (safePage - 1) * limit + i) : row[c.key]}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      )}

      {!loading && !error && total > 0 && (
        <div className="flex flex-col gap-3 border-t border-line px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-ink-muted">
            Showing <span className="font-semibold text-ink">{from}</span>–
            <span className="font-semibold text-ink">{to}</span> of{' '}
            <span className="font-semibold text-ink">{total}</span>
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="btn-ghost h-9 w-9 !px-0 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages })
              .slice(0, 6)
              .map((_, idx) => {
                const n = idx + 1
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={cx(
                      'h-9 min-w-[2.25rem] rounded-btn px-2 text-[13px] font-semibold transition-colors',
                      n === safePage ? 'bg-accent text-white' : 'text-ink-muted hover:bg-surface-muted',
                    )}
                  >
                    {n}
                  </button>
                )
              })}
            {totalPages > 6 && <span className="px-1 text-[13px] text-ink-faint">…</span>}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="btn-ghost h-9 w-9 !px-0 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ErrorState: a page-level failure with a retry
export function ErrorState({ error, onRetry, className }) {
  return (
    <Card className={className}>
      <EmptyState
        icon={AlertTriangle}
        title="Something went wrong"
        description={error?.message || 'The request failed. Please try again.'}
        action={
          onRetry && (
            <button className="btn-secondary" onClick={onRetry}>
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          )
        }
      />
    </Card>
  )
}
