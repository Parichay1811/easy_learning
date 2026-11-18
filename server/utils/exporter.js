// One way to export a table as CSV or XLSX (FND-062). Rows are streamed, so a
// whole school's data never sits in memory, and every export is audited.
//
//   await exportRows(req, res, {
//     filename: 'year-4-learners', format: req.query.format,   // 'csv' (default) | 'xlsx'
//     columns: [{ key: 'name', header: 'Name' }, { key: 'minutes', header: 'Minutes', width: 10 }],
//     rows,                                                   // array, or an async iterable (a Mongo cursor)
//     audit: { action: 'export.learners', targetType: 'batch', targetId, orgId },
//   })
const { audit } = require('./audit')

const FORMATS = ['csv', 'xlsx']

// Spreadsheet apps run cells starting with = + - @ as formulas; a leading ' stops that.
function safeCell(v) {
  if (v == null) return ''
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'number' || typeof v === 'boolean') return v
  const s = String(v)
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
}

function csvCell(v) {
  const s = String(safeCell(v))
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const cleanName = (s) => String(s || 'export').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'export'

async function* iterate(rows) {
  if (Array.isArray(rows)) { for (const r of rows) yield r; return }
  for await (const r of rows) yield r
}

async function exportRows(req, res, { filename, format = 'csv', columns, rows, sheetName = 'Data', audit: a = {} }) {
  const fmt = FORMATS.includes(format) ? format : 'csv'
  const name = `${cleanName(filename)}-${new Date().toISOString().slice(0, 10)}.${fmt}`
  let count = 0
  let failed = null
  try {
    if (fmt === 'csv') {
      res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'no-store' })
      res.write('﻿' + columns.map((c) => csvCell(c.header)).join(',') + '\r\n')
      let buf = ''
      for await (const row of iterate(rows)) {
        buf += columns.map((c) => csvCell(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(',') + '\r\n'
        count++
        if (buf.length > 64 * 1024) { if (!res.write(buf)) await new Promise((r) => res.once('drain', r)); buf = '' }
      }
      res.end(buf)
    } else {
      const ExcelJS = require('exceljs')
      res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'no-store' })
      const wb = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res, useStyles: true })
      const ws = wb.addWorksheet(String(sheetName).slice(0, 31))
      ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || Math.max(12, String(c.header).length + 2) }))
      ws.getRow(1).font = { bold: true }
      ws.getRow(1).commit()
      for await (const row of iterate(rows)) {
        ws.addRow(Object.fromEntries(columns.map((c) => [c.key, safeCell(typeof c.value === 'function' ? c.value(row) : row[c.key])]))).commit()
        count++
        if (count % 500 === 0) await new Promise((r) => setImmediate(r))
      }
      ws.commit()
      await wb.commit()
    }
  } catch (err) {
    failed = err
    console.error('export failed:', err.message)
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Export failed' })
    else res.end()
  } finally {
    await audit(req, a.action || 'export', { targetType: a.targetType || '', targetId: a.targetId || '', orgId: a.orgId || '', reason: a.reason || '', meta: { ...(a.meta || {}), format: fmt, rows: count, file: name, ...(failed ? { failed: true } : {}) } })
  }
  return { rows: count, file: name }
}

module.exports = { exportRows, safeCell, csvCell, FORMATS }
