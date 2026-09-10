import { prisma } from "@/infrastructure/database/prisma";
import { requireAdminSection } from "@/modules/administration/api-guard";
import { contentError } from "@/modules/administration/content-error";
import { timelineSchema } from "@/modules/editorial/content-validation";
import { logAdminAction } from "@/modules/administration/action-log";
export async function GET() {
  try {
    await requireAdminSection("timeline");
    const items = await prisma.timelineMilestone.findMany({
      orderBy: { order: "asc" },
    });
    return Response.json({ items });
  } catch (error) {
    return contentError(error);
  }
}
export async function POST(request: Request) {
  try {
    const { userId } = await requireAdminSection("timeline");
    const data = timelineSchema.parse(await request.json());
    const item = await prisma.timelineMilestone.create({
      data: { ...data, createdById: userId },
    });
    await logAdminAction({
      actorId: userId,
      action: "timeline.create",
      targetId: item.id,
      targetType: "timelineMilestone",
    });
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    return contentError(error);
  }
}
