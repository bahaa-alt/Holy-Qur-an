import Link from "next/link";
import type { TopicDefinition } from "@/lib/topics/topicDefinitions";

/**
 * A heading plus a wrapping row of topic chips, each linking to that
 * topic's `/topics/{slug}/` detail page. Shared by the general Topics
 * index and the dedicated Names of Allah page -- both browse the exact
 * same kind of curated TopicDefinition list, just different arrays.
 */
export function TopicSection({ heading, topics }: { heading: string; topics: readonly TopicDefinition[] }) {
  return (
    <section>
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted">{heading}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {topics.map((topic) => (
          <Link
            key={topic.slug}
            href={`/topics/${topic.slug}/`}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
          >
            <span className="arabic-ui">{topic.labelAr}</span>
            <span className="ms-2 text-xs text-muted">{topic.labelEn}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
