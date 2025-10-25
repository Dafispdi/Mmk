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
    // Ambil file dari request
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

    // 🔍 Ambil semua URL dari hasil upload
    const allLinks = html.match(/https?:\/\/[a-z0-9\-]+\.top4top\.io\/[^\s"'<>]+/gi);

    // Ambil link gambar langsung (biasanya file jpg/png/zip/mp4)
    const fileLink = allLinks?.find(l => /\.(jpg|jpeg|png|gif|pdf|zip|mp4|mp3|webp)$/i.test(l));
    // Ambil link hapus (biasanya mengandung /del dan di domain top4top.io tanpa subdomain)
    const deleteLink = allLinks?.find(l => /top4top\.io\/del/i.test(l));

    if (!fileLink) {
      console.error("❌ Tidak menemukan direct link di HTML:", html.slice(0, 500));
      res.status(500).json({ error: "Upload success, but no direct link found" });
      return;
    }

    res.status(200).json({
      success: true,
      file: fileLink,
      delete: deleteLink || "N/A"
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload", message: err.message });
  }
};
