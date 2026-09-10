import { SavedList } from "@/components/notes/SavedList";

export const metadata = { title: "Saved" };

export default function SavedPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Saved</h1>
        <p className="mt-1 text-sm text-muted">
          Roots, words, and verses you&apos;ve bookmarked, with room for your own notes. Stored only in this
          browser -- nothing is sent anywhere.
        </p>
      </div>
      <SavedList />
    </div>
  );
}
