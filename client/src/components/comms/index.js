// Shared communication components (FND-050..052). Each works for any signed-in
// role: pass `role` ('parent' | 'teacher' | 'admin' | 'superadmin') or let it
// pick the token for the current page. Use inside the dashboard shell (.dash).
//
//   import { NotificationBell, NotificationPrefs, MessageCenter, AnnouncementsPanel, AnnouncementComposer } from '../../components/comms';
export { default as NotificationBell } from './NotificationBell';
export { default as NotificationPrefs } from './NotificationPrefs';
export { default as MessageCenter } from './MessageCenter';
export { default as AnnouncementsPanel } from './AnnouncementsPanel';
export { default as AnnouncementComposer } from './AnnouncementComposer';
export { api, download, currentActor, signedInRoles } from './commsApi';
export { default as usePoll } from './usePoll';
