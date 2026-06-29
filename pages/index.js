import { useEffect, useState } from "react";

export default function Home() {
  const [embedInfo, setEmbedInfo] = useState({ embed: "checking", referrer: "" });
  const [email, setEmail] = useState("hammadabrar498@gmail.com");
  const [token, setToken] = useState("");
  const [session, setSession] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [question, setQuestion] = useState("What session links and recordings can I access?");
  const [error, setError] = useState("");

  useEffect(() => {
    setEmbedInfo({
      embed: window.self !== window.top ? "Inside Circle iframe" : "Direct / mobile web view",
      referrer: document.referrer || "No referrer"
    });

    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setToken(urlToken);
      verifyToken(urlToken);
    }
  }, []);

  async function continueWithEmail(event) {
    event.preventDefault();
    setError("");
    setSession(null);
    setAnswer(null);

    const response = await fetch("/api/issue-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await response.json();

    if (!response.ok) {
      setToken("");
      setError(data.error || "Email is not mapped to a Circle tier in the backend.");
      return;
    }

    setToken(data.token);
    window.history.replaceState({}, "", `/?token=${encodeURIComponent(data.token)}`);
    await verifyToken(data.token);
  }

  async function verifyToken(value = token) {
    setError("");
    const response = await fetch("/api/me", {
      headers: { Authorization: `Bearer ${value}` }
    });
    const data = await response.json();
    setSession(data);
    if (!response.ok) setError(data.error || "Token verification failed.");
  }

  async function askBot() {
    setError("");
    setAnswer(null);

    const response = await fetch("/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ question })
    });
    const data = await response.json();
    setAnswer(data);
    if (!response.ok) setError(data.error || "Ask failed.");
  }

  return (
    <main>
      <section className="card hero">
        <p className="eyebrow">Circle Stage 2 Research</p>
        <h1>AI Coach Tier-Aware Handoff Test</h1>
        <p>
          This is the production-style pattern: Circle opens one shared bot, the bot verifies the
          member email with our backend, and answers are filtered by the member&apos;s mapped tier.
        </p>
        <div className="facts">
          <span>{embedInfo.embed}</span>
          <span>{embedInfo.referrer}</span>
        </div>
      </section>

      <section className="card">
        <h2>1. Continue With Email</h2>
        <p className="small">
          In production this would be an email OTP, magic link, or SSO login. For this engineering
          test, the backend maps known emails to tiers and issues a signed session token.
        </p>
        <form onSubmit={continueWithEmail}>
          <label>Circle member email</label>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="member@example.com"
            inputMode="email"
          />
          <div className="actions">
            <button type="submit">Continue</button>
            <button type="button" className="secondary" onClick={() => verifyToken()} disabled={!token}>
              Re-check session
            </button>
          </div>
        </form>
        {error ? <div className="error">{error}</div> : null}
      </section>

      <section className="card">
        <h2>2. Verified Backend Identity</h2>
        <p className="small">The browser does not choose a tier. The backend returns the mapped tier.</p>
        <Result data={session} empty="No verified session yet." />
      </section>

      <section className="card">
        <h2>3. Ask Tier-Aware RAG Demo</h2>
        <label>Question</label>
        <input value={question} onChange={(event) => setQuestion(event.target.value)} />
        <div className="actions">
          <button onClick={askBot} disabled={!token}>Ask with verified identity</button>
        </div>
        <Result data={answer} empty="No answer yet." />
      </section>

      <section className="card">
        <h2>What To Prove In Circle</h2>
        <ul>
          <li>One shared bot link can be placed in Circle for all members.</li>
          <li>Circle iframe does not pass member identity automatically.</li>
          <li>Backend email/session verification identifies the user and tier.</li>
          <li>RAG retrieval is filtered server-side by shared, tier, and user-specific documents.</li>
        </ul>
      </section>
    </main>
  );
}

function Result({ data, empty }) {
  if (!data) return <div className="result">{empty}</div>;
  return <pre className="result">{JSON.stringify(data, null, 2)}</pre>;
}