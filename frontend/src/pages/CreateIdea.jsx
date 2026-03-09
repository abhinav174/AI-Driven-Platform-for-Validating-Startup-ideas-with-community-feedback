import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import TopNav from "../components/TopNav.jsx";

export default function CreateIdea() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const idea = await api.post("/ideas", form);
      navigate(`/ideas/${idea.id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page-shell narrow-shell">
      <TopNav />
      <div className="section-heading page-top-gap">
        <div>
          <p className="eyebrow">Idea submission</p>
          <h1>Submit a startup concept for AI validation</h1>
        </div>
        <Link className="text-link" to="/dashboard">Back to dashboard</Link>
      </div>

      <form className="idea-form-card" onSubmit={submit}>
        <label className="field">
          <span>Idea title</span>
          <input type="text" placeholder="AI co-pilot for independent fitness coaches" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea rows="9" placeholder="Explain the target users, the painful problem, why now, and how this startup will make money." value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
        </label>

        <p className="muted-copy">The platform will score strength, estimate budget, surface competitors, highlight likely early problems, and generate founder advice.</p>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" disabled={isLoading}>{isLoading ? "Analyzing idea..." : "Submit and analyze"}</button>
      </form>
    </main>
  );
}
