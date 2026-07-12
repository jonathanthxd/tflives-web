import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const modalities = await prisma.modality.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ modalities }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}