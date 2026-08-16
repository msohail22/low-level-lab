import { authClient } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LinkButton } from "@/components/ui";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-12 sm:px-6">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <p className="section-eyebrow">Low-Level Lab</p>
      <h1 className="section-title mt-2 text-4xl sm:text-5xl">Learn low-level systems</h1>
      <p className="section-copy mt-4 max-w-xl">
        Practice systems thinking with guided tracks. Sign in to continue to your dashboard.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {isPending ? (
          <span className="text-sm text-[color:var(--muted)]">Loading…</span>
        ) : session ? (
          <LinkButton variant="primary" to="/dashboard">
            Go to dashboard
          </LinkButton>
        ) : (
          <>
            <LinkButton variant="primary" to="/login">
              Sign in
            </LinkButton>
            <LinkButton variant="secondary" to="/register">
              Sign up
            </LinkButton>
          </>
        )}
      </div>
    </main>
  );
}
