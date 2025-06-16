import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });

  const domain = process.env.PTERO_DOMAIN;
  const apikey = process.env.PTERO_API_KEY;
  if (!domain || !apikey) return res.status(500).json({ error: "Domain/APIKEY not set" });

  const username = name.trim().toLowerCase().replace(/\s+/g, '');
  const email = `${username}@admin.com`;
  const capital = str => str.charAt(0).toUpperCase() + str.slice(1);
  const password = username + crypto.randomBytes(2).toString('hex');

  const resp = await fetch(`${domain}/api/application/users`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apikey
    },
    body: JSON.stringify({
      email,
      username,
      first_name: capital(name),
      last_name: "Admin",
      root_admin: true,
      language: "en",
      password
    })
  });

  const data = await resp.json();
  if (data.errors) return res.status(400).json({ error: JSON.stringify(data.errors[0], null, 2) });

  return res.status(200).json({ username, email, password });
}
