export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Change to your domain in production
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { email } = req.query;
  const CIRCLE_API_TOKEN = process.env.CIRCLE_API_TOKEN;

  if (!email) {
    return res.status(400).json({ error: "Email query parameter is required." });
  }

  if (!CIRCLE_API_TOKEN) {
    return res.status(500).json({ error: "Server Configuration Error: Missing CIRCLE_API_TOKEN" });
  }

  try {
    // Using Circle Admin API v2 (recommended)
    const response = await fetch(`https://app.circle.so/api/headless/admin/v1/search/community_members`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CIRCLE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        filters: [
          {
            key: "email",
            filter_type: "is",
            value: email.toLowerCase()
          },
          {
            key: "status",
            filter_type: "is",
            value: "active"
          }
        ],
        per_page: 10
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Circle API error:", errorText);
      return res.status(500).json({ error: "Circle API request failed" });
    }

    const data = await response.json();
    const members = data.records || [];

    const activeMember = members.find(member => 
      member.email?.toLowerCase() === email.toLowerCase()
    );

    if (activeMember) {
      return res.status(200).json({
        verified: true,
        name: `${activeMember.first_name || ''} ${activeMember.last_name || ''}`.trim() || activeMember.name,
        id: activeMember.id,
        email: activeMember.email
      });
    } else {
      return res.status(404).json({
        verified: false,
        error: "No active member found with this email."
      });
    }

  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ error: "Internal server error during verification." });
  }
}