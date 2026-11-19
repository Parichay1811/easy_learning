import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigationType } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaEllipsisH, FaTimes } from 'react-icons/fa';
import { NavEntry, SideNav } from './ShellNav';
import { groupStarts, useActive } from './shellUtils';
import logoImg from '../../assets/dash/logo.webp';
import mascotImg from '../../assets/dash/mascot.webp';
import './tokens.css';
import s from './shell.module.css';

const PREF_KEY = 'dash.sidebar';
const NARROW = '(max-width: 1279px)';
const SHORT = '(max-height: 500px)'; // landscape phones: always the slim rail

function useMedia(query) {
  const [match, setMatch] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

// DSN-004: moving to another level (a tab, a view, a section, or drilling into an
// id / org / child) eases the new level in, like zooming into it. The time range
// and other filters are NOT levels, so changing them never remounts the page.
const LEVEL_PARAMS = ['tab', 'view', 'section', 'id', 'org', 'child'];
const levelKeyOf = (loc) => {
  const p = new URLSearchParams(loc.search);
  return [loc.pathname, ...LEVEL_PARAMS.map((k) => p.get(k) || '')].join('|');
};

// Back (and Forward) returns to where you were on that page. New pages start at
// the top as before (the role dashboards scroll up when they navigate).
const SCROLL_KEY = 'dash.scroll';
function useScrollMemory(rootRef, level) {
  const location = useLocation();
  const navType = useNavigationType();
  const pos = useRef(0);
  // The shell scrolls itself, so window.scrollTo() in a page does nothing: a new
  // level (not Back / Forward) starts at the top here instead.
  useEffect(() => {
    if (navType !== 'POP') rootRef.current?.scrollTo?.({ top: 0 });
  }, [level, navType, rootRef]);
  useEffect(() => {
    const el = rootRef.current;
    const target = el || window;
    const onScroll = () => { pos.current = el ? el.scrollTop : window.scrollY; };
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => target.removeEventListener('scroll', onScroll);
  }, [rootRef]);
  useEffect(() => {
    const key = location.key;
    const el = rootRef.current;
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem(SCROLL_KEY) || '{}'); } catch { /* storage unavailable */ }
    const timers = [];
    if (navType === 'POP' && saved[key] > 0) {
      const y = saved[key];
      // The page fills in as its data arrives, so try a few times until it is tall enough.
      for (const ms of [0, 120, 360, 800]) {
        timers.push(setTimeout(() => (el ? el.scrollTo({ top: y }) : window.scrollTo({ top: y })), ms));
      }
    }
    return () => {
      timers.forEach(clearTimeout);
      try {
        const next = { ...saved, [key]: pos.current };
        const keys = Object.keys(next);
        if (keys.length > 60) keys.slice(0, keys.length - 60).forEach((k) => delete next[k]);
        sessionStorage.setItem(SCROLL_KEY, JSON.stringify(next));
      } catch { /* storage unavailable: Back starts at the top */ }
    };
  }, [location.key, navType, rootRef]);
}

function readPref() {
  try {
    const v = localStorage.getItem(PREF_KEY);
    return v === 'collapsed' ? true : v === 'expanded' ? false : null;
  } catch {
    return null;
  }
}

// "LEARNIGO · Console" -> "Console". A plain "LEARNIGO" label has no role tag.
function roleOf(b) {
  if (b.role) return b.role;
  return String(b.label || '').replace(/learnigo/i, '').replace(/^[\s·:|–-]+/, '').trim();
}

// The real puppy logo of the learning site; the puppy alone when the menu is narrow.
// `top`: the phone bar's copy, which shrinks to the puppy on the narrowest screens.
function Brand({ brand, collapsed, top }) {
  const b = brand && typeof brand === 'object' && !('props' in brand) ? brand : { node: brand };
  if (b.node) return <div className={s.brand}>{b.node}</div>;
  const role = roleOf(b);
  const body = (
    <>
      {collapsed
        ? <img src={mascotImg} alt="Learnigo" className={s.brandMascot} width="52" height="58" />
        : <img src={logoImg} alt="Learnigo" className={s.brandLogo} width="160" height="58" />}
      {top && <img src={mascotImg} alt="Learnigo" className={s.brandPup} width="36" height="40" />}
      {!collapsed && role && <span className={s.brandRole}>{role}</span>}
    </>
  );
  return b.to ? <Link to={b.to} className={s.brand}>{body}</Link> : <div className={s.brand}>{body}</div>;
}

