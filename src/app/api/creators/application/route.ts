import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { applyForCreator, getOwnCreatorApplication, CreatorError } from "@/modules/creators/service";
import { creatorApplicationSchema } from "@/modules/creators/validation";

export async function GET() {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  return NextResponse.json({ application: await getOwnCreatorApplication(authUser.id) });
}

export async function POST(request: Request) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const parsed = creatorApplicationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  try {
    const application = await applyForCreator(authUser.id, parsed.data);
    return NextResponse.json({ application: { id: application.id, status: application.status } }, { status: 201 });
  } catch (error) {
    if (error instanceof CreatorError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
}
