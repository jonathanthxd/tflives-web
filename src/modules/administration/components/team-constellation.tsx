"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  CosmeticAccentLayer,
  CosmeticAvatarFrame,
  CosmeticBadge,
  CosmeticBannerLayer,
  CosmeticNameplate,
  cosmeticAccentProps,
} from "@/modules/cosmetics/components/cosmetic-renderer";
import type { CosmeticVisualPresetKey } from "@/modules/cosmetics/visuals";
import { UserAvatar } from "@/modules/profiles/components/user-identity";

export interface TeamConstellationMember {
  id: string;
  username: string;
  displayName: string;
  name: string | null;
  image: string | null;
  roleTitle: string;
  bio: string | null;
  cosmetics: {
    avatarFrame?: CosmeticVisualPresetKey;
    profileAccent?: CosmeticVisualPresetKey;
    profileBadge?: CosmeticVisualPresetKey;
    nameplate?: CosmeticVisualPresetKey;
    bannerStyle?: CosmeticVisualPresetKey;
  };
}

function constellationPoint(index: number, total: number) {
  const angle = -Math.PI / 2 + (index / Math.max(total, 1)) * Math.PI * 2;
  const wobble = index % 2 === 0 ? 1 : -1;
  const radiusX = 43 + wobble * 1.7;
  const radiusY = 38 + ((index % 3) - 1) * 1.6;
  return {
    x: 50 + Math.cos(angle) * radiusX,
    y: 50 + Math.sin(angle) * radiusY,
  };
}

export default function TeamConstellation({
  members,
  viewProfileLabel,
  teamLabel,
}: {
  members: TeamConstellationMember[];
  viewProfileLabel: string;
  teamLabel: string;
}) {
  const [activeId, setActiveId] = useState(members[0]?.id ?? "");
  const active = members.find((member) => member.id === activeId) ?? members[0];
  const points = useMemo(
    () => members.map((_, index) => constellationPoint(index, members.length)),
    [members],
  );

  if (!active) return null;

  return (
    <div className="team-constellation" data-count={members.length}>
      <div className="team-constellation__arena">
        <div aria-hidden className="team-constellation__field" />

        <svg
          aria-hidden
          className="team-constellation__links"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {points.map((point, index) => (
            <line
              key={members[index]?.id}
              x1="50"
              y1="50"
              x2={point.x}
              y2={point.y}
              className={members[index]?.id === active.id ? "is-active" : undefined}
            />
          ))}
        </svg>

        <article
          key={active.id}
          className="team-constellation__spotlight"
          {...cosmeticAccentProps(active.cosmetics.profileAccent)}
        >
          <div aria-hidden className="team-constellation__spotlight-surface">
            <CosmeticAccentLayer preset={active.cosmetics.profileAccent} />
          </div>
          <div aria-hidden className="team-constellation__spotlight-banner">
            <span />
            <CosmeticBannerLayer preset={active.cosmetics.bannerStyle} />
          </div>

          <div className="team-constellation__identity">
            <CosmeticAvatarFrame preset={active.cosmetics.avatarFrame}>
              <UserAvatar
                identity={active}
                alt={active.displayName}
                className="size-24 border-4 border-card text-3xl shadow-2xl shadow-black/20 sm:size-28"
              />
            </CosmeticAvatarFrame>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h3 className="min-w-0 font-display text-2xl font-semibold sm:text-3xl">
                  <CosmeticNameplate preset={active.cosmetics.nameplate}>
                    {active.displayName}
                  </CosmeticNameplate>
                </h3>
                <CosmeticBadge preset={active.cosmetics.profileBadge} label="" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">@{active.username}</p>
              <p className="mt-3 text-sm font-semibold tracking-wide text-primary">{active.roleTitle}</p>
              {active.bio ? (
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{active.bio}</p>
              ) : null}
              <Link href={`/perfil/${active.username}`} className="team-constellation__profile-link">
                <span>{viewProfileLabel}</span>
                <span aria-hidden>↗</span>
              </Link>
            </div>
          </div>
        </article>

        <div className="team-constellation__nodes" role="group" aria-label={teamLabel}>
          {members.map((member, index) => {
            const point = points[index];
            const selected = member.id === active.id;
            return (
              <button
                key={member.id}
                type="button"
                className="team-constellation__node"
                data-active={selected ? "true" : undefined}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                onMouseEnter={() => setActiveId(member.id)}
                onFocus={() => setActiveId(member.id)}
                onClick={() => setActiveId(member.id)}
                aria-pressed={selected}
                aria-label={`${member.displayName} — ${member.roleTitle}`}
                title={`${member.displayName} — ${member.roleTitle}`}
              >
                <span className="team-constellation__node-lens">
                  <CosmeticAvatarFrame preset={member.cosmetics.avatarFrame} className="team-constellation__node-frame">
                    <UserAvatar identity={member} alt="" className="size-12 text-sm" />
                  </CosmeticAvatarFrame>
                </span>
                <span aria-hidden className="team-constellation__node-pulse" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="team-constellation__mobile-nodes" role="group" aria-label={teamLabel}>
        {members.map((member) => {
          const selected = member.id === active.id;
          return (
            <button
              key={member.id}
              type="button"
              className="team-constellation__mobile-node"
              data-active={selected ? "true" : undefined}
              onClick={() => setActiveId(member.id)}
              onFocus={() => setActiveId(member.id)}
              aria-pressed={selected}
              aria-label={`${member.displayName} — ${member.roleTitle}`}
            >
              <span className="team-constellation__node-lens">
                <CosmeticAvatarFrame preset={member.cosmetics.avatarFrame} className="team-constellation__node-frame">
                  <UserAvatar identity={member} alt="" className="size-11 text-xs" />
                </CosmeticAvatarFrame>
              </span>
              <span className="min-w-0 text-left">
                <span className="block truncate text-xs font-semibold text-foreground">{member.displayName}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{member.roleTitle}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
