// Runs the relay on Node 22.18+ (which can load relay.ts directly):
//   HIVE_API_KEY=... PORT=8787 node server/detector-relay/node.mjs
import http from 'node:http';
import { handle } from './relay.ts';

const port = Number(process.env.PORT ?? 8787);
http
  .createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
    if (!headers.has('x-forwarded-for')) headers.set('x-forwarded-for', req.socket.remoteAddress ?? 'unknown');
    const body = ['GET', 'HEAD'].includes(req.method ?? 'GET') ? undefined : Buffer.concat(chunks);
    const r = await handle(new Request(`http://localhost${req.url}`, { method: req.method, headers, body }), process.env);
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(Buffer.from(await r.arrayBuffer()));
  })
  .listen(port, () => console.log(`VERITAS detection relay on :${port}`));
