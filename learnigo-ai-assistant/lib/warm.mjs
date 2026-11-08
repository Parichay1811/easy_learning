// Which model to ask. Ollama on a small machine keeps one model in memory,
// and swapping models while another job (the pack factory) is using one can
// take minutes or never happen. So a call uses the preferred model when it is
// loaded or nothing is, and otherwise the model that is already loaded, with
// the context size it was loaded with (a different size makes Ollama reload).
export function createWarm(host = 'http://127.0.0.1:11434') {
  let cache = { at: 0, models: [] };
  async function loaded() {
    if (Date.now() - cache.at < 5000) return cache.models;
    try {
      const res = await fetch(`${host}/api/ps`, { signal: AbortSignal.timeout(1500) });
      const { models = [] } = await res.json();
      cache = { at: Date.now(), models: models.filter((m) => !/embed|bge|nomic/i.test(m.name)) };
    } catch { cache = { at: Date.now(), models: [] }; }
    return cache.models;
  }
  // { model, ctx, swapped }: swapped is true when the preferred model is not the one used.
  return async function pick(preferred) {
    const models = await loaded();
    const mine = models.find((m) => m.name === preferred || m.model === preferred);
    if (mine) return { model: preferred, ctx: mine.context_length || null, swapped: false };
    if (models.length) return { model: models[0].name, ctx: models[0].context_length || null, swapped: true };
    return { model: preferred, ctx: null, swapped: false };
  };
}
