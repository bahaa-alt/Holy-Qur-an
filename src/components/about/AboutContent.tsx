"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import { OfflineDownload } from "@/components/layout/OfflineDownload";
import type { ManifestFile } from "@/lib/data/types";

export function AboutContent({ manifest, rootNames }: { manifest: ManifestFile; rootNames: string[] }) {
  const t = useT();

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 text-sm leading-relaxed text-ink">
      <div>
        <h1 className="text-2xl font-semibold">{t.aboutPage.heading}</h1>
        <p className="mt-2 text-muted">{t.aboutPage.intro}</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold">{t.aboutPage.howCountsComputedHeading}</h2>
        <p className="mt-2 text-muted">{t.aboutPage.howCountsComputedBody}</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold">{t.aboutPage.insightsMethodologyHeading}</h2>
        <p className="mt-2 text-muted">{t.aboutPage.insightsMethodologyIntro}</p>
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="font-medium">{t.aboutPage.coverageRankingHeading}</h3>
            <p className="mt-1 text-muted">{t.aboutPage.coverageRankingBody}</p>
          </div>
          <div>
            <h3 className="font-medium">{t.aboutPage.hapaxHeading}</h3>
            <p className="mt-1 text-muted">{t.aboutPage.hapaxBody}</p>
          </div>
          <div>
            <h3 className="font-medium">{t.aboutPage.rootDensityHeading}</h3>
            <p className="mt-1 text-muted">{t.aboutPage.rootDensityBody}</p>
          </div>
          <div>
            <h3 className="font-medium">{t.aboutPage.distinctiveVocabHeading}</h3>
            <p className="mt-1 text-muted">{t.aboutPage.distinctiveVocabBody}</p>
          </div>
          <div>
            <h3 className="font-medium">{t.aboutPage.rhymeMethodHeading}</h3>
            <p className="mt-1 text-muted">{t.aboutPage.rhymeMethodBody}</p>
          </div>
          <div>
            <h3 className="font-medium">{t.aboutPage.collocationsMethodHeading}</h3>
            <p className="mt-1 text-muted">{t.aboutPage.collocationsMethodBody}</p>
          </div>
          <div>
            <h3 className="font-medium">{t.aboutPage.abjadMethodHeading}</h3>
            <p className="mt-1 text-muted">{t.aboutPage.abjadMethodBody}</p>
          </div>
          <div>
            <h3 className="font-medium">{t.aboutPage.juzHizbHeading}</h3>
            <p className="mt-1 text-muted">{t.aboutPage.juzHizbBody}</p>
          </div>
          <div>
            <h3 className="font-medium">{t.aboutPage.cooccurrenceMethodHeading}</h3>
            <p className="mt-1 text-muted">{t.aboutPage.cooccurrenceMethodBody}</p>
          </div>
          <div>
            <h3 className="font-medium">{t.aboutPage.patternsMethodHeading}</h3>
            <p className="mt-1 text-muted">{t.aboutPage.patternsMethodBody}</p>
          </div>
          <div>
            <h3 className="font-medium">{t.aboutPage.formulasMethodHeading}</h3>
            <p className="mt-1 text-muted">{t.aboutPage.formulasMethodBody}</p>
          </div>
          <div>
            <h3 className="font-medium">{t.aboutPage.verseSimilarityMethodHeading}</h3>
            <p className="mt-1 text-muted">{t.aboutPage.verseSimilarityMethodBody}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">{t.aboutPage.dataSourcesHeading}</h2>
        <ul className="mt-2 space-y-3">
          {manifest.sources.map((s) => (
            <li key={s.url} className="rounded-lg border border-border p-3">
              <p className="font-medium">{s.name}</p>
              <p className="text-muted">
                <a href={s.url} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-strong">
                  {s.url}
                </a>
                {" · "}
                {s.license}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">{t.aboutPage.laneLexiconNote}</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold">{t.aboutPage.offlineHeading}</h2>
        <p className="mt-2 text-muted">{t.aboutPage.offlineBody}</p>
        <OfflineDownload roots={rootNames} />
      </div>

      <div>
        <h2 className="text-lg font-semibold">{t.aboutPage.corpusExportHeading}</h2>
        <p className="mt-2 text-muted">{t.aboutPage.corpusExportBody}</p>
        <a
          href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/data/v1/export/corpus.csv`}
          className="mt-3 inline-block rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm text-accent hover:bg-accent/20"
        >
          {t.aboutPage.corpusExportDownload(formatBytes(manifest.counts.corpusExportBytes))}
        </a>
      </div>

      <div>
        <h2 className="text-lg font-semibold">{t.aboutPage.dataBuildHeading}</h2>
        <p className="mt-2 text-muted">
          {t.aboutPage.dataBuildSummary(
            new Date(manifest.builtAt).toLocaleDateString(),
            manifest.counts.words,
            manifest.counts.roots,
            manifest.counts.occurrences,
            manifest.counts.verses,
          )}
        </p>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
