"use client";

import "./team-constellation.css";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, Orbit, Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
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
import dynamic from "next/dynamic";
import { teamSpacePosition } from "./team-space";

const TeamNeuralField = dynamic(() => import("./team-neural-field"));

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

type TravelVector = { x: number; y: number };

function wrapIndex(index: number, length: number) {
  if (!length) return 0;
  return ((index % length) + length) % length;
}

function transitionVector(fromIndex: number, toIndex: number, total: number): TravelVector {
  const from = teamSpacePosition(fromIndex, total);
  const to = teamSpacePosition(toIndex, total);
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const magnitude = Math.max(Math.hypot(dx, dy), 0.001);
  return {
    x: (dx / magnitude) * 28,
    y: (-dy / magnitude) * 22,
  };
}

export default function TeamConstellation({
  members,
  viewProfileLabel,
  teamLabel,
  previousMemberLabel,
  nextMemberLabel,
}: {
  members: TeamConstellationMember[];
  viewProfileLabel: string;
  teamLabel: string;
  previousMemberLabel: string;
  nextMemberLabel: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [travel, setTravel] = useState<TravelVector>({ x: 0, y: 0 });
  const active = members[activeIndex] ?? members[0];

  const paddedIndex = useMemo(
    () => String(activeIndex + 1).padStart(Math.max(2, String(members.length).length), "0"),
    [activeIndex, members.length],
  );
  const paddedCount = useMemo(
    () => String(members.length).padStart(Math.max(2, String(members.length).length), "0"),
    [members.length],
  );

  const selectIndex = useCallback(
    (requestedIndex: number) => {
      if (!members.length) return;
      const nextIndex = wrapIndex(requestedIndex, members.length);
      if (nextIndex === activeIndex) return;
      setTravel(transitionVector(activeIndex, nextIndex, members.length));
      setActiveIndex(nextIndex);
    },
    [activeIndex, members.length],
  );

  if (!active) return null;

  return (
    <div className="team-constellation team-neural" data-count={members.length}>
      <div className="team-neural__arena">
        <TeamNeuralField members={members} activeIndex={activeIndex} onSelect={selectIndex} />
        <div aria-hidden className="team-neural__vignette" />
        <div aria-hidden className="team-neural__grid" />
        <div aria-hidden className="team-neural__safe-zone" />

        <div className="team-neural__core-halo" aria-hidden>
          <span />
          <span />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.article
            key={active.id}
            className="team-neural__spotlight"
            {...cosmeticAccentProps(active.cosmetics.profileAccent)}
            initial={{
              opacity: 0,
              x: travel.x,
              y: travel.y,
              scale: 0.984,
              filter: "blur(5px)",
            }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{
              opacity: 0,
              x: -travel.x * 0.55,
              y: -travel.y * 0.55,
              scale: 0.992,
              filter: "blur(4px)",
            }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            <div aria-hidden className="team-neural__accent-surface">
              <CosmeticAccentLayer preset={active.cosmetics.profileAccent} />
            </div>

            <div className="team-neural__banner">
              <div aria-hidden className="team-neural__banner-default">
                <span />
                <span />
                <span />
              </div>
              <CosmeticBannerLayer preset={active.cosmetics.bannerStyle} />
              <div className="team-neural__signal-tag">
                <Orbit size={13} />
                <span>{paddedIndex}</span>
                <span className="team-neural__signal-divider" />
                <span>{paddedCount}</span>
              </div>
            </div>

            <div className="team-neural__profile-body">
              <div className="team-neural__avatar-row">
                <motion.div
                  className="team-neural__avatar-mount"
                  initial={{ scale: 0.94, rotate: -1.5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                >
                  <CosmeticAvatarFrame preset={active.cosmetics.avatarFrame}>
                    <UserAvatar
                      identity={active}
                      alt={active.displayName}
                      className="size-[5.75rem] border-[5px] border-card text-3xl shadow-2xl shadow-black/20 sm:size-[6.35rem]"
                    />
                  </CosmeticAvatarFrame>
                </motion.div>

                <div className="team-neural__role-pill">
                  <Sparkles size={13} aria-hidden />
                  <span>{active.roleTitle}</span>
                </div>
              </div>

              <div className="team-neural__profile-copy">
                <div className="team-neural__name-row">
                  <h3 className="team-neural__display-name">
                    <CosmeticNameplate preset={active.cosmetics.nameplate} className="team-neural__nameplate">
                      {active.displayName}
                    </CosmeticNameplate>
                  </h3>
                  <CosmeticBadge preset={active.cosmetics.profileBadge} label="" />
                </div>
                <p className="team-neural__username">@{active.username}</p>
                <p className="team-neural__bio">
                  {active.bio || `${active.displayName} · ${active.roleTitle}`}
                </p>

                <div className="team-neural__actions">
                  <Link href={`/perfil/${active.username}`} className="team-neural__profile-link">
                    <span>{viewProfileLabel}</span>
                    <ArrowUpRight size={15} aria-hidden />
                  </Link>
                  <span className="team-neural__active-caption" aria-hidden>
                    <span />
                    {teamLabel.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </motion.article>
        </AnimatePresence>

        <div className="team-neural__navigator" role="group" aria-label={teamLabel}>
          <button
            type="button"
            className="team-neural__nav-button"
            onClick={() => selectIndex(activeIndex - 1)}
            aria-label={previousMemberLabel}
            title={previousMemberLabel}
          >
            <ArrowLeft size={18} aria-hidden />
          </button>

          <div className="team-neural__nav-status" aria-live="polite">
            <span className="team-neural__nav-route" aria-hidden>
              <i />
              <i />
              <i />
            </span>
            <span className="team-neural__nav-copy">
              <strong>{active.displayName}</strong>
              <small>{paddedIndex} / {paddedCount}</small>
            </span>
          </div>

          <button
            type="button"
            className="team-neural__nav-button"
            onClick={() => selectIndex(activeIndex + 1)}
            aria-label={nextMemberLabel}
            title={nextMemberLabel}
          >
            <ArrowRight size={18} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
