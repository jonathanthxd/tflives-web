import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";
import {
  absoluteUrl,
  alternatesFor,
  languageAlternates,
  localePath,
  siteConfig,
} from "@/config/site";
import { staticSeoRoutes } from "@/shared/seo/routes";
import robots from "@/app/robots";
import manifest from "@/app/manifest";
import {
  articleNode,
  breadcrumbNode,
  jsonLdGraph,
  organizationNode,
  personNode,
  websiteNode,
} from "@/shared/seo/schema";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

function filesUnder(path: string): string[] {
  const absolute = join(root, path);
  return readdirSync(absolute).flatMap((entry) => {
    const child = join(absolute, entry);
    if (statSync(child).isDirectory()) {
      return filesUnder(relative(root, child));
    }
    return [relative(root, child).replaceAll("\\", "/")];
  });
}

test("site config exposes an origin and absolute URL helpers", () => {
  assert.match(siteConfig.url, /^https?:\/\/[^/]+$/);
  assert.equal(absoluteUrl("/"), `${siteConfig.url}/`);
  assert.equal(absoluteUrl("/network"), `${siteConfig.url}/network`);
  assert.equal(absoluteUrl("network"), `${siteConfig.url}/network`);
});

test("locale helpers build locale-prefixed paths and hreflang maps", () => {
  assert.equal(localePath("en", "/network"), "/en/network");
  assert.equal(localePath("es", "/"), "/es");
  assert.equal(localePath("es"), "/es");
  assert.deepEqual(languageAlternates("/network/wiki"), {
    es: "/es/network/wiki",
    en: "/en/network/wiki",
    "x-default": "/es/network/wiki",
  });
  assert.deepEqual(alternatesFor("en", "/network"), {
    canonical: "/en/network",
    languages: { es: "/es/network", en: "/en/network", "x-default": "/es/network" },
  });
});

test("static sitemap routes cover public pages and exclude private surfaces", () => {
  const paths = staticSeoRoutes.map((route) => route.path);
  for (const expected of ["/", "/network", "/network/wiki", "/streamers", "/proyectos"]) {
    assert.ok(paths.includes(expected), expected);
  }
  const forbidden = /admin|login|register|mensajes|amigos|configuracion|cosmeticos/;
  assert.deepEqual(
    paths.filter((path) => forbidden.test(path)),
    [],
  );
});

test("robots disallows private surfaces and links the sitemap", () => {
  const result = robots();
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
  const disallow = rules.flatMap((rule) =>
    Array.isArray(rule.disallow) ? rule.disallow : rule.disallow ? [rule.disallow] : [],
  );
  assert.ok(disallow.some((entry) => entry.includes("admin")));
  assert.ok(disallow.some((entry) => entry.includes("mensajes")));
  assert.ok(disallow.some((entry) => entry.includes("login")));
  assert.equal(result.sitemap, absoluteUrl("/sitemap.xml"));
});

test("web app manifest is installable and locale-aware", () => {
  const result = manifest();
  assert.equal(result.name, siteConfig.title);
  assert.equal(result.short_name, siteConfig.name);
  assert.equal(result.start_url, `/${siteConfig.defaultLocale}`);
  assert.equal(result.display, "standalone");
  assert.equal(result.lang, siteConfig.defaultLocale);
  assert.ok(result.icons && result.icons.length > 0);
});

test("JSON-LD builders produce structured nodes", () => {
  const organization = organizationNode();
  assert.equal(organization["@type"], "Organization");
  assert.equal(organization["@id"], `${siteConfig.url}/#organization`);

  const website = websiteNode("es");
  assert.equal(website["@type"], "WebSite");
  assert.equal(website.inLanguage, "es");

  const graph = jsonLdGraph(organization, website);
  assert.equal(graph["@context"], "https://schema.org");
  assert.ok(Array.isArray(graph["@graph"]));

  const person = personNode({
    locale: "es",
    name: "Ana",
    username: "ana",
    path: "/es/perfil/ana",
  });
  assert.equal(person["@type"], "Person");
  assert.equal(person["@id"], `${absoluteUrl("/es/perfil/ana")}#person`);
  assert.equal(person.alternateName, "@ana");

  const article = articleNode({
    locale: "es",
    headline: "Hola",
    path: "/es/network/hola",
    datePublished: "2026-01-01T00:00:00.000Z",
  });
  assert.equal(article["@type"], "Article");
  assert.equal(article.datePublished, "2026-01-01T00:00:00.000Z");
  assert.equal(article.dateModified, "2026-01-01T00:00:00.000Z");

  const breadcrumb = breadcrumbNode([
    { name: "Inicio", path: "/es" },
    { name: "Wiki", path: "/es/network/wiki" },
  ]);
  assert.equal(breadcrumb["@type"], "BreadcrumbList");
  assert.equal(
    (breadcrumb.itemListElement as unknown[]).length,
    2,
  );
});

test("sitemap renders both locales with alternates and dynamic content", () => {
  const source = read("src/app/sitemap.ts");
  assert.match(source, /await connection\(\)/);
  assert.match(source, /routing\.locales/);
  assert.match(source, /alternates/);
  for (const model of [
    "post.findMany",
    "wikiArticle.findMany",
    "modality.findMany",
    "creatorProfile.findMany",
    "user.findMany",
  ]) {
    assert.ok(source.includes(model), model);
  }
});

test("default social images and metadata routes exist", () => {
  assert.match(
    read("src/app/[locale]/opengraph-image.tsx"),
    /renderDefaultOgImage/,
  );
  assert.match(
    read("src/app/[locale]/twitter-image.tsx"),
    /renderDefaultOgImage/,
  );
  assert.match(read("src/app/manifest.ts"), /MetadataRoute\.Manifest/);
  assert.match(read("src/app/robots.ts"), /MetadataRoute\.Robots/);
});

test("JSON-LD payloads escape angle brackets", () => {
  assert.match(read("src/shared/seo/json-ld.tsx"), /\\u003c/);
});

test("public pages expose canonical and hreflang alternates", () => {
  const pages = [
    ...filesUnder("src/app/[locale]/(marketing)"),
    ...filesUnder("src/app/[locale]/(platform)/perfil"),
  ].filter((path) => path.endsWith("page.tsx"));

  const offenders = pages.filter((path) => {
    const source = read(path);
    if (!source.includes("generateMetadata")) return false;
    return !source.includes("alternates") && !source.includes("contentMetadata");
  });
  assert.deepEqual(offenders, []);
});
