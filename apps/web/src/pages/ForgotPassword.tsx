import { Link } from "react-router-dom";

export default function ForgotPassword() {
  return (
    <section className="mx-auto flex w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="surface-card w-full p-6 sm:p-8">
        <div className="section-eyebrow">Account recovery</div>
        <h1 className="section-title mt-3 text-4xl">Reset your password</h1>
        <p className="section-copy mt-4">A minimal recovery screen that stays on brand and keeps the form straightforward.</p>
        <form className="mt-8 space-y-4">
          <label className="block space-y-2 text-sm font-medium text-[color:var(--ink)]">
            <span>Email</span>
            <input className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]" type="email" placeholder="you@example.com" />
          </label>
          <button className="pill-link !w-full !justify-center !bg-[color:var(--accent-btn)] !text-white !border-transparent" type="button">Send reset link</button>
        </form>
        <p className="mt-4 text-sm text-[color:var(--muted)]">Remembered it? <Link className="text-[color:var(--accent)] underline decoration-[color:var(--accent)]/30 underline-offset-4" to="/login">Go back to sign in</Link></p>
      </div>
    </section>
  );
}
