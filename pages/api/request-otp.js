import { otpCodes, users } from "./_data";

function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST required" });

  const email = String(req.body.email || "").trim().toLowerCase();
  const user = users[email];
  if (!user) return res.status(404).json({ error: "Email is not mapped to an active Circle member" });

  const code = makeCode();
  otpCodes.set(email, {
    code,
    user,
    attempts: 0,
    expiresAt: Date.now() + 10 * 60 * 1000
  });

  res.json({
    ok: true,
    email,
    message: "OTP generated. In production this is emailed to the member.",
    devTestCode: code
  });
}