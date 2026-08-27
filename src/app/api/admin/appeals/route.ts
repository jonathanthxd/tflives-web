import { NextResponse } from "next/server";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { listAppeals } from "@/modules/administration/appeals";

export async function GET(request: Request) {
  try {
    await requireAdminSection("moderation");

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status =
      statusParam && (["PENDING", "APPROVED", "DENIED"] as const).includes(statusParam as "PENDING")
        ? (statusParam as "PENDING" | "APPROVED" | "DENIED")
        : undefined;

    const appeals = await listAppeals(status);
    return NextResponse.json({ appeals }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al obtener las apelaciones" }, { status: 500 });
  }
}
