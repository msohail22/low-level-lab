import { Link } from "react-router-dom";

import { ThemeToggle } from "@/components/ThemeToggle";
import { useMe } from "@/hooks/useMe";

type AppShellProps = {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
};

export function AppShell({ title, eyebrow, children }: AppShellProps) {
  const { data } = useMe();

  return (
    <div className="min-h-screen bg-[color:var(--canvas)]">
      <header className="border-b border-[color:var(--line)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to="/dashboard" className="font-semibold tracking-tight text-[color:var(--ink)]">
            Low-Level Lab
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex flex-wrap gap-3 text-sm">
              <Link className="text-[color:var(--muted)] hover:text-[color:var(--ink)]" to="/playground">
                Playground
              </Link>
              <Link className="text-[color:var(--muted)] hover:text-[color:var(--ink)]" to="/paths">
                Paths
              </Link>
              <Link className="text-[color:var(--muted)] hover:text-[color:var(--ink)]" to="/topics">
                Practice
              </Link>
              <Link className="text-[color:var(--muted)] hover:text-[color:var(--ink)]" to="/challenge">
                Challenge
              </Link>
              <Link className="text-[color:var(--muted)] hover:text-[color:var(--ink)]" to="/due">
                Due
              </Link>
              <Link className="text-[color:var(--muted)] hover:text-[color:var(--ink)]" to="/sets">
                Sets
              </Link>
              <Link className="text-[color:var(--muted)] hover:text-[color:var(--ink)]" to="/glossary">
                Glossary
              </Link>
              <Link className="text-[color:var(--muted)] hover:text-[color:var(--ink)]" to="/leaderboard">
                Leaderboard
              </Link>
              <Link className="text-[color:var(--muted)] hover:text-[color:var(--ink)]" to="/contribute/questions">
                Contribute
              </Link>
              {data?.roles.reviewer && (
                <Link className="text-[color:var(--muted)] hover:text-[color:var(--ink)]" to="/review/questions">
                  Review
                </Link>
              )}
              {data?.roles.admin && (
                <Link className="text-[color:var(--muted)] hover:text-[color:var(--ink)]" to="/admin">
                  Admin
                </Link>
              )}
              <Link className="text-[color:var(--muted)] hover:text-[color:var(--ink)]" to="/dashboard">
                Dashboard
              </Link>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <p className="section-eyebrow">{eyebrow}</p>
        <h1 className="section-title mt-2">{title}</h1>
        {children}
      </main>
    </div>
  );
}
