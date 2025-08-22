// scripts/cleanup.js
const fs = require("fs");
const path = require("path");

const FILE = process.env.TOKEN_FILE_PATH || "database.json";
const full = path.join(process.cwd(), FILE);

function loadJson(p) {
  if (!fs.existsSync(p)) return [];
  const raw = fs.readFileSync(p, "utf8").trim();
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}
function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}
function isExpired(u) {
  if (!u.expireAt) return false;
  const t = Date.parse(u.expireAt);
  return !Number.isNaN(t) && Date.now() > t;
}

(function main() {
  if (!fs.existsSync(full)) {
    console.log(`[cleanup] ${FILE} not found, nothing to do.`);
    return;
  }
  const before = loadJson(full);
  const kept = before.filter(u => !isExpired(u));
  if (kept.length !== before.length) {
    console.log(`[cleanup] removed ${before.length - kept.length} expired user(s).`);
    saveJson(full, kept);
  } else {
    console.log("[cleanup] no expired users.");
  }
})();
