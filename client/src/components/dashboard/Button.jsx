import { Link } from 'react-router-dom';
import s from './cards.module.css';

/**
 * Dashboard button: chunky like the learning pages, 44px tall.
 * variant: 'primary' | 'ghost' | 'soft'. Pass `to` to render a router link.
 *
 *   <Button onClick={retry}>Try again</Button>
 */
export default function Button({ variant = 'primary', to, className = '', children, icon: Icon, size, ...rest }) {
  const cls = `${s.btn} ${s[`btn_${variant}`] || ''} ${size === 'sm' ? s.btnSm : ''} ${className}`;
  const inner = (
    <>
      {Icon && <Icon aria-hidden="true" />}
      <span>{children}</span>
    </>
  );
  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {inner}
    </button>
  );
}
