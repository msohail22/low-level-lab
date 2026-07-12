import { Link } from "react-router-dom";

export default function Login() {
  return (
    <section className="mx-auto flex w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="surface-card w-full p-6 sm:p-8">
        <div className="section-eyebrow">Welcome back</div>
        <h1 className="section-title mt-3 text-4xl">Sign in</h1>
        <p className="section-copy mt-4">Optional. Progress can stay local, or you can sign in to sync across devices.</p>
        <form className="mt-8 space-y-4">
          <label className="block space-y-2 text-sm font-medium text-[color:var(--ink)]">
            <span>Email</span>
            <input className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]" type="email" placeholder="you@example.com" />
          </label>
          <label className="block space-y-2 text-sm font-medium text-[color:var(--ink)]">
            <span>Password</span>
            <input className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]" type="password" placeholder="••••••••" />
          </label>
          <button className="pill-link !w-full !justify-center !bg-[color:var(--accent-btn)] !text-white !border-transparent" type="button">Sign in</button>
        </form>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a className="pill-link" href="#">Continue with GitHub</a>
          <a className="pill-link" href="#">Continue with Google</a>
        </div>
        <p className="mt-4 text-sm text-[color:var(--muted)]">No account yet? <Link className="text-[color:var(--accent)] underline decoration-[color:var(--accent)]/30 underline-offset-4" to="/register">Create one</Link></p>
      </div>
    </section>
  );
}
