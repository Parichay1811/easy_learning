import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, EmptyState } from "../../components/dashboard";
import s from "./parent.module.css";

// Chat with Learnigo support (kept from the old dashboard).
export default function ParentChat({ api, onRead }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.chat.${k}`, { defaultValue: d, ...o });
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const end = useRef(null);
  const readRef = useRef(onRead);
  useEffect(() => { readRef.current = onRead; }, [onRead]);

  const [tick, setTick] = useState(0);
  const load = useCallback(() => setTick((n) => n + 1), []);
  useEffect(() => {
    let live = true;
    (async () => {
      const d = await api.get("/chat");
      if (!live) return;
      if (d.success) { setMessages(d.messages); readRef.current?.(); } else setError(d.message);
    })();
    return () => { live = false; };
  }, [api, tick]);
  useEffect(() => { const iv = setInterval(load, 25000); return () => clearInterval(iv); }, [load]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    const d = await api.post("/chat", { message: draft.trim() });
    setSending(false);
    if (d.success) { setDraft(""); load(); } else setError(d.message);
  };

  return (
    <>
      <div className={s.pageHead}><div><h1>{T("title", "Chat with us")}</h1><p>{T("sub", "Questions about your account or your child? We usually reply within a day.")}</p></div></div>
      <section className={`${s.card} ${s.chat}`}>
        <div className={s.chatList} role="log" aria-live="polite">
          {messages.length === 0 ? <EmptyState compact icon="💬" title={T("empty", "No messages yet")} text={T("emptyText", "Write to the Learnigo team below.")} /> : messages.map((m) => (
            <div key={m._id} className={`${s.bubble} ${m.senderRole === "parent" ? s.bubbleMine : ""}`}>
              <span>{m.message}</span>
              <time dateTime={m.createdAt}>{new Date(m.createdAt).toLocaleString()}</time>
            </div>
          ))}
          <div ref={end} />
        </div>
        <form onSubmit={send} className={s.stack}>
          <label className={s.field}><span className={s.srOnly}>{T("label", "Message")}</span>
            <textarea className={s.textarea} rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={T("placeholder", "Write a message…")} />
          </label>
          {error && <p className={s.error} role="alert">{error}</p>}
          <div><Button type="submit" disabled={sending || !draft.trim()}>{sending ? T("sending", "Sending…") : T("send", "Send")}</Button></div>
        </form>
      </section>
    </>
  );
}
