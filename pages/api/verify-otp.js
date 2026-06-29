import crypto from "crypto";
import { users } from "./_data";
import { signToken, verifyToken } from "./_tokens";

const otpSecret = process.env.OTP_SECRET || process.env.TOKEN_SECRET || "local-demo-secret-change-in-production";

function hashCode(email, code) {
  return crypto.createHmac("sha256", otpSecret).update(`${email}:${code}`).digest("hex");
}

function safeEqual(leftValue, rightValue) {
  const left = Buffer.from(String(leftValue || ""));
  const right = Buffer.from(String(rightValue || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST required" });

  const email = String(req.body.email || "").trim().toLowerCase();
  const code = String(req.body.code || "").trim();
  const otpChallenge = String(req.body.otpChallenge || "");

  let challenge;
  try {
    challenge = verifyToken(otpChallenge);
  } catch (error) {
    return res.status(401).json({ error: "OTP challenge expired or invalid. Send a new code." });
  }

  if (challenge.purpose !== "otp") return res.status(401).json({ error: "Invalid OTP purpose" });
  if (challenge.email !== email) return res.status(401).json({ error: "OTP email mismatch" });
  if (!safeEqual(challenge.codeHash, hashCode(email, code))) {
    return res.status(401).json({ error: "Incorrect OTP" });
  }

  const user = users[email];
  if (!user) return res.status(404).json({ error: "Email is not mapped to an active Circle member" });

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
