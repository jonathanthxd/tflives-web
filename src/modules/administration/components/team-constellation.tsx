"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Orbit, Sparkles } from "lucide-react";
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
import TeamNeuralField from "@/modules/administration/components/team-neural-field";

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

type Point = { x: number; y: number };

function constellationPoint(index: number, total: number): Point {
  const safeTotal = Math.max(total, 1);
  const angle = -Math.PI / 2 + (index / safeTotal) * Math.PI * 2;
  const dense = safeTotal > 10;
  const wave = index % 2 === 0 ? 1 : -1;
  const radiusX = dense ? 45 + wave * 2 : 43 + wave * 2.2;
  const radiusY = dense ? 42 + ((index % 3) - 1) * 1.8 : 39 + ((index % 3) - 1) * 2;
  return {
    x: 50 + Math.cos(angle) * radiusX,
    y: 50 + Math.sin(angle) * radiusY,
  };
}

function curvedPath(from: Point, to: Point, bend: number) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.max(Math.hypot(dx, dy), 1);
  const controlX = midX + (-dy / length) * bend;
  const controlY = midY + (dx / length) * bend;
  return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
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
  const activeIndex = Math.max(0, members.findIndex((member) => member.id === activeId));
  const active = members[activeIndex] ?? members[0];
  const points = useMemo(
    () => members.map((_, index) => constellationPoint(index, members.length)),
    [members],
  );
  const center = useMemo<Point>(() => ({ x: 50, y: 50 }), []);

  if (!active) return null;

  return (
    <div className="team-constellation team-neural" data-count={members.length}>
      <div className="team-neural__arena">
        <TeamNeuralField activeIndex={activeIndex} memberCount={members.length} />
        <div aria-hidden className="team-neural__vignette" />
        <div aria-hidden className="team-neural__grid" />

        <svg
          aria-hidden
          className="team-neural__links"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="team-neural-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.45" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {points.map((point, index) => {
            const selected = members[index]?.id === active.id;
            return (
              <motion.path
                key={`core-${members[index]?.id}`}
                d={curvedPath(center, point, index % 2 === 0 ? 4.2 : -4.2)}
                className="team-neural__link team-neural__link--core"
                data-active={selected ? "true" : undefined}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: selected ? 1 : 0.64 }}
                transition={{ duration: 0.65, delay: index * 0.025, ease: "easeOut" }}
                filter={selected ? "url(#team-neural-glow)" : undefined}
              />
            );
          })}
          {points.map((point, index) => {
            if (points.length < 2) return null;
            const nextIndex = (index + 1) % points.length;
            const next = points[nextIndex];
            const selected = members[index]?.id === active.id || members[nextIndex]?.id === active.id;
            return (
              <motion.path
                key={`peer-${members[index]?.id}-${members[nextIndex]?.id}`}
                d={curvedPath(point, next, index % 2 === 0 ? 2.6 : -2.6)}
                className="team-neural__link team-neural__link--peer"
                data-active={selected ? "true" : undefined}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: selected ? 0.72 : 0.28 }}
                transition={{ duration: 0.8, delay: 0.18 + index * 0.02, ease: "easeOut" }}
              />
            );
          })}
        </svg>

        <div className="team-neural__core-halo" aria-hidden>
          <span />
          <span />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.article
            key={active.id}
            className="team-neural__spotlight"
            {...cosmeticAccentProps(active.cosmetics.profileAccent)}
            initial={{ opacity: 0, y: 10, scale: 0.988, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -7, scale: 0.992, filter: "blur(4px)" }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
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
                <span>{String(activeIndex + 1).padStart(2, "0")}</span>
                <span className="team-neural__signal-divider" />
                <span>{String(members.length).padStart(2, "0")}</span>
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

        <div className="team-neural__nodes" role="group" aria-label={teamLabel}>
          {members.map((member, index) => {
            const point = points[index];
            const selected = member.id === active.id;
            return (
              <motion.button
                key={member.id}
                type="button"
                className="team-neural__node"
                data-active={selected ? "true" : undefined}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                onMouseEnter={() => setActiveId(member.id)}
                onFocus={() => setActiveId(member.id)}
                onClick={() => setActiveId(member.id)}
                aria-pressed={selected}
                aria-label={`${member.displayName} — ${member.roleTitle}`}
                title={`${member.displayName} — ${member.roleTitle}`}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: selected ? 1.08 : 1 }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 330, damping: 23, delay: index * 0.018 }}
              >
                <span aria-hidden className="team-neural__node-orbit" />
                <span className="team-neural__node-lens">
                  <CosmeticAvatarFrame preset={member.cosmetics.avatarFrame} className="team-neural__node-frame">
                    <UserAvatar identity={member} alt="" className="size-11 text-sm sm:size-12" />
                  </CosmeticAvatarFrame>
                </span>
                <span className="team-neural__node-label" aria-hidden>
                  <strong>{member.displayName}</strong>
                  <small>{member.roleTitle}</small>
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="team-neural__mobile-deck" role="group" aria-label={teamLabel}>
        {members.map((member, index) => {
          const selected = member.id === active.id;
          return (
            <motion.button
              key={member.id}
              type="button"
              className="team-neural__mobile-node"
              data-active={selected ? "true" : undefined}
              onClick={() => setActiveId(member.id)}
              onFocus={() => setActiveId(member.id)}
              aria-pressed={selected}
              aria-label={`${member.displayName} — ${member.roleTitle}`}
              whileTap={{ scale: 0.96 }}
            >
              <span className="team-neural__mobile-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="team-neural__mobile-avatar">
                <CosmeticAvatarFrame preset={member.cosmetics.avatarFrame} className="team-neural__node-frame">
                  <UserAvatar identity={member} alt="" className="size-10 text-xs" />
                </CosmeticAvatarFrame>
              </span>
              <span className="min-w-0 text-left">
                <strong className="block truncate text-xs font-semibold text-foreground">{member.displayName}</strong>
                <span className="block truncate text-[11px] text-muted-foreground">{member.roleTitle}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
