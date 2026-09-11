import { searchArabicPhrase, type PhraseMatch } from "@/lib/search/arabicPhrase";
import type { ArIndexFile } from "@/lib/data/types";

/** One curated phrase this app lets a researcher browse every verse that
 *  literally opens with, rather than just contains anywhere. */
export interface OpeningPhraseDef {
  slug: string;
  phraseAr: string;
  labelEn: string;
}

/**
 * A hand-picked set of Allah-invoking openings and formulas -- direct
 * addresses (اللهم), first-person/second-person references to Allah as
 * "Lord" (رب, ربي, ربكم, ربنا), and a few recurring verse-opening
 * constructions (هو الذي, قل هو, إن الله ...). Not derived from any
 * automatic frequency scan; this is a curated starting point, matching
 * this app's existing Topics/Names convention.
 */
export const OPENING_PHRASES: OpeningPhraseDef[] = [
  { slug: "allah", phraseAr: "الله", labelEn: "Allah" },
  { slug: "allahu-huwa", phraseAr: "الله هو", labelEn: "Allāhu huwa (Allah is)" },
  { slug: "allahumma", phraseAr: "اللهم", labelEn: "Allāhumma (O Allah)" },
  { slug: "qul-allahumma", phraseAr: "قل اللهم", labelEn: "Qul Allāhumma (Say: O Allah)" },
  { slug: "rabb", phraseAr: "رب", labelEn: "Rabb (Lord)" },
  { slug: "rabbi", phraseAr: "ربي", labelEn: "Rabbī (My Lord)" },
  { slug: "rabbuna", phraseAr: "ربنا", labelEn: "Rabbunā (Our Lord)" },
  { slug: "rabbukum", phraseAr: "ربكم", labelEn: "Rabbukum (Your Lord)" },
  { slug: "huwa-alladhi", phraseAr: "هو الذي", labelEn: "Huwa alladhī (He is the One who)" },
  { slug: "qul-huwa", phraseAr: "قل هو", labelEn: "Qul huwa (Say: He is)" },
  { slug: "inna-allaha-yuhibbu", phraseAr: "إن الله يحب", labelEn: "Inna Allāha yuḥibbu (Indeed, Allah loves)" },
  { slug: "inna-allaha-la-yuhibbu", phraseAr: "إن الله لا يحب", labelEn: "Inna Allāha lā yuḥibbu (Indeed, Allah does not love)" },
  { slug: "inna-allaha-maa", phraseAr: "إن الله مع", labelEn: "Inna Allāha ma'a (Indeed, Allah is with)" },
];

/**
 * Every verse whose text literally *opens* with `phraseAr` (word 1
 * onward), not just contains it anywhere -- a thin filter over the
 * existing exact-phrase search (`searchArabicPhrase`, already used by
 * /search/'s text search) restricted to `startW === 1`. Reuses that
 * function's normalization (diacritic/alif/hamza-insensitive matching)
 * rather than re-implementing it.
 */
export function findVersesStartingWith(phraseAr: string, arIndex: ArIndexFile): PhraseMatch[] {
  return searchArabicPhrase(phraseAr, arIndex).filter((m) => m.startW === 1);
}
