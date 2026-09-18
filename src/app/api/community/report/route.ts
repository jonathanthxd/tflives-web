import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { reportComment, CommunityReportError } from "@/modules/community/report";
import { enforceRateLimit } from "@/infrastructure/rate-limit/service";

export async function POST(request: Request) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const limited = await enforceRateLimit("community-report", authUser.id);
  if (limited) return limited;

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
