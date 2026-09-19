import { readMeta } from "@/lib/data/serverData";
import { QuranPageContent } from "@/components/quran/QuranPageContent";
import { absoluteUrl } from "@/lib/site";

export const metadata = {
  title: "The Qur'an",
  alternates: { canonical: absoluteUrl("/quran/") },
};

export default function QuranPage() {
  const meta = readMeta();

  return <QuranPageContent surahs={meta.surahs} />;
}
