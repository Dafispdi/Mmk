const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const FormData = require("form-data");

module.exports = async (req, res) => {
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
    // Ambil file dari body
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    // Kirim ke Top4Top
    const form = new FormData();
    form.append("file_1", buffer, {
      filename: "upload_" + Date.now() + ".jpg",
      contentType: "application/octet-stream"
    });
    form.append("submit", "Upload");

    const response = await fetch("https://top4top.io/index.php", {
      method: "POST",
      body: form,
      headers: form.getHeaders()
    });

    const html = await response.text();

    // 🎯 Ambil link langsung dan link hapus dari HTML
    const directMatch = html.match(/https?:\/\/[a-z]\.top4top\.io\/p_[a-z0-9]+\.jpg/i);
    const deleteMatch = html.match(/https?:\/\/top4top\.io\/del[^\s'"]+\.html/i);

    const directLink = directMatch ? directMatch[0] : null;
    const deleteLink = deleteMatch ? deleteMatch[0] : null;

    if (!directLink) {
      res.status(500).json({ error: "Upload success, but no direct link found" });
      return;
    }

    res.status(200).json({
      success: true,
      file: directLink,
      delete: deleteLink || "N/A"
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload", message: err.message });
  }
};
