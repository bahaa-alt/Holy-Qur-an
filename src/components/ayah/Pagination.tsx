import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-4 text-sm">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted"
      >
        <ChevronLeft size={14} /> Prev
      </button>
      <span className="text-muted">
        Page {page} of {pageCount}
      </span>
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted"
      >
        Next <ChevronRight size={14} />
      </button>
    </div>
  );
}
