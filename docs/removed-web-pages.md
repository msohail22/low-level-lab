# Removed Web Pages Documentation

**Date Removed:** 2026-08-07
**Reason:** Not needed for current scope
**Source:** `apps/web/src/pages/`

---

## Page Inventory (Removed)

| Page | Route(s) | Purpose | Key Components Used |
|------|----------|---------|---------------------|
| `Landing.tsx` | `/`, `/landing` | Marketing landing page with hero, CTA, feature grid | `Link` |
| `Login.tsx` | `/login`, `/signin` | Authentication with email/password + OAuth (GitHub, Google, Apple) | `LLBButton`, `LLBCard`, `LLBInput`, `react-icons` |
| `Register.tsx` | `/register`, `/signup` | User registration form | Similar to Login |
| `ForgotPassword.tsx` | `/forgot-password` | Password reset request | `LLBButton`, `LLBCard`, `LLBInput` |
| `Onboarding.tsx` | `/onboarding` | New user onboarding flow | TBD |
| `Dashboard.tsx` | `/dashboard` | User learning dashboard with progress cards | `surface-card`, progress bars |
| `DailyChallenge.tsx` | `/daily-challenge` | Daily coding challenge view | TBD |
| `Topics.tsx` | `/topics` | Track listing grid with progress | `surface-card`, progress bars |
| `TopicDetails.tsx` | `/topics/:topicId`, `/track` | Track detail with question list | `Link`, `surface-card` |
| `Questions.tsx` | `/questions` | Question list with filters | TBD |
| `Question.tsx` | `/questions/:questionId`, `/question/:questionId`, `/problem` | Single question view with answer options, explanation, next | `Link`, `surface-card` |
| `Complete.tsx` | `/complete` | Question completion screen | TBD |
| `Bookmarks.tsx` | `/bookmarks` | User bookmarked questions | TBD |
| `History.tsx` | `/history` | User question history | TBD |
| `Leaderboard.tsx` | `/leaderboard` | Leaderboard table | TBD |
| `Profile.tsx` | `/profile`, `/account` | User profile with stats | TBD |
| `Settings.tsx` | `/settings` | Preferences (appearance, account, notifications, data) | `surface-card`, `pill-link` |
| `Search.tsx` | `/search` | Search interface | TBD |
| `Method.tsx` | `/method` | Learning methodology page | TBD |
| `Formats.tsx` | `/formats` | Question formats explanation | TBD |
| `States.tsx` | `/states` | State management demo | TBD |
| `Error500.tsx` | `/500` | Server error page | TBD |
| `NotFound.tsx` | `/404`, `*` | 404 page | TBD |
| **Admin Pages** | | | |
| `AdminShell.tsx` | `/admin/*` | Admin layout wrapper | `AdminShell` |
| `AdminDashboard.tsx` | `/admin` | Admin dashboard | `AdminShell` |
| `AdminTopics.tsx` | `/admin/topics` | Admin topic management | `AdminShell` |
| `AdminQuestion.tsx` | `/admin/question` | Admin question management | `AdminShell` |
| `AdminReview.tsx` | `/admin/review` | Admin review queue | `AdminShell` |

---

## Styling System (Preserved for AI Agent Use)

### CSS Variables (Defined in Tailwind config / global CSS)

```css
/* Color Palette - Use these variables directly in className */
--ink: #1a1a1a;                    /* Primary text, dark backgrounds */
--accent: #a84124;                 /* Primary brand color (rust/orange) */
--accent-btn: #c4502a;             /* Button hover/active accent */
--surface: #fafafa;                /* Page background */
--surface-2: #f0efe9;              /* Elevated card background */
--line: #e5e3dd;                   /* Border/divider color */
--muted: #78716c;                  /* Secondary text, placeholders */

/* Semantic color-mix usage */
bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)]  /* Glassmorphism header */
```

### Utility Classes (Used Across All Pages)

#### Layout Containers
```tsx
// Standard page container - use on every page section
<section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

// Narrow container for forms/settings
<section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">

// Full-height centered (login/register)
<section className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-5xl items-center px-4 py-12 sm:px-6 lg:px-8">
```

