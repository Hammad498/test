# Circle AI Coach Backend Handoff Test

This Next.js test harness is for Stage 2 research. It uses dummy users and dummy RAG documents only.

## What it tests

- Plain iframe: Circle renders the tool but does not pass identity automatically.
- Signed token: backend issues and verifies an HMAC-signed token.
- Magic token: backend issues and maps a token to a user/tier.
- Tier-filtered RAG retrieval: backend returns only shared, matching tier, and matching user-specific dummy documents.

## How to test in Circle

1. Deploy this folder to Vercel.
2. Embed the deployed URL in a Circle Site Builder page iframe.
3. Open the Circle page on desktop, mobile browser, and Circle mobile app workarounds.
4. Select `Hammad Abrar - hammadabrar498@gmail.com - 10K`.
5. Click `Issue signed token`.
6. Click `Verify current token`.
7. Click `Ask with verified identity`.
8. Confirm the response allows shared + 10K + Hammad-specific dummy docs and blocks 30K/Alum docs.
9. Repeat with `Issue magic link token`.

## Production recommendation

Use signed-token handoff through the bot backend. Use magic-token handoff as a fallback. Do not use raw email/tier URL params in production.
