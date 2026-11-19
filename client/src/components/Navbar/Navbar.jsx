import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./Navbar.module.css";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from "/brand/logo-clean.webp";
import { sfx, isSoundEnabled, setSoundEnabled } from "../../utils/sounds";
import {
  FaHome, FaInfoCircle, FaEnvelope, FaSignOutAlt,
  FaHandPaper, FaLayerGroup, FaGamepad, FaVolumeUp, FaVolumeMute,
  FaGlobe, FaTags, FaShieldAlt, FaFileContract,
} from "react-icons/fa";
import { RiBarChart2Fill } from "react-icons/ri";
import { BsStars } from "react-icons/bs";
import { useAuth } from "../../context/AuthContext";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import AIAssistantWidget from "../AIAssistantWidget/AIAssistantWidget";

// How much room the bar needs, from roomiest to tightest. The bar measures
// itself and takes the first level whose content fits on one line, so the
// links, language, sound switch, greeting and logout never run into each
// other, whatever the width or the language:
//   0 – full pills (icon + word)
//   1 – tighter pills, greeting trimmed, logout as an icon
//   2 – icon-only links (each keeps its name as a tooltip and label)
//   3 – a menu button that opens everything in a panel
const LEVELS = 4;

const LINKS = [
  { to: "/home", key: "navbar.home", def: "Home", Icon: FaHome, color: "navHome" },
  { to: "/games", key: "navbar.games", def: "Games", Icon: FaGamepad, color: "navGames" },
  { to: "/ai-teacher", key: "navbar.aiTeacher", def: "AI Teacher", Icon: BsStars, color: "navAITeacher" },
  { to: "/about-us", key: "navbar.about", def: "About Us", Icon: FaInfoCircle, color: "navAbout" },
  { to: "/contact-us", key: "navbar.contact", def: "Contact Us", Icon: FaEnvelope, color: "navContact" },
];

