import { getCurrentAuthUser } from "@/infrastructure/auth/server";
import CosmeticsCatalog, { type AccountCosmeticsView } from "@/modules/cosmetics/components/cosmetics-catalog";
import { listCosmeticsForAccount, listPublicCosmetics } from "@/modules/cosmetics/service";

export const instant = false;

export default async function CosmeticsPage() {
  const user = await getCurrentAuthUser();
  const initialData: AccountCosmeticsView = user
    ? await listCosmeticsForAccount(user.id)
    : { balance: 0, premium: false, catalog: await listPublicCosmetics(), inventory: [] };
  return <CosmeticsCatalog initialData={initialData} authenticated={Boolean(user)} />;
}
