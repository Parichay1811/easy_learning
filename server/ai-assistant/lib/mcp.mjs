// A small MCP server (Model Context Protocol, Streamable HTTP with JSON
// replies) over the teacher's tools, so any MCP client can use the same
// teacher as the website: POST /mcp with JSON-RPC 2.0.
//   initialize, notifications/initialized, ping, tools/list, tools/call
const PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];

export function createMcp(tools, { name = 'learnigo-live-teacher', version = '0.2.0' } = {}) {
  const ok = (id, result) => ({ jsonrpc: '2.0', id, result });
  const fail = (id, code, message) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

  // One JSON-RPC message in, the reply out (null for notifications).
  async function handle(msg) {
    if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') return fail(msg?.id, -32600, 'invalid request');
    const { id, method } = msg;
    const params = msg.params && typeof msg.params === 'object' ? msg.params : {};
    if (id === undefined) return null;
    if (method === 'initialize') {
      return ok(id, {
        protocolVersion: PROTOCOLS.includes(params.protocolVersion) ? params.protocolVersion : PROTOCOLS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name, version },
        instructions: 'A teacher for school students. Use ask_teacher for anything a student asks; search_knowledge and use_card to teach from checked answers; solve_* for maths with numbers. Answers come from checked lesson packs.',
      });
    }
    if (method === 'ping') return ok(id, {});
    if (method === 'tools/list') return ok(id, { tools: tools.list() });
    if (method === 'tools/call') {
      try {
        const out = await tools.call(params.name, params.arguments || {});
        return ok(id, { content: [{ type: 'text', text: out.text }], structuredContent: out.plan ? { plan: out.plan } : { data: out.data } });
      } catch (e) {
        if (e.code === -32602 && /unknown tool/.test(e.message)) return fail(id, -32602, e.message);
        return ok(id, { content: [{ type: 'text', text: e.message }], isError: true });
      }
    }
    return fail(id, -32601, `method not found: ${method}`);
  }

  return { handle };
}
