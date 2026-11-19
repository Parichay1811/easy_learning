import { createElement, isValidElement } from 'react';
import { useLocation } from 'react-router-dom';

/** Nav icons may be a component (FaHome) or an element (<img/>). */
export const renderIcon = (icon) => {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;
  return createElement(icon, { 'aria-hidden': 'true', focusable: 'false' });
};

/**
 * `is(item)`     -> this exact item is the current page
 * `within(item)` -> the item or one of its children is current
 * With `active` (a nav key) the key decides; without it the URL does.
 */
export function useActive(active) {
  const { pathname } = useLocation();
  const is = (item) => {
    if (active != null) return item.key === active;
    if (!item.to) return false;
    const to = typeof item.to === 'string' ? item.to.split('?')[0] : item.to.pathname || '';
    return pathname === to || (to !== '/' && pathname.startsWith(`${to}/`));
  };
  const within = (item) => is(item) || (item.children || []).some(within);
  return { is, within };
}

/** A heading (or, in the narrow rail, a thin rule) where the `group` of the entries changes. */
export function groupStarts(nav) {
  return nav.map((item, i) => (item.group && item.group !== nav[i - 1]?.group ? item.group : null));
}
