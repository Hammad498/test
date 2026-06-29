import { docs, magicTokens } from "./_data";
import { readBearer, verifyToken } from "./_tokens";

function allowed(doc, identity) {
  if (doc.audience === "shared") return true;
  if (!identity) return false;
  if (doc.audience === identity.tier) return true;
  if (doc.audience === `user:${identity.email}`) return true;
  return false;
}

function identityFromMagic(token) {
  const record = magicTokens.get(String(token || ""));
  if (!record || record.expiresAt < Date.now()) return null;
  return record.user;
}

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST required" });

  let identity = null;
  let method = "none";

  try {
    const bearer = readBearer(req);
    if (bearer) {
      identity = verifyToken(bearer);
      method = "signed-token";
    } else if (req.body.magicToken) {
      identity = identityFromMagic(req.body.magicToken);
      method = "magic-link";
    }
  } catch (error) {
    return res.status(401).json({ ok: false, error: error.message });
  }

  if (!identity) return res.status(401).json({ ok: false, error: "No verified identity" });

  const allowedDocs = docs.filter((doc) => allowed(doc, identity));
  const blockedDocs = docs.filter((doc) => !allowed(doc, identity));

  res.json({
    ok: true,
    method,
    identity: { email: identity.email, name: identity.name, tier: identity.tier },
    question: req.body.question,
    answer: `For ${identity.tier}, I can answer using ${allowedDocs.length} allowed dummy document(s).`,
    allowedDocs,
    blockedDocTitles: blockedDocs.map((doc) => doc.title)
  });
}
