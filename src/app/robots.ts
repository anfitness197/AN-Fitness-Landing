import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://anfitness.in";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/an-admin/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
