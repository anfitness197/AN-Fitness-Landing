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
    default: "AN Fitness | Best Gym in Khordha & Premier Training Club",
    template: "%s | AN Fitness Khordha",
  },
  description:
    "AN Fitness is recognized as the best gym in Khordha, Odisha. Featuring world-class heavy strength decks, personal coaching, Zumba classes, and premium facilities in Palla.",
  keywords: [
    "best gym in khordha",
    "best gym khordha",
    "AN Fitness",
    "gym in khordha",
    "fitness club khordha",
    "top rated gym khordha",
    "unisex gym khordha",
    "personal trainer khordha",
    "best fitness centre in khordha",
    "gym near me khordha",
    "zumba classes khordha",
    "strength training khordha",
    "AN Fitness Palla Khordha",
    "weight loss gym khordha",
  ],
  authors: [{ name: "AN Fitness" }],
  creator: "AN Fitness",
  publisher: "AN Fitness",
  applicationName: "AN Fitness",
  manifest: "/assets/logos/site.webmanifest",
  appleWebApp: {
    capable: true,
    title: "AN Fitness Khordha",
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
    siteName: "AN Fitness - Best Gym in Khordha",
    title: "AN Fitness | Best Gym in Khordha & Premier Training Club",
    description:
      "Looking for the best gym in Khordha? AN Fitness delivers state-of-the-art strength decks, personal coaching, recovery zones, and Zumba classes.",
    images: [
      {
        url: "/assets/logos/og-image.png",
        width: 1200,
        height: 630,
        alt: "AN Fitness - Best Gym in Khordha, Odisha",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AN Fitness | Best Gym in Khordha",
    description:
      "Khordha's #1 premier gym & fitness club. Professional trainers, modern equipment, and Zumba classes.",
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
  name: "AN Fitness - Best Gym in Khordha",
  description:
    "AN Fitness is the best gym in Khordha, offering state-of-the-art strength decks, personal coaching, Zumba classes, and premium workout equipment.",
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
    latitude: "20.1677",
    longitude: "85.6067",
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

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Which is the best gym in Khordha?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AN Fitness is widely recognized as the best gym in Khordha, featuring top-quality strength machines, certified personal coaches, Zumba sessions, and a hygienic environment."
      }
    },
    {
      "@type": "Question",
      name: "Where is AN Fitness located in Khordha?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AN Fitness is located on Palla Main Road, Palla, Khordha, Odisha 752056."
      }
    },
    {
      "@type": "Question",
      name: "What facilities are offered at AN Fitness Khordha?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AN Fitness offers strength training, personal coaching, cardio deck, Zumba classes, recovery saunas, and custom workout programs."
      }
    }
  ]
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
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
