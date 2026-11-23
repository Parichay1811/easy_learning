// TCH-080 plan, limits and usage; TCH-081 branding; TCH-082 public tutor page; workspace details.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaRocket, FaCheck, FaExternalLinkAlt, FaIdCard, FaPalette, FaGlobe } from "react-icons/fa";
import { Button, PlanLockCard, EmptyState, SubTabs, SubPanel, usePane } from "../../components/dashboard";
import { useLoad, useTeacherApi } from "./teacherApi";
import { Meter, Modal } from "./teacherUi";
import { GROUP_COLORS, limitText } from "./teacherShared";
import s from "./teacher.module.css";

function Upgrade({ w }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  if (!w.upgrade) return null;
  return (
    <section id="upgrade" className={`${s.card} ${s.planCard}`}>
      <h2 className={s.h2}><FaRocket aria-hidden="true" /> {t("teacher.plan.upgradeTitle", { defaultValue: "{{plan}} adds", plan: w.upgrade.label })}</h2>
      <ul className={s.planList}>
        {Object.keys(w.upgrade.limits || {}).length === 0 && <li>{t("teacher.plan.unlimited", { defaultValue: "Unlimited groups and students" })}</li>}
        {w.upgrade.adds.map((m) => <li key={m.key}>{m.label}</li>)}
      </ul>
      <div><Button icon={FaRocket} onClick={() => setOpen(true)}>{t("teacher.plan.upgrade", { defaultValue: "Upgrade to {{plan}}", plan: w.upgrade.label })}</Button></div>
      {open && (
        <Modal title={t("teacher.plan.soonTitle", { defaultValue: "Online payment is coming soon" })} onClose={() => setOpen(false)}>
          <p>{t("teacher.plan.soonText", { defaultValue: "We are setting up card payments. Until then, write to us and we will switch your workspace to {{plan}} by hand. Nothing you have made will change.", plan: w.upgrade.label })}</p>
          <div className={s.row} style={{ justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setOpen(false)}>{t("teacher.close", { defaultValue: "Close" })}</Button>
            <Button to="/contact-us">{t("teacher.plan.contact", { defaultValue: "Contact us" })}</Button>
          </div>
        </Modal>
      )}
    </section>
  );
}

function Details({ w, onSaved }) {
  const { t } = useTranslation();
  const { send } = useTeacherApi();
  const [f, setF] = useState({ name: w.workspace.name, country: w.profile.country, subjects: w.profile.subjects.join(", "), grades: w.profile.grades.join(", ") });
  const [msg, setMsg] = useState(null);
  const save = async (e) => {
    e.preventDefault();
    const split = (v) => v.split(/[,、，;；]/).map((x) => x.trim()).filter(Boolean);
    const r = await send("PATCH", "/workspace", { name: f.name, country: f.country, subjects: split(f.subjects), grades: split(f.grades) });
    setMsg(r.ok ? { ok: true, text: t("teacher.saved", { defaultValue: "Saved." }) } : { ok: false, text: limitText(t, r) });
    if (r.ok) onSaved();
  };
  return (
    <section className={s.card}>
      <h2 className={s.h2}>{t("teacher.plan.details", { defaultValue: "Your workspace" })}</h2>
      <form className={s.form} onSubmit={save}>
        <label className={s.field}><span>{t("teacher.plan.wsName", { defaultValue: "Workspace name" })}</span><input className={s.input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={80} required /></label>
        <div className={s.grid2} style={{ gap: 14 }}>
          <label className={s.field}><span>{t("teacher.signup.subjects", { defaultValue: "Subjects you teach" })}</span><input className={s.input} value={f.subjects} onChange={(e) => setF({ ...f, subjects: e.target.value })} /><small>{t("teacher.commaSep", { defaultValue: "Separate with commas" })}</small></label>
          <label className={s.field}><span>{t("teacher.signup.grades", { defaultValue: "Grades or ages" })}</span><input className={s.input} value={f.grades} onChange={(e) => setF({ ...f, grades: e.target.value })} /></label>
        </div>
        <label className={s.field}><span>{t("teacher.signup.country", { defaultValue: "Country" })}</span><input className={s.input} value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} maxLength={60} /></label>
        {msg && <p className={msg.ok ? s.success : s.error} role="status">{msg.text}</p>}
        <div><Button type="submit">{t("teacher.save", { defaultValue: "Save" })}</Button></div>
      </form>
    </section>
  );
}

function Branding({ w, onSaved, onSeePlans }) {
  const { t } = useTranslation();
  const { send, upload } = useTeacherApi();
  const [color, setColor] = useState(w.workspace.brandColor || "#5b4fd6");
  const [msg, setMsg] = useState(null);
  if (!w.permissions.branded) {
    return (
      <PlanLockCard module="reports.branded" title={t("teacher.brand.lockTitle", { defaultValue: "Your logo and colour" })}
        text={t("teacher.brand.lockText", { defaultValue: "Put your own logo and colour on parent invites, the join page and reports. Part of Solo Pro." })}
        ctaLabel={t("teacher.seePlans", { defaultValue: "See plans" })} onUpgrade={onSeePlans} />
    );
  }
  const saveColor = async () => {
    const r = await send("PATCH", "/workspace", { brandColor: color });
    setMsg(r.ok ? { ok: true, text: t("teacher.saved", { defaultValue: "Saved." }) } : { ok: false, text: limitText(t, r) });
    if (r.ok) onSaved();
  };
  const sendLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("logo", file);
    const r = await upload("/workspace/logo", fd);
    setMsg(r.ok ? { ok: true, text: t("teacher.brand.logoSaved", { defaultValue: "Logo saved." }) } : { ok: false, text: limitText(t, r) });
    if (r.ok) onSaved();
  };
  const removeLogo = async () => { const r = await send("PATCH", "/workspace", { logoUrl: "" }); if (r.ok) onSaved(); };
  return (
    <section className={s.card}>
      <h2 className={s.h2}>{t("teacher.brand.title", { defaultValue: "Branding" })}</h2>
      <p className={s.muted}>{t("teacher.brand.text", { defaultValue: "Used on parent invites, your join page and your public page." })}</p>
      <div className={s.form}>
        <div className={s.row}>
          {w.workspace.logoUrl ? <img src={w.workspace.logoUrl} alt={t("teacher.brand.logoAlt", { defaultValue: "Your logo" })} style={{ height: 56, borderRadius: 12 }} /> : <span className={s.muted}>{t("teacher.brand.noLogo", { defaultValue: "No logo yet" })}</span>}
          <label className={s.chipToggle} style={{ display: "inline-flex", alignItems: "center" }}>
            {t("teacher.brand.upload", { defaultValue: "Upload logo" })}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={sendLogo} className="d-sr-only" />
          </label>
          {w.workspace.logoUrl && <Button size="sm" variant="ghost" onClick={removeLogo}>{t("teacher.brand.removeLogo", { defaultValue: "Remove" })}</Button>}
        </div>
        <fieldset className={s.field} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className={s.fieldLabel}>{t("teacher.brand.colour", { defaultValue: "Brand colour" })}</legend>
          <div className={s.swatches}>
            {["#5b4fd6", ...GROUP_COLORS].map((c) => <button key={c} type="button" aria-label={c} aria-pressed={color === c} className={`${s.swatch} ${color === c ? s.swatchOn : ""}`} style={{ background: c }} onClick={() => setColor(c)} />)}
            <input className={s.input} style={{ width: 130 }} value={color} onChange={(e) => setColor(e.target.value)} aria-label={t("teacher.brand.hex", { defaultValue: "Colour code" })} />
          </div>
        </fieldset>
        <div style={{ background: color, color: "#fff", padding: "12px 16px", borderRadius: 12, fontWeight: 700 }}>{w.workspace.name}</div>
        {msg && <p className={msg.ok ? s.success : s.error} role="status">{msg.text}</p>}
        <div><Button onClick={saveColor}>{t("teacher.brand.save", { defaultValue: "Save colour" })}</Button></div>
      </div>
    </section>
  );
}

