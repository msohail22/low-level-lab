import { Link } from "react-router-dom";

export default function Register() {
  return (
    <section className="mx-auto flex w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="surface-card w-full p-6 sm:p-8">
        <div className="section-eyebrow">Create account</div>
        <h1 className="section-title mt-3 text-4xl">Register</h1>
        <p className="section-copy mt-4">A concise signup page that mirrors the sign-in screen and keeps the product tone calm.</p>
        <form className="mt-8 space-y-4">
          <label className="block space-y-2 text-sm font-medium text-[color:var(--ink)]">
            <span>Email</span>
            <input className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]" type="email" placeholder="you@example.com" />
          </label>
          <label className="block space-y-2 text-sm font-medium text-[color:var(--ink)]">
            <span>Password</span>
            <input className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]" type="password" placeholder="at least 8 characters" />
          </label>
          <button className="pill-link !w-full !justify-center !bg-[color:var(--accent-btn)] !text-white !border-transparent" type="button">Create account</button>
        </form>
        <p className="mt-4 text-sm text-[color:var(--muted)]">Already have one? <Link className="text-[color:var(--accent)] underline decoration-[color:var(--accent)]/30 underline-offset-4" to="/login">Sign in</Link></p>
      </div>
    </section>
  );
}
