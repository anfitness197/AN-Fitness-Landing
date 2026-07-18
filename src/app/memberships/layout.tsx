import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Membership Plans & Pricing",
  description:
    "Explore AN Fitness membership plans and pricing. Affordable gym memberships with full access to strength decks, personal coaching, and premium facilities in Khordha.",
  openGraph: {
    title: "Membership Plans & Pricing | AN Fitness",
    description:
      "Explore AN Fitness membership plans and pricing. Affordable gym memberships with full access to strength decks, personal coaching, and premium facilities in Khordha.",
  },
  alternates: {
    canonical: "/memberships",
  },
};

export default function MembershipsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
