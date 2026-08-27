"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface TeamMember {
  id: string;
  name: string;
  roleTitle: string;
  avatarUrl: string | null;
}

function OwnerCard({ member, index }: { member: TeamMember; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="group relative flex flex-col items-center"
    >
      {/* Pedestal / Base */}
      <div className="relative w-full max-w-[280px]">
        {/* Glow effect behind */}
        <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Card container - glassmorphism para ver el silk detrás */}
        <div className="relative bg-card/60 backdrop-blur-md border border-primary/10 rounded-2xl p-8 flex flex-col items-center transition-all duration-500 group-hover:-translate-y-3 group-hover:border-primary/30 group-hover:shadow-[0_0_40px_hsl(var(--primary)/0.1)]">

          {/* Avatar circle */}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/20 border-2 border-primary/20 flex items-center justify-center mb-5 overflow-hidden group-hover:border-primary/50 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)] transition-all duration-500">
            {member.avatarUrl ? (
              <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-3xl font-bold text-foreground/90">
                {member.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Name */}
          <h3 className="font-display text-xl font-semibold text-foreground mb-1 group-hover:text-primary transition-colors duration-300">
            {member.name}
          </h3>

          {/* Tag */}
          <span className="px-3 py-1 text-xs font-medium tracking-wider uppercase text-primary/80 bg-primary/10 rounded-full border border-primary/20">
            {member.roleTitle}
          </span>

          {/* Decorative line */}
          <div className="mt-5 w-12 h-[1px] bg-primary/20 group-hover:w-20 group-hover:bg-primary/50 transition-all duration-500" />
        </div>

        {/* Pedestal base shadow */}
        <div className="mx-auto mt-2 w-3/4 h-2 bg-primary/5 rounded-full blur-md group-hover:bg-primary/10 transition-all duration-500" />
      </div>
    </motion.div>
  );
}

export default function OwnersSection() {
  const t = useTranslations("Owners");
  const [team, setTeam] = useState<TeamMember[] | null>(null);

  useEffect(() => {
    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => setTeam(data.team ?? []))
      .catch(() => setTeam([]));
  }, []);

  if (team && team.length === 0) return null;

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t("titulo")}
          </h2>
          <div className="w-16 h-[2px] bg-primary/50 mx-auto rounded-full" />
        </motion.div>

        {/* Owners grid */}
        {team && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-start">
            {team.map((member, index) => (
              <OwnerCard key={member.id} member={member} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
