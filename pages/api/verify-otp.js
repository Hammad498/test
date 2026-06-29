import { otpCodes } from "./_data";
import { signToken } from "./_tokens";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST required" });

  const email = String(req.body.email || "").trim().toLowerCase();
  const code = String(req.body.code || "").trim();
  const record = otpCodes.get(email);

  if (!record) return res.status(404).json({ error: "No active OTP for this email" });
  if (record.expiresAt < Date.now()) {
    otpCodes.delete(email);
    return res.status(401).json({ error: "OTP expired" });
  }
  if (record.attempts >= 5) {
    otpCodes.delete(email);
    return res.status(429).json({ error: "Too many incorrect attempts" });
  }
  if (record.code !== code) {
    record.attempts += 1;
    return res.status(401).json({ error: "Incorrect OTP" });
  }

  otpCodes.delete(email);
  const user = record.user;
  const now = Math.floor(Date.now() / 1000);
  const token = signToken({
    sub: user.id,
    name: user.name,
    email: user.email,
    tier: user.tier,
    iat: now,
    exp: now + 60 * 60
  });

  res.json({ ok: true, token, user, message: "Email ownership verified. Signed session issued." });
}