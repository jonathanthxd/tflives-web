import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AdminGuardError } from "./api-guard";

export function contentError(error: unknown) {
  if (error instanceof AdminGuardError)
    return NextResponse.json(
      { error: error.status === 401 ? "unauthenticated" : "forbidden" },
      { status: error.status },
    );
  if (error instanceof ZodError || error instanceof SyntaxError)
    return NextResponse.json(
      {
        error: "invalid",
        fields: error instanceof ZodError ? error.flatten().fieldErrors : {},
      },
      { status: 400 },
    );
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      return NextResponse.json({ error: "duplicate" }, { status: 409 });
    if (error.code === "P2025")
      return NextResponse.json({ error: "missing" }, { status: 404 });
    if (error.code === "P2003")
      return NextResponse.json({ error: "related" }, { status: 409 });
  }
  console.error(
    "Content operation failed",
    error instanceof Error ? error.name : "unknown",
  );
  return NextResponse.json({ error: "failed" }, { status: 500 });
}
