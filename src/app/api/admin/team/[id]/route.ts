import { NextResponse } from "next/server";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { updateTeamMember, deleteTeamMember, TeamMemberError } from "@/modules/administration/team";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await requireAdminSection("team");
    const body = await request.json();

    const member = await updateTeamMember(userId, id, {
      name: typeof body.name === "string" ? body.name : undefined,
      roleTitle: typeof body.roleTitle === "string" ? body.roleTitle : undefined,
      avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : undefined,
      order: typeof body.order === "number" ? body.order : undefined,
      active: typeof body.active === "boolean" ? body.active : undefined,
    });
    return NextResponse.json({ member }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof TeamMemberError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar el miembro" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await requireAdminSection("team");
    await deleteTeamMember(userId, id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof TeamMemberError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al eliminar el miembro" }, { status: 500 });
  }
}
