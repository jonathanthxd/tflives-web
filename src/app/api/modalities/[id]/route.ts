import { prisma } from "@/infrastructure/database/prisma";
import { requireAdminSection } from "@/modules/administration/api-guard";
import { contentError } from "@/modules/administration/content-error";
import { modalitySchema } from "@/modules/editorial/content-validation";
import { logAdminAction } from "@/modules/administration/action-log";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  try {
    const { userId } = await requireAdminSection("modalities");
    const { id } = await params;
    const data = modalitySchema.parse(await request.json());
    const item = await prisma.modality.update({
      where: { id },
      data: { ...data },
    });
    await logAdminAction({
      actorId: userId,
      action: "modalities.update",
      targetId: id,
      targetType: "modality",
    });
    return Response.json({ item });
  } catch (error) {
    return contentError(error);
  }
}
export async function DELETE(_request: Request, { params }: Context) {
  try {
    const { userId } = await requireAdminSection("modalities");
    const { id } = await params;
    await prisma.modality.delete({ where: { id } });
    await logAdminAction({
      actorId: userId,
      action: "modalities.delete",
      targetId: id,
      targetType: "modality",
    });
    return Response.json({ success: true });
  } catch (error) {
    return contentError(error);
  }
}
