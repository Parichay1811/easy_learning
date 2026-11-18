/**
 * Demo tests (TCH-020..052) on top of scripts/seed-demo.js: questions of every
 * type written by Mr Sharma, approved by the school, a published test with
 * finished attempts (for results and item analysis), an open test for Aanya's
 * To do list, and a practice set. Goes through the real API, so it exercises
 * the same rules as production.
 *
 *   const demo = await seedDemo(app.db)
 *   await seedDemoTests(app, demo)        // app from test/integration/harness.js
 */
const QUESTIONS = [
  { module: 'read', subject: 'maths', interaction: 'tap_mcq', instruction: 'Which fraction is the biggest?', prompt: '1/2   1/4   1/8', emoji: '🍕', options: ['1/2', '1/4', '1/8'], correct_answer: '1/2', hints: ['Fewer slices means bigger slices.'], feedback: { correct: 'Yes! Half is the biggest piece.', incorrect: 'Think about sharing one pizza.', second_try: "Let's look at it together." }, worked_example: 'Cut a pizza in 2, 4 and 8. The piece from 2 slices is the biggest.', skillIds: ['comparing fractions'], difficulty: 2, gradeBand: '3-5' },
  { module: 'read', subject: 'maths', interaction: 'multi_select', instruction: 'Tap every fraction equal to one half', options: ['2/4', '3/6', '2/3', '4/8'], correct_answer: ['2/4', '3/6', '4/8'], skillIds: ['equivalent fractions'], difficulty: 3, gradeBand: '3-5' },
  { module: 'read', subject: 'maths', interaction: 'drag_order', instruction: 'Put these in order, smallest first', correct_answer: ['1/8', '1/4', '1/2', '1'], skillIds: ['comparing fractions'], difficulty: 3, gradeBand: '3-5' },
  { module: 'read', subject: 'maths', interaction: 'match_pairs', instruction: 'Match each fraction to its picture', correct_answer: [['1/2', '◐'], ['1/4', '◔'], ['1', '●']], skillIds: ['fraction pictures'], difficulty: 2, gradeBand: '3-5' },
  { module: 'read', subject: 'maths', interaction: 'sort_bins', instruction: 'Sort the fractions', correct_answer: { 'less than a half': ['1/3', '1/4'], 'more than a half': ['3/4', '2/3'] }, skillIds: ['comparing fractions'], difficulty: 3, gradeBand: '3-5' },
  { module: 'write', subject: 'maths', interaction: 'typed_short', instruction: 'Type the answer', prompt: '1/4 + 1/4 = ?', correct_answer: '1/2', accepted_answers: ['2/4'], skillIds: ['adding fractions'], difficulty: 3, gradeBand: '3-5' },
  { module: 'read', subject: 'maths', interaction: 'true_false', instruction: 'True or false?', prompt: '3/4 is bigger than 1/2', options: ['True', 'False'], correct_answer: 'True', skillIds: ['comparing fractions'], difficulty: 1, gradeBand: '3-5' },
  { module: 'write', subject: 'english', interaction: 'typed_long', instruction: 'Explain how you know 2/4 and 1/2 are the same', correct_answer: 'Both are half of the whole: 2 of 4 equal parts is the same as 1 of 2.', skillIds: ['reasoning'], difficulty: 4, gradeBand: '3-5' },
  { module: 'write', subject: 'english', interaction: 'letter_bank', instruction: 'Build the word', prompt: 'A part of a whole', audio_text: 'half', correct_answer: 'half', skillIds: ['spelling'], difficulty: 1, gradeBand: 'K-2' },
  { module: 'speak', subject: 'english', interaction: 'mic_record', instruction: 'Say the word out loud', emoji: '🍕', audio_text: 'pizza', speech_scoring: { expected_keywords: ['pizza'], sample_answer: 'pizza' }, skillIds: ['speaking'], difficulty: 1, gradeBand: 'K-2' },
  { module: 'listen', subject: 'maths', interaction: 'tap_sequence', instruction: 'Listen and tap the numbers in order', audio_text: 'two, four, six', options: ['2', '4', '6', '8'], correct_answer: ['2', '4', '6'], skillIds: ['counting'], difficulty: 2, gradeBand: 'K-2' },
  { module: 'read', subject: 'maths', interaction: 'drag_to_blank', instruction: 'Fill the blank', prompt: '1/3 + 1/3 = ___', options: ['2/3', '2/6', '1/9'], correct_answer: '2/3', skillIds: ['adding fractions'], difficulty: 3, gradeBand: '3-5' },
]

