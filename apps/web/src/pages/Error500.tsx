export default function Error500() {
	return (
		<section className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center px-4 py-12 sm:px-6 lg:px-8">
			<div className="surface-card w-full p-8 text-center sm:p-12">
				<p className="section-eyebrow">500</p>
				<h1 className="mt-4 text-4xl font-semibold tracking-tight">Something faulted on our side.</h1>
				<p className="mt-4 text-[color:var(--muted)]">The server hit an unrecoverable state. This placeholder keeps the product language but does not add more complexity.</p>
			</div>
		</section>
	);
}