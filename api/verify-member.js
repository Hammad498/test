export default async function handler(req, res) {
  // 1. Enable Global Cross-Origin Requests for Testing Flow lines
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { email } = req.query;
  const CIRCLE_API_TOKEN = process.env.CIRCLE_API_TOKEN; // Injected via secure environment vars

  if (!email) {
    return res.status(400).json({ error: "Email target query parameter is required." });
  }

  if (!CIRCLE_API_TOKEN) {
    return res.status(500).json({ error: "Server Configuration Error: Missing master verification key." });
  }

  try {
    // 2. Query Circle's secure administrative production directory endpoints
    const response = await fetch(`https://circle.so{encodeURIComponent(email)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${CIRCLE_API_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      return res.status(500).json({ error: "Circle API server rejected the operational routing block." });
    }

    const members = await response.json();

    // 3. Match user strings inside the active directory dataset returned
    const activeMember = members.find(
      member => member.email.toLowerCase() === email.toLowerCase() && member.status === "active"
    );

    if (activeMember) {
      return res.status(200).json({
        verified: true,
        name: `${activeMember.first_name} ${activeMember.last_name}`,
        id: activeMember.id
      });
    } else {
      return res.status(404).json({
        verified: false,
        error: "No active community workspace account matches this email profile configuration."
      });
    }

  } catch (error) {
    return res.status(500).json({ error: "Internal Gateway execution mapping failure." });
  }
}
