"use client";

import { useState } from "react";
import type { ConjugationTableData } from "@/lib/root/conjugation";
import type { RowFilters } from "@/lib/root/occurrences";
import { ConjugationTable } from "./ConjugationTable";
import { AyahExplorer } from "@/components/ayah/AyahExplorer";

export function RootInteractive({
  root,
  conjugationTables,
  filenameBase,
}: {
  root: string;
  conjugationTables: ConjugationTableData[];
  filenameBase: string;
}) {
  const [filters, setFilters] = useState<RowFilters>({});

  function handleCellClick(next: RowFilters) {
    setFilters(next);
    document.getElementById("ayah-explorer")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      {conjugationTables.length > 0 && (
        <ConjugationTable tables={conjugationTables} onSelectForm={handleCellClick} />
      )}
      <AyahExplorer
        key={root}
        source={{ kind: "root", root }}
        filenameBase={filenameBase}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </>
  );
}