async function seedDemoTests(app, demo) {
  const t = app.tokens
  const sharma = t.teacher(demo.org.tutorIds[0], demo.org.id, 'sharma@demo.test')
  const admin = t.admin(demo.org.adminId, demo.org.id, demo.org.adminUid)
  const ids = []
  for (const q of QUESTIONS) {
    const r = await app.call('POST', '/api/teacher/bank/questions', { token: sharma, body: q })
    if (r.status !== 201) throw new Error(`question failed: ${JSON.stringify(r.body)}`)
    ids.push({ ...q, id: r.body.question._id })
  }
  // The admin approves everything except the last one (left in the review queue).
  const pending = await app.call('GET', '/api/admin/questions/uploads?status=pending', { token: admin })
  for (const b of pending.body.batches.slice(1)) await app.call('POST', `/api/admin/questions/uploads/${b._id}/approve`, { token: admin })
  const ref = (i, extra = {}) => ({ kind: 'question', module: ids[i].module, subject: ids[i].subject, questionId: ids[i].id, points: 1, ...extra })
  const day = 24 * 3600 * 1000
  const iso = (ms) => new Date(Date.now() + ms).toISOString()

  // A finished test with results.
  const quiz = await app.call('POST', '/api/teacher/tests', { token: sharma, body: {
    title: 'Fractions check', description: 'Ten minutes on fractions. Do your best!',
    sections: [{ title: '', items: [ref(0), ref(1, { points: 2 }), ref(2, { points: 2 }), ref(3), ref(4, { points: 2 }), ref(5), ref(6), ref(7, { points: 3, marking: 'manual', rubric: [{ name: 'Reasoning', levels: [{ label: 'Not yet', points: 0 }, { label: 'Some', points: 1 }, { label: 'Clear', points: 3 }] }] })] }],
    rules: { closesAt: iso(3 * day), timeLimit: 'total', totalMinutes: 15, feedback: 'after_submit', hints: true, integrity: { logTabSwitches: true } },
  } })
  const quizId = quiz.body.test._id
  await app.call('POST', `/api/teacher/tests/${quizId}/publish`, { token: sharma, body: { batchIds: [demo.org.batchIds[0]], notifyParents: true } })
  const students = await app.db.admin.collection('students').find({ batchIds: { $in: [new (require('mongoose').Types.ObjectId)(demo.org.batchIds[0])] } }).toArray()
  let k = 0
  for (const s of students.slice(1)) { // leave the first (Aanya) to take it herself
    const st = t.student(s.email, s.name)
    const a = (await app.call('POST', `/api/student/tests/${quizId}/start`, { token: st })).body.attempt
    const good = k % 3 !== 2
    for (const it of a.items) {
      const right = {
        tap_mcq: good ? '1/2' : '1/8', multi_select: good ? ['2/4', '3/6', '4/8'] : ['2/4', '2/3'], drag_order: good ? ['1/8', '1/4', '1/2', '1'] : ['1/2', '1/4', '1/8', '1'],
        match_pairs: [['1/2', '◐'], ['1/4', '◔'], ['1', '●']], sort_bins: good ? { 'less than a half': ['1/3', '1/4'], 'more than a half': ['3/4', '2/3'] } : { 'less than a half': ['1/3', '2/3'], 'more than a half': ['3/4', '1/4'] },
        typed_short: k % 2 ? '2/4' : '2/8', true_false: k === 0 ? 'False' : 'True', typed_long: 'Because two quarters make a half.',
      }[it.interaction]
      await app.call('PUT', `/api/student/attempts/${a._id}/items/${encodeURIComponent(it.id)}`, { token: st, body: { response: right, timeMs: 4000 + k * 900 } })
    }
    if (k === 1) await app.call('POST', `/api/student/attempts/${a._id}/events`, { token: st, body: { type: 'tab_hidden' } })
    await app.call('POST', `/api/student/attempts/${a._id}/submit`, { token: st })
    k++
  }
  // An open test and a practice set for the To do list.
  const open = await app.call('POST', '/api/teacher/tests', { token: sharma, body: {
    title: 'Friday fractions quiz', sections: [{ items: [ref(0), ref(6), ref(10), ref(5), ref(3), ref(9)] }],
    rules: { closesAt: iso(2 * day), feedback: 'after_close', attempts: 2, counts: 'best', listen: true },
  } })
  await app.call('POST', `/api/teacher/tests/${open.body.test._id}/publish`, { token: sharma, body: { batchIds: [demo.org.batchIds[0]] } })
  const practice = await app.call('POST', '/api/teacher/tests', { token: sharma, body: { title: 'Warm-up: halves and quarters', kind: 'practice', sections: [{ items: [ref(0), ref(6), ref(10), ref(8)] }] } })
  await app.call('POST', `/api/teacher/tests/${practice.body.test._id}/publish`, { token: sharma, body: { batchIds: [demo.org.batchIds[0]] } })
  return { quizId, openId: open.body.test._id, practiceId: practice.body.test._id, questionIds: ids.map((q) => q.id) }
}

module.exports = { seedDemoTests, QUESTIONS }
