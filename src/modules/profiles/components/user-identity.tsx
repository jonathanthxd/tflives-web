"use client";
/* eslint-disable @next/next/no-img-element -- the shared avatar accepts existing OAuth and local profile URLs. */

import { Link } from "@/i18n/navigation";
import { identityInitial, identityName, type PublicIdentity } from "@/modules/profiles/types";
import { cn } from "@/shared/utilities/utils";

type IdentityPreview = Pick<PublicIdentity, "username" | "displayName" | "name" | "image">;

export function UserAvatar({
  identity,
  className,
  alt,
}: {
  identity: IdentityPreview;
  className?: string;
  alt?: string;
}) {
  const name = identityName(identity);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-semibold text-primary",
        className,
      )}
      role="img"
      aria-label={alt ?? name}
    >
      {identity.image ? <img src={identity.image} alt="" referrerPolicy="no-referrer" className="size-full object-cover" /> : identityInitial(identity)}
    </span>
  );
}

export function UserIdentityCompact({
  identity,
  className,
  avatarClassName = "size-9 text-sm",
}: {
  identity: IdentityPreview;
  className?: string;
  avatarClassName?: string;
}) {
  const content = (
    <>
      <UserAvatar identity={identity} className={avatarClassName} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground">{identityName(identity)}</span>
        {identity.username && <span className="block truncate text-xs text-muted-foreground">@{identity.username}</span>}
      </span>
    </>
  );

  return identity.username ? (
    <Link href={`/perfil/${identity.username}`} className={cn("flex min-w-0 items-center gap-2", className)}>
      {content}
    </Link>
  ) : (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>{content}</span>
  );
}
