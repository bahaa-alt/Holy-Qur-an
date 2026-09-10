import { readIndex } from "@/lib/data/serverData";
import { PhraseSearch } from "@/components/phrases/PhraseSearch";

export const metadata = { title: "Phrase search" };

export default function PhrasesPage() {
  const index = readIndex();
  const roots = index.roots.map((r) => ({ ar: r.ar, key: r.key, count: r.count }));

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Phrase search</h1>
        <p className="mt-1 text-sm text-muted">
          Find every verse where a word from one root is immediately followed by a word from another --
          skipping particles and pronouns in between -- for studying formulaic word-pair patterns.
        </p>
      </div>
      <PhraseSearch roots={roots} />
    </div>
  );
}
