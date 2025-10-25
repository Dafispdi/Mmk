import fetch from "node-fetch";
import FormData from "form-data";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST method allowed" });
    }

    // Terima file upload dari browser
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    // Ekstrak boundary & nama file dari header
    const contentType = req.headers["content-type"] || "";
    const match = contentType.match(/boundary=(.*)$/);
    if (!match) return res.status(400).json({ error: "Invalid form-data" });
    const boundary = match[1];

    // Buat ulang FormData untuk dikirim ke Top4Top
    const form = new FormData();
    form.append("file_1", buffer, {
      filename: "upload_" + Date.now() + ".bin",
      contentType: "application/octet-stream",
    });
    form.append("submit", "Upload");

    // Kirim ke Top4Top
    const upload = await fetch("https://top4top.io/index.php", {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });

    const html = await upload.text();

    // Ambil link hasil upload dari HTML Top4Top
    const linkMatch = html.match(/https?:\/\/[^\s'"]+\.(?:jpg|png|mp4|pdf|zip|mp3|webp)/i);
    if (!linkMatch) {
      return res.status(500).json({ error: "Upload success, but link not found" });
    }

    const fileLink = linkMatch[0];
    res.status(200).json({ success: true, link: fileLink });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: "Failed to upload", message: err.message });
  }
}
