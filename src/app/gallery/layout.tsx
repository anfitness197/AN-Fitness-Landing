import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Photo Gallery",
  description:
    "Browse the AN Fitness training facility gallery. View our strength decks, gym equipment, workout areas, and premium facility in Khordha.",
  openGraph: {
    title: "Photo Gallery | AN Fitness",
    description:
      "Browse the AN Fitness training facility gallery. View our strength decks, gym equipment, workout areas, and premium facility in Khordha.",
  },
  alternates: {
    canonical: "/gallery",
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
