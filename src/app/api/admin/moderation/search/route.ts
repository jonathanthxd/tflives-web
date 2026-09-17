import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
export async function GET(request: Request) {
  try {
    await requireAdminSection("moderation");
    const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (q.length < 2 || q.length > 100) return NextResponse.json({ results: [] });
    const results = await prisma.user.findMany({ where: { OR: [ { username: { contains: q, mode: "insensitive" } }, { displayName: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } } ] }, select: { id: true, username: true, displayName: true, name: true, image: true }, orderBy: { createdAt: "desc" }, take: 20 });
    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof AdminGuardError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "unavailable" }, { status: 500 });
  }
}
