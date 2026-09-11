import { searchArabicPhrase, type PhraseMatch } from "@/lib/search/arabicPhrase";
import type { ArIndexFile } from "@/lib/data/types";

/** One curated phrase this app lets a researcher browse every verse
 *  containing, anywhere in the verse (not only at its start). */
export interface NamePhraseDef {
  slug: string;
  phraseAr: string;
  labelEn: string;
}

/**
 * A hand-picked set of Allah-invoking phrases -- direct addresses
 * (اللهم), first/second-person references to Allah as "Lord" (رب, ربي,
 * ربنا, ربكم), a few recurring constructions (هو الذي, قل هو, الله
 * يحب/لا يحب/مع/هو, انه هو), and a run of preposition + "Allah"/"your
 * Lord" combinations (من/على/بـ/إلى/مع/في/عند + الله/ربك/ربكم, و + الله/
 * ربكم). Not derived from any automatic frequency scan; this is a
 * curated starting point, matching this app's existing Topics/Names
 * convention.
 *
 * Two entries (والله, وربكم) are written pre-fused with the conjunction
 * و rather than as two space-separated words: و is a clitic that is
 * never its own token in the Uthmani script (always attached directly
 * to the following word, like the vocative يا already handled specially
 * in tokenizePhraseQuery) -- writing "و الله" as two words would search
 * for a standalone "و" token that never occurs, matching nothing.
 */
export const NAME_PHRASES: NamePhraseDef[] = [
  { slug: "allahumma", phraseAr: "اللهم", labelEn: "Allāhumma (O Allah)" },
  { slug: "qul-allahumma", phraseAr: "قل اللهم", labelEn: "Qul Allāhumma (Say: O Allah)" },
  { slug: "rabb", phraseAr: "رب", labelEn: "Rabb (Lord)" },
  { slug: "rabbi", phraseAr: "ربي", labelEn: "Rabbī (My Lord)" },
  { slug: "rabbuna", phraseAr: "ربنا", labelEn: "Rabbunā (Our Lord)" },
  { slug: "rabbukum", phraseAr: "ربكم", labelEn: "Rabbukum (Your Lord)" },
  { slug: "huwa-alladhi", phraseAr: "هو الذي", labelEn: "Huwa alladhī (He is the One who)" },
  { slug: "qul-huwa", phraseAr: "قل هو", labelEn: "Qul huwa (Say: He is)" },
  { slug: "innahu-huwa", phraseAr: "انه هو", labelEn: "Innahu huwa (Indeed, He is)" },
  { slug: "allahu-yuhibbu", phraseAr: "الله يحب", labelEn: "Allāhu yuḥibbu (Allah loves)" },
  { slug: "allahu-la-yuhibbu", phraseAr: "الله لا يحب", labelEn: "Allāhu lā yuḥibbu (Allah does not love)" },
  { slug: "allahu-maa", phraseAr: "الله مع", labelEn: "Allāhu ma'a (Allah is with)" },
  { slug: "allahu-huwa", phraseAr: "الله هو", labelEn: "Allāhu huwa (Allah is)" },
  { slug: "min-rabbihi", phraseAr: "من ربه", labelEn: "Min rabbihi (From his Lord)" },
  { slug: "min-allah", phraseAr: "من الله", labelEn: "Min Allah (From Allah)" },
  { slug: "min-rabbikum", phraseAr: "من ربكم", labelEn: "Min rabbikum (From your Lord)" },
  { slug: "min-ladunna", phraseAr: "من لدنا", labelEn: "Min ladunnā (From Us)" },
  { slug: "ala-allah", phraseAr: "على الله", labelEn: "'Alā Allah (Upon Allah)" },
  { slug: "billah", phraseAr: "بالله", labelEn: "Billāh (By/in Allah)" },
  { slug: "ila-allah", phraseAr: "إلى الله", labelEn: "Ilā Allah (To Allah)" },
  { slug: "maa-allah", phraseAr: "مع الله", labelEn: "Ma'a Allah (With Allah)" },
  { slug: "fi-allah", phraseAr: "في الله", labelEn: "Fī Allah (In/concerning Allah)" },
  { slug: "inda-allah", phraseAr: "عند الله", labelEn: "'Inda Allah (With/near Allah)" },
  { slug: "ila-rabbikum", phraseAr: "إلى ربكم", labelEn: "Ilā rabbikum (To your Lord)" },
  { slug: "ila-rabbik", phraseAr: "الى ربك", labelEn: "Ilā rabbik (To your Lord)" },
  { slug: "ala-rabbikum", phraseAr: "على ربكم", labelEn: "'Alā rabbikum (Upon your Lord)" },
  { slug: "ala-rabbik", phraseAr: "على ربك", labelEn: "'Alā rabbik (Upon your Lord)" },
  { slug: "maa-rabbikum", phraseAr: "مع ربكم", labelEn: "Ma'a rabbikum (With your Lord)" },
  { slug: "maa-rabbik", phraseAr: "مع ربك", labelEn: "Ma'a rabbik (With your Lord)" },
  { slug: "fi-rabbikum", phraseAr: "في ربكم", labelEn: "Fī rabbikum (In/concerning your Lord)" },
  { slug: "fi-rabbik", phraseAr: "في ربك", labelEn: "Fī rabbik (In/concerning your Lord)" },
  { slug: "inda-rabbik", phraseAr: "عند ربك", labelEn: "'Inda rabbik (With/near your Lord)" },
  { slug: "wa-allah", phraseAr: "والله", labelEn: "Wa Allah (And/by Allah)" },
  { slug: "wa-rabbikum", phraseAr: "وربكم", labelEn: "Wa rabbikum (And your Lord)" },
];

/**
 * Every verse containing `phraseAr` anywhere -- a thin wrapper over the
 * existing exact-phrase search (`searchArabicPhrase`, already used by
 * /search/'s text search), kept as a named entry point for this feature
 * area rather than importing `searchArabicPhrase` directly at call sites.
 */
export function findVersesContaining(phraseAr: string, arIndex: ArIndexFile): PhraseMatch[] {
  return searchArabicPhrase(phraseAr, arIndex);
}
