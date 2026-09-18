import { absoluteUrl, localePath, siteConfig } from "@/config/site";

export type JsonLdNode = Record<string, unknown>;

export function jsonLdGraph(...nodes: JsonLdNode[]): JsonLdNode {
  return { "@context": "https://schema.org", "@graph": nodes };
}

export function organizationNode(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/icon.png"),
    },
  };
}

export function websiteNode(locale: string): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    url: absoluteUrl(localePath(locale, "/")),
    name: siteConfig.name,
    inLanguage: locale,
    publisher: { "@id": `${siteConfig.url}/#organization` },
  };
}

export function breadcrumbNode(
  items: Array<{ name: string; path: string }>,
): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function personNode(input: {
  locale: string;
  name: string;
  username: string;
  description?: string;
  image?: string;
  path: string;
}): JsonLdNode {
  return {
    "@type": "Person",
    "@id": `${absoluteUrl(input.path)}#person`,
    name: input.name,
    alternateName: `@${input.username}`,
    description: input.description || undefined,
    image: input.image || undefined,
    url: absoluteUrl(input.path),
    mainEntityOfPage: absoluteUrl(input.path),
    inLanguage: input.locale,
  };
}

export function articleNode(input: {
  locale: string;
  headline: string;
  description?: string;
  image?: string;
  path: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  section?: string;
}): JsonLdNode {
  return {
    "@type": "Article",
    "@id": `${absoluteUrl(input.path)}#article`,
    headline: input.headline,
    description: input.description || undefined,
    image: input.image || undefined,
    url: absoluteUrl(input.path),
    mainEntityOfPage: absoluteUrl(input.path),
    inLanguage: input.locale,
    datePublished: input.datePublished || undefined,
    dateModified: input.dateModified || input.datePublished || undefined,
    author: input.authorName
      ? { "@type": "Person", name: input.authorName }
      : { "@id": `${siteConfig.url}/#organization` },
    publisher: { "@id": `${siteConfig.url}/#organization` },
    articleSection: input.section || undefined,
  };
}
