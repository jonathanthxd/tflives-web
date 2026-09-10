import { prisma } from "@/infrastructure/database/prisma";
import { requireAdminSection } from "@/modules/administration/api-guard";
import { contentError } from "@/modules/administration/content-error";
import { teamSchema } from "@/modules/editorial/content-validation";
import { logAdminAction } from "@/modules/administration/action-log";
export async function GET() {
  try {
    await requireAdminSection("team");
    const items = await prisma.teamMember.findMany({
      orderBy: { order: "asc" },
    });
    return Response.json({ items });
  } catch (error) {
    return contentError(error);
  }
}
export async function POST(request: Request) {
  try {
    const { userId } = await requireAdminSection("team");
    const data = teamSchema.parse(await request.json());
    const item = await prisma.teamMember.create({
      data: { ...data, createdById: userId },
    });
    await logAdminAction({
      actorId: userId,
      action: "team.create",
      targetId: item.id,
      targetType: "teamMember",
    });
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    return contentError(error);
  }
}
