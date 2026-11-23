// Catches an error while a page draws, so a learner sees the puppy and two
// ways on ("Try again", "Go home") instead of a blank white screen. The error
// goes to the console. It clears itself when `resetKey` changes, so a parent
// that passes the route (location.pathname) gets a fresh try on every page:
//
//   <ErrorBoundary resetKey={location.pathname}>
//     <AnimatedRoutes />
//   </ErrorBoundary>
//
// `fallback` replaces the friendly screen, e.g. fallback={null} around a
// floating layer (captions, reminders) so a crash there only hides it.
//
// Words come from i18next directly (no hook): the boundary must still draw if
// a hook or a translation load is what went wrong.
import { Component } from "react";
import { Link, useInRouterContext } from "react-router-dom";
import i18next from "i18next";
import Mascot from "../Mascot/Mascot";
import { companion } from "../../companion/bus";
import s from "./ErrorBoundary.module.css";

const t = (key, fallback) => {
  try { return i18next.t(key, fallback); } catch { return fallback; }
};

// A router link when there is a router around (keeps the app loaded), a plain
// link otherwise.
function HomeLink({ className, onClick, children }) {
  if (useInRouterContext()) return <Link to="/home" className={className} onClick={onClick}>{children}</Link>;
  return <a href="/home" className={className}>{children}</a>;
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetKey: props.resetKey };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error: error || new Error("Unknown render error") };
  }

  // A new route (or whatever the parent keys on) clears the error.
  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.resetKey) return { error: null, resetKey: props.resetKey };
    return null;
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] A page failed to draw:", error, info?.componentStack || "");
    // The companion comes to this screen and gives a gentle, kind look (never a sad face).
    companion.signal("support");
  }

  reset() {
    this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    return (
      <div className={s.screen} role="alert">
        <div className={s.card}>
          <Mascot size={120} mood="think" butterfly={false} />
          <h1 className={s.title}>{t("errorScreen.title", "Oops! Something went wrong")}</h1>
          <p className={s.text}>
            {t("errorScreen.body", "This page tripped over. Your stars and progress are safe. You can try again or go back home.")}
          </p>
          <div className={s.actions}>
            <button type="button" className={s.primary} onClick={this.reset}>
              {t("errorScreen.retry", "Try again")}
            </button>
            <HomeLink className={s.secondary} onClick={this.reset}>
              {t("errorScreen.home", "Go home")}
            </HomeLink>
          </div>
        </div>
      </div>
    );
  }
}
