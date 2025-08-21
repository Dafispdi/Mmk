// scripts/cleanup.js
// Hapus entry yang expireAt < now. Tidak menyentuh item tanpa expireAt.

const fs = require("fs");
const path = require("path");

const FILE = process.env.TOKEN_FILE_PATH || "database.json"; // optional: bisa set via Actions env
const full = path.join(process.cwd(), FILE);

function loadJson(p) {
  if (!fs.existsSync(p)) return [];
  const raw = fs.readFileSync(p, "utf8").trim();
  if (!raw) return [];
  try { const j = JSON.parse(raw); return Array.isArray(j) ? j : []; }
  catch { return []; }
}

function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}

function isExpired(item) {
  if (!item || !item.expireAt) return false;
  const t = Date.parse(item.expireAt); // ISO 8601
  if (Number.isNaN(t)) return false;
  return Date.now() > t;
}

(function main() {
  if (!fs.existsSync(full)) {
    console.log(`[cleanup] ${FILE} not found, nothing to do.`);
    process.exit(0);
  }

  const before = loadJson(full);
  const kept   = before.filter(x => !isExpired(x));

  if (kept.length !== before.length) {
    console.log(`[cleanup] removed ${before.length - kept.length} expired user(s).`);
    saveJson(full, kept);
  } else {
    console.log("[cleanup] no expired users.");
  }
})();
