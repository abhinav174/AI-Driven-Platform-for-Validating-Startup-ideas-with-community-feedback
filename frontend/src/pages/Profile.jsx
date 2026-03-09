import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import TopNav from "../components/TopNav.jsx";

export default function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const isOwnProfile = !userId;
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [form, setForm] = useState({ headline: "", bio: "", location: "", interests: "", skills: "", linkedin: "", website: "" });

  function fillForm(data) {
    setForm({
      headline: data.headline || "",
      bio: data.bio || "",
      location: data.location || "",
      interests: (data.interests || []).join(", "),
      skills: (data.skills || []).join(", "),
      linkedin: data.links?.linkedin || "",
      website: data.links?.website || ""
    });
  }

  useEffect(() => {
    const endpoint = isOwnProfile ? "/profiles/me" : `/profiles/users/${userId}`;
    api.get(endpoint)
      .then((data) => {
        setProfile(data);
        if (isOwnProfile) fillForm(data);
      })
      .catch((requestError) => setError(requestError.message));
  }, [isOwnProfile, userId]);

  async function saveProfile(event) {
    event.preventDefault();
    const updated = await api.put("/profiles/me", {
      headline: form.headline,
      bio: form.bio,
      location: form.location,
      interests: form.interests.split(",").map((item) => item.trim()).filter(Boolean),
      skills: form.skills.split(",").map((item) => item.trim()).filter(Boolean),
      links: { linkedin: form.linkedin, website: form.website }
    });
    setProfile(updated);
    localStorage.setItem("user", JSON.stringify({
      ...JSON.parse(localStorage.getItem("user") || "{}"),
      name: updated.name,
      headline: updated.headline,
      location: updated.location
    }));
    setSavedMessage("Profile updated.");
  }

  async function sendConnection() {
    await api.post(`/connections/request/${profile.id}`, {});
    navigate("/network");
  }

  if (error) {
    return <main className="page-shell"><TopNav /><p className="form-error">{error}</p></main>;
  }
  if (!profile) {
    return <main className="page-shell"><TopNav /><p className="muted-copy">Loading profile...</p></main>;
  }

  return (
    <main className="page-shell">
      <TopNav />
      <section className="hero-card page-top-gap">
        <div>
          <p className="eyebrow">Founder profile</p>
          <h1>{profile.name}</h1>
          <p className="lead">{profile.headline}</p>
          <p>{profile.bio}</p>
        </div>
        {!isOwnProfile ? (
          <div className="hero-actions">
            <button type="button" onClick={sendConnection} disabled={Boolean(profile.relationship)}>
              {profile.relationship?.state === "connected" ? "Connected" : profile.relationship?.state === "outgoing" ? "Request sent" : profile.relationship?.state === "incoming" ? "Accept from network page" : "Connect"}
            </button>
            {profile.relationship?.state === "connected" ? <Link className="secondary-button" to={`/messages/${profile.id}`}>Message</Link> : null}
          </div>
        ) : null}
      </section>

      <section className="details-grid network-grid">
        <article className="detail-card">
          <h3>Snapshot</h3>
          <p><strong>Location:</strong> {profile.location}</p>
          <p><strong>Ideas shared:</strong> {profile.stats.ideaCount}</p>
          <p><strong>Connections:</strong> {profile.stats.connectionCount}</p>
          <div className="tag-row">
            {profile.interests?.map((interest) => <span className="tag-chip" key={interest}>{interest}</span>)}
          </div>
          <div className="tag-row">
            {profile.skills?.map((skill) => <span className="tag-chip" key={skill}>{skill}</span>)}
          </div>
        </article>

        <article className="detail-card full-width">
          <h3>Ideas from this founder</h3>
          <div className="founder-list">
            {profile.ideas.length === 0 ? <p className="muted-copy">No ideas shared yet.</p> : profile.ideas.map((idea) => (
              <Link className="founder-card" key={idea.id} to={`/ideas/${idea.id}`}>
                <strong>{idea.title}</strong>
                <span>{idea.analysis.industry}</span>
                <small>{idea.analysis.verdict}</small>
              </Link>
            ))}
          </div>
        </article>

        {isOwnProfile ? (
          <article className="detail-card full-width">
            <h3>Edit profile</h3>
            <form className="idea-form-card slim-card" onSubmit={saveProfile}>
              <label className="field"><span>Headline</span><input value={form.headline} onChange={(event) => setForm({ ...form, headline: event.target.value })} /></label>
              <label className="field"><span>Bio</span><textarea rows="4" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label>
              <label className="field"><span>Location</span><input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label>
              <label className="field"><span>Interests</span><input value={form.interests} onChange={(event) => setForm({ ...form, interests: event.target.value })} placeholder="AI, EdTech, FinTech" /></label>
              <label className="field"><span>Skills</span><input value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} placeholder="Product, Growth, Design" /></label>
              <label className="field"><span>LinkedIn</span><input value={form.linkedin} onChange={(event) => setForm({ ...form, linkedin: event.target.value })} /></label>
              <label className="field"><span>Website</span><input value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} /></label>
              {savedMessage ? <p className="muted-copy">{savedMessage}</p> : null}
              <button type="submit">Save profile</button>
            </form>
          </article>
        ) : null}
      </section>
    </main>
  );
}
