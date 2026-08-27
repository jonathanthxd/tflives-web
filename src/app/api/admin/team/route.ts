import { NextResponse } from "next/server";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { listAllTeamMembers, createTeamMember, TeamMemberError } from "@/modules/administration/team";

export async function GET() {
  try {
    await requireAdminSection("team");
    const team = await listAllTeamMembers();
    return NextResponse.json({ team }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al obtener el equipo" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAdminSection("team");
    const body = await request.json();

    const member = await createTeamMember(userId, {
      name: typeof body.name === "string" ? body.name : "",
      roleTitle: typeof body.roleTitle === "string" ? body.roleTitle : "",
      avatarUrl: typeof body.avatarUrl === "string" ? body.avatarUrl : null,
      order: typeof body.order === "number" ? body.order : 0,
      active: typeof body.active === "boolean" ? body.active : true,
    });
    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof TeamMemberError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al crear el miembro" }, { status: 500 });
  }
}
