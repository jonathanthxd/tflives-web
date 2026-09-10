import { prisma } from "@/infrastructure/database/prisma";
import { requireAdminSection } from "@/modules/administration/api-guard";
import { contentError } from "@/modules/administration/content-error";
import { wikiSchema } from "@/modules/editorial/content-validation";
import { logAdminAction } from "@/modules/administration/action-log";
export async function GET() {
  try {
    await requireAdminSection("wiki");
    const items = await prisma.wikiArticle.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return Response.json({ items });
  } catch (error) {
    return contentError(error);
  }
}
export async function POST(request: Request) {
  try {
    const { userId } = await requireAdminSection("wiki");
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
    const item = await prisma.wikiArticle.create({
      data: { ...data, editorId: userId },
    });
    await logAdminAction({
      actorId: userId,
      action: "wiki.create",
      targetId: item.id,
      targetType: "wikiArticle",
    });
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    return contentError(error);
  }
}
