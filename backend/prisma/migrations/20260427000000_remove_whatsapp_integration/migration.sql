DROP INDEX IF EXISTS "User_phone_key";
DROP INDEX IF EXISTS "Group_whatsappGroupId_key";

ALTER TABLE "EmailLoginToken"
  DROP COLUMN IF EXISTS "waGroupId",
  DROP COLUMN IF EXISTS "waGroupName";

ALTER TABLE "Group"
  DROP COLUMN IF EXISTS "whatsappGroupId";

ALTER TABLE "User"
  DROP COLUMN IF EXISTS "phone";
