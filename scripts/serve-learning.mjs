import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.argv[process.argv.indexOf("--port") + 1]) || 4198;
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};
http
  .createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const match = pathname.match(
        /^\/(math|chinese|english)-adventure\/(.*)$/,
      );
      const base = match
        ? path.join(repo, match[1] + "-adventure", "dist")
        : path.join(repo, "learning-home");
      const target = path.resolve(
        base,
        match ? match[2] || "index.html" : pathname.slice(1) || "index.html",
      );
      if (!target.startsWith(base + path.sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      const data = await readFile(target);
      res.writeHead(200, {
        "Content-Type":
          types[path.extname(target)] || "application/octet-stream",
      });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`Learning site: http://127.0.0.1:${port}`),
  );
