import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Low Level Lab",
  description: "A project to learn programming by practice (a lot of practice).",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Runs before the first paint and sets data-theme from storage. Without
          it the page paints in the system theme and then flips, which is the
          flash every theme switcher has to kill. It must be inline and
          synchronous; a module would run too late.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t}}catch(e){}",
          }}
        />
      </head>
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
              <ThemeToggle />
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">{children}</main>

        <div className="h-16" />
      </body>
    </html>
  );
}
