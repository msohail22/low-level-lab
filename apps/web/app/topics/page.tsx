import Link from "next/link";
import { TOPICS } from "@/lib/topics";

export default function TopicsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Topics</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {TOPICS.map((topic) => (
          <Link
            key={topic.slug}
            href={`/topics/${topic.slug}`}
            className="group rounded-lg border border-border bg-surface p-5 hover:border-accent"
          >
            <h2 className="text-lg font-semibold group-hover:text-accent">
              {topic.name}
            </h2>
            <p className="mt-2 text-sm text-muted">{topic.tagline}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
