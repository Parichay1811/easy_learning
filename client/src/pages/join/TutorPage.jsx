// TCH-082: a tutor's optional public page with a "Join my class" button.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import SEO from "../../components/SEO/SEO";
import { apiCall } from "../teacher/teacherApi";
import "../../components/dashboard/tokens.css";
import s from "./join.module.css";

export default function TutorPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { apiCall(`/join/tutor/${encodeURIComponent(slug)}`).then((r) => (r.ok ? setD(r) : setErr(r.message))); }, [slug]);
  const brand = d?.org?.brandColor || "#5b4fd6";
  return (
    <main className={`dash ${s.page}`}>
      {d && <SEO title={`${d.tutor.name} | ${d.org.name} on Learnigo`} description={d.profile.headline || `${d.tutor.name} tutors on Learnigo.`} path={`/tutor/${slug}`} />}
      <div className={`${s.card} ${s.wide}`}>
        <div className={s.head} style={{ background: brand }}>
          {d?.org?.logoUrl && <img src={d.org.logoUrl} alt="" className={s.logo} />}
          <span>{d?.org?.name || "Learnigo"}</span>
        </div>
        <div className={s.body}>
          {!d && !err && <p>{t("tutorPage.loading", { defaultValue: "Loading…" })}</p>}
          {err && <><h1 className={s.title}>{t("tutorPage.notFound", { defaultValue: "Page not found" })}</h1><Link to="/" className={s.secondary}>{t("join.home", { defaultValue: "Go to Learnigo" })}</Link></>}
          {d && (
            <>
              <div className={s.tutorHead}>
                {d.tutor.photoURL && <img src={d.tutor.photoURL} alt="" className={s.photo} referrerPolicy="no-referrer" />}
                <div>
                  <h1 className={s.title}>{d.tutor.name}</h1>
                  {d.profile.headline && <p className={s.muted} style={{ fontSize: "1.1rem" }}>{d.profile.headline}</p>}
                </div>
              </div>
              <div className={s.chips}>
                {[...(d.profile.subjects || []), ...(d.profile.grades || [])].map((x) => <span key={x} className={s.chip}>{x}</span>)}
                {d.profile.country && <span className={s.chip}>{d.profile.country}</span>}
              </div>
              {d.profile.bio && <p style={{ whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.6 }}>{d.profile.bio}</p>}
              {(d.profile.testimonials || []).map((q, i) => (
                <blockquote key={i} className={s.quote}>“{q.quote}”{q.by && <footer>{q.by}</footer>}</blockquote>
              ))}
              {d.joinCode && <Link to={`/join/${d.joinCode}`} className={s.primary} style={{ background: brand }}>{t("tutorPage.join", { defaultValue: "Join my class" })}</Link>}
              <p className={s.small}>{t("tutorPage.footer", { defaultValue: "Learning on Learnigo: friendly practice in reading, writing, maths and science." })}</p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
