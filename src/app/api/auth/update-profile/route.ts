import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-manual";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { image } = body;

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: { image },
    });

    // Create new token with updated info
    const { createToken } = await import("@/lib/auth-manual");
    const newToken = createToken(user.id, user.email, user.role, user.name, user.username);

    return NextResponse.json({ success: true, token: newToken, user }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}