import { useEffect, useState } from "react";

export default function Home() {
  const [embedInfo, setEmbedInfo] = useState({ embed: "checking", referrer: "" });
  const [email, setEmail] = useState("hammadabrar498@gmail.com");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [token, setToken] = useState("");
  const [session, setSession] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [question, setQuestion] = useState("What session links and recordings can I access?");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setEmbedInfo({
      embed: window.self !== window.top ? "Inside Circle iframe" : "Direct / mobile web view",
      referrer: document.referrer || "No referrer"
    });
  }, []);

  async function requestOtp(event) {
    event.preventDefault();
    setError("");
    setStatus("");
    setSession(null);
    setAnswer(null);
    setToken("");
    setCode("");
    setDevCode("");

    const response = await fetch("/api/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Could not request OTP.");
      return;
    }

    setStatus(data.message);
    setDevCode(data.devTestCode || "");
  }

  async function verifyOtp(event) {
    event.preventDefault();
    setError("");
    setStatus("");

    const response = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code })
    });
    const data = await response.json();

    if (!response.ok) {
      setToken("");
      setSession(null);
      setError(data.error || "OTP verification failed.");
      return;
    }

    setToken(data.token);
    setStatus(data.message);
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
        <h1>Bot Tier-Aware OTP Handoff Test</h1>
        <p>
          This is the production-style pattern: Circle opens one shared bot, the bot verifies email
          ownership with our backend, and answers are filtered by the verified member&apos;s mapped tier.
        </p>
        <div className="facts">
          <span>{embedInfo.embed}</span>
          <span>{embedInfo.referrer}</span>
        </div>
      </section>

      <section className="card">
        <h2>1. Request Email Code</h2>
        <p className="small">
          Production sends this code by email. This test shows the code on-screen so we can verify
          the full flow without connecting an email provider yet.
        </p>
        <form onSubmit={requestOtp}>
          <label>Circle member email</label>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="member@example.com"
            inputMode="email"
          />
          <div className="actions">
            <button type="submit">Send code</button>
          </div>
        </form>
        {devCode ? <div className="notice">Test OTP: <strong>{devCode}</strong></div> : null}
      </section>

      <section className="card">
        <h2>2. Verify Code</h2>
        <form onSubmit={verifyOtp}>
          <label>One-time code</label>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Enter 6-digit code"
            inputMode="numeric"
          />
          <div className="actions">
            <button type="submit" disabled={!devCode}>Verify and continue</button>
            <button type="button" className="secondary" onClick={() => verifyToken()} disabled={!token}>
              Re-check session
            </button>
          </div>
        </form>
        {status ? <div className="notice">{status}</div> : null}
        {error ? <div className="error">{error}</div> : null}
      </section>

      <section className="card">
        <h2>3. Verified Backend Identity</h2>
        <p className="small">The browser does not choose a tier. The backend returns the mapped tier.</p>
        <Result data={session} empty="No verified session yet." />
      </section>

      <section className="card">
        <h2>4. Ask Tier-Aware RAG Demo</h2>
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
          <li>OTP verification proves email ownership before issuing a session.</li>
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