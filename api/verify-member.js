export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { email } = req.query;
  const CIRCLE_API_TOKEN = process.env.CIRCLE_API_TOKEN;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  if (!CIRCLE_API_TOKEN) {
    return res.status(500).json({ error: "Missing CIRCLE_API_TOKEN environment variable." });
  }

  try {
    const response = await fetch("https://app.circle.so/api/headless/v1/search/community_members", {
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
          }
        ],
        status: "active",
        per_page: 5
      })
    });

    console.log("Circle API Status:", response.status); // Helpful for debugging

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Circle API Error Response:", errorText);
      return res.status(500).json({ 
        error: "Circle API request failed",
        details: response.status 
      });
    }

    const data = await response.json();
    const members = data.data || [];

    const activeMember = members.find(member => 
      member.email?.toLowerCase() === email.toLowerCase()
    );

    if (activeMember) {
      return res.status(200).json({
        verified: true,
        name: `${activeMember.first_name || ''} ${activeMember.last_name || ''}`.trim() || activeMember.name || activeMember.email,
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
    return res.status(500).json({ error: "Internal server error." });
  }
}