import { revalidateTag } from "next/cache";
import { PUBLIC_CONTENT_TAGS } from "@/modules/network/cache/public-content-cache";
import { prisma } from "@/infrastructure/database/prisma";
import { requireAdminSection } from "@/modules/administration/api-guard";
import { contentError } from "@/modules/administration/content-error";
import { categorySchema } from "@/modules/editorial/content-validation";
import { logAdminAction } from "@/modules/administration/action-log";
export async function GET() {
  try {
    await requireAdminSection("wiki");
    const items = await prisma.wikiCategory.findMany({
      orderBy: { order: "asc" },
    });
    return Response.json({ items });
  } catch (error) {
    return contentError(error);
  }
}
export async function POST(request: Request) {
  try {
    const { userId } = await requireAdminSection("wiki");
    const data = categorySchema.parse(await request.json());
    const item = await prisma.wikiCategory.create({ data: { ...data } });
    await logAdminAction({
      actorId: userId,
      action: "wiki/categories.create",
      targetId: item.id,
      targetType: "wikiCategory",
    });
    revalidateTag(PUBLIC_CONTENT_TAGS.wiki, "max");
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    return contentError(error);
  }
}
