import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaEllipsisH, FaTimes } from 'react-icons/fa';
import { NavEntry, SideNav } from './ShellNav';
import { useActive } from './shellUtils';
import './tokens.css';
import s from './shell.module.css';

const PREF_KEY = 'dash.sidebar';
const NARROW = '(max-width: 1279px)';

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

function readPref() {
  try {
    const v = localStorage.getItem(PREF_KEY);
    return v === 'collapsed' ? true : v === 'expanded' ? false : null;
  } catch {
    return null;
  }
}

function Brand({ brand, collapsed }) {
  const b = brand && typeof brand === 'object' && !('props' in brand) ? brand : { node: brand };
  if (b.node) return <div className={s.brand}>{b.node}</div>;
  const body = (
    <>
      {b.logo && <span className={s.brandLogo}>{b.logo}</span>}
      <span className={collapsed ? 'd-sr-only' : s.brandText}>{b.label || 'LEARNIGO'}</span>
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
 *   brand            node, or { label, logo, to }
 *   nav[]            { key, label, icon (component or element), to | onClick, badge, children? }
 *   active           key of the current nav item (if omitted the current URL decides)
 *   topbar           slot, grows to fill the bar (search, command palette button)
 *   contextSwitcher  slot, left of the topbar: role / org / child switcher
 *   bell, user       slots, right end of the bar
 *   breadcrumbs[]    { label, to? } the last one is the current page
 *   actions          slot, right of the breadcrumbs (Export …)
 *   theme            'light' | 'dark' | undefined (follow the OS)
 *   fill             true = position: fixed over the whole viewport (for pages that still live under the site Navbar)
 * Under 1280px the sidebar shows icons only; on phones (<= 700px) it becomes a
 * bottom tab bar with at most 5 entries, the rest under "More".
 */
export default function DashboardShell({
  brand, nav = [], active, topbar, breadcrumbs = [], contextSwitcher, bell, user, actions, theme, fill, className = '', children,
}) {
  const { t } = useTranslation();
  const narrow = useMedia(NARROW);
  const [pref, setPref] = useState(readPref);
  const [more, setMore] = useState(false);
  const mainRef = useRef(null);
  const { is, within } = useActive(active);
  const collapsed = pref ?? narrow;

  const toggle = () => {
    const next = !collapsed;
    setPref(next);
    try {
      localStorage.setItem(PREF_KEY, next ? 'collapsed' : 'expanded');
    } catch { /* storage unavailable: preference lasts for this visit only */ }
  };

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

  return (
    <div
      className={`dash ${s.shell} ${fill ? s.fill : ''} ${className}`}
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

      <aside className={s.sidebar} data-print="hide">
        <Brand brand={brand} collapsed={collapsed} />
        <nav aria-label={t('dash.shell.nav', { defaultValue: 'Main' })} className={s.sideNav}>
          <SideNav nav={nav} active={active} collapsed={collapsed} />
        </nav>
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
          <div className={s.topBrand}><Brand brand={brand} collapsed={false} /></div>
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
          {children}
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
          </button>
        )}
      </nav>

      {more && (
        <div className={s.sheetWrap} onClick={() => setMore(false)}>
          <div className={s.sheet} role="dialog" aria-modal="true" aria-label={t('dash.shell.more', { defaultValue: 'More' })} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={s.sheetClose} onClick={() => setMore(false)} aria-label={t('dash.shell.close', { defaultValue: 'Close' })} autoFocus>
              <FaTimes aria-hidden="true" />
            </button>
            {rest.map((item) => (
              <NavEntry key={item.key} item={item} on={within(item)} current={is(item)} variant="sheet" onNavigate={() => setMore(false)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
