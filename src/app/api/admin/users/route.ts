import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";

export async function GET(request: Request) {
  try {
    await requireAdminSection("users");

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const roleParam = searchParams.get("role");
    const role =
      roleParam && (["USER", "MOD", "ADMIN"] as const).includes(roleParam as "USER" | "MOD" | "ADMIN")
        ? (roleParam as "USER" | "MOD" | "ADMIN")
        : undefined;

    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(q
          ? {
              OR: [
                { username: { contains: q, mode: "insensitive" } },
                { displayName: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al obtener los usuarios" }, { status: 500 });
  }
}
