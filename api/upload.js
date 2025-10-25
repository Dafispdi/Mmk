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
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

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

    // 🔍 Tambahkan log isi respon HTML
    console.log("===== HTML FROM TOP4TOP (FIRST 600 CHARS) =====");
    console.log(html.slice(0, 600));
    console.log("==============================================");

    const allLinks = html.match(/https?:\/\/[a-z0-9\-]+\.top4top\.io\/[^\s"'<>]+/gi);
    const fileLink = allLinks?.find(l => /\.(jpg|jpeg|png|gif|pdf|zip|mp4|mp3|webp)$/i.test(l));
    const deleteLink = allLinks?.find(l => /top4top\.io\/del/i.test(l));

    if (!fileLink) {
      res.status(500).json({
        error: "Upload success, but no direct link found",
        debug: html.slice(0, 500)
      });
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
