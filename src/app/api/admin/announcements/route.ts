import { NextResponse } from "next/server";
import { AnnouncementSegment } from "@prisma/client";
import { requireAdminSection, AdminGuardError } from "@/modules/administration/api-guard";
import { createAnnouncement, listAnnouncements, AnnouncementError } from "@/modules/administration/announcements";

const VALID_SEGMENTS: AnnouncementSegment[] = ["ALL", "USERS", "STAFF"];

export async function GET() {
  try {
    await requireAdminSection("announcements");
    const announcements = await listAnnouncements();
    return NextResponse.json({ announcements }, { status: 200 });
  } catch (error) {
    if (error instanceof AdminGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al obtener los anuncios" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAdminSection("announcements");
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body) || (body.segment !== undefined && !VALID_SEGMENTS.includes(body.segment))) return NextResponse.json({ error: "invalid" }, { status: 400 });

    const title = typeof body.title === "string" ? body.title : "";
    const message = typeof body.body === "string" ? body.body : "";
    const segment = VALID_SEGMENTS.includes(body.segment) ? (body.segment as AnnouncementSegment) : "ALL";

    const { announcement, recipientCount } = await createAnnouncement(userId, title, message, segment);
    return NextResponse.json({ announcement, recipientCount }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminGuardError || error instanceof AnnouncementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Error al enviar el anuncio" }, { status: 500 });
  }
}
