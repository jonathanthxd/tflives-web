import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { CreatorError, getOwnCreatorProfile, updateOwnCreatorProfile } from "@/modules/creators/service";
import { creatorProfileUpdateSchema } from "@/modules/creators/validation";

export async function PATCH(request: Request) {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const parsed = creatorProfileUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
    return NextResponse.json({ error: "invalid", fields: parsed.success ? {} : parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  try {
    const creator = await updateOwnCreatorProfile(authUser.id, parsed.data);
    return NextResponse.json({ creator });
  } catch (error) {
    if (error instanceof CreatorError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
}

export async function GET() {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  return NextResponse.json({ creator: await getOwnCreatorProfile(authUser.id) });
}
