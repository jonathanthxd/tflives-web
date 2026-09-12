import { prisma } from "@/infrastructure/database/prisma";
import { requireAdminSection } from "@/modules/administration/api-guard";
import { contentError } from "@/modules/administration/content-error";
import { teamSchema } from "@/modules/editorial/content-validation";
import { logAdminAction } from "@/modules/administration/action-log";

const linkedUserSelect = {
  id: true,
  username: true,
  displayName: true,
  name: true,
  image: true,
} as const;

export async function GET() {
  try {
    await requireAdminSection("team");
    const items = await prisma.teamMember.findMany({
      include: { user: { select: linkedUserSelect } },
      orderBy: { order: "asc" },
    });
    return Response.json({
      items: items.map((item) => ({ ...item, username: item.user?.username ?? "" })),
    });
  } catch (error) {
    return contentError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAdminSection("team");
    const { username, ...data } = teamSchema.parse(await request.json());
    const linkedUser = await prisma.user.findUnique({
      where: { username },
      select: linkedUserSelect,
    });
    if (!linkedUser?.username) {
      return Response.json({ error: "teamUserMissing" }, { status: 404 });
    }
    const duplicate = await prisma.teamMember.findUnique({
      where: { userId: linkedUser.id },
      select: { id: true },
    });
    if (duplicate) {
      return Response.json({ error: "teamUserDuplicate" }, { status: 409 });
    }
    const item = await prisma.teamMember.create({
      data: {
        ...data,
        userId: linkedUser.id,
        name: linkedUser.displayName || linkedUser.name || linkedUser.username,
        avatarUrl: linkedUser.image,
        createdById: userId,
      },
      include: { user: { select: linkedUserSelect } },
    });
    await logAdminAction({
      actorId: userId,
      action: "team.create",
      targetId: item.id,
      targetType: "teamMember",
      metadata: { linkedUserId: linkedUser.id, username: linkedUser.username },
    });
    return Response.json({ item: { ...item, username: linkedUser.username } }, { status: 201 });
  } catch (error) {
    return contentError(error);
  }
}
