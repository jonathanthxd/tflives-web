-- Cosmetic purchases are represented by the immutable WalletTransaction ledger.
-- Remove legacy persistent purchase notifications so the store uses only its
-- short-lived in-page confirmation and the localized wallet transaction entry.
DELETE FROM "Notification"
WHERE type = 'COSMETIC'
  AND "entityType" = 'Cosmetic';
