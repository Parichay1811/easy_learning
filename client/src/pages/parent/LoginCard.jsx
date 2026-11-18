import { useTranslation } from "react-i18next";
import { Button } from "../../components/dashboard";
import { PICTURES } from "./parentApi";
import s from "./parent.module.css";

const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// The managed child's sign-in card: a code and three pictures, shown once, printable.
export default function LoginCard({ name, avatar, loginCode, pictures }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.card.${k}`, { defaultValue: d, ...o });
  const pics = (pictures || []).map((p) => PICTURES[p] || p);

  const print = () => {
    const w = window.open("", "_blank", "width=520,height=640");
    if (!w) return;
    w.document.write(`<!doctype html><meta charset="utf-8"><title>${esc(name)}</title>
      <style>body{font-family:Fredoka,system-ui,sans-serif;display:grid;place-items:center;min-height:90vh;margin:0}
      .c{border:4px dashed #6c5ce7;border-radius:24px;padding:32px 40px;text-align:center;max-width:360px}
      .a{font-size:64px}.n{font-size:28px;font-weight:600;margin:4px 0 18px}.k{font-size:40px;font-weight:700;letter-spacing:.15em}
      .p{font-size:56px;letter-spacing:.2em;margin-top:10px}.h{color:#555;font-size:14px;margin-top:18px}</style>
      <div class="c"><div class="a">${esc(avatar || "")}</div><div class="n">${esc(name)}</div>
      <div>${esc(T("myCode", "My code"))}</div><div class="k">${esc(loginCode)}</div>
      <div>${esc(T("myPictures", "My pictures, in order"))}</div><div class="p">${pics.map(esc).join(" ")}</div>
      <div class="h">${esc(T("printHelp", "Learnigo › I have a class code"))}</div></div>
      <script>window.onload=()=>{window.print()}</script>`);
    w.document.close();
  };

  return (
    <div className={s.loginCard}>
      <div style={{ fontSize: "2.6rem" }} aria-hidden="true">{avatar}</div>
      <strong style={{ fontSize: "1.2rem" }}>{name}</strong>
      <div className={s.muted} style={{ marginTop: 10 }}>{T("myCode", "My code")}</div>
      <div className={s.loginCode} aria-label={T("codeSpoken", "Code: {{c}}", { c: loginCode.split("").join(" ") })}>{loginCode}</div>
      <div className={s.muted}>{T("myPictures", "My pictures, in order")}</div>
      <div className={s.loginPics} aria-label={(pictures || []).join(", ")}>{pics.join(" ")}</div>
      <div className={s.row} style={{ justifyContent: "center", marginTop: 12 }}>
        <Button variant="soft" size="sm" onClick={print}>{T("print", "Print the card")}</Button>
      </div>
    </div>
  );
}
