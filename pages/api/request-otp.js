import crypto from "crypto";
import { users } from "./_data";
import { signToken } from "./_tokens";

const otpSecret = process.env.OTP_SECRET || process.env.TOKEN_SECRET || "local-demo-secret-change-in-production";

function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode(email, code) {
  return crypto.createHmac("sha256", otpSecret).update(`${email}:${code}`).digest("hex");
}

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST required" });

  const email = String(req.body.email || "").trim().toLowerCase();
  const user = users[email];
  if (!user) return res.status(404).json({ error: "Email is not mapped to an active Circle member" });

  const code = makeCode();
  const now = Math.floor(Date.now() / 1000);
  const otpChallenge = signToken({
    purpose: "otp",
    email,
    codeHash: hashCode(email, code),
    iat: now,
    exp: now + 10 * 60
  });

  res.json({
    ok: true,
    email,
    message: "OTP generated. In production this is emailed to the member.",
    devTestCode: code,
    otpChallenge
  });
}
