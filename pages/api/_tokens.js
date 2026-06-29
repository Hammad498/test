import crypto from "crypto";

const secret = process.env.TOKEN_SECRET || "local-demo-secret-change-in-production";

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

export function signToken(payload) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  const input = `${header}.${body}`;
  const signature = crypto.createHmac("sha256", secret).update(input).digest("base64url");
  return `${input}.${signature}`;
}

export function verifyToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");

  const [header, body, signature] = parts;
  const input = `${header}.${body}`;
  const expected = crypto.createHmac("sha256", secret).update(input).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (payload.exp && payload.exp * 1000 < Date.now()) throw new Error("Token expired");
  return payload;
}

export function readBearer(req) {
  const value = req.headers.authorization || "";
  if (!value.startsWith("Bearer ")) return "";
  return value.slice("Bearer ".length);
}
