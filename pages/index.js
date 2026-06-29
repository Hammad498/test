import { useEffect, useMemo, useState } from "react";

const demoUsers = [
  { email: "hammadabrar498@gmail.com", name: "Hammad Abrar", tier: "10K" },
  { email: "test30k@example.com", name: "Test 30K User", tier: "30K" },
  { email: "alum@example.com", name: "Test Alum User", tier: "Alum" }
];

export default function Home() {
  const [embedInfo, setEmbedInfo] = useState({ embed: "checking", referrer: "" });
  const [selectedEmail, setSelectedEmail] = useState(demoUsers[0].email);
  const [token, setToken] = useState("");
  const [magicToken, setMagicToken] = useState("");
  const [session, setSession] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [question, setQuestion] = useState("What session links and recordings can I access?");

  const currentUser = useMemo(
    () => demoUsers.find((user) => user.email === selectedEmail) || demoUsers[0],
    [selectedEmail]
  );

  useEffect(() => {
    setEmbedInfo({
      embed: window.self !== window.top ? "Inside iframe" : "Direct / app web view",
      referrer: document.referrer || "No referrer"
    });

    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    const urlMagic = params.get("magic_token");
    if (urlToken) {
      setToken(urlToken);
      verifyToken(urlToken);
    }
    if (urlMagic) {
      setMagicToken(urlMagic);
      verifyMagic(urlMagic);
    }
  }, []);

  async function issueToken() {
    const response = await fetch("/api/issue-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: currentUser.email })
    });
    const data = await response.json();
    setToken(data.token);
    setMagicToken("");
    setSession(null);
    setAnswer(null);
    window.history.replaceState({}, "", `/?token=${encodeURIComponent(data.token)}`);
  }

  async function issueMagic() {
    const response = await fetch("/api/issue-magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: currentUser.email })
    });
    const data = await response.json();
    setMagicToken(data.magicToken);
    setToken("");
    setSession(null);
    setAnswer(null);
    window.history.replaceState({}, "", `/?magic_token=${encodeURIComponent(data.magicToken)}`);
  }

  async function verifyToken(value = token) {
    const response = await fetch("/api/me", {
      headers: { Authorization: `Bearer ${value}` }
    });
    setSession(await response.json());
  }

  async function verifyMagic(value = magicToken) {
    const response = await fetch(`/api/magic-session?magic_token=${encodeURIComponent(value)}`);
    setSession(await response.json());
  }

  async function askBot() {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const body = magicToken ? { question, magicToken } : { question };
    const response = await fetch("/api/ask", {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    setAnswer(await response.json());
  }

  return (
    <main>
      <section className="card hero">
        <p className="eyebrow">Circle Stage 2 Research</p>
        <h1>AI Coach Backend Handoff Test</h1>
        <p>
          This proves the real production pattern: Circle opens the bot, our backend identifies the
          user/tier, and RAG retrieval only uses allowed documents.
        </p>
        <div className="facts">
          <span>{embedInfo.embed}</span>
          <span>{embedInfo.referrer}</span>
        </div>
      </section>

      <section className="card">
        <h2>1. Pick a Test Client</h2>
        <label>Email / tier</label>
        <select value={selectedEmail} onChange={(event) => setSelectedEmail(event.target.value)}>
          {demoUsers.map((user) => (
            <option key={user.email} value={user.email}>
              {user.name} - {user.email} - {user.tier}
            </option>
          ))}
        </select>
        <div className="actions">
          <button onClick={issueToken}>Issue signed token</button>
          <button onClick={issueMagic} className="secondary">Issue magic link token</button>
        </div>
      </section>

      <section className="card">
        <h2>2. Verify Identity Handoff</h2>
        <p className="small">Signed token and magic token are both verified by backend API routes.</p>
        <pre>{token || magicToken || "No token issued yet."}</pre>
        <div className="actions">
          <button onClick={() => token ? verifyToken() : verifyMagic()}>
            Verify current token
          </button>
        </div>
        <Result data={session} />
      </section>

      <section className="card">
        <h2>3. Ask Tier-Aware RAG Demo</h2>
        <label>Question</label>
        <input value={question} onChange={(event) => setQuestion(event.target.value)} />
        <div className="actions">
          <button onClick={askBot}>Ask with verified identity</button>
        </div>
        <Result data={answer} />
      </section>

      <section className="card">
        <h2>What This Proves</h2>
        <ul>
          <li>Plain Circle iframe does not provide member identity automatically.</li>
          <li>Signed-token handoff works as the best production pattern.</li>
          <li>Magic-link handoff works as a simpler fallback.</li>
          <li>Backend can filter RAG docs by shared, tier, and user-specific access.</li>
        </ul>
      </section>
    </main>
  );
}

function Result({ data }) {
  if (!data) return <div className="result">No result yet.</div>;
  return <pre className="result">{JSON.stringify(data, null, 2)}</pre>;
}
