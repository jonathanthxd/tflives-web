import { getTranslations } from "next-intl/server";
import { TeamCards } from "@/modules/network/components/public-content";
import { Link } from "@/i18n/navigation";
export default async function OwnersSection() {
  const t = await getTranslations("Content");
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <h2 className="mb-10 text-center font-display text-3xl font-semibold">
        <Link href="/equipo">{t("team")}</Link>
      </h2>
      <TeamCards limit={3} />
    </section>
  );
}
