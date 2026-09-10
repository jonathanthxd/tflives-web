import { getMinecraftStatus } from "@/infrastructure/external-services/minecraft";
export const runtime = "nodejs";
export async function GET() {
  return Response.json(await getMinecraftStatus(), {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30",
    },
  });
}
