import { revalidateTag } from "next/cache";
import { PUBLIC_CONTENT_TAGS } from "@/modules/network/cache/public-content-cache";
import { contentError } from "@/modules/administration/content-error";
import { isPublicPost } from "@/modules/editorial/publication";
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import {
  requireAdminSection,
  AdminGuardError,
} from "@/modules/administration/api-guard";
import { logAdminAction } from "@/modules/administration/action-log";
import { notifyPostPublished } from "@/modules/notifications/service";
import { postUpdateSchema } from "@/modules/editorial/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await requireAdminSection("posts");
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post)
      return NextResponse.json(
        { error: "Post no encontrado" },
        { status: 404 },
      );
    return NextResponse.json({ post }, { status: 200 });
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const { userId } = await requireAdminSection("posts");
    const body = await request.json();
    const parsed = postUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid", details: parsed.error.errors },
        { status: 400 },
      );
    }

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json(
        { error: "Post no encontrado" },
        { status: 404 },
      );

    const { scheduledFor, ...rest } = parsed.data;
    const post = await prisma.post.update({
      where: { id },
      data: {
        ...rest,
        publishedAt:
          rest.published === true
            ? ((scheduledFor === undefined
                ? existing.scheduledFor
                : scheduledFor
                  ? new Date(scheduledFor)
                  : null) ??
              existing.publishedAt ??
              new Date())
            : undefined,
        ...(scheduledFor !== undefined
          ? { scheduledFor: scheduledFor ? new Date(scheduledFor) : null }
          : {}),
      },
    });

    const action =
      parsed.data.archived === true
        ? "post.archive"
        : parsed.data.archived === false && existing.archived
          ? "post.unarchive"
          : parsed.data.published === true && !existing.published
            ? "post.publish"
            : "post.update";

    await logAdminAction({
      actorId: userId,
      action,
      targetType: "Post",
      targetId: id,
      metadata: parsed.data,
    });

    if (isPublicPost(post) && !isPublicPost(existing)) {
      notifyPostPublished(post.slug, post.authorId).catch((err) =>
        console.error("Error notificando post publicado:", err),
      );
    }

    revalidateTag(PUBLIC_CONTENT_TAGS.posts, "max");
    return NextResponse.json({ post }, { status: 200 });
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const { userId } = await requireAdminSection("posts");
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json(
        { error: "Post no encontrado" },
        { status: 404 },
      );

    await prisma.$transaction(async (tx) => {
      const comments = await tx.comment.findMany({
        where: { postId: id },
        select: { id: true },
      });
      await tx.reaction.deleteMany({
        where: {
          OR: [
            { targetType: "POST", targetId: id },
            {
              targetType: "COMMENT",
              targetId: { in: comments.map((c) => c.id) },
            },
          ],
        },
      });
      await tx.comment.updateMany({
        where: { postId: id },
        data: { parentId: null },
      });
      await tx.comment.deleteMany({ where: { postId: id } });
      await tx.post.delete({ where: { id } });
    });

    await logAdminAction({
      actorId: userId,
      action: "post.delete",
      targetType: "Post",
      targetId: id,
      metadata: { title: existing.title },
    });

    revalidateTag(PUBLIC_CONTENT_TAGS.posts, "max");
    return NextResponse.json({ success: true }, { status: 200 });
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
