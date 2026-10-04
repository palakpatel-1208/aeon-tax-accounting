const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname);
const port = Number(process.env.PORT) || 4173;
const host = "127.0.0.1";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function send(res, status, body, type) {
  res.writeHead(status, { "Content-Type": type || "text/plain; charset=utf-8" });
  res.end(body);
}

function resolveFile(urlPath) {
  let pathname = decodeURIComponent(urlPath.split("?")[0] || "/");
  if (pathname.endsWith("/")) pathname += "index.html";
  if (pathname === "/") pathname = "/index.html";

  let file = path.resolve(root, "." + path.posix.normalize(pathname));
  if (!file.startsWith(root + path.sep) && file !== root) return null;

  if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;

  // Pretty URLs: /services -> services.html (matches Netlify behavior)
  if (!path.extname(file)) {
    const withHtml = `${file}.html`;
    if (fs.existsSync(withHtml) && fs.statSync(withHtml).isFile()) return withHtml;
  }

  return null;
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url || "/");
  if (!file) return send(res, 404, "Not found");

  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, "Not found");
    send(res, 200, data, mime[path.extname(file)] || "application/octet-stream");
  });
});

server.listen(port, host, () => {
  console.log(`listening http://${host}:${port}`);
});
