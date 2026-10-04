import { currency, formatDate } from './utils.js'

// The PDF library is large: load it only when someone actually downloads
export const downloadDocumentPdf = (opts) => import('./export.js').then((m) => m.downloadDocumentPdf(opts))

// Ready-made PDF documents shared by the admin, teacher and student panels

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const className = (room) => (room?.name ? `${room.name} · Section ${room.section}` : '—')

function studentPairs(student) {
  return [
    ['Student', student?.name ?? '—'],
    ['Student ID', student?.studentId ?? '—'],
    ['Class', className(student?.classRoom)],
    ...(student?.roll ? [['Roll number', student.roll]] : []),
  ]
}

// One invoice: a receipt once paid, otherwise an invoice to pay
export function feeReceiptPdf(fee, student) {
  const paid = fee.status === 'Paid'
  return downloadDocumentPdf({
    filename: `${paid ? 'Receipt' : 'Invoice'} ${fee.invoiceNo}`,
    title: paid ? 'Fee Payment Receipt' : 'Fee Invoice',
    subtitle: fee.invoiceNo,
    sections: [
      { heading: 'Billed to', pairs: studentPairs(student ?? fee.student) },
      {
        heading: 'Invoice',
        pairs: [
          ['Invoice number', fee.invoiceNo],
          ['Fee type', fee.description],
          ['Term', fee.term],
          ['Amount (PKR)', currency(fee.amount)],
          ['Due date', formatDate(fee.dueDate)],
          ['Status', fee.status],
          ...(paid ? [['Paid on', formatDate(fee.paidAt)], ['Payment method', fee.method]] : []),
        ],
      },
    ],
    note: paid
      ? 'This receipt confirms the payment above was received. Please keep it for your records.'
      : 'Please pay this invoice by the due date at the school accounts office. Late payments may incur a surcharge.',
  })
}

// Every invoice for one student with totals
export function feeStatementPdf({ student, invoices, summary }) {
  return downloadDocumentPdf({
    filename: `Fee statement ${student?.studentId ?? ''}`.trim(),
    title: 'Fee Statement',
    subtitle: student?.name,
    sections: [
      { heading: 'Student', pairs: studentPairs(student) },
      {
        heading: 'Summary',
        pairs: [
          ['Total billed', currency(summary?.billed ?? 0)],
          ['Paid', currency(summary?.paid ?? 0)],
          ['Outstanding', currency(summary?.outstanding ?? 0)],
          ['Overdue', currency(summary?.overdue ?? 0)],
        ],
      },
      {
        heading: 'Invoices',
        columns: [
          { header: 'Invoice', value: (f) => f.invoiceNo },
          { header: 'Description', value: (f) => `${f.description} — ${f.term}` },
          { header: 'Amount', value: (f) => currency(f.amount), align: 'right' },
          { header: 'Due', value: (f) => formatDate(f.dueDate) },
          { header: 'Status', value: (f) => f.status },
          { header: 'Paid on', value: (f) => (f.paidAt ? formatDate(f.paidAt) : '—') },
        ],
        rows: invoices ?? [],
      },
    ],
  })
}

// Published results for one student
export function marksheetPdf({ student, results, average }) {
  return downloadDocumentPdf({
    filename: `Marksheet ${student?.studentId ?? ''}`.trim(),
    title: 'Statement of Marks',
    subtitle: student?.name,
    sections: [
      {
        heading: 'Student',
        pairs: [
          ...studentPairs(student),
          ['Assessments', String(results.length)],
          ['Overall average', average != null ? `${average}%` : '—'],
        ],
      },
      {
        heading: 'Results',
        columns: [
          { header: 'Subject', value: (r) => r.subject },
          { header: 'Examination', value: (r) => r.exam },
          { header: 'Date', value: (r) => formatDate(r.date) },
          { header: 'Marks', value: (r) => `${r.marks} / ${r.maxMarks}`, align: 'center' },
          { header: 'Percent', value: (r) => `${r.percent}%`, align: 'center' },
          { header: 'Grade', value: (r) => r.grade, align: 'center' },
        ],
        rows: results,
      },
    ],
    note: 'Grades: A+ 90%+, A 80%+, A- 75%+, B+ 70%+, B 60%+, C 50%+, D 40%+, F below 40%.',
  })
}

// A student's attendance log with totals
export function attendanceReportPdf({ student, log, totals, rate }) {
  return downloadDocumentPdf({
    filename: `Attendance ${student?.studentId ?? ''}`.trim(),
    title: 'Attendance Report',
    subtitle: student?.name,
    sections: [
      {
        heading: 'Summary',
        pairs: [
          ...studentPairs(student),
          ['Attendance rate', rate != null ? `${rate}%` : '—'],
          ['Present', String(totals?.present ?? 0)],
          ['Late', String(totals?.late ?? 0)],
          ['Absent', String(totals?.absent ?? 0)],
        ],
      },
      {
        heading: 'Register entries',
        columns: [
          { header: 'Date', value: (r) => formatDate(r.date) },
          { header: 'Period', value: (r) => r.period, align: 'center' },
          { header: 'Subject', value: (r) => r.subject },
          { header: 'Status', value: (r) => r.status },
          { header: 'Remark', value: (r) => r.remark },
        ],
        rows: log ?? [],
      },
    ],
  })
}

// A weekly timetable as a period × day grid
export function timetablePdf({ title, subtitle, grid, showClass = false }) {
  const periods = new Map()
  DAYS.forEach((d) =>
    (grid?.[d] ?? []).forEach((s) => {
      if (!periods.has(s.period)) periods.set(s.period, s.time)
    }),
  )
  const order = [...periods.keys()].sort((a, b) => a - b)

  const slotText = (s) => {
    if (s.free) return s.subject
    const who = showClass ? s.classRoom : s.teacher
    return [s.subject, who, s.room].filter((x) => x && x !== '—').join('\n')
  }
  const cellText = (day, p) =>
    (grid?.[day] ?? [])
      .filter((s) => s.period === p)
      .map(slotText)
      .join('\n\n')

  return downloadDocumentPdf({
    filename: title,
    title,
    subtitle,
    landscape: true,
    sections: [
      {
        columns: [
          { header: 'Period', value: (p) => `P${p}\n${periods.get(p) ?? ''}` },
          ...DAYS.map((d) => ({ header: d, value: (p) => cellText(d, p) })),
        ],
        rows: order,
      },
    ],
  })
}
