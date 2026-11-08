import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Low Level Lab",
  description:
    "A project to learn programming by practice (a lot of practice).",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
            <Link href="/" className="font-semibold tracking-tight">
              Low Level Lab
            </Link>
            <nav className="flex items-center gap-5 text-sm text-muted">
              <Link href="/topics" className="hover:text-accent">
                Topics
              </Link>
              <Link href="/contribute" className="hover:text-accent">
                Contribute
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>

        <footer className="mt-16 border-t border-border">
          <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-muted">
            Questions live in this repository as MDX. Open a pull request to add one.
          </div>
        </footer>
      </body>
    </html>
  );
}
