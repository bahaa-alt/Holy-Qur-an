import Link from "next/link";
import { PROPHET_TOPICS, THEME_TOPICS } from "@/lib/topics/topicDefinitions";

export const metadata = { title: "Browse by topic" };

export default function TopicsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Browse by topic</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          A curated index from topic to the roots/lemmas that cover it -- hand-picked, not derived from any tafsir
          (classical commentary). Use it to find candidate verses quickly; it is not a claim about what a verse
          means, and a verse can be relevant to a topic without using any of the listed roots.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Themes</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {THEME_TOPICS.map((t) => (
            <Link
              key={t.slug}
              href={`/topics/${t.slug}/`}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
            >
              <span className="arabic-ui">{t.labelAr}</span>
              <span className="ml-2 text-xs text-muted">{t.labelEn}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Prophets</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {PROPHET_TOPICS.map((t) => (
            <Link
              key={t.slug}
              href={`/topics/${t.slug}/`}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
            >
              <span className="arabic-ui">{t.labelAr}</span>
              <span className="ml-2 text-xs text-muted">{t.labelEn}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
