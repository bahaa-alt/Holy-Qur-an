import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
      <SearchX size={32} className="text-muted" />
      <h1 className="text-xl font-semibold text-ink">Not found</h1>
      <p className="text-sm text-muted">
        That root, word, or page doesn&apos;t exist. Try searching from the home page instead.
      </p>
      <Link href="/" className="mt-2 text-sm text-accent hover:text-accent-strong">
        Back to search
      </Link>
    </div>
  );
}
