import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerSyncRoutes } from "../sync";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Remote sync routes
  registerSyncRoutes(app);

  // ── Solana RPC proxy (avoids CORS issues from browser) ──
  // Accepts: POST /api/solana-rpc  body: either object or array of JSON-RPC requests
  app.post('/api/solana-rpc', async (req, res) => {
    const SOLANA_RPCS = [
      'https://api.mainnet-beta.solana.com',
      'https://rpc.ankr.com/solana',
    ];
    let payload = req.body;
    if (!Array.isArray(payload) && typeof payload === 'object' && payload !== null && !payload.jsonrpc) {
      payload = { jsonrpc: '2.0', id: 1, method: payload.method, params: payload.params };
    }
    let lastError: Error | null = null;
    for (const rpc of SOLANA_RPCS) {
      try {
        const resp = await fetch(rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        });
        if (!resp.ok) throw new Error(`RPC ${rpc} returned ${resp.status}`);
        const data = await resp.json();
        return res.json(data);
      } catch (e: any) {
        console.warn('[SolanaProxy] RPC failed:', rpc, e?.message);
        lastError = e;
      }
    }
    res.status(502).json({ error: 'All Solana RPC endpoints failed', detail: lastError?.message });
  });

  // ── CryptoPanic News Proxy (avoids CORS & hides API Key) ──
  app.get('/api/cryptopanic/news', async (req, res) => {
    try {
      const { kind = 'news', filter = 'hot', currencies, regions } = req.query;
      const apiKey = '3b77795175017cec84b13b3b5f82b12a86683aaa';
      const baseUrl = 'https://cryptopanic.com/api/developer/v2/posts/';
      
      let urlStr = baseUrl + '?auth_token=' + apiKey + '&public=true';
      if (typeof kind === 'string') urlStr += `&kind=${kind}`;
      if (typeof filter === 'string') urlStr += `&filter=${filter}`;
      if (typeof currencies === 'string') urlStr += `&currencies=${currencies}`;
      if (typeof regions === 'string') urlStr += `&regions=${regions}`;

      const response = await fetch(urlStr, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BlockStock/1.0'
        }
      });
      
      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Proxy] CryptoPanic API responded with ${response.status}:`, errText);
        throw new Error(`API responded with ${response.status}: ${errText.substring(0, 100)}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('[Proxy] CryptoPanic API error:', error.message);
      res.status(500).json({ error: 'Failed to fetch CryptoPanic', details: error.message });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
