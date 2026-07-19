import { MetadataRoute } from "next";

const BASE_URL = "https://kleopatra.app";

const toolSlugs = [
  "pgp-encrypt",
  "pgp-decrypt",
  "pgp-key-generator",
  "kleopatra-download",
  "kleopatra-mac",
  "kleopatra-alternative",
  "pgp-online",
  "what-is-pgp",
  "openpgp-vs-pgp",
  "pgp-key-import",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const toolPages: MetadataRoute.Sitemap = toolSlugs.map((slug) => ({
    url: `${BASE_URL}/tools/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/tools`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/create-private-key`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/import-public-key`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...toolPages,
  ];
}
