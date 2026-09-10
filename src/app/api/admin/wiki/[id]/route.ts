import { prisma } from "@/infrastructure/database/prisma";
import { requireAdminSection } from "@/modules/administration/api-guard";
import { contentError } from "@/modules/administration/content-error";
import { wikiSchema } from "@/modules/editorial/content-validation";
import { logAdminAction } from "@/modules/administration/action-log";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  try {
    const { userId } = await requireAdminSection("wiki");
    const { id } = await params;
    const input = wikiSchema.parse(await request.json());
    const data = {
      ...input,
      scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
      publishedAt:
        input.state === "PUBLISHED"
          ? new Date()
          : input.state === "SCHEDULED" && input.scheduledFor
            ? new Date(input.scheduledFor)
            : null,
    };
    const existing = await prisma.wikiArticle.findUniqueOrThrow({
      where: { id },
    });
    if (input.state === "PUBLISHED" && existing.state === "PUBLISHED")
      data.publishedAt = existing.publishedAt ?? new Date();
    const item = await prisma.wikiArticle.update({
      where: { id },
      data: { ...data, editorId: userId },
    });
    await logAdminAction({
      actorId: userId,
      action: "wiki.update",
      targetId: id,
      targetType: "wikiArticle",
    });
    return Response.json({ item });
  } catch (error) {
    return contentError(error);
  }
}
export async function DELETE(_request: Request, { params }: Context) {
  try {
    const { userId } = await requireAdminSection("wiki");
    const { id } = await params;
    await prisma.wikiArticle.delete({ where: { id } });
    await logAdminAction({
      actorId: userId,
      action: "wiki.delete",
      targetId: id,
      targetType: "wikiArticle",
    });
    return Response.json({ success: true });
  } catch (error) {
    return contentError(error);
  }
}
