import { prisma } from "@/infrastructure/database/prisma";
import { requireAdminSection } from "@/modules/administration/api-guard";
import { contentError } from "@/modules/administration/content-error";
import { timelineSchema } from "@/modules/editorial/content-validation";
import { logAdminAction } from "@/modules/administration/action-log";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  try {
    const { userId } = await requireAdminSection("timeline");
    const { id } = await params;
    const data = timelineSchema.parse(await request.json());
    const item = await prisma.timelineMilestone.update({
      where: { id },
      data: { ...data },
    });
    await logAdminAction({
      actorId: userId,
      action: "timeline.update",
      targetId: id,
      targetType: "timelineMilestone",
    });
    return Response.json({ item });
  } catch (error) {
    return contentError(error);
  }
}
export async function DELETE(_request: Request, { params }: Context) {
  try {
    const { userId } = await requireAdminSection("timeline");
    const { id } = await params;
    await prisma.timelineMilestone.delete({ where: { id } });
    await logAdminAction({
      actorId: userId,
      action: "timeline.delete",
      targetId: id,
      targetType: "timelineMilestone",
    });
    return Response.json({ success: true });
  } catch (error) {
    return contentError(error);
  }
}
