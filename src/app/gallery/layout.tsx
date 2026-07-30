import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Photo Gallery",
  description:
    "Browse the AN Fitness gym gallery. View our strength floor, gym equipment, workout areas, and facilities in Khordha.",
  openGraph: {
    title: "Photo Gallery | AN Fitness",
    description:
      "Browse the AN Fitness gym gallery. View our strength floor, gym equipment, workout areas, and facilities in Khordha.",
  },
  alternates: {
    canonical: "/gallery",
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
