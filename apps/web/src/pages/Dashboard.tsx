import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import { authClient } from "@/lib/auth";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const [loggingOut, setLoggingOut] = useState(false);

  async function onLogout() {
    setLoggingOut(true);
    await authClient.signOut();
    setLoggingOut(false);
    navigate("/login", { replace: true });
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="section-eyebrow">Dashboard</p>
      <h1 className="section-title mt-2">Welcome back</h1>
      <p className="section-copy mt-2">
        Signed in as {session?.user.name || session?.user.email}.
      </p>

      <div className="surface-card mt-8 space-y-2 p-6">
        <p className="text-sm text-[color:var(--muted)]">Email</p>
        <p className="font-medium text-[color:var(--ink)]">{session?.user.email}</p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link className="auth-primary-btn text-center" to="/topics">
          Practice topics
        </Link>
        <Link className="auth-secondary-btn text-center" to="/leaderboard">
          Leaderboard
        </Link>
        <Link className="auth-secondary-btn text-center" to="/contribute/questions">
          Contribute questions
        </Link>
        <Link className="auth-secondary-btn text-center" to="/review/questions">
          Review queue
        </Link>
      </div>

      <button
        className="auth-secondary-btn mt-8"
        type="button"
        onClick={onLogout}
        disabled={loggingOut}
      >
        {loggingOut ? "Signing out…" : "Sign out"}
      </button>
    </main>
  );
}
