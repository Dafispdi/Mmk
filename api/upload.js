const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const FormData = require("form-data");

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Only POST method allowed" });
    return;
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const form = new FormData();
    form.append("file_1", buffer, {
      filename: "upload_" + Date.now() + ".bin",
      contentType: "application/octet-stream",
    });
    form.append("submit", "Upload");

    const response = await fetch("https://top4top.io/index.php", {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });

    const html = await response.text();

    // Cari link file
    let link = null;
    const match = html.match(/https?:\/\/[a-z0-9\-]+\.top4top\.io\/[^\s'"]+/i);
    if (match) link = match[0];

    if (link && !link.match(/\.(jpg|png|jpeg|pdf|zip|mp4|mp3|webp)$/i)) {
      const dir = link.split("/")[2].replace(".top4top.io", "");
      const fileCode = (link.match(/\/([a-z0-9_]+)$/i) || [])[1] || "";
      link = `https://${dir}.top4top.io/${fileCode}.jpg`;
    }

    if (!link) {
      res.status(500).json({ error: "Upload success, but link not found" });
      return;
    }

    res.status(200).json({ success: true, link });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload", message: err.message });
  }
};
