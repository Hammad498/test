import { users } from "./_data";
import { signToken } from "./_tokens";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST required" });

  const user = users[String(req.body.email || "").toLowerCase()];
  if (!user) return res.status(404).json({ error: "User not mapped" });

  const now = Math.floor(Date.now() / 1000);
  const token = signToken({
    sub: user.id,
    name: user.name,
    email: user.email,
    tier: user.tier,
    iat: now,
    exp: now + 60 * 60
  });

  res.json({ token, user, note: "Demo signed token issued by backend API." });
}
