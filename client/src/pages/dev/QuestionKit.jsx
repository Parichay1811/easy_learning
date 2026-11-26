import { useState } from "react";
import QuestionCard from "../../components/QuestionCard/QuestionCard";
import items from "./questionKitItems.json";

/**
 * Dev only (/dev/question-kit): real served questions from the content v5 bank (filled for EUR)
 * in the real question card: the action strip, "Hear the choices", money and letter tiles.
 * Regenerate the items from server/data when the bank changes (see the commit that added them).
 */
export default function QuestionKit() {
  const [i, setI] = useState(0);
  const it = items[i];
  return (
    <main style={{ minHeight: "100vh", padding: 16, background: "#16324a" }}>
      <nav style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {items.map((x, k) => (
          <button key={x.question.id} type="button" data-kit={k} onClick={() => setI(k)} aria-pressed={k === i} style={{ padding: "6px 10px", borderRadius: 8, fontWeight: k === i ? 700 : 400 }}>{x.question.id}</button>
        ))}
      </nav>
      <div style={{ maxWidth: 760, margin: "0 auto", height: "80vh" }}>
        <QuestionCard key={it.question.id} question={it.question} subject={it.subject} module={it.module} onAnswered={() => {}} onNext={() => setI((k) => (k + 1) % items.length)} />
      </div>
    </main>
  );
}
