import { readManifest } from "@/lib/data/serverData";

export const metadata = { title: "About" };

export default function AboutPage() {
  const manifest = readManifest();

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 text-sm leading-relaxed text-ink">
      <div>
        <h1 className="text-2xl font-semibold">About this project</h1>
        <p className="mt-2 text-muted">
          A free, open-source, account-less tool for researching Qur&apos;anic Arabic roots and word forms.
          It runs entirely in your browser as a static site: no accounts, no login, no database server. All
          data ships as static files and works fully offline once installed.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold">How counts are computed</h2>
        <p className="mt-2 text-muted">
          An &quot;occurrence&quot; of a root is a morphological segment tagged with that root in the
          underlying corpus. Particles, pronouns, and grammatical clitics (prefixes and suffixes such as
          the determiner &quot;al-&quot; or attached pronouns) never carry a root and are never counted
          toward one, even though they still appear in the verse text. This matches how the Quranic Arabic
          Corpus itself counts roots, which may differ from tools that count whole inflected words.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Data sources &amp; licenses</h2>
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
        <p className="mt-3 text-xs text-muted">
          Root meanings are given as &quot;after Lane&apos;s Lexicon&quot; -- a summary drawn from that
          dataset, not a verbatim quotation of the original 19th-century lexicon. This project&apos;s own
          source code is licensed GPL-3.0, matching the copyleft terms of the morphology dataset it builds
          on.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Offline &amp; installation</h2>
        <p className="mt-2 text-muted">
          On a phone or desktop browser that supports it, use &quot;Add to Home Screen&quot; (or the
          install prompt this site shows after a couple of visits) to install it like a native app. Once
          installed, previously visited roots and surahs stay available offline, and the app can download
          the full corpus in the background for complete offline access.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Data build</h2>
        <p className="mt-2 text-muted">
          Built {new Date(manifest.builtAt).toLocaleDateString()} · {manifest.counts.words.toLocaleString()}{" "}
          words · {manifest.counts.roots.toLocaleString()} roots · {manifest.counts.occurrences.toLocaleString()}{" "}
          root occurrences across {manifest.counts.verses.toLocaleString()} verses.
        </p>
      </div>
    </div>
  );
}