/**
 * One frame for every role (DSN-001). It does NO routing of its own.
 *
 *   <DashboardShell
 *     brand={{ label: 'LEARNIGO', logo: <img …/>, to: '/' }}
 *     nav={[{ key: 'home', label: 'Overview', icon: FaHome, to: '/parent-dashboard', badge: 2 },
 *           { key: 'tests', label: 'Tests', icon: FaClipboard, onClick: openTests,
 *             children: [{ key: 'upcoming', label: 'Upcoming', to: '/…' }] }]}
 *     active="home"
 *     breadcrumbs={[{ label: 'Sunrise School', to: '/…' }, { label: 'Grade 5' }]}
 *     contextSwitcher={<ChildSwitcher />} topbar={<SearchButton />}
 *     bell={<BellButton />} user={<AvatarMenu />}
 *     actions={<Button variant="ghost">Export</Button>}>
 *     …page…
 *   </DashboardShell>
 *
 * Props
 *   brand            node, or { label, role, to }: shows the Learnigo logo plus a role tag
 *                    ("Parent", "Teacher" …; taken from the label when no role is given)
 *   sideNote         text in the friendly note at the foot of the sidebar; false hides it
 *   zoomKey          what counts as "a new level" for the zoom-in (default: the path plus the
 *                    tab / view / section / id / org / child URL parameters)
 *   nav[]            { key, label, icon (component or element), to | onClick, badge, children?, group? }
 *                    `group` (a short label like "Manage") puts a heading above the first entry of each group
 *   active           key of the current nav item (if omitted the current URL decides)
 *   topbar           slot, grows to fill the bar (search, command palette button)
 *   contextSwitcher  slot, left of the topbar: role / org / child switcher
 *   bell, user       slots, right end of the bar
 *   breadcrumbs[]    { label, to? } the last one is the current page
 *   actions          slot, right of the breadcrumbs (Export …)
 *   theme            'light' | 'dark' | undefined (follow the OS)
 *   fill             true = position: fixed over the whole viewport (for pages that still live under the site Navbar)
 * Under 1280px the sidebar shows icons only; on phones (<= 700px) it becomes a
 * bottom tab bar with at most 5 entries, the rest under "More". On short
 * landscape phones (height <= 500px) it stays a slim side rail with a compact
 * top bar. `--d-topbar-h` on the shell is the bar's height (for sticky rows).
 */
