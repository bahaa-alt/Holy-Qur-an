import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * A placeholder for a page with nothing in it yet -- a dashed card that
 * names what's missing and, where there's a first action to point at,
 * carries it directly (children), rather than leaving a bare line of text
 * above an otherwise blank page.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center">
      <Icon size={24} className="mx-auto text-muted/60" />
      <h2 className="mt-3 text-sm font-medium text-ink">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{description}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
