import { Link, Navigate, useNavigate } from "react-router-dom";
import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
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

    const result = await authClient.signIn.email({
      email,
      password,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error.message || "Unable to sign in");
      return;
    }

    navigate("/dashboard", { replace: true });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
      <p className="section-eyebrow">Low-Level Lab</p>
      <h1 className="section-title mt-2">Sign in</h1>
      <p className="section-copy mt-2">
        Use your email and password. GitHub and Google sign-in will come next.
      </p>

      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
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
            autoComplete="current-password"
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
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-[color:var(--muted)]">
        No account yet?{" "}
        <Link className="font-medium text-[color:var(--ink)] underline" to="/register">
          Sign up
        </Link>
      </p>
    </main>
  );
}
