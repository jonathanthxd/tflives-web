import { NextResponse } from "next/server";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { CreatorError, reviewCreatorApplication } from "@/modules/creators/service";
import { creatorReviewSchema } from "@/modules/creators/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAdminSection("creators");
    const parsed = creatorReviewSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "invalid", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    const { id } = await params;
    const result = await reviewCreatorApplication(userId, id, parsed.data);
    return NextResponse.json({ action: result.action, creatorId: result.creatorId });
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof CreatorError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
}