export default function DashboardShell({
  brand, nav = [], active, topbar, breadcrumbs = [], contextSwitcher, bell, user, actions, theme, fill, sideNote, zoomKey, className = '', children,
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const rootRef = useRef(null);
  const level = zoomKey ?? levelKeyOf(location);
  useScrollMemory(rootRef, level);
  const narrow = useMedia(NARROW);
  const short = useMedia(SHORT);
  const [pref, setPref] = useState(readPref);
  const [more, setMore] = useState(false);
  const mainRef = useRef(null);
  const { is, within } = useActive(active);
  const collapsed = short || (pref ?? narrow);

  const toggle = () => {
    const next = !collapsed;
    setPref(next);
    try {
      localStorage.setItem(PREF_KEY, next ? 'collapsed' : 'expanded');
    } catch { /* storage unavailable: preference lasts for this visit only */ }
  };

  // A long menu in a short rail: keep the current entry in view.
  const sideRef = useRef(null);
  useEffect(() => {
    const side = sideRef.current;
    const on = side?.querySelector('[aria-current="page"]');
    if (!side || !on || side.scrollHeight <= side.clientHeight) return;
    const top = on.getBoundingClientRect().top - side.getBoundingClientRect().top + side.scrollTop;
    if (top < side.scrollTop || top + on.offsetHeight > side.scrollTop + side.clientHeight) {
      side.scrollTop = Math.max(0, top - (side.clientHeight - on.offsetHeight) / 2);
    }
  }, [active, location.pathname, collapsed]);

  // Any navigation (Back, a link in the page) closes the "More" sheet.
  const [moreAt, setMoreAt] = useState(location.key);
  if (moreAt !== location.key) { setMoreAt(location.key); if (more) setMore(false); }

  useEffect(() => {
    if (!more) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMore(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [more]);

  const needMore = nav.length > 5;
  const tabs = needMore ? nav.slice(0, 4) : nav;
  const rest = needMore ? nav.slice(4) : [];
  const moreOn = rest.some(within);
  const restStarts = groupStarts(rest);
  // Badges of the entries tucked under "More" add up on the More button.
  const moreBadge = rest.reduce((n, x) => n + (Number(x.badge) || 0), 0);

  return (
    <div
      ref={rootRef}
      className={`dash ${s.shell} ${fill ? s.fill : ''} ${className}`}
      data-scroll-root=""
      data-theme={theme}
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      <a
        href="#dash-main"
        className={s.skip}
        onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}
      >
        {t('dash.shell.skip', { defaultValue: 'Skip to main content' })}
      </a>

      <aside ref={sideRef} className={s.sidebar} data-print="hide">
        <Brand brand={brand} collapsed={collapsed} />
        <nav aria-label={t('dash.shell.nav', { defaultValue: 'Main' })} className={s.sideNav}>
          <SideNav nav={nav} active={active} collapsed={collapsed} />
        </nav>
        {sideNote !== false && (
          <p className={s.sideFoot}>
            <img src={mascotImg} alt="" width="42" height="49" />
            <span>{sideNote || t('dash.shell.note', { defaultValue: 'Every day of learning counts. Little steps grow into big wins!' })}</span>
          </p>
        )}
        <button
          type="button"
          className={s.collapseBtn}
          onClick={toggle}
          aria-pressed={collapsed}
          aria-label={collapsed ? t('dash.shell.expand', { defaultValue: 'Expand menu' }) : t('dash.shell.collapse', { defaultValue: 'Collapse menu' })}
        >
          {collapsed ? <FaAngleDoubleRight aria-hidden="true" /> : <FaAngleDoubleLeft aria-hidden="true" />}
          {!collapsed && <span>{t('dash.shell.collapseShort', { defaultValue: 'Collapse' })}</span>}
        </button>
      </aside>

      <div className={s.column}>
        <header className={s.topbar} data-print="hide">
          <div className={s.topBrand}><Brand brand={brand} collapsed={false} top /></div>
          {contextSwitcher && <div className={s.context}>{contextSwitcher}</div>}
          <div className={s.topSlot}>{topbar}</div>
          {bell && <div className={s.bell}>{bell}</div>}
          {user && <div className={s.user}>{user}</div>}
        </header>

        <main id="dash-main" ref={mainRef} tabIndex={-1} className={s.main}>
          {(breadcrumbs.length > 0 || actions) && (
            <div className={s.crumbRow}>
              {breadcrumbs.length > 0 ? (
                <nav aria-label={t('dash.shell.breadcrumb', { defaultValue: 'Breadcrumb' })} className={s.crumbs}>
                  <ol>
                    {breadcrumbs.map((c, i) => {
                      const last = i === breadcrumbs.length - 1;
                      return (
                        <li key={`${c.label}-${i}`}>
                          {c.to && !last ? <Link to={c.to}>{c.label}</Link> : <span aria-current={last ? 'page' : undefined}>{c.label}</span>}
                        </li>
                      );
                    })}
                  </ol>
                </nav>
              ) : <span />}
              {actions && <div className={s.actions} data-print="hide">{actions}</div>}
            </div>
          )}
          <div key={level} className={s.level}>{children}</div>
        </main>
      </div>

      <nav className={s.tabbar} aria-label={t('dash.shell.navMobile', { defaultValue: 'Main, mobile' })} data-print="hide">
        {tabs.map((item) => (
          <NavEntry key={item.key} item={item} on={within(item)} current={is(item)} variant="tab" />
        ))}
        {needMore && (
          <button type="button" className={`${s.nav_tab} ${moreOn ? s.navOn : ''}`} aria-expanded={more} onClick={() => setMore((v) => !v)}>
            <span className={s.navIcon}><FaEllipsisH aria-hidden="true" /></span>
            <span className={s.navLabel}>{t('dash.shell.more', { defaultValue: 'More' })}</span>
            {moreBadge > 0 && <span className={s.badge}>{moreBadge}</span>}
          </button>
        )}
      </nav>

      {more && (
        <div className={s.sheetWrap} onClick={() => setMore(false)}>
          <div className={s.sheet} role="dialog" aria-modal="true" aria-label={t('dash.shell.more', { defaultValue: 'More' })} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={s.sheetClose} onClick={() => setMore(false)} aria-label={t('dash.shell.close', { defaultValue: 'Close' })} autoFocus>
              <FaTimes aria-hidden="true" />
            </button>
            {rest.map((item, i) => [
              restStarts[i] && <p key={`g-${item.group}`} className={s.sheetGroup} aria-hidden="true">{item.group}</p>,
              <NavEntry key={item.key} item={item} on={within(item)} current={is(item)} variant="sheet" onNavigate={() => setMore(false)} />,
            ])}
          </div>
        </div>
      )}
    </div>
  );
}
