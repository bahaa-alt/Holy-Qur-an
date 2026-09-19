import { TopicComparePageContent } from "@/components/topics/TopicComparePageContent";
import { absoluteUrl } from "@/lib/site";

export const metadata = {
  title: "Compare topics",
  alternates: { canonical: absoluteUrl("/topics/compare/") },
};

export default function TopicComparePage() {
  return <TopicComparePageContent />;
}
