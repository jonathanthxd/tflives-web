import { revalidateTag } from "next/cache";
import { PUBLIC_CONTENT_TAGS } from "@/modules/network/cache/public-content-cache";
import { contentError } from "@/modules/administration/content-error";
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
