// A test: questions only when the student asks for them, one after another,
// then the score. Shared by the server (which builds the test) and the
// browser (which runs it: next question, tapped answers, the score).
import { quizStep } from './solvers.js';

export function questionPlan(test, i) {
  const n = test.questions.length;
  const q = test.questions[i];
  return { kind: 'test-q', title: null, steps: [quizStep(q, { lead: `Question ${i + 1} of ${n}.`, title: `Question ${i + 1} of ${n}` })], awaiting: q };
}

// results: [{ topic, topicTitle, correct }]
export function resultPlan(test, results) {
  const n = results.length;
  const score = results.filter((r) => r.correct).length;
  const ratio = n ? score / n : 0;
  const praise = score === n && n > 0 ? 'Brilliant, full marks!' : ratio >= 0.7 ? 'Great work!' : ratio >= 0.4 ? 'Good effort.' : "That's a start, and practice will make it easier.";
  const missed = [...new Set(results.filter((r) => !r.correct).map((r) => r.topicTitle).filter(Boolean))].slice(0, 3);
  const review = missed.length ? ` Have another look at ${missed.map((m) => m.toLowerCase()).join(missed.length > 1 ? ', ' : '').replace(/, ([^,]*)$/, ' and $1')}.` : '';
  return {
    kind: 'test-result', title: `Score: ${score} out of ${n}`, score, total: n,
    steps: [{
      say: `That's the end of the test. You got ${score} out of ${n}. ${praise}${review}`,
      draw: [{ op: 'clear' }, { op: 'title', text: 'Your score' }, { op: 'box', text: `${score} / ${n}`, at: 'got', sfx: 'correct' },
        ...(missed.length ? [{ op: 'note', text: `Look again at: ${missed.join(', ')}`, color: 'blue', at: 'look' }] : [])],
    }],
  };
}