// Smaller print, only in the menu panel (on the app pages the footer steps aside).
const LEGAL = [
  { to: "/learning-support-by-country", key: "footer.learningSupport", def: "Learning Support", Icon: FaGlobe },
  { to: "/pricing", key: "footer.pricing", def: "Plans", Icon: FaTags },
  { to: "/policy", key: "navbar.policy", def: "Policy", Icon: FaShieldAlt },
  { to: "/terms-and-conditions", key: "navbar.terms", def: "T & C", Icon: FaFileContract },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [level, setLevel] = useState(0);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const barRef = useRef(null);
  const menuRef = useRef(null);
  const linksRef = useRef(null);
  const rightRef = useRef(null);
  const burgerRef = useRef(null);

  const firstName = user?.name?.split(" ")[0] || user?.email?.split("@")[0];

  // A new page closes the menu (adjusting state during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (menuOpen) setMenuOpen(false);
  }

  // Fit: try each level until the row fits. The attribute is set straight on
  // the element so the browser lays out each candidate before React commits
  // the winner, so nothing flickers.
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;
    const fits = () => {
      const menu = menuRef.current;
      const links = linksRef.current;
      const right = rightRef.current;
      if (!menu || !links || !right) return true;
      const gap = parseFloat(getComputedStyle(menu).columnGap) || 0;
      const need = links.getBoundingClientRect().width + right.getBoundingClientRect().width + gap;
      return need <= menu.clientWidth + 0.5;
    };
    const measure = () => {
      for (let lv = 0; lv < LEVELS - 1; lv += 1) {
        bar.dataset.fit = String(lv);
        if (fits()) { setLevel(lv); return; }
      }
      bar.dataset.fit = String(LEVELS - 1);
      setLevel(LEVELS - 1);
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => measure()) : null;
    ro?.observe(bar);
    let alive = true;
    document.fonts?.ready?.then(() => { if (alive) measure(); });
    return () => { alive = false; ro?.disconnect(); };
  }, [user, firstName, i18n.language]);

  const collapsed = level === LEVELS - 1;

  // The open menu closes on Escape or a tap outside it.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") { sfx.close(); setMenuOpen(false); } };
    const onDown = (e) => {
      if (menuRef.current?.contains(e.target) || burgerRef.current?.contains(e.target)) return;
      setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const toggleMenu = () => {
    (menuOpen ? sfx.close : sfx.open)();
    setMenuOpen((o) => !o);
  };
  const handleLogin = () => { closeMenu(); sfx.forward(); navigate("/login"); };
  const handleLogout = async () => {
    closeMenu();
    sfx.back();
    await logout();
    navigate("/");
  };
  const toggleSound = () => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    // Only the switch turning ON makes a sound (turning off is silent).
    if (next) sfx.toggle(true);
  };

  const pillClass = (color) => ({ isActive }) =>
    `${styles.navPill} ${styles[color]} ${isActive ? styles.navPillActive : ""}`;

  const soundLabel = soundOn
    ? t("navbar.soundsOn", { defaultValue: "Sounds on" })
    : t("navbar.soundsOff", { defaultValue: "Sounds off" });

  return (
    <nav className={styles.navbar} data-site-navbar="">
      <div className={styles.bar} ref={barRef} data-fit={level}>
        <Link to="/home" className={styles.logo} onClick={closeMenu}>
          <img src={logo} alt="Learnigo" />
        </Link>

        <div
          ref={menuRef}
          id="site-menu"
          className={`${styles.menu} ${menuOpen ? styles.menuOpen : ""}`}
        >
          <div className={styles.navLinks} ref={linksRef}>
            {LINKS.map(({ to, key, def, color, ...link }) => {
              const Icon = link.Icon;
              const label = t(key, { defaultValue: def });
              return (
                <NavLink key={to} to={to} className={pillClass(color)} onClick={closeMenu} title={level === 2 ? label : undefined} aria-label={label}>
                  <span className={styles.navIconWrap}><Icon className={styles.navIcon} /></span>
                  <span className={styles.linkText}>{label}</span>
                </NavLink>
              );
            })}
            {user && (
              <NavLink
                to="/dashboard"
                className={pillClass("navDash")}
                onClick={closeMenu}
                title={level === 2 ? t("navbar.dashboard") : undefined}
                aria-label={t("navbar.dashboard")}
              >
                <span className={styles.navIconWrap}><RiBarChart2Fill className={styles.navIcon} /></span>
                <span className={styles.linkText}>{t("navbar.dashboard")}</span>
              </NavLink>
            )}
          </div>

          <div className={styles.rightGroup} ref={rightRef}>
            <LanguageSwitcher variant={collapsed ? "menu" : "bar"} />

            <button
              type="button"
              className={`${styles.soundBtn} ${soundOn ? "" : styles.soundOff}`}
              onClick={toggleSound}
              aria-pressed={soundOn}
              aria-label={soundLabel}
              title={soundLabel}
              data-sound="none"
            >
              {soundOn ? <FaVolumeUp /> : <FaVolumeMute />}
              <span className={styles.soundText}>{soundLabel}</span>
            </button>

            {user ? (
              <div className={styles.userArea}>
                <span className={styles.userName} title={t("navbar.greeting", { name: firstName })}>
                  <FaHandPaper className={styles.wave} aria-hidden="true" />
                  <span className={styles.greetFull}>{t("navbar.greeting", { name: firstName })}</span>
                  <span className={styles.greetShort}>{firstName}</span>
                </span>
                <button
                  type="button"
                  className={styles.logout}
                  onClick={handleLogout}
                  aria-label={t("navbar.logout")}
                  title={t("navbar.logout")}
                >
                  <FaSignOutAlt className={styles.loginIcon} />
                  <span className={styles.btnText}>{t("navbar.logout")}</span>
                </button>
              </div>
            ) : (
              <button type="button" className={styles.login} onClick={handleLogin}>
                <FaLayerGroup className={styles.loginIcon} />
                <span>{t("navbar.login")}</span>
              </button>
            )}
          </div>

          {collapsed && (
            <div className={styles.legal}>
              {LEGAL.map((item) => {
                const Icon = item.Icon;
                return (
                  <Link key={item.to} to={item.to} className={styles.legalLink} onClick={closeMenu}>
                    <Icon aria-hidden="true" /> {t(item.key, { defaultValue: item.def })}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {/* A question round is a focused game screen whose answer button sits
              where the floating AI button would; the AI Teacher stays one tap
              away in the links. */}
          {!pathname.startsWith("/module/") && <AIAssistantWidget />}

          <button
            ref={burgerRef}
            type="button"
            className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ""}`}
            onClick={toggleMenu}
            aria-label={t("navbar.menu", { defaultValue: "Menu" })}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            data-sound="none"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
