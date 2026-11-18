// Small helpers shared by the console controllers.
const mongoose = require('mongoose')

// Wrap an async handler: errors with .status answer that status, others 500.
const h = (fn) => async (req, res) => {
  try {
    const out = await fn(req, res)
    if (out !== undefined && !res.headersSent) res.json({ success: true, ...out })
  } catch (err) {
    if (res.headersSent) return
    if (err.status) return res.status(err.status).json({ success: false, message: err.message, code: err.code })
    console.error('console error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const fail = (status, message, code) => Object.assign(new Error(message), { status, code })
const isId = (id) => mongoose.isValidObjectId(id) && String(new mongoose.Types.ObjectId(String(id))) === String(id)
const needId = (id, what = 'Item') => { if (!isId(id)) throw fail(404, `${what} not found`); return id }

const paging = (query, { max = 200, def = 25 } = {}) => {
  const limit = Math.min(max, Math.max(1, Number(query.limit) || def))
  const page = Math.max(1, Number(query.page) || 1)
  return { limit, page, skip: (page - 1) * limit }
}

// Regex-safe search text.
const rx = (s) => new RegExp(String(s).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')

// CSV with a header row; formula-looking cells are escaped (CSV injection).
function toCsv(rows, columns) {
  const cell = (v) => {
    let s = v == null ? '' : v instanceof Date ? v.toISOString() : typeof v === 'object' ? JSON.stringify(v) : String(v)
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [columns.map((c) => c.label || c.key).join(','), ...rows.map((r) => columns.map((c) => cell(typeof c.get === 'function' ? c.get(r) : r[c.key])).join(','))].join('\n')
}
const sendCsv = (res, name, rows, columns) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${name}"`)
  res.send(toCsv(rows, columns))
}

const by = (req) => req.superadmin?.email || ''
const staffName = (req) => req.superadmin?.name || req.superadmin?.email || ''

module.exports = { h, fail, isId, needId, paging, rx, toCsv, sendCsv, by, staffName }
