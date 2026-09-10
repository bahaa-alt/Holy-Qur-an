import { readMeta } from "@/lib/data/serverData";
import { QuranPageContent } from "@/components/quran/QuranPageContent";

export const metadata = { title: "The Qur'an" };

export default function QuranPage() {
  const meta = readMeta();

  return <QuranPageContent surahs={meta.surahs} />;
}
