import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-manual";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  const cookies = cookieHeader?.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const token = cookies?.["tfl_token"];
  let payload = null;
  
  if (token) {
    payload = verifyToken(token);
  }

  return NextResponse.json({
    hasCookie: !!token,
    cookieValue: token ? token.substring(0, 20) + "..." : null,
    payload,
    allCookies: cookies,
  });
}