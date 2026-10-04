import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { schoolInfo } from './school.js'
import { todayISO } from './utils.js'

// File exports: CSV (opens in Excel) and PDF (tables, receipts, reports)

const ACCENT = [15, 118, 110]
const INK = [15, 23, 42]
const MUTED = [100, 116, 139]
const LINE = [226, 232, 240]

// "Students 2026-10-04.csv": safe on every OS
function fileName(base, ext, stamp = true) {
  const safe = String(base || 'export').replace(/[\\/:*?"<>|]+/g, '-').trim()
  return stamp ? `${safe} ${todayISO()}.${ext}` : `${safe}.${ext}`
}

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const cell = (col, row) => {
  const v = col.value ? col.value(row) : row[col.key]
  return v == null ? '' : v
}

// CSV

export function downloadCsv({ filename, columns, rows, stamp = true }) {
  const escape = (v) => {
    const s = String(v ?? '')
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [
    columns.map((c) => escape(c.header)).join(','),
    ...rows.map((r) => columns.map((c) => escape(cell(c, r))).join(',')),
  ]
  // BOM so Excel reads UTF-8 names correctly
  saveBlob(new Blob([`﻿${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' }), fileName(filename, 'csv', stamp))
}

// PDF

// The built-in PDF fonts only cover Latin-1; swap the common typographic characters
function clean(v) {
  return String(v ?? '')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/[^\x00-\xFF]/g, '')
}

// Header band + title block
function drawHeader(doc, school, title, subtitle) {
  const width = doc.internal.pageSize.getWidth()
  doc.setFillColor(...ACCENT)
  doc.rect(0, 0, width, 6, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...ACCENT)
  doc.text(clean(school.name || 'Scholaris'), 40, 34)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...MUTED)
  const contact = [school.address, school.phone, school.email].filter(Boolean).map(clean).join('  |  ')
  if (contact) doc.text(contact, 40, 48, { maxWidth: width - 80 })

  doc.setDrawColor(...LINE)
  doc.line(40, 58, width - 40, 58)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...INK)
  doc.text(clean(title), 40, 84)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...MUTED)
  const generated = `Generated ${new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}`
  doc.text(clean(subtitle ? `${subtitle}  |  ${generated}` : generated), 40, 100, { maxWidth: width - 80 })

  return 116
}

function drawFooters(doc) {
  const pages = doc.getNumberOfPages()
  const width = doc.internal.pageSize.getWidth()
  const height = doc.internal.pageSize.getHeight()
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text('Scholaris School Management System', 40, height - 22)
    doc.text(`Page ${i} of ${pages}`, width - 40, height - 22, { align: 'right' })
  }
}

// Two-column label/value block
function drawPairs(doc, pairs, y) {
  const width = doc.internal.pageSize.getWidth()
  autoTable(doc, {
    startY: y,
    body: pairs.map(([k, v]) => [clean(k), clean(v)]),
    theme: 'plain',
    margin: { left: 40, right: 40 },
    styles: { fontSize: 10, cellPadding: { top: 5, bottom: 5, left: 0, right: 0 }, textColor: INK },
    columnStyles: {
      0: { cellWidth: Math.min(170, (width - 80) * 0.4), textColor: MUTED },
      1: { fontStyle: 'bold' },
    },
    didDrawCell: (data) => {
      if (data.column.index === 1) {
        doc.setDrawColor(...LINE)
        doc.line(40, data.cell.y + data.cell.height, width - 40, data.cell.y + data.cell.height)
      }
    },
  })
  return doc.lastAutoTable.finalY + 18
}

// CSV keeps raw numbers so Excel can add them up; on paper they read better grouped
const printable = (v) => (typeof v === 'number' ? v.toLocaleString('en-US') : v)

function drawTable(doc, columns, rows, y) {
  autoTable(doc, {
    startY: y,
    head: [columns.map((c) => clean(c.header))],
    body: rows.map((r) => columns.map((c) => clean(printable(cell(c, r))))),
    margin: { left: 40, right: 40, bottom: 40 },
    styles: { fontSize: 9, cellPadding: 6, textColor: INK, lineColor: LINE, lineWidth: 0.5 },
    headStyles: { fillColor: ACCENT, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: Object.fromEntries(
      columns.map((c, i) => [i, c.align ? { halign: c.align } : {}]),
    ),
  })
  return doc.lastAutoTable.finalY + 18
}

function drawHeading(doc, text, y) {
  if (y > doc.internal.pageSize.getHeight() - 90) {
    doc.addPage()
    y = 50
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...INK)
  doc.text(clean(text), 40, y)
  return y + 10
}

// A listing: title, optional summary pairs, then the table
export async function downloadTablePdf({ filename, title, subtitle, columns, rows, summary, landscape, stamp = true }) {
  const school = await schoolInfo()
  const wide = landscape ?? columns.length > 6
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: wide ? 'landscape' : 'portrait' })
  let y = drawHeader(doc, school, title, subtitle)
  if (summary?.length) y = drawPairs(doc, summary, y)
  if (rows.length) drawTable(doc, columns, rows, y)
  else {
    doc.setFontSize(10)
    doc.setTextColor(...MUTED)
    doc.text('No records.', 40, y + 10)
  }
  drawFooters(doc)
  doc.save(fileName(filename || title, 'pdf', stamp))
}

// A document made of sections: receipts, marksheets
export async function downloadDocumentPdf({ filename, title, subtitle, sections, note, landscape = false }) {
  const school = await schoolInfo()
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: landscape ? 'landscape' : 'portrait' })
  let y = drawHeader(doc, school, title, subtitle)

  sections.forEach((s) => {
    if (s.heading) y = drawHeading(doc, s.heading, y + 4)
    if (s.pairs) y = drawPairs(doc, s.pairs, y)
    if (s.columns) {
      if (s.rows?.length) y = drawTable(doc, s.columns, s.rows, y)
      else {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9.5)
        doc.setTextColor(...MUTED)
        doc.text('No records.', 40, y + 8)
        y += 26
      }
    }
  })

  if (note) {
    const width = doc.internal.pageSize.getWidth()
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text(clean(note), 40, y + 4, { maxWidth: width - 80 })
  }

  drawFooters(doc)
  doc.save(fileName(filename || title, 'pdf'))
}
