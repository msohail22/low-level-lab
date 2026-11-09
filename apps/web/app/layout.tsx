import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { AuthNav } from "@/components/AuthNav";
import { Providers } from "@/components/Providers";
import { PREFS_COOKIE, decodePrefs } from "@/lib/settings";
import "./globals.css";

export const metadata: Metadata = {
  title: "Low Level Lab",
  description: "A project to learn programming by practice (a lot of practice).",
  /**
   * The mark is a square wave: a clock signal, the thing underneath every
   * instruction. It is drawn as paths and carries no text element, so it does
   * not depend on a font being present on the viewer's machine.
   *
   * The .ico is listed as well as the .svg because Safari and older browsers
   * ignore an SVG favicon, and a tab with no icon reads as a broken page.
   */
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

/**
 * The reader's settings are applied here, as attributes on <html>, so the CSS
 * in globals.css can key off them. They come from the preferences cookie and
 * not from D1: this renders on every page, and no page should pay a database
 * read to pick a colour. /settings/save and /settings/sync keep that cookie
 * in step with the rows, which stay the source of truth.
 *
 * Rendered on the server, so the correct theme is in the first byte of HTML.
 * There is no inline script and so no flash — which is what broke the toggle
 * this replaces.
 */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const prefs = decodePrefs((await cookies()).get(PREFS_COOKIE)?.value);

  return (
    <html
      lang="en"
      data-theme={prefs.theme}
      data-code-size={prefs.codeSize}
    >
      <body>
        {/*
         * Everything is inside the providers, but the markup above them is
         * already correct: the server rendered data-theme on <html> from the
         * cookie. The client layer only applies later changes, so there is no
         * flash and no theme script in the head.
         */}
        <Providers prefs={prefs}>
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
                <AuthNav />
              </nav>
            </div>
          </header>

          <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">{children}</main>

          <div className="h-16" />
        </Providers>
      </body>
    </html>
  );
}
