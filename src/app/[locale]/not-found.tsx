import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function LocaleNotFound() {
  const t = await getTranslations("Profile");
  return (
    <main className="flex min-h-screen items-center px-4 pt-20">
      <section className="mx-auto max-w-md rounded-3xl border border-border bg-card/60 p-8 text-center shadow-xl">
        <p className="font-mono text-sm text-primary">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-foreground">{t("perfilNoEncontrado")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("perfilNoEncontradoDescripcion")}</p>
        <Link href="/comunidad" className="mt-5 inline-flex text-sm font-medium text-primary hover:underline">
          {t("volverComunidad")}
        </Link>
      </section>
    </main>
  );
}
