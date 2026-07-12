export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="surface-card w-full p-8 text-center sm:p-12">
        <p className="section-eyebrow">404</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">This page is not mapped yet.</h1>
        <p className="mt-4 text-[color:var(--muted)]">
          The route exists in the product map, but the design pass has not reached it yet.
        </p>
      </div>
    </section>
  );
}
