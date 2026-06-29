import crypto from "crypto";
import { magicTokens, users } from "./_data";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST required" });

  const user = users[String(req.body.email || "").toLowerCase()];
  if (!user) return res.status(404).json({ error: "User not mapped" });

  const magicToken = `magic_${crypto.randomBytes(12).toString("hex")}`;
  magicTokens.set(magicToken, {
    user,
    expiresAt: Date.now() + 60 * 60 * 1000
  });

  res.json({ magicToken, user, note: "Demo magic token stored by backend API." });
}
