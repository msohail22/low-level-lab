import { Link, Navigate, useNavigate } from "react-router-dom";
import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth";

export default function Register() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isPending && session) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await authClient.signUp.email({
      name,
      email,
      password,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error.message || "Unable to create account");
      return;
    }

    navigate("/dashboard", { replace: true });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
      <p className="section-eyebrow">Low-Level Lab</p>
      <h1 className="section-title mt-2">Create account</h1>
      <p className="section-copy mt-2">
        Sign up with email and password. Social login comes later.
      </p>

      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-2 text-sm font-medium text-[color:var(--ink)]">
          <span>Name</span>
          <input
            className="auth-input"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <label className="block space-y-2 text-sm font-medium text-[color:var(--ink)]">
          <span>Email</span>
          <input
            className="auth-input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="block space-y-2 text-sm font-medium text-[color:var(--ink)]">
          <span>Password</span>
          <input
            className="auth-input"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <button className="auth-primary-btn" type="submit" disabled={loading}>
          {loading ? "Creating…" : "Sign up"}
        </button>
      </form>

      <p className="mt-6 text-sm text-[color:var(--muted)]">
        Already have an account?{" "}
        <Link className="font-medium text-[color:var(--ink)] underline" to="/login">
          Sign in
        </Link>
      </p>
    </main>
  );
}
