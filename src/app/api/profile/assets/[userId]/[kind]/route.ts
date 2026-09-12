import { NextResponse } from "next/server";
import { ProfileAssetKind } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";

export const runtime = "nodejs";

function parseKind(value: string): ProfileAssetKind | null {
  if (value === "avatar") return ProfileAssetKind.AVATAR;
  if (value === "banner") return ProfileAssetKind.BANNER;
  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string; kind: string }> }
) {
  const { userId, kind: rawKind } = await params;
  const kind = parseKind(rawKind);
  if (!kind) return new NextResponse(null, { status: 404 });

  const asset = await prisma.profileAsset.findUnique({
    where: { userId_kind: { userId, kind } },
    select: { bytes: true, mimeType: true, updatedAt: true },
  });

  if (!asset) return new NextResponse(null, { status: 404 });

  const bytes = Uint8Array.from(asset.bytes);

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": asset.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Last-Modified": asset.updatedAt.toUTCString(),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
