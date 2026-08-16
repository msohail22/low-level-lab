import { Link, NavLink } from "react-router-dom";

import { ThemeToggle } from "@/components/ThemeToggle";
import { useMe } from "@/hooks/useMe";

type AppShellProps = {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
};

export function AppShell({ title, eyebrow, children }: AppShellProps) {
  const { data } = useMe();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
      isActive
        ? "bg-[color:var(--surface-active)] text-[color:var(--accent)] border border-[color:var(--line)] shadow-sm"
        : "text-[color:var(--muted)] hover:text-[color:var(--ink)] hover:bg-[color:var(--surface-2)]"
    }`;

  return (
    <div className="min-h-screen bg-[color:var(--canvas)] text-[color:var(--ink)] antialiased">
      <header className="sticky top-0 z-30 border-b border-[color:var(--line)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 font-bold tracking-tight text-[color:var(--fg-bright)] hover:text-[color:var(--accent)] transition-colors"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--accent)] shadow-[0_0_8px_color-mix(in_srgb,var(--accent)_60%,transparent)]" />
            <span>Low-Level Lab</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <nav className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-sm">
              <NavLink className={navLinkClass} to="/playground">
                Playground
              </NavLink>
              <NavLink className={navLinkClass} to="/paths">
                Paths
              </NavLink>
              <NavLink className={navLinkClass} to="/topics">
                Practice
              </NavLink>
              <NavLink className={navLinkClass} to="/challenge">
                Challenge
              </NavLink>
              <NavLink className={navLinkClass} to="/due">
                Due
              </NavLink>
              <NavLink className={navLinkClass} to="/sets">
                Sets
              </NavLink>
              <NavLink className={navLinkClass} to="/glossary">
                Glossary
              </NavLink>
              <NavLink className={navLinkClass} to="/leaderboard">
                Leaderboard
              </NavLink>
              <NavLink className={navLinkClass} to="/contribute/questions">
                Contribute
              </NavLink>
              {data?.roles.reviewer && (
                <NavLink className={navLinkClass} to="/review/questions">
                  Review
                </NavLink>
              )}
              {data?.roles.admin && (
                <NavLink className={navLinkClass} to="/admin">
                  Admin
                </NavLink>
              )}
              <NavLink className={navLinkClass} to="/dashboard">
                Dashboard
              </NavLink>
            </nav>
            <div className="pl-1 border-l border-[color:var(--line)]">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6">
          <p className="section-eyebrow">{eyebrow}</p>
          <h1 className="section-title mt-1.5">{title}</h1>
        </div>
        {children}
      </main>
    </div>
  );
}
