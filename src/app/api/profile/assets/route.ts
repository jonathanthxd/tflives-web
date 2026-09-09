import { NextResponse } from "next/server";
import { ProfileAssetKind } from "@prisma/client";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";

export const runtime = "nodejs";

const MAX_PROFILE_ASSET_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function parseKind(value: FormDataEntryValue | null): ProfileAssetKind | null {
  if (value === "avatar") return ProfileAssetKind.AVATAR;
  if (value === "banner") return ProfileAssetKind.BANNER;
  return null;
}

export async function POST(request: Request) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = parseKind(formData.get("kind"));

  if (!(file instanceof File) || !kind) {
    return NextResponse.json({ error: "Archivo o tipo inválido" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Formato no permitido. Usa PNG, JPG o WebP." }, { status: 415 });
  }
  if (file.size <= 0 || file.size > MAX_PROFILE_ASSET_BYTES) {
    return NextResponse.json({ error: "La imagen no puede superar los 2 MB" }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  await prisma.profileAsset.upsert({
    where: { userId_kind: { userId: authUser.id, kind } },
    update: { mimeType: file.type, bytes },
    create: { userId: authUser.id, kind, mimeType: file.type, bytes },
  });

  const publicKind = kind === ProfileAssetKind.AVATAR ? "avatar" : "banner";
  const url = `/api/profile/assets/${authUser.id}/${publicKind}?v=${Date.now()}`;
  const user = await prisma.user.update({
    where: { id: authUser.id },
    data: kind === ProfileAssetKind.AVATAR ? { image: url } : { bannerUrl: url },
    select: {
      id: true,
      image: true,
      bannerUrl: true,
      username: true,
      displayName: true,
      bio: true,
      minecraftUsername: true,
      socialLinks: true,
    },
  });

  return NextResponse.json({ url, user }, { status: 200 });
}
