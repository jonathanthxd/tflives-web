import { NextResponse } from "next/server";
import { NotificationType } from "@prisma/client";
import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import { prisma } from "@/infrastructure/database/prisma";
import { NOTIFICATION_CATEGORIES } from "@/modules/notifications/service";

export async function GET() {
  const authUser = await getCurrentAuthUser();

  if (!authUser) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const stored = await prisma.notificationPreference.findMany({
    where: { userId: authUser.id },
  });
  const storedByCategory = new Map(stored.map((p) => [p.category, p]));

  const preferences = NOTIFICATION_CATEGORIES.map((category) => {
    const existing = storedByCategory.get(category);
    return {
      category,
      inAppEnabled: existing?.inAppEnabled ?? true,
      browserEnabled: existing?.browserEnabled ?? true,
    };
  });

  return NextResponse.json({ preferences });
}

export async function PATCH(request: Request) {
  const authUser = await getCurrentAuthUser();

  if (!authUser) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { category, inAppEnabled, browserEnabled } = body as {
    category?: string;
    inAppEnabled?: boolean;
    browserEnabled?: boolean;
  };

  if (!category || !NOTIFICATION_CATEGORIES.includes(category as NotificationType)) {
    return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
  }

  const updated = await prisma.notificationPreference.upsert({
    where: { userId_category: { userId: authUser.id, category: category as NotificationType } },
    create: {
      userId: authUser.id,
      category: category as NotificationType,
      inAppEnabled: inAppEnabled ?? true,
      browserEnabled: browserEnabled ?? true,
    },
    update: {
      ...(inAppEnabled !== undefined ? { inAppEnabled } : {}),
      ...(browserEnabled !== undefined ? { browserEnabled } : {}),
    },
  });

  return NextResponse.json({ preference: updated });
}
