export const config = {
  runtime: "nodejs"
};

import fetch from "node-fetch";
import FormData from "form-data";

export default async function handler(req, res) {
  // ✅ Izinkan CORS biar bisa diakses dari browser langsung
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Tangani preflight (CORS OPTIONS)
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // ✅ Batasi hanya method POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Only POST method allowed" });
    return;
  }

  try {
    // Terima file dari browser
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    // Kirim ke Top4Top
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

    // 🔍 Cari link hasil upload dari HTML
    let link = null;
    const match = html.match(/https?:\/\/[a-z0-9\-]+\.top4top\.io\/[^\s'"]+/i);
    if (match) link = match[0];

    // Format ulang link biar langsung ke file
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
}    const html = await response.text();

    // 🔍 Regex baru: ambil link view & link langsung (Top4Top update struktur)
    let link = null;
    const viewLink = html.match(/https?:\/\/[a-z0-9\-]+\.top4top\.io\/[^\s'"]+/i);
    if (viewLink) link = viewLink[0];
    if (link && !link.match(/\.(jpg|png|mp4|zip|pdf|mp3|webp|jpeg)$/i)) {
      const dir = link.split("/")[2].replace(".top4top.io", "");
      const fileCode = (link.match(/\/([a-z0-9_]+)$/i) || [])[1] || "";
      link = `https://${dir}.top4top.io/${fileCode}.jpg`;
    }

    if (!link)
      return res.status(500).json({
        error: "Upload success, but link not found (layout updated again)",
      });

    res.status(200).json({ success: true, link });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload", message: err.message });
  }
}
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
