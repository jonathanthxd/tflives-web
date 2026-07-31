import { NextResponse } from "next/server";
import { createAdminClient } from "@/infrastructure/auth/admin";

// Solo para desarrollo local: evita tener que revisar el email real cada vez
// que se prueba el registro. Nunca debe correr en producción — devolver un
// link de confirmación al cliente es equivalente a filtrar la autenticación.
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }

  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Falta email o password" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ link: data.properties?.action_link ?? null });
}
