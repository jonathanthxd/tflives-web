import { NextResponse } from "next/server";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { ChatValidationError, listStickersForAdmin, saveSticker } from "@/modules/chat/service";

function failure(error: unknown) {
  if (error instanceof AdminGuardError || error instanceof ChatValidationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: "Error al gestionar stickers" }, { status: 500 });
}

export async function GET() {
  try {
    await requireAdminSection("reports");
    return NextResponse.json({ stickers: await listStickersForAdmin() });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSection("reports");
    const body = await request.json();
    const sticker = await saveSticker(body);
    return NextResponse.json({ sticker }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminSection("reports");
    const body = await request.json();
    if (typeof body.id !== "string") return NextResponse.json({ error: "Sticker inválido" }, { status: 400 });
    const sticker = await saveSticker(body);
    return NextResponse.json({ sticker });
  } catch (error) {
    return failure(error);
  }
}
