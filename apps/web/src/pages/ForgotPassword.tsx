import { Link } from "react-router-dom";

import LLBButton from "../components/ui/LLBButton";
import LLBCard from "../components/ui/LLBCard";
import LLBInput from "../components/ui/LLBInput";

export default function ForgotPassword() {
  return (
		<section className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-5xl items-center px-4 py-12 sm:px-6 lg:px-8">
			<LLBCard className="mx-auto w-full max-w-[430px] p-7 sm:p-8 lg:p-10">
        <div className="section-eyebrow">Account recovery</div>
        <h1 className="section-title mt-3 text-4xl">Reset your password</h1>
        <p className="section-copy mt-4">A minimal recovery screen that stays on brand and keeps the form straightforward.</p>
        <form className="mt-8 space-y-4">
          <label className="block space-y-2 text-sm font-medium text-[color:var(--ink)]">
            <span>Email</span>
            <LLBInput type="email" placeholder="you@example.com" />
          </label>
          <LLBButton className="w-full" variant="primary" type="button">Send reset link</LLBButton>
        </form>
        <p className="mt-4 text-sm text-[color:var(--muted)]">Remembered it? <Link className="text-[color:var(--accent)] underline decoration-[color:var(--accent)]/30 underline-offset-4" to="/login">Go back to sign in</Link></p>
			</LLBCard>
    </section>
  );
}