#### Typography Scale
```tsx
// Section eyebrow (category label)
<div className="section-eyebrow">Category</div>
/* Styles: text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)] */

// Section title (main heading)
<h1 className="section-title">Main Heading</h1>
/* Styles: text-3xl font-bold tracking-tight text-[color:var(--ink)] */

// Section copy (descriptive text)
<p className="section-copy">Description text</p>
/* Styles: text-base leading-7 text-[color:var(--muted)] */

// Responsive title sizes
<h1 className="section-title mt-3 text-4xl">  // Large pages
<h2 className="text-2xl font-semibold tracking-tight">  // Card titles
<h3 className="text-lg font-semibold tracking-tight">   // List items
```

#### Surface Cards
```tsx
// Standard elevated card
<div className="surface-card p-6 sm:p-8">
/* Styles: rounded-2xl border border-[color:var(--line)] bg-white shadow-sm */

// Compact card
<div className="surface-card p-5 sm:p-6">

// Interactive card (hover states handled inline)
<div className="surface-card p-6 hover:border-[color:var(--accent)]/30 transition">
```

#### Buttons & Links
```tsx
// Primary CTA button (pill style)
<Link className="pill-link !bg-[color:var(--accent-btn)] !text-white !border-transparent" to="/path">
/* Styles: inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-5 py-2.5 text-sm font-medium transition */

// Secondary button
<button className="pill-link" type="button">

// Icon button (OAuth)
<button className="inline-flex h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white text-[color:var(--ink)] transition hover:border-[color:var(--accent)]/25 hover:bg-[color:var(--surface-2)]" type="button">

// Navigation link (active state handled by NavLink)
<NavLink className={({ isActive }) => [
  "rounded-full px-4 py-2 text-sm font-medium transition",
  isActive ? "bg-[color:var(--ink)] text-white shadow-[0_10px_24px_rgba(26,26,26,0.12)]" : "text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--ink)]"
].join(" ")} to="/path">
```

#### Progress Indicators
```tsx
// Thin progress bar (43% example)
<div className="h-2 overflow-hidden rounded-full bg-[color:var(--surface-2)]">
  <div className="h-full w-[43%] rounded-full bg-[color:var(--accent-btn)]" />
</div>

// Thicker progress bar
<div className="h-3 overflow-hidden rounded-full bg-[color:var(--surface-2)]">
  <div className="h-full w-[43%] rounded-full bg-[color:var(--accent-btn)]" />
</div>

// Circular progress (14x14)
<div className="grid h-14 w-14 place-items-center rounded-2xl bg-[color:var(--surface-2)] text-sm font-semibold text-[color:var(--accent)]">19</div>
```

#### Grid Layouts
```tsx// 3-column responsive (1/2/3 cols)
<div className="grid gap-4 md:grid-cols-3">

// 2-column desktop, 1-col mobile
<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">

// Asymmetric: 1.2fr / 0.8fr
<div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">

// Track detail: 0.9fr / 1.1fr
<div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">

// Question detail: 1.05fr / 0.95fr
<div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
```

#### Interactive States
```tsx// Answer option (selected)
<button className="flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition border-[color:var(--accent)] bg-[color:var(--surface-2)]">
  <span className="font-medium">Option</span>
  <span className="text-sm font-semibold text-[color:var(--accent)]">Correct</span>
</button>

// Answer option (unselected)
<button className="flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition border-[color:var(--line)] bg-white hover:border-[color:var(--accent)]/30">

// List item (active)
<div className="rounded-2xl border px-4 py-4 border-[color:var(--accent)] bg-[color:var(--surface-2)]">

// List item (default)
<div className="rounded-2xl border px-4 py-4 border-[color:var(--line)] bg-white">
```

#### Chips & Badges
```tsx// Stat chip
<span className="stat-chip">9 ordered tracks</span>
/* Styles: inline-flex items-center rounded-full border border-[color:var(--line)] bg-white px-3 py-1 text-xs font-medium text-[color:var(--muted)] */

// Topic tag
<span className="stat-chip">Types</span>
```

#### Form Elements
```tsx// Label + Input
<label className="block space-y-2 text-sm font-medium text-[color:var(--ink)]">
  <span>Label</span>
  <LLBInput type="email" placeholder="you@example.com" />
</label>

// LLBInput handles its own styling
```

#### Navigation Header (AppShell)
```tsx// Sticky header with glassmorphism
<header className="sticky top-0 z-20 border-b border-[color:var(--line)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] backdrop-blur-xl">
  <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
    // Logo + nav items
  </div>
</header>
```

---

## AI Agent Usage Guide

### When Creating New Pages

1. **Always use the page container pattern:**
```tsx
export default function NewPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page content */}
    </section>
  );
}
```

