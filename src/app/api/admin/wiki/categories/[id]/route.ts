import { revalidateTag } from "next/cache";
import { PUBLIC_CONTENT_TAGS } from "@/modules/network/cache/public-content-cache";
import { prisma } from "@/infrastructure/database/prisma";
import { requireAdminSection } from "@/modules/administration/api-guard";
import { contentError } from "@/modules/administration/content-error";
import { categorySchema } from "@/modules/editorial/content-validation";
import { logAdminAction } from "@/modules/administration/action-log";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  try {
    const { userId } = await requireAdminSection("wiki");
    const { id } = await params;
    const data = categorySchema.parse(await request.json());
    const item = await prisma.wikiCategory.update({
      where: { id },
      data: { ...data },
    });
    await logAdminAction({
      actorId: userId,
      action: "wiki/categories.update",
      targetId: id,
      targetType: "wikiCategory",
    });
    revalidateTag(PUBLIC_CONTENT_TAGS.wiki, "max");
    return Response.json({ item });
  } catch (error) {
    return contentError(error);
  }
}
export async function DELETE(_request: Request, { params }: Context) {
  try {
    const { userId } = await requireAdminSection("wiki");
    const { id } = await params;
    await prisma.wikiCategory.delete({ where: { id } });
    await logAdminAction({
      actorId: userId,
      action: "wiki/categories.delete",
      targetId: id,
      targetType: "wikiCategory",
    });
    revalidateTag(PUBLIC_CONTENT_TAGS.wiki, "max");
    return Response.json({ success: true });
  } catch (error) {
    return contentError(error);
  }
}
