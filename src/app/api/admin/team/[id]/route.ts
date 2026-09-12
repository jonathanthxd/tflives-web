import { prisma } from "@/infrastructure/database/prisma";
import { requireAdminSection } from "@/modules/administration/api-guard";
import { contentError } from "@/modules/administration/content-error";
import { teamSchema } from "@/modules/editorial/content-validation";
import { logAdminAction } from "@/modules/administration/action-log";

type Context = { params: Promise<{ id: string }> };

const linkedUserSelect = {
  id: true,
  username: true,
  displayName: true,
  name: true,
  image: true,
} as const;

export async function PATCH(request: Request, { params }: Context) {
  try {
    const { userId } = await requireAdminSection("team");
    const { id } = await params;
    const { username, ...data } = teamSchema.parse(await request.json());
    const linkedUser = await prisma.user.findUnique({
      where: { username },
      select: linkedUserSelect,
    });
    if (!linkedUser?.username) {
      return Response.json({ error: "teamUserMissing" }, { status: 404 });
    }
    const duplicate = await prisma.teamMember.findFirst({
      where: { userId: linkedUser.id, id: { not: id } },
      select: { id: true },
    });
    if (duplicate) {
      return Response.json({ error: "teamUserDuplicate" }, { status: 409 });
    }
    const item = await prisma.teamMember.update({
      where: { id },
      data: {
        ...data,
        userId: linkedUser.id,
        name: linkedUser.displayName || linkedUser.name || linkedUser.username,
        avatarUrl: linkedUser.image,
      },
      include: { user: { select: linkedUserSelect } },
    });
    await logAdminAction({
      actorId: userId,
      action: "team.update",
      targetId: id,
      targetType: "teamMember",
      metadata: { linkedUserId: linkedUser.id, username: linkedUser.username },
    });
    return Response.json({ item: { ...item, username: linkedUser.username } });
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
