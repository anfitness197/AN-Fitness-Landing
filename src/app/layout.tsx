import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/layout-wrapper";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  preload: false,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
  preload: false,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://anfitness.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AN Fitness | Best Gym & Training Club | Khordha",
    template: "%s | AN Fitness",
  },
  description:
    "Experience the best gym in Khordha at AN Fitness. Proper strength zones, elite personal coaching, Zumba classes, and a premium training environment. Forge your steel.",
  keywords: [
    "AN Fitness",
    "gym Khordha",
    "fitness club Khordha",
    "gym near me Khordha",
    "strength training Odisha",
    "personal trainer Khordha",
    "Zumba classes Khordha",
    "best gym Khordha",
    "AN Fitness Khordha",
    "workout gym Palla",
  ],
  authors: [{ name: "AN Fitness" }],
  creator: "AN Fitness",
  publisher: "AN Fitness",
  applicationName: "AN Fitness",
  manifest: "/assets/logos/site.webmanifest",
  appleWebApp: {
    capable: true,
    title: "AN Fitness",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/assets/logos/favicon.svg",
    apple: "/assets/logos/apple-touch-icon.png",
    shortcut: "/assets/logos/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "AN Fitness",
    title: "AN Fitness | Best Gym & Training Club | Khordha",
    description:
      "Khordha's best gym and premier training club. State-of-the-art strength decks, custom combat rings, recovery zone, certified coaches, and Zumba classes.",
    images: [
      {
        url: "/assets/logos/og-image.png",
        width: 1200,
        height: 630,
        alt: "AN Fitness - Best Gym & Training Club Khordha",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AN Fitness | Best Gym & Training Club | Khordha",
    description:
      "Khordha's best gym and premier training club. Strength decks, personal coaching, Zumba, and premium facilities.",
    images: ["/assets/logos/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0a",
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "HealthClub",
  name: "AN Fitness",
  description:
    "Khordha's best gym and premier training club offering strength training, personal coaching, Zumba classes, and premium gym facilities.",
  url: siteUrl,
  telephone: "+919867195346",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Palla Main Road, Palla",
    addressLocality: "Khordha",
    addressRegion: "Odisha",
    postalCode: "752056",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "20.1825",
    longitude: "85.6167",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "05:00",
      closes: "12:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "16:00",
      closes: "22:30",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Sunday"],
      opens: "06:00",
      closes: "10:00",
    },
  ],
  priceRange: "₹₹",
  image: `${siteUrl}/assets/logos/og-image.png`,
  areaServed: {
    "@type": "City",
    name: "Khordha",
  },
  sameAs: ["https://instagram.com/an_fitness2025"],
  founder: {
    "@type": "Person",
    name: "Anil Mahapatra",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AN Fitness",
  url: siteUrl,
  logo: `${siteUrl}/assets/logos/favicon.svg`,
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+919867195346",
    contactType: "customer service",
    availableLanguage: ["English", "Hindi", "Odia"],
  },
  sameAs: ["https://instagram.com/an_fitness2025"],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AN Fitness",
  url: siteUrl,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="icon" href="/assets/logos/favicon.svg" type="image/svg+xml" />
        <link rel="preload" href="/assets/logos/favicon.svg" as="image" type="image/svg+xml" fetchPriority="high" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body
        className={`${outfit.variable} ${inter.variable} font-sans antialiased bg-zinc-950 text-zinc-100 selection:bg-brandRed selection:text-white`}
      >
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
