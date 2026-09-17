import { revalidateTag } from "next/cache";
import { PUBLIC_CONTENT_TAGS } from "@/modules/network/cache/public-content-cache";
import { contentError } from "@/modules/administration/content-error";
import { postSummary } from "@/modules/editorial/post-summary";
import { publicPosts } from "@/modules/editorial/publication";
import { isPublicPost } from "@/modules/editorial/publication";
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { postSchema } from "@/modules/editorial/validation";
import { notifyPostPublished } from "@/modules/notifications/service";
import { getActiveBanOrSuspension } from "@/modules/administration/sanctions";
import {
  requireAdminSection,
  AdminGuardError,
} from "@/modules/administration/api-guard";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAdminSection("posts");

    if (await getActiveBanOrSuspension(userId)) {
      return NextResponse.json(
        { error: "Tu cuenta está suspendida" },
        { status: 403 },
      );
    }

    const body = await request.json();

    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid", details: parsed.error.errors },
        { status: 400 },
      );
    }

    const post = await prisma.post.create({
      data: {
        ...parsed.data,
        scheduledFor: parsed.data.scheduledFor
          ? new Date(parsed.data.scheduledFor)
          : null,
        publishedAt: parsed.data.published
          ? parsed.data.scheduledFor
            ? new Date(parsed.data.scheduledFor)
            : new Date()
          : null,
        authorId: userId,
      },
    });

    if (isPublicPost(post)) {
      notifyPostPublished(post.slug, userId).catch((err) =>
        console.error("Error notificando post publicado:", err),
      );
    }

    revalidateTag(PUBLIC_CONTENT_TAGS.posts, "max");
    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return contentError(error);
  }
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const offset = Number(query.get("offset") ?? 0);
  const limit = Number(query.get("limit") ?? 12);
  const type = query.get("type");
  if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 48 || (type && type !== "MAINTENANCE")) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const locale = query.get("locale") === "en" ? "en" : "es";
  try {
    const posts = await prisma.post.findMany({ where: { ...publicPosts(), ...(query.get("modality") ? { modalityId: query.get("modality")! } : {}), ...(type ? { type: "MAINTENANCE" } : {}) }, include: { modality: true }, orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }], skip: offset, take: limit + 1 });
    const items = posts.slice(0, limit).map((post) => postSummary(post, locale));
    return NextResponse.json({ items, hasMore: posts.length > limit, nextOffset: offset + items.length });
  } catch (error) { return contentError(error); }
}
