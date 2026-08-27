import { NextResponse } from "next/server";
import { createClient } from "@/infrastructure/auth/server";
import { reportComment, CommunityReportError } from "@/modules/community/report";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const body = await request.json();
    const commentId = typeof body.commentId === "string" ? body.commentId : "";
    const reason = typeof body.reason === "string" ? body.reason : "";

    await reportComment(authUser.id, commentId, reason);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof CommunityReportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al enviar el reporte" }, { status: 500 });
  }
}
