import { TopicsPageContent } from "@/components/topics/TopicsPageContent";
import { absoluteUrl } from "@/lib/site";

export const metadata = {
  title: "Browse by topic",
  alternates: { canonical: absoluteUrl("/topics/") },
};

export default function TopicsPage() {
  return <TopicsPageContent />;
}
