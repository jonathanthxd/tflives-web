import { NextResponse } from "next/server";
import { createClient } from "@/infrastructure/auth/server";
import { MessagingError, declineConversationRequest, openConversationRequest } from "@/modules/messaging/service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const { action } = await request.json().catch(() => ({}));
  if (action !== "open" && action !== "decline") {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  try {
    const participant =
      action === "open"
        ? await openConversationRequest(id, authUser.id)
        : await declineConversationRequest(id, authUser.id);
    return NextResponse.json({ participant });
  } catch (error) {
    if (error instanceof MessagingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
