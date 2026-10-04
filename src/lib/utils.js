export function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Today's date as yyyy-mm-dd in the user's own time zone (toISOString would give UTC)
export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Every amount in the system is Pakistani Rupees: "Rs 12,500"
export function currency(n) {
  return `Rs ${Math.round(Number(n) || 0).toLocaleString('en-US')}`
}

// Status -> visual tone used by <Badge tone="..." />
const STATUS_TONE = {
  Active: 'success',
  Inactive: 'neutral',
  'On Leave': 'warning',
  Paid: 'success',
  Pending: 'warning',
  Overdue: 'danger',
  Present: 'success',
  Absent: 'danger',
  Late: 'warning',
  Enrolled: 'success',
  'Pending docs': 'warning',
  Open: 'info',
  Grading: 'warning',
  Graded: 'success',
  Draft: 'neutral',
  Scheduled: 'info',
  'Results published': 'success',
  Upcoming: 'info',
  Completed: 'success',
  Submitted: 'info',
}

export function toneFor(status) {
  return STATUS_TONE[status] || 'neutral'
}
