import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaApple, FaGithub } from "react-icons/fa";

import LLBButton from "../components/ui/LLBButton";
import LLBCard from "../components/ui/LLBCard";
import LLBInput from "../components/ui/LLBInput";

export default function Login() {
  return (
		<section className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-5xl items-center px-4 py-12 sm:px-6 lg:px-8">
			<LLBCard className="mx-auto w-full max-w-[430px] p-7 sm:p-8 lg:p-10">
        <div className="section-eyebrow">Welcome back</div>
        <h1 className="section-title mt-3 text-4xl">Sign in</h1>
        <p className="section-copy mt-4">Optional. Progress can stay local, or you can sign in to sync across devices.</p>
        <form className="mt-8 space-y-4">
          <label className="block space-y-2 text-sm font-medium text-[color:var(--ink)]">
            <span>Email</span>
            <LLBInput type="email" placeholder="you@example.com" />
          </label>
          <label className="block space-y-2 text-sm font-medium text-[color:var(--ink)]">
            <span>Password</span>
            <LLBInput type="password" placeholder="••••••••" />
          </label>
          <LLBButton className="w-full" variant="primary" type="button">Sign in</LLBButton>
        </form>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <button aria-label="Continue with GitHub" className="inline-flex h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white text-[color:var(--ink)] transition hover:border-[color:var(--accent)]/25 hover:bg-[color:var(--surface-2)]" type="button">
            <FaGithub aria-hidden="true" className="text-lg" />
          </button>
          <button aria-label="Continue with Google" className="inline-flex h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white text-[color:var(--ink)] transition hover:border-[color:var(--accent)]/25 hover:bg-[color:var(--surface-2)]" type="button">
            <FcGoogle aria-hidden="true" className="text-lg" />
          </button>
          <button aria-label="Continue with Apple" className="inline-flex h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white text-[color:var(--ink)] transition hover:border-[color:var(--accent)]/25 hover:bg-[color:var(--surface-2)]" type="button">
            <FaApple aria-hidden="true" className="text-lg" />
          </button>
        </div>
        <p className="mt-4 text-sm text-[color:var(--muted)]">No account yet? <Link className="text-[color:var(--accent)] underline decoration-[color:var(--accent)]/30 underline-offset-4" to="/register">Create one</Link></p>
			</LLBCard>
    </section>
  );
}
