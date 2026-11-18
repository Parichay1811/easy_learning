
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path')
require('dotenv').config()

const authRoutes          = require('./routes/auth')
const adminAuthRoutes     = require('./routes/adminAuth')
const superadminAuthRoutes = require('./routes/superadminAuth')
const teacherAuthRoutes   = require('./routes/teacherAuth')
const parentAuthRoutes    = require('./routes/parentAuth')
const adminRoutes         = require('./routes/admin')
const superadminRoutes    = require('./routes/superadmin')
const teacherRoutes       = require('./routes/teacher')
const parentRoutes        = require('./routes/parent')
const contactRoutes       = require('./routes/contact')
const listenScienceRoutes = require('./routes/listenScience')
const listenMathsRoutes = require('./routes/listenMaths')
const listenEnglishRoutes = require('./routes/listenEnglish')
const readScienceRoutes = require('./routes/readScience')
const readMathsRoutes = require('./routes/readMaths')
const readEnglishRoutes = require('./routes/readEnglish')
const writeScienceRoutes = require('./routes/writeScience')
const writeMathsRoutes   = require('./routes/writeMaths')
const writeEnglishRoutes = require('./routes/writeEnglish')
const speakScienceRoutes = require('./routes/speakScience')
const speakMathsRoutes   = require('./routes/speakMaths')
const speakEnglishRoutes = require('./routes/speakEnglish')
const dashboardRoutes     = require('./routes/dashboard')
const sharedRoutes        = require('./routes/shared')
const arRoutes            = require('./routes/ar')
const { createAIAssistant } = require('./services/aiAssistant')

// Initialise separate DB connections before routes load models
require('./db/adminDb')
require('./db/superAdminDb')

const app = express()

// The AI voice assistant (./ai-assistant) is part of this API, at
// /api/ai-assistant/*; its page is served by the React site at /ai-assistant/.
// Its heavy speech/LLM work runs in a child process that this API starts,
// supervises and forwards to (services/aiAssistant.js), so it can never block
// or crash the API. Only its own same-origin page calls it and it guards its
// POSTs itself (a foreign Origin gets a 403), and its request bodies (JSON and
// raw audio) are streamed to it untouched, so it is mounted before CORS and the
// body parsers. It answers 503 while it loads. AI_ASSISTANT=off leaves it out
// (e.g. on a machine without the RAM for it).
const aiAssistant = createAIAssistant({ enabled: process.env.AI_ASSISTANT !== 'off' })
app.use('/api/ai-assistant', aiAssistant.handle)

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',').map(o => o.trim().replace(/\/$/, ''))
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))
// AR telemetry retries up to 25 rounds of trial-level data in one POST, which
// overruns the 100kb default. Mounted first so the global parser sees the body
// as already read and skips it — every other route keeps the default limit.
app.use('/api/ar', express.json({ limit: '2mb' }))
app.use(express.json())
// Signed cookies need a secret; the student session cookie is signed so it can't be forged.
app.use(cookieParser(process.env.COOKIE_SECRET || process.env.JWT_SECRET))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

const PORT = process.env.PORT || 5000

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB')
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error)
  })

app.use('/api/auth', authRoutes)
app.use('/api/admin/auth', adminAuthRoutes)
app.use('/api/superadmin/auth', superadminAuthRoutes)
app.use('/api/teacher/auth', teacherAuthRoutes)
app.use('/api/parent/auth', parentAuthRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/superadmin', superadminRoutes)
app.use('/api/teacher', teacherRoutes)
app.use('/api/parent', parentRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/join', require('./routes/join')) // public join codes and tutor pages (TCH-011/082)
app.use('/api/admin', require('./routes/teacherInvite')) // TCH-002 invite email

app.get('/', (req, res) => {
  res.send('hello bachho')
})

app.use('/api/listen/science', listenScienceRoutes)
app.use('/api/listen/maths', listenMathsRoutes)
app.use('/api/listen/english', listenEnglishRoutes)
app.use('/api/read/science', readScienceRoutes)
app.use('/api/read/maths', readMathsRoutes)
app.use('/api/read/english', readEnglishRoutes)
app.use('/api/write/science', writeScienceRoutes)
app.use('/api/write/maths',   writeMathsRoutes)
app.use('/api/write/english', writeEnglishRoutes)
app.use('/api/speak/science', speakScienceRoutes)
app.use('/api/speak/maths',   speakMathsRoutes)
app.use('/api/speak/english', speakEnglishRoutes)
app.use('/api/dashboard',        dashboardRoutes)
app.use('/api',                  sharedRoutes)
app.use('/api/ar',               arRoutes)

// Global error handler — catches any unhandled errors from route handlers
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ success: false, message: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  aiAssistant.start()
})

// Stop the AI assistant's process with the API (it saves its TODO list on the way out).
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    aiAssistant.stop()
    process.exit(0)
  })
}
