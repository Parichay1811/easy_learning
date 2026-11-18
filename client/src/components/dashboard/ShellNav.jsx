import { Link } from 'react-router-dom';
import { renderIcon, useActive } from './shellUtils';
import s from './shell.module.css';

/** One sidebar / tab-bar / sheet entry. `variant`: 'side' | 'sub' | 'tab' | 'sheet'. */
export function NavEntry({ item, on, current, variant = 'side', onNavigate, collapsed }) {
  const cls = `${s[`nav_${variant}`]} ${on ? s.navOn : ''}`;
  const hideLabel = variant === 'side' && collapsed;
  const inner = (
    <>
      <span className={s.navIcon}>{renderIcon(item.icon)}</span>
      <span className={hideLabel ? 'd-sr-only' : s.navLabel}>{item.label}</span>
      {item.badge != null && item.badge !== 0 && item.badge !== '' && <span className={s.badge}>{item.badge}</span>}
    </>
  );
  const common = {
    className: cls,
    'aria-current': current ? 'page' : undefined,
    title: hideLabel ? item.label : undefined,
    onClick: () => { item.onClick?.(); onNavigate?.(); },
  };
  return item.to ? (
    <Link to={item.to} {...common}>{inner}</Link>
  ) : (
    <button type="button" {...common}>{inner}</button>
  );
}

export function SideNav({ nav, active, collapsed }) {
  const { is, within } = useActive(active);
  return (
    <ul className={s.navList}>
      {nav.map((item) => (
        <li key={item.key}>
          <NavEntry item={item} on={within(item)} current={is(item)} variant="side" collapsed={collapsed} />
          {item.children?.length > 0 && !collapsed && within(item) && (
            <ul className={s.subList}>
              {item.children.map((c) => (
                <li key={c.key}>
                  <NavEntry item={c} on={within(c)} current={is(c)} variant="sub" />
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
