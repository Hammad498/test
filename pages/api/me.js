import { readBearer, verifyToken } from "./_tokens";

export default function handler(req, res) {
  try {
    const identity = verifyToken(readBearer(req));
    res.json({ ok: true, method: "signed-token", identity });
  } catch (error) {
    res.status(401).json({ ok: false, error: error.message });
  }
}
