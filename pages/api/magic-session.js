import { magicTokens } from "./_data";

export default function handler(req, res) {
  const record = magicTokens.get(String(req.query.magic_token || ""));
  if (!record) return res.status(401).json({ ok: false, error: "Unknown magic token" });
  if (record.expiresAt < Date.now()) return res.status(401).json({ ok: false, error: "Magic token expired" });

  res.json({ ok: true, method: "magic-link", identity: record.user });
}
