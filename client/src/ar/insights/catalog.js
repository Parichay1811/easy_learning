/**
 * The camera-game catalogue, slimmed to what the findings engine needs (id,
 * title, domains, engine, group) so it can suggest a game to play next. The
 * app bundles the AR section with every page already (App.jsx imports it
 * statically), so the dashboards reuse it at no extra cost.
 */
import { GAMES } from '../catalog/games'

export const slimCatalog = (games) =>
  (games || []).map((g) => ({ id: g.id, title: g.title, domains: g.domains || [], engine: g.engine, group: g.group }))

export const CATALOG = slimCatalog(GAMES)
