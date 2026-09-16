import { revalidateTag } from "next/cache";
import { PUBLIC_CONTENT_TAGS } from "@/modules/network/cache/public-content-cache";
import { prisma } from "@/infrastructure/database/prisma";
import { requireAdminSection } from "@/modules/administration/api-guard";
import { contentError } from "@/modules/administration/content-error";
import { modalitySchema } from "@/modules/editorial/content-validation";
import { logAdminAction } from "@/modules/administration/action-log";
export async function GET(request: Request) {
  try {
    const all = new URL(request.url).searchParams.get("admin") === "1";
    if (all) await requireAdminSection("posts");
    const modalities = await prisma.modality.findMany({
      where: all ? {} : { published: true, status: { not: "ARCHIVED" } },
      orderBy: { order: "asc" },
    });
    return Response.json({ modalities });
  } catch (error) {
    return contentError(error);
  }
}
export async function POST(request: Request) {
  try {
    const { userId } = await requireAdminSection("modalities");
    const data = modalitySchema.parse(await request.json());
    const item = await prisma.modality.create({ data: { ...data } });
    await logAdminAction({
      actorId: userId,
      action: "modalities.create",
      targetId: item.id,
      targetType: "modality",
    });
    revalidateTag(PUBLIC_CONTENT_TAGS.modalities, "max");
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    return contentError(error);
  }
}