2. **Use semantic color variables ONLY** - never hardcode hex values:
```tsx
// ✅ Correct
className="text-[color:var(--ink)]"
className="bg-[color:var(--surface-2)]"
className="border-[color:var(--accent)]"

// ❌ Wrong
className="text-slate-900"
className="bg-gray-100"
className="border-orange-600"
```

3. **Follow the typography hierarchy:**
- `section-eyebrow` → Category label
- `section-title` → Page/main heading  
- `section-copy` → Descriptive paragraph
- `text-xl font-semibold tracking-tight` → Card titles
- `text-lg font-semibold tracking-tight` → List item titles

4. **Use surface-card for all content containers:**
```tsx
<div className="surface-card p-6 sm:p-8">
  {/* Card content */}
</div>
```

5. **Use grid layouts for responsive columns:**
```tsx
// 3-col on xl, 2-col on md, 1-col on mobile
<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
```

6. **Buttons use pill-link with variants:**
```tsx
// Primary
<pill-link !bg-[color:var(--accent-btn)] !text-white !border-transparent>

// Secondary  
<pill-link>

// Icon button
<inline-flex h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white ...>
```

7. **Progress bars use surface-2 track + accent-btn fill:**
```tsx
<div className="h-2 overflow-hidden rounded-full bg-[color:var(--surface-2)]">
  <div className="h-full w-[XX%] rounded-full bg-[color:var(--accent-btn)]" />
</div>
```

8. **Interactive elements use transition + hover states:**
```tsx
className="transition hover:border-[color:var(--accent)]/30"
className="transition hover:bg-[color:var(--surface-2)]"
```

### Component Library (Preserved in `apps/web/src/components/ui/`)

The following UI components are available and pre-styled:
- `LLBButton` - Primary/secondary buttons with variants
- `LLBCard` - Card wrapper with consistent styling
- `LLBInput` - Form input with label support
- `LLBFooter` - Footer component
- `Toast`, `Dialog`, `Drawer`, `Popover`, `Tooltip` - Overlay components
- `Accordion`, `Tabs`, `Select`, `Switch`, `Checkbox`, `RadioGroup` - Form controls
- `Avatar`, `Badge`, `Progress`, `Spinner`, `Skeleton` - Feedback components
- `Pagination`, `Breadcrumb`, `Dropdown`, `Slider` - Navigation components
- `Card`, `Separator`, `Label`, `Alert` - Layout components

### Responsive Breakpoints
- `sm:` 640px+
- `md:` 768px+
- `lg:` 1024px+
- `xl:` 1280px+
- `2xl:` 1536px+

All pages used mobile-first approach with progressive enhancement.

---

## File Structure Reference (Before Removal)

```
apps/web/src/
├── pages/
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── ForgotPassword.tsx
│   ├── Onboarding.tsx
│   ├── Dashboard.tsx
│   ├── DailyChallenge.tsx
│   ├── Topics.tsx
│   ├── TopicDetails.tsx
│   ├── Questions.tsx
│   ├── Question.tsx
│   ├── Complete.tsx
│   ├── Bookmarks.tsx
│   ├── History.tsx
│   ├── Leaderboard.tsx
│   ├── Profile.tsx
│   ├── Settings.tsx
│   ├── Search.tsx
│   ├── Method.tsx
│   ├── Formats.tsx
│   ├── States.tsx
│   ├── Error500.tsx
│   ├── NotFound.tsx
│   └── admin/
│       ├── AdminShell.tsx
│       ├── Dashboard.tsx
│       ├── Topics.tsx
│       ├── Question.tsx
│       └── Review.tsx
├── components/
│   ├── common/
│   │   └── AppShell.tsx
│   ├── ui/              (Preserved - 30+ components)
│   ├── auth/
│   ├── dashboard/
│   ├── explanation/
│   ├── leaderboard/
│   ├── profile/
│   ├── question/
│   ├── settings/
│   └── topic/
├── routes/
│   └── index.tsx        (Defines all routes)
├── lib/
│   └── auth.ts
├── context/
└── index.css            (Only @import "tailwindcss")
```

---

## Restoration Notes

To restore any page:
1. Create the page file in `apps/web/src/pages/`
2. Follow the styling patterns documented above
3. Add the route in `apps/web/src/routes/index.tsx`
4. Import and use UI components from `apps/web/src/components/ui/`

All styling is self-contained in Tailwind classes using CSS variables - no external CSS files needed.