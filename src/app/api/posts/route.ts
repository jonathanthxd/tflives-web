import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { postSchema } from "@/modules/editorial/validation";
import { notifyPostPublished } from "@/modules/notifications/service";
import { getActiveBanOrSuspension } from "@/modules/administration/sanctions";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAdminSection("posts");

    if (await getActiveBanOrSuspension(userId)) {
      return NextResponse.json(
        { error: "Tu cuenta está suspendida" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        ...parsed.data,
        authorId: userId,
      },
    });

    if (post.published) {
      notifyPostPublished(post.slug, userId).catch((err) =>
        console.error("Error notificando post publicado:", err)
      );
    }

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Error al crear el post" },
      { status: 500 }
    );
  }
}
