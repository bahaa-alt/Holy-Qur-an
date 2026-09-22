"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import { OfflineDownload } from "@/components/layout/OfflineDownload";
import type { ManifestFile } from "@/lib/data/types";
import { CONCEPT_DOI, VERSION_DOI, VERSION_TAG, doiUrl } from "@/lib/citation/doi";

/** Set once the CSV is uploaded to a release; see scripts/build-data.ts EXPORT_DIR. */
const CORPUS_EXPORT_URL = process.env.NEXT_PUBLIC_CORPUS_EXPORT_URL ?? "";

// Matches next.config.ts's basePath and lib/data/loader.ts's own DATA_BASE:
// empty for the default (root-domain) deploy, "/Holy-Qur-an" for GitHub Pages.
// Unlike corpus.csv, codebook.json/corpus-columns.csv are a few KB, so they
// ship as ordinary public/data/v1 files rather than a release asset.
const DATA_BASE = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/data/v1`;
const CODEBOOK_JSON_URL = `${DATA_BASE}/codebook.json`;
const CORPUS_COLUMNS_CSV_URL = `${DATA_BASE}/corpus-columns.csv`;

export function AboutContent({
  manifest,
  rootNames,
}: {
  manifest: ManifestFile;
  rootNames: string[];
}) {
  const t = useT();

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 text-sm leading-relaxed text-ink">
      <div>
        <h1 className="text-2xl font-semibold">{t.aboutPage.heading}</h1>
        <p className="mt-2 text-muted">{t.aboutPage.intro}</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold">{t.aboutPage.readingHeading}</h2>
        <p className="mt-2 text-muted">
          {t.aboutPage.readingBody(
            manifest.reading.transmission,
            manifest.reading.edition,
            manifest.reading.verseNumbering,
          )}{" "}
          <bdi dir="rtl" lang="ar" className="arabic-ui">
            {manifest.reading.transmissionAr}
          </bdi>
        </p>
        <p className="mt-2 text-muted">{t.aboutPage.readingWhyItMatters}</p>
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
          <div>
            <h3 className="font-medium">{t.aboutPage.keynessMethodHeading}</h3>
            <p className="mt-1 text-muted">{t.aboutPage.keynessMethodBody}</p>
          </div>
          <div>
            <h3 className="font-medium">{t.aboutPage.dispersionMethodHeading}</h3>
            <p className="mt-1 text-muted">{t.aboutPage.dispersionMethodBody}</p>
          </div>
          <div>
            <h3 className="font-medium">{t.aboutPage.letterFrequencyMethodHeading}</h3>
            <p className="mt-1 text-muted">{t.aboutPage.letterFrequencyMethodBody}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">{t.aboutPage.changelogHeading}</h2>
        <p className="mt-2 text-muted">{t.aboutPage.changelogIntro}</p>
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="font-medium">{t.aboutPage.changelogUnreleasedLabel}</h3>
            <ul className="mt-1 list-disc space-y-2 ps-5 text-muted">
              <li>{t.aboutPage.changelogCategoryFix}</li>
              <li>{t.aboutPage.changelogLetterFrequencyFix}</li>
              <li>{t.aboutPage.changelogStatsAdditions}</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium">{t.aboutPage.changelogV1Label}</h3>
            <p className="mt-1 text-muted">{t.aboutPage.changelogV1Note}</p>
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
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:text-accent-strong"
                >
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
        {/* The CSV is deliberately not deployed (37.5 MB, a third of the
            export's bytes, and over Cloudflare Pages' 25 MiB per-asset cap at
            every tier). When a release asset URL is configured this links
            straight at it; otherwise it links to the releases page and says
            plainly where the file comes from, rather than offering a download
            that is not there. */}
        {CORPUS_EXPORT_URL ? (
          <a
            href={CORPUS_EXPORT_URL}
            className="mt-3 inline-block rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm text-accent hover:bg-accent/20"
          >
            {t.aboutPage.corpusExportDownload(formatBytes(manifest.counts.corpusExportBytes))}
          </a>
        ) : (
          <>
            <p className="mt-2 text-muted">
              {t.aboutPage.corpusExportNotPublished(formatBytes(manifest.counts.corpusExportBytes))}
            </p>
            <a
              href="https://github.com/bahaa-alt/Holy-Qur-an/releases"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm text-accent hover:bg-accent/20"
            >
              {t.aboutPage.corpusExportReleases}
            </a>
          </>
        )}
        <p className="mt-3 text-muted">
          {t.aboutPage.codebookBody}{" "}
          <a href={CODEBOOK_JSON_URL} className="text-accent hover:text-accent-strong" dir="ltr">
            codebook.json
          </a>
          {" · "}
          <a href={CORPUS_COLUMNS_CSV_URL} className="text-accent hover:text-accent-strong" dir="ltr">
            corpus-columns.csv
          </a>
        </p>
        <p className="mt-3 text-muted">
          {t.aboutPage.reproducibilityExampleBody}{" "}
          <a
            href="https://github.com/bahaa-alt/Holy-Qur-an/blob/HEAD/examples/reproduce_keyness.py"
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:text-accent-strong"
            dir="ltr"
          >
            examples/reproduce_keyness.py
          </a>
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold">{t.aboutPage.qcqlCliHeading}</h2>
        <p className="mt-2 text-muted">{t.aboutPage.qcqlCliBody}</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold">{t.aboutPage.citeHeading}</h2>
        <p className="mt-2 text-muted">{t.aboutPage.citeIntro}</p>
        <dl className="mt-3 space-y-1.5 text-sm">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <dt className="text-muted">{t.aboutPage.citeConceptLabel}:</dt>
            <dd>
              <a
                href={doiUrl(CONCEPT_DOI)}
                className="font-mono text-accent hover:text-accent-strong"
                dir="ltr"
              >
                {CONCEPT_DOI}
              </a>
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <dt className="text-muted">
              {t.aboutPage.citeVersionLabel} ({VERSION_TAG}):
            </dt>
            <dd>
              <a
                href={doiUrl(VERSION_DOI)}
                className="font-mono text-accent hover:text-accent-strong"
                dir="ltr"
              >
                {VERSION_DOI}
              </a>
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-sm leading-relaxed text-muted">{t.aboutPage.citeWhyVersion}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted/80">{t.aboutPage.citeButtonHint}</p>
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
