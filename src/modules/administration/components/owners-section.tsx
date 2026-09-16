import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/infrastructure/database/prisma";
import { translated } from "@/modules/editorial/publication";
import { identityName } from "@/modules/profiles/types";
import { cosmeticVisualsByType, toSafeCosmeticVisual } from "@/modules/cosmetics/visuals";
import { isEntitlementActive } from "@/modules/cosmetics/service";
import TeamConstellation, { type TeamConstellationMember } from "@/modules/administration/components/team-constellation";

export default async function OwnersSection() {
  const [t, locale, members] = await Promise.all([
    getTranslations("Content"),
    getLocale(),
    prisma.teamMember.findMany({
      where: { active: true, userId: { not: null } },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            name: true,
            image: true,
            equippedCosmetics: {
              select: {
                type: true,
                cosmetic: {
                  select: {
                    visualPreset: true,
                    premiumOnly: true,
                  },
                },
              },
            },
            premiumEntitlements: {
              select: {
                startsAt: true,
                expiresAt: true,
                revokedAt: true,
              },
            },
          },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const constellation = members.flatMap<TeamConstellationMember>((raw) => {
    const user = raw.user;
    if (!user?.username) return [];

    const member = translated(raw, locale);
    const hasActivePremium = user.premiumEntitlements.some((entitlement) => isEntitlementActive(entitlement));
    const cosmetics = cosmeticVisualsByType(
      user.equippedCosmetics
        .filter((equipped) => !equipped.cosmetic.premiumOnly || hasActivePremium)
        .map((equipped) => toSafeCosmeticVisual({ type: equipped.type, visualPreset: equipped.cosmetic.visualPreset })),
    );

    return [{
      id: member.id,
      username: user.username,
      displayName: identityName(user),
      name: user.name,
      image: user.image,
      roleTitle: member.roleTitle,
      bio: member.bio,
      cosmetics: {
        avatarFrame: cosmetics.AVATAR_FRAME?.visualPreset,
        profileAccent: cosmetics.PROFILE_ACCENT?.visualPreset,
        profileBadge: cosmetics.PROFILE_BADGE?.visualPreset,
        nameplate: cosmetics.NAMEPLATE?.visualPreset,
        bannerStyle: cosmetics.BANNER_STYLE?.visualPreset,
      },
    }];
  });

  if (!constellation.length) return null;

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mb-7 flex items-end justify-between gap-4 sm:mb-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary/75">TIME FOR LIVES</p>
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            <Link href="/equipo" className="transition-colors hover:text-primary">{t("team")}</Link>
          </h2>
        </div>
        <Link
          href="/equipo"
          className="hidden rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary transition hover:border-primary/35 hover:bg-primary/10 sm:inline-flex"
        >
          {t("team")}
          <span aria-hidden className="ml-2">↗</span>
        </Link>
      </div>

      <TeamConstellation
        members={constellation}
        viewProfileLabel={t("viewProfile")}
        teamLabel={t("team")}
        previousMemberLabel={t("previousMember")}
        nextMemberLabel={t("nextMember")}
      />
    </section>
  );
}
