import fetch from "node-fetch";
import FormData from "form-data";

export default async function handler(req, res) {
  // ✅ Izinkan CORS dari semua origin
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // preflight CORS OK
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST method allowed" });
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

    const upload = await fetch("https://top4top.io/index.php", {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });

    const html = await upload.text();

    const linkMatch = html.match(
      /https?:\/\/[^\s'"]+\.(?:jpg|png|mp4|pdf|zip|mp3|webp)/i
    );
    if (!linkMatch) {
      return res
        .status(500)
        .json({ error: "Upload success, but link not found" });
    }

    res.status(200).json({ success: true, link: linkMatch[0] });
  } catch (err) {
    console.error("Upload error:", err);
    res
      .status(500)
      .json({ error: "Failed to upload", message: err.message });
  }
}
