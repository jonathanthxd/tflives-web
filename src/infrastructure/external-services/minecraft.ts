import { unstable_cache } from "next/cache";
import { queryMinecraft } from "./minecraft-protocol";

export const getMinecraftStatus = unstable_cache(
  () => queryMinecraft(),
  ["tfl-network-status-v2"],
  { revalidate: 30 },
);