function PublicPage({ w, onSaved }) {
  const { t } = useTranslation();
  const { get, send } = useTeacherApi();
  const groups = useLoad(() => get("/groups"), []);
  const p = w.profile;
  const [f, setF] = useState({ slug: p.slug, headline: p.headline, bio: p.bio, publicGroupId: p.publicGroupId, testimonials: [...p.testimonials, { quote: "", by: "" }].slice(0, 3) });
  const [msg, setMsg] = useState(null);
  const save = async (publicEnabled) => {
    const r = await send("PATCH", "/workspace", { ...f, testimonials: f.testimonials.filter((x) => x.quote.trim()), publicEnabled });
    setMsg(r.ok ? { ok: true, text: publicEnabled ? t("teacher.pub.live", { defaultValue: "Your page is live." }) : t("teacher.saved", { defaultValue: "Saved." }) } : { ok: false, text: limitText(t, r) });
    if (r.ok) onSaved();
  };
  const setT = (i, k, v) => setF((x) => ({ ...x, testimonials: x.testimonials.map((tt, j) => (j === i ? { ...tt, [k]: v } : tt)) }));
  return (
    <section className={s.card}>
      <h2 className={s.h2}>{t("teacher.pub.title", { defaultValue: "Public tutor page (optional)" })}</h2>
      <p className={s.muted}>{t("teacher.pub.text", { defaultValue: "A simple page parents can find, with a “Join my class” button. Off until you publish it. Your email is never shown." })}</p>
      <div className={s.form}>
        <label className={s.field}>
          <span>{t("teacher.pub.address", { defaultValue: "Page address" })}</span>
          <div className={s.row} style={{ gap: 6 }}><span className={s.muted} style={{ overflowWrap: "anywhere", minWidth: 0 }}>{window.location.origin}/tutor/</span><input className={s.input} style={{ flex: "1 1 160px", width: "auto", minWidth: 0 }} value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value.toLowerCase() })} placeholder="ms-rao" maxLength={40} /></div>
        </label>
        <label className={s.field}><span>{t("teacher.pub.headline", { defaultValue: "Headline" })}</span><input className={s.input} value={f.headline} onChange={(e) => setF({ ...f, headline: e.target.value })} maxLength={120} placeholder={t("teacher.pub.headlinePh", { defaultValue: "Patient maths tutoring for ages 7 to 11" })} /></label>
        <label className={s.field}><span>{t("teacher.pub.bio", { defaultValue: "About you" })}</span><textarea className={`${s.textarea} ${s.notesArea}`} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} maxLength={1200} /></label>
        <label className={s.field}>
          <span>{t("teacher.pub.group", { defaultValue: "“Join my class” opens" })}</span>
          <select className={s.select} value={f.publicGroupId} onChange={(e) => setF({ ...f, publicGroupId: e.target.value })}>
            <option value="">{t("teacher.pub.noGroup", { defaultValue: "No join button" })}</option>
            {(groups.data?.groups || []).map((g) => <option key={g._id} value={g._id}>{g.emoji} {g.name}</option>)}
          </select>
        </label>
        <fieldset className={s.field} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className={s.fieldLabel}>{t("teacher.pub.testimonials", { defaultValue: "What parents say (up to 3)" })}</legend>
          {f.testimonials.map((tt, i) => (
            <div key={i} className={s.row}>
              <input className={s.input} style={{ flex: 3, minWidth: 200 }} value={tt.quote} onChange={(e) => setT(i, "quote", e.target.value)} maxLength={400} aria-label={t("teacher.pub.quote", { defaultValue: "Quote {{n}}", n: i + 1 })} placeholder={t("teacher.pub.quotePh", { defaultValue: "Quote" })} />
              <input className={s.input} style={{ flex: 1, minWidth: 120 }} value={tt.by} onChange={(e) => setT(i, "by", e.target.value)} maxLength={60} aria-label={t("teacher.pub.by", { defaultValue: "Who said it {{n}}", n: i + 1 })} placeholder={t("teacher.pub.byPh", { defaultValue: "A parent" })} />
            </div>
          ))}
        </fieldset>
        {msg && <p className={msg.ok ? s.success : s.error} role="status">{msg.text}</p>}
        <div className={s.row}>
          {p.publicEnabled
            ? <><Button onClick={() => save(true)}>{t("teacher.save", { defaultValue: "Save" })}</Button><Button variant="ghost" onClick={() => save(false)}>{t("teacher.pub.unpublish", { defaultValue: "Unpublish" })}</Button>{p.slug && <Button variant="soft" icon={FaExternalLinkAlt} to={`/tutor/${p.slug}`} target="_blank">{t("teacher.pub.view", { defaultValue: "View page" })}</Button>}</>
            : <><Button icon={FaCheck} onClick={() => save(true)}>{t("teacher.pub.publish", { defaultValue: "Publish my page" })}</Button><Button variant="ghost" onClick={() => save(false)}>{t("teacher.pub.draft", { defaultValue: "Save draft" })}</Button></>}
        </div>
      </div>
    </section>
  );
}

