import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createDatabase } from "./database.js";

const root = join(fileURLToPath(new URL("..", import.meta.url)));
const serverDir = join(root, "server");
if (!existsSync(serverDir)) mkdirSync(serverDir, { recursive: true });

const db = createDatabase(join(serverDir, "nutrition.db"));
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

function sendJson(res, status, data) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function badRequest(res, message) {
  sendJson(res, 400, { error: message });
}

async function handleApi(req, res, url) {
  try {
    if (req.method === "GET" && url.pathname === "/api/state") {
      const date = url.searchParams.get("date");
      if (!date) return badRequest(res, "date is required");
      return sendJson(res, 200, db.getState(date));
    }

    if (req.method === "GET" && url.pathname === "/api/history") {
      return sendJson(res, 200, db.getHistory(url.searchParams.get("days") || 30));
    }

    if (req.method === "POST" && url.pathname === "/api/entries") {
      const body = await readJson(req);
      if (!body.date || !body.meal || !body.foodName || !(body.grams > 0)) return badRequest(res, "invalid entry");
      return sendJson(res, 201, db.addEntry(body));
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/api/entries/")) {
      db.deleteEntry(decodeURIComponent(url.pathname.split("/").pop()));
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "POST" && url.pathname === "/api/custom-foods") {
      const body = await readJson(req);
      if (!body.name || !(body.defaultGrams > 0)) return badRequest(res, "invalid food");
      return sendJson(res, 201, db.addCustomFood(body));
    }

    if (req.method === "POST" && url.pathname === "/api/weights") {
      const body = await readJson(req);
      if (!body.date || !(body.weight > 0)) return badRequest(res, "invalid weight");
      return sendJson(res, 200, db.saveWeight(body));
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/api/day/")) {
      db.clearDay(decodeURIComponent(url.pathname.split("/").pop()));
      return sendJson(res, 200, { ok: true });
    }

    sendJson(res, 404, { error: "not found" });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}

async function serveStatic(req, res, url) {
  const requestPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const fullPath = normalize(join(root, requestPath));
  if (!fullPath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  try {
    const file = await readFile(fullPath);
    res.writeHead(200, { "content-type": types[extname(fullPath)] || "application/octet-stream" });
    res.end(file);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

const app = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/")) {
    handleApi(req, res, url);
  } else {
    serveStatic(req, res, url);
  }
});

app.listen(port, host, () => {
  console.log(`营养记录器服务已启动: http://localhost:${port}/`);
});

