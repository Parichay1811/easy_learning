import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authHeaders } from '../../utils/authHeaders'

const BASE = import.meta.env.VITE_API_BASE_URL
const ROUND_SIZE = 10

const signedIn = () => {
  try { return Boolean(localStorage.getItem('jwt_token') || localStorage.getItem('firebase_jwt')) } catch { return false }
}

// A level the learner chose on this device before signing in (components/Placement).
function localLevel(subject) {
  try {
    const v = JSON.parse(localStorage.getItem('learnigo_levels') || '{}')[subject]
    return Number.isInteger(v) ? v : null
  } catch { return null }
}

function shuffled(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Ten from the whole bank; with a level chosen on this device, those nearest
// to it first (no adaptivity without an account, but no wall either).
function pickTen(all, level) {
  const list = shuffled(all)
  if (level == null) return list.slice(0, ROUND_SIZE)
  const dist = (q) => (Number.isFinite(q?.level) ? Math.abs(q.level - level) : 3)
  return list.sort((a, b) => dist(a) - dist(b)).slice(0, ROUND_SIZE).sort(() => Math.random() - 0.5)
}

// One slice for all 12 Listen/Read/Write/Speak x English/Maths/Science rounds,
// cached by "module:subject".
//
// A signed-in learner gets a round from the learning engine
// (GET /api/learn/round: their level, reviews due, and how to support each
// item — contract §2), kept in the engine's order. If that is not there
// (404, an older server, offline) or the learner is a guest, the round is 10
// questions from the module's bank (GET /api/<module>/<subject>).
export const fetchQuestions = createAsyncThunk(
  'questions/fetchAll',
  async ({ module, subject, lang, skill }, { rejectWithValue }) => {
    if (signedIn()) {
      try {
        const qs = new URLSearchParams({ subject, module, size: String(ROUND_SIZE) })
        if (lang) qs.set('lang', lang)
        // "Practise now" on a skill (dashboard links add ?skill=): a round focused on it.
        if (skill) qs.set('skill', skill)
        const res = await fetch(`${BASE}/learn/round?${qs}`, { credentials: 'include', headers: authHeaders() })
        if (res.ok) {
          const json = await res.json()
          if (Array.isArray(json.items) && json.items.length) {
            return { data: json.items, adaptive: true, level: json.level ?? null, learnStatus: json.status ?? null, ceiling: json.ceiling ?? null }
          }
        }
      } catch { /* the bank below */ }
    }
    const qs = lang && subject !== 'english' ? `?lang=${lang}` : ''
    const res = await fetch(`${BASE}/${module}/${subject}${qs}`, { credentials: 'include', headers: authHeaders() })
    if (!res.ok) return rejectWithValue('Failed to fetch questions')
    const json = await res.json()
    return { data: pickTen(json.data || [], localLevel(subject)), adaptive: false, noOrgQuestions: json.noOrgQuestions }
  }
)

const keyOf = (module, subject) => `${module}:${subject}`

const questionsSlice = createSlice({
  name: 'questions',
  initialState: { byKey: {} },
  reducers: {
    resetQuestions: (state, action) => {
      delete state.byKey[keyOf(action.payload.module, action.payload.subject)]
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestions.pending, (state, action) => {
        const key = keyOf(action.meta.arg.module, action.meta.arg.subject)
        state.byKey[key] = { questions: [], status: 'loading', error: null, noOrgQuestions: false, adaptive: false, requestId: action.meta.requestId, lang: action.meta.arg.lang ?? null }
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        const key = keyOf(action.meta.arg.module, action.meta.arg.subject)
        // Only the newest request for this round counts: an older, slower answer
        // must never replace a round the learner has already started.
        if (state.byKey[key]?.requestId !== action.meta.requestId) return
        const p = action.payload
        state.byKey[key] = {
          questions: p.data || [],
          status: 'succeeded',
          error: null,
          noOrgQuestions: Boolean(p.noOrgQuestions),
          adaptive: Boolean(p.adaptive),
          level: p.level ?? null,
          learnStatus: p.learnStatus ?? null,
          ceiling: p.ceiling ?? null,
          requestId: action.meta.requestId,
          lang: action.meta.arg.lang ?? null,
        }
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        const key = keyOf(action.meta.arg.module, action.meta.arg.subject)
        if (state.byKey[key]?.requestId !== action.meta.requestId) return
        state.byKey[key] = { questions: [], status: 'failed', error: action.payload, noOrgQuestions: false, adaptive: false, requestId: action.meta.requestId, lang: action.meta.arg.lang ?? null }
      })
  },
})

export const { resetQuestions } = questionsSlice.actions

const EMPTY_STATE = { questions: [], status: 'idle', error: null, noOrgQuestions: false, adaptive: false }
export const selectQuestionState = (state, module, subject) =>
  state.questions.byKey[keyOf(module, subject)] || EMPTY_STATE

export default questionsSlice.reducer
