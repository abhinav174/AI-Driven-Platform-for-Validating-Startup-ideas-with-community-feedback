import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await api.post("/auth/register", form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="brand-panel">
        <p className="eyebrow">Founder workspace</p>
        <h1>Turn raw startup concepts into scored, critique-ready opportunities.</h1>
        <p className="lead">
          Create an account to submit ideas, review AI-generated risks and
          budgets, and invite community comments.
        </p>
      </section>

      <form className="auth-card" onSubmit={submit}>
        <div>
          <p className="eyebrow">Start building</p>
          <h2>Register</h2>
        </div>

        <label className="field">
          <span>Name</span>
          <input
            type="text"
            placeholder="Anirudh"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </label>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            placeholder="founder@example.com"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            placeholder="At least 6 characters"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Register"}
        </button>

        <p className="muted-copy">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
