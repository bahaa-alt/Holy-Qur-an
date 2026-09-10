import Link from "next/link";
import { PhraseTextSearch } from "@/components/search/PhraseTextSearch";

export const metadata = { title: "Phrase & sentence search" };

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Phrase & sentence search</h1>
        <p className="mt-1 text-sm text-muted">
          Find every verse containing an exact phrase or sentence -- common openings like &quot;يا أيها
          الناس&quot; or &quot;يا أيها الذين آمنوا&quot;, or any run of words you type. For matching root pairs
          regardless of the exact words used, see{" "}
          <Link href="/phrases/" className="text-accent hover:text-accent-strong">
            Phrases
          </Link>{" "}
          instead.
        </p>
      </div>
      <PhraseTextSearch />
    </div>
  );
}
