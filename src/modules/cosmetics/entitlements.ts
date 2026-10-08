/** Pure eligibility predicate shared by public projections and the account service. */
export function isEntitlementActive(
  entitlement: { startsAt: Date; expiresAt: Date | null; revokedAt: Date | null },
  now = new Date(),
) {
  return !entitlement.revokedAt && entitlement.startsAt <= now && (!entitlement.expiresAt || entitlement.expiresAt > now);
}
