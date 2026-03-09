import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import TopNav from "../components/TopNav.jsx";

function ScoreBadge({ score }) {
  const tone = score >= 80 ? "score-good" : score >= 65 ? "score-medium" : "score-risk";
  return <span className={`score-pill ${tone}`}>{score}/100</span>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [founders, setFounders] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    let mounted = true;

    Promise.all([api.get("/ideas"), api.get("/notifications"), api.get("/profiles/users")])
      .then(([ideasData, notificationData, founderData]) => {
        if (!mounted) return;
        setIdeas(ideasData);
        setNotifications(notificationData.slice(0, 4));
        setFounders(founderData.slice(0, 3));
      })
      .catch((requestError) => mounted && setError(requestError.message))
      .finally(() => mounted && setIsLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  const averageScore = ideas.length > 0 ? Math.round(ideas.reduce((total, idea) => total + idea.analysis.score, 0) / ideas.length) : 0;
  const unreadNotifications = notifications.filter((notification) => !notification.read).length;

  return (
    <main className="page-shell">
      <TopNav />

      <section className="hero-card">
        <div>
          <p className="eyebrow">Founder dashboard</p>
          <h1>Welcome, {user.name || "Founder"}.</h1>
          <p className="lead">
            Validate ideas, meet other founders, send connection requests, and turn good conversations into collaboration.
          </p>
        </div>

        <div className="hero-actions">
          <Link className="secondary-button" to="/create">Submit an idea</Link>
          <button className="ghost-button" type="button" onClick={logout}>Logout</button>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card"><span>Total ideas</span><strong>{ideas.length}</strong></article>
        <article className="stat-card"><span>Average strength</span><strong>{averageScore ? `${averageScore}/100` : "No data yet"}</strong></article>
        <article className="stat-card"><span>Unread notifications</span><strong>{unreadNotifications}</strong></article>
      </section>

      {error ? <p className="form-error">{error}</p> : null}
      {isLoading ? <p className="muted-copy">Loading dashboard...</p> : null}

      <section className="split-layout">
        <div>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Community pipeline</p>
              <h2>Validated startup ideas</h2>
            </div>
          </div>

          {!isLoading && ideas.length === 0 ? (
            <article className="empty-card">
              <h3>No ideas yet</h3>
              <p>Start by submitting your first concept and the platform will generate a score, risks, competitors, budget estimate, and founder advice.</p>
              <Link className="secondary-button" to="/create">Create first idea</Link>
            </article>
          ) : null}

          {ideas.map((idea) => (
            <Link className="idea-card" key={idea.id} to={`/ideas/${idea.id}`}>
              <div className="idea-card-head">
                <div>
                  <p className="eyebrow">{idea.analysis.industry}</p>
                  <h3>{idea.title}</h3>
                </div>
                <ScoreBadge score={idea.analysis.score} />
              </div>
              <p>{idea.description}</p>
              <div className="idea-card-meta">
                <span>{idea.analysis.verdict}</span>
                <span>{idea.analysis.budget.range}</span>
              </div>
              <div className="idea-card-footer">
                <span>By {idea.author?.name || "Unknown founder"}</span>
                <span>{idea.commentCount || 0} comments</span>
              </div>
            </Link>
          ))}
        </div>

        <aside className="sidebar-stack">
          <article className="detail-card">
            <div className="section-heading compact-heading">
              <div>
                <p className="eyebrow">Networking</p>
                <h3>Suggested founders</h3>
              </div>
              <Link className="text-link" to="/network">View all</Link>
            </div>
            <div className="founder-list">
              {founders.map((founder) => (
                <Link key={founder.id} className="founder-card" to={`/profile/${founder.id}`}>
                  <strong>{founder.name}</strong>
                  <span>{founder.headline}</span>
                  <small>{founder.location}</small>
                </Link>
              ))}
            </div>
          </article>

          <article className="detail-card">
            <div className="section-heading compact-heading">
              <div>
                <p className="eyebrow">Alerts</p>
                <h3>Recent notifications</h3>
              </div>
            </div>
            <div className="notification-list">
              {notifications.length === 0 ? <p className="muted-copy">No notifications yet.</p> : notifications.map((notification) => (
                <div key={notification.id} className="notification-card">
                  <strong>{notification.type.replace("_", " ")}</strong>
                  <p>{notification.text}</p>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}
