// Dev gallery for the comms layer: bell, messages, announcements, preferences
// and the printable report, live against the API as whichever role is signed in.
// Route: /dev/comms (dev or VITE_ENABLE_DEV_PAGES=1). Sign in by putting a token
// in localStorage, or open /dev/comms?as=parent&token=<jwt> once (dev only).
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaBell, FaBullhorn, FaCog, FaCommentDots, FaFileAlt, FaPen } from 'react-icons/fa';
import { DashboardShell, EmptyState } from '../../components/dashboard';
import { AnnouncementComposer, AnnouncementsPanel, MessageCenter, NotificationBell, NotificationPrefs, api, signedInRoles } from '../../components/comms';
import ReportView from '../../components/reports/ReportView';

const KEY = { parent: 'parent_jwt', teacher: 'teacher_jwt', admin: 'admin_jwt', superadmin: 'superadmin_jwt', student: 'jwt_token' };
const SECTIONS = [
  { key: 'messages', label: 'Messages', icon: FaCommentDots, roles: ['parent', 'teacher', 'admin'] },
  { key: 'announcements', label: 'Announcements', icon: FaBullhorn },
  { key: 'compose', label: 'Compose', icon: FaPen, roles: ['teacher', 'admin', 'superadmin'] },
  { key: 'report', label: 'Report', icon: FaFileAlt, roles: ['parent', 'teacher', 'admin', 'superadmin'] },
  { key: 'settings', label: 'Notifications', icon: FaCog },
];

// Report endpoint for the role: the first child / all my students / the school / the first org.
function useReportTarget(role) {
  const [target, setTarget] = useState(null);
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        if (role === 'parent') {
          const r = await api('/parent/children', { role });
          const c = r.children.find((x) => x.linkStatus === 'verified');
          if (live) setTarget(c ? { endpoint: `/reports/parent/children/${c._id}` } : { none: true });
        } else if (role === 'teacher') setTarget({ endpoint: '/reports/teacher/all' });
        else if (role === 'admin') setTarget({ endpoint: '/reports/admin/org', exportEndpoint: '/reports/admin/org/learners.export' });
        else if (role === 'superadmin') {
          const r = await api('/superadmin/organizations', { role });
          const org = (r.organizations || r.orgs || r.data || []).find((o) => o.adminOrgId);
          if (live) setTarget(org ? { endpoint: `/reports/superadmin/organizations/${org._id}` } : { none: true });
        }
      } catch { if (live) setTarget({ none: true }); }
    })();
    return () => { live = false; };
  }, [role]);
  return target;
}

export default function CommsGallery() {
  const [params, setParams] = useSearchParams();
  // One-time sign-in from the URL (dev page only), then drop the token from the address bar.
  const [roles, setRoles] = useState(() => {
    const as = params.get('as'), token = params.get('token');
    if (as && token && KEY[as]) { try { localStorage.setItem(KEY[as], token); } catch { /* private mode */ } }
    return signedInRoles();
  });
  useEffect(() => {
    if (params.get('token')) setParams((p) => { const n = new URLSearchParams(p); n.delete('token'); return n; }, { replace: true });
  }, [params, setParams]);
  const [role, setRole] = useState(() => params.get('as') || roles[0] || null);
  const [section, setSection] = useState(() => params.get('s') || 'messages');
  const theme = params.get('theme') === 'dark' ? 'dark' : params.get('theme') === 'light' ? 'light' : undefined;
  const target = useReportTarget(role);
  const visible = SECTIONS.filter((x) => !x.roles || x.roles.includes(role));
  const active = visible.some((x) => x.key === section) ? section : visible[0]?.key;

  return (
    <DashboardShell
      fill
      theme={theme}
      brand={{ label: 'LEARNIGO', to: '/dev/comms' }}
      nav={visible.map((x) => ({ key: x.key, label: x.label, icon: x.icon, onClick: () => setSection(x.key) }))}
      active={active}
      breadcrumbs={[{ label: 'Dev' }, { label: 'Comms gallery' }]}
      contextSwitcher={roles.length > 1 && (
        <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          <span>As</span>
          <select value={role || ''} onChange={(e) => { setRole(e.target.value); setRoles(signedInRoles()); }} style={{ minHeight: 40, borderRadius: 12, padding: '0 10px', font: 'inherit' }}>
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
      )}
      bell={role && role !== 'student' ? <NotificationBell key={role} role={role} onOpenSettings={() => setSection('settings')} onNavigate={(link) => { const m = link.match(/thread=([a-f0-9]{24})/); if (m) setSection('messages'); }} /> : <FaBell aria-hidden="true" />}
    >
      {!role && (
        <EmptyState title="Sign in first" text="Put a role token in localStorage (parent_jwt, teacher_jwt, admin_jwt, superadmin_jwt), or open /dev/comms?as=parent&token=… once. Tokens for the demo server are in server/tmp/demo.json." />
      )}
      {role && active === 'messages' && <MessageCenter key={role} role={role} initialThreadId={params.get('thread') || undefined} />}
      {role && active === 'announcements' && <AnnouncementsPanel key={role} role={role} />}
      {role && active === 'compose' && <AnnouncementComposer key={role} role={role} />}
      {role && active === 'settings' && <NotificationPrefs key={role} role={role} />}
      {role && active === 'report' && (
        target?.endpoint ? <ReportView key={role} role={role} endpoint={target.endpoint} exportEndpoint={target.exportEndpoint} />
          : target?.none ? <EmptyState title="Nothing to report on yet" text="This account has no verified learner or organisation." /> : null
      )}
    </DashboardShell>
  );
}