export default function PlanView({ workspace: w, reload }) {
  const { t } = useTranslation();
  const [pane, setPane] = usePane(["plan", "workspace", "branding", "page"]);
  if (!w) return null;
  const solo = w.workspace.kind === "solo";
  const planCard = (
    <section className={`${s.card} ${s.planCard}`}>
      <h2 className={s.h2}>{t("teacher.plan.current", { defaultValue: "You are on {{plan}}", plan: w.plan.label })}</h2>
      <div className={s.usage}>
        <Meter label={t("teacher.usage.groups", { defaultValue: "Groups" })} used={w.usage.groups} max={w.limits.groups} />
        <Meter label={t("teacher.usage.students", { defaultValue: "Students" })} used={w.usage.students} max={w.limits.students} />
      </div>
      {!solo && <p className={s.muted} style={{ margin: 0 }}>{t("teacher.plan.school", { defaultValue: "Your school looks after the plan. Ask your admin about extra features." })}</p>}
    </section>
  );
  const head = (
    <div className={s.headRow}>
      <div>
        <h1>{solo ? t("teacher.plan.title", { defaultValue: "Plan and settings" }) : t("teacher.plan.titleSchool", { defaultValue: "Your plan" })}</h1>
        <p>{w.workspace.name}</p>
      </div>
    </div>
  );
  if (!solo) {
    return (
      <>
        {head}
        {planCard}
        <EmptyState compact title={t("teacher.plan.schoolSettings", { defaultValue: "Settings are managed by your school" })} text={t("teacher.plan.schoolSettingsText", { defaultValue: "Want to tutor privately too? Start your own free Solo workspace and switch between them at the top." })} actionLabel={t("teacher.plan.startSolo", { defaultValue: "Start a Solo workspace" })} to="/teach" />
      </>
    );
  }
  return (
    <>
      {head}
      <SubTabs label={t("teacher.plan.tabs", { defaultValue: "Plan and settings" })} value={pane} onChange={setPane} idBase="plan"
        tabs={[
          { id: "plan", label: t("teacher.plan.tabPlan", { defaultValue: "My plan" }), icon: FaRocket },
          { id: "workspace", label: t("teacher.plan.details", { defaultValue: "Your workspace" }), icon: FaIdCard },
          { id: "branding", label: t("teacher.brand.title", { defaultValue: "Branding" }), icon: FaPalette },
          { id: "page", label: t("teacher.plan.tabPage", { defaultValue: "Public page" }), icon: FaGlobe },
        ]} />
      <SubPanel key={pane} id={pane} value={pane} idBase="plan">
        {pane === "plan" && <>{planCard}<Upgrade w={w} /></>}
        {pane === "workspace" && <Details w={w} onSaved={reload} />}
        {pane === "branding" && <Branding w={w} onSaved={reload} onSeePlans={() => setPane("plan")} />}
        {pane === "page" && <PublicPage w={w} onSaved={reload} />}
      </SubPanel>
    </>
  );
}
