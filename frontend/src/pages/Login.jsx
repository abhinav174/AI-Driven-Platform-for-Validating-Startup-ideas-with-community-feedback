import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await api.post("/auth/login", form);
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
        <p className="eyebrow">AI Startup Validation Platform</p>
        <h1>Pressure-test startup ideas before you spend months building them.</h1>
        <p className="lead">
          Sign in to analyze ideas, compare against funded startups, and collect
          community feedback in one place.
        </p>
      </section>

      <form className="auth-card" onSubmit={submit}>
        <div>
          <p className="eyebrow">Welcome back</p>
          <h2>Login</h2>
        </div>

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
            placeholder="Enter your password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Login"}
        </button>

        <p className="muted-copy">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
