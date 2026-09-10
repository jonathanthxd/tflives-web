import { prisma } from "@/infrastructure/database/prisma";
import { requireAdminSection } from "@/modules/administration/api-guard";
import { contentError } from "@/modules/administration/content-error";
import { teamSchema } from "@/modules/editorial/content-validation";
import { logAdminAction } from "@/modules/administration/action-log";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  try {
    const { userId } = await requireAdminSection("team");
    const { id } = await params;
    const data = teamSchema.parse(await request.json());
    const item = await prisma.teamMember.update({
      where: { id },
      data: { ...data },
    });
    await logAdminAction({
      actorId: userId,
      action: "team.update",
      targetId: id,
      targetType: "teamMember",
    });
    return Response.json({ item });
  } catch (error) {
    return contentError(error);
  }
}
export async function DELETE(_request: Request, { params }: Context) {
  try {
    const { userId } = await requireAdminSection("team");
    const { id } = await params;
    await prisma.teamMember.delete({ where: { id } });
    await logAdminAction({
      actorId: userId,
      action: "team.delete",
      targetId: id,
      targetType: "teamMember",
    });
    return Response.json({ success: true });
  } catch (error) {
    return contentError(error);
  }
}
