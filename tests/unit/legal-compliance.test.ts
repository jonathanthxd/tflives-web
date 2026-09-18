import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { staticSeoRoutes } from "@/shared/seo/routes";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

type Json = Record<string, unknown>;

function keysDeep(value: Json, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      return keysDeep(child as Json, path);
    }
    return [path];
  });
}

const es = JSON.parse(read("messages/es.json")) as Json;
const en = JSON.parse(read("messages/en.json")) as Json;

test("new legal namespaces keep ES/EN key parity", () => {
  for (const namespace of ["Cookies", "LegalNotice", "CommunityGuidelines", "CookieNotice"]) {
    const esKeys = keysDeep(es[namespace] as Json).sort();
    const enKeys = keysDeep(en[namespace] as Json).sort();
    assert.ok(esKeys.length > 0, `${namespace} should exist in ES`);
    assert.deepEqual(enKeys, esKeys, `${namespace} parity`);
  }
});

test("privacy, terms, subscription and footer keys are at parity", () => {
  for (const namespace of ["Privacy", "Terms", "Subscription", "Footer", "Register"]) {
    assert.deepEqual(
      keysDeep(en[namespace] as Json).sort(),
      keysDeep(es[namespace] as Json).sort(),
      namespace,
    );
  }
});

test("legal contact points to Discord instead of non-existent mailboxes", () => {
  const serialized = JSON.stringify({ privacy: es.Privacy, terms: es.Terms });
  assert.doesNotMatch(serialized, /privacy@tflives\.com|legal@tflives\.com/);
  assert.match(read("src/app/[locale]/(marketing)/privacidad/page.tsx"), /DISCORD_INVITE/);
  assert.match(read("src/app/[locale]/(marketing)/terminos/page.tsx"), /DISCORD_INVITE/);
});

test("legal pages exist, opt out of instant navigation and expose alternates", () => {
  const pages = [
    ["src/app/[locale]/(marketing)/privacidad/page.tsx", "Privacy"],
    ["src/app/[locale]/(marketing)/terminos/page.tsx", "Terms"],
    ["src/app/[locale]/(marketing)/cookies/page.tsx", "Cookies"],
    ["src/app/[locale]/(marketing)/aviso-legal/page.tsx", "LegalNotice"],
    ["src/app/[locale]/(marketing)/normas/page.tsx", "CommunityGuidelines"],
  ] as const;
  for (const [path, namespace] of pages) {
    assert.ok(existsSync(join(root, path)), path);
    const source = read(path);
    assert.match(source, /export const instant = false;/, path);
    assert.match(source, /generateMetadata/, path);
    assert.match(source, /alternatesFor/, path);
    assert.ok(source.includes(`namespace: "${namespace}"`), path);
  }
});

test("legal pages reuse the shared legal shell to avoid navbar overlap", () => {
  const shared = read("src/shared/ui/legal-page.tsx");
  assert.match(shared, /pt-28/);
  for (const path of [
    "src/app/[locale]/(marketing)/privacidad/page.tsx",
    "src/app/[locale]/(marketing)/cookies/page.tsx",
    "src/app/[locale]/(marketing)/normas/page.tsx",
  ]) {
    assert.match(read(path), /from "@\/shared\/ui\/legal-page"/, path);
  }
});

test("sitemap advertises the new legal routes", () => {
  const paths = staticSeoRoutes.map((route) => route.path);
  for (const expected of ["/cookies", "/aviso-legal", "/normas"]) {
    assert.ok(paths.includes(expected), expected);
  }
});

test("footer links all legal pages", () => {
  const footer = read("src/shared/ui/layout/footer.tsx");
  for (const href of ["/privacidad", "/terminos", "/cookies", "/aviso-legal", "/normas"]) {
    assert.ok(footer.includes(`href="${href}"`), href);
  }
});

test("cookie notice is informational, dismissible and rendered globally", () => {
  const notice = read("src/shared/ui/cookie-notice.tsx");
  assert.match(notice, /localStorage/);
  assert.match(notice, /href="\/cookies"/);
  assert.match(read("src/app/[locale]/layout.tsx"), /<CookieNotice \/>/);
});

test("registration requires accepting terms and privacy", () => {
  const register = read("src/app/[locale]/(account)/register/page.tsx");
  assert.match(register, /acceptedTerms/);
  assert.match(register, /debesAceptar/);
  assert.match(register, /if \(!acceptedTerms\)/);
  assert.match(register, /href="\/terminos"/);
  assert.match(register, /href="\/privacidad"/);
  const gate = register.indexOf("if (!acceptedTerms)");
  const signUp = register.indexOf("authClient.signUp.email");
  assert.ok(gate > 0 && signUp > 0 && gate < signUp, "terms gate must precede sign-up");
});

test("subscription page avoids navbar overlap and renders premium status", () => {
  const source = read("src/app/[locale]/(account)/suscripcion/page.tsx");
  assert.match(source, /pt-28/);
  assert.doesNotMatch(source, /py-12/);
  assert.match(source, /getUserPremiumStatus/);
  assert.match(source, /sourceAdmin/);
  assert.match(source, /DISCORD_INVITE/);
});
