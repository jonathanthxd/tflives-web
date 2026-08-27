import { NextResponse } from "next/server";
import { createClient } from "@/infrastructure/auth/server";
import { listMySanctions, submitAppeal, AppealError } from "@/modules/administration/appeals";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const sanctions = await listMySanctions(authUser.id);
  return NextResponse.json({ sanctions }, { status: 200 });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const body = await request.json();
    const sanctionId = typeof body.sanctionId === "string" ? body.sanctionId : "";
    const message = typeof body.message === "string" ? body.message : "";
    const appeal = await submitAppeal(authUser.id, sanctionId, message);
    return NextResponse.json({ appeal }, { status: 201 });
  } catch (error) {
    if (error instanceof AppealError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al enviar la apelación" }, { status: 500 });
  }
}
