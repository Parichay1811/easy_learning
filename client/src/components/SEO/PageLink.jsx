import { Link, useNavigate } from "react-router-dom";
import { DEFAULT_LANG, localizedPath, pageFor } from "../../seo/registry";
import { routeLang } from "../../seo/routeLocale";

/**
 * A link to a site page that is right on every language's URLs.
 *
 * Under a language prefix (/es/...) the router puts the prefix in front of
 * every link. That is right for a page published in that language (/es/faq),
 * but:
 *   - a page published in English only (pricing, policy, terms, the country
 *     hub: see seo/registry.js) has no /es/... address: the link would lead
 *     search engines to an app shell, or to a folder with no page. Those links
 *     go to the page's English URL (a full page load; the language shown stays
 *     the reader's choice).
 *   - the start page's address is /es/, but the router writes /es: a second
 *     URL for the same page. Its link says /es/ and still opens in the app.
 */
export default function PageLink({ to, children, onClick, ...rest }) {
  const navigate = useNavigate();
  const page = routeLang ? pageFor(to) : null;

  if (page && !page.langs.includes(routeLang)) {
    return <a href={localizedPath(page.path, DEFAULT_LANG)} onClick={onClick} {...rest}>{children}</a>;
  }
  if (page?.path === "/") {
    const open = (e) => {
      onClick?.(e);
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (rest.target && rest.target !== "_self")) return;
      e.preventDefault();
      navigate("/");
    };
    return <a href={localizedPath("/", routeLang)} onClick={open} {...rest}>{children}</a>;
  }
  return <Link to={to} onClick={onClick} {...rest}>{children}</Link>;
}
