import { LimitsContent } from "@/components/limits/LimitsContent";
import { absoluteUrl } from "@/lib/site";

export const metadata = {
  title: "Limits",
  alternates: { canonical: absoluteUrl("/limits/") },
};

export default function LimitsPage() {
  return <LimitsContent />;
}
