interface AuthEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Envío de correo desacoplado del proveedor de autenticación.
 *
 * - Producción: usa Resend si RESEND_API_KEY y AUTH_EMAIL_FROM están definidos.
 * - Desarrollo: si no hay proveedor, imprime el contenido/link en la terminal.
 *
 * Esto mantiene el proyecto ejecutable en local sin contratar un proveedor y
 * permite activar correos reales únicamente añadiendo variables de entorno.
 */
export async function sendAuthEmail(input: AuthEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.info("\n[auth:dev-email]", input.subject, "->", input.to);
      console.info(input.text, "\n");
      return;
    }

    throw new Error(
      "El correo de autenticación no está configurado. Define RESEND_API_KEY y AUTH_EMAIL_FROM."
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`No se pudo enviar el correo de autenticación (${response.status}). ${detail}`);
  }
}
