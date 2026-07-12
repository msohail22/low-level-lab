export default function Settings() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="section-eyebrow">Preferences</div>
        <h1 className="section-title mt-3 text-4xl">Settings</h1>
        <p className="section-copy mt-4">Theme, account, notifications, and data controls arranged in a calm, readable stack.</p>
      </div>

      <div className="space-y-4">
        {[
          ["Appearance", "Theme", "Light or dark. Follows your system on first visit."],
          ["Account", "Signed out", "Progress saves on this device only."],
          ["Notifications", "Daily streak reminder", "A nudge if you haven't practiced today."],
          ["Data", "Reset progress", "Clears solved state and streak on this device."],
        ].map(([group, title, copy]) => (
          <div key={group as string} className="surface-card p-5 sm:p-6">
            <p className="section-eyebrow">{group as string}</p>
            <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">{title as string}</h2>
                <p className="mt-1 text-sm text-[color:var(--muted)]">{copy as string}</p>
              </div>
              <button className="pill-link" type="button">Manage</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
