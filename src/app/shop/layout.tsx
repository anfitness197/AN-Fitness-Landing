import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Premium Supplements Shop",
  description:
    "Shop premium supplements at AN Fitness Khordha. Top brands for protein, creatine and fitness essentials — enquire directly on WhatsApp.",
  openGraph: {
    title: "Premium Supplements Shop | AN Fitness Khordha",
    description:
      "Premium supplements from top brands at AN Fitness Khordha. Tap to enquire directly on WhatsApp.",
  },
  alternates: {
    canonical: "/shop",
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
