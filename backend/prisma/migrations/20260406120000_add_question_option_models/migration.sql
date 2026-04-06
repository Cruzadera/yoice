CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "selectionType" TEXT NOT NULL,
    "nsfw" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Poll" ADD COLUMN "questionId" TEXT;

INSERT INTO "Question" ("id", "text", "category", "selectionType", "nsfw", "active", "createdAt")
SELECT
    'legacy-question-' || "id",
    "question",
    'legacy',
    'single',
    false,
    true,
    "createdAt"
FROM "Poll";

UPDATE "Poll"
SET "questionId" = 'legacy-question-' || "id"
WHERE "questionId" IS NULL;

CREATE TABLE "Option" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "legacyLabel" TEXT,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

INSERT INTO "User" ("id", "phone", "name", "createdAt")
SELECT DISTINCT
    'legacy-user-' || md5(source."pollId" || '|' || source."label"),
    'legacy-option-' || md5(source."pollId" || '|' || source."label") || '@local.invalid',
    source."label",
    CURRENT_TIMESTAMP
FROM (
    SELECT
        p."id" AS "pollId",
        option_value AS "label"
    FROM "Poll" p
    CROSS JOIN LATERAL unnest(p."options") AS option_value
) AS source
LEFT JOIN "User" u ON u."name" = source."label"
WHERE u."id" IS NULL
AND source."label" IS NOT NULL
AND source."label" <> ''
ON CONFLICT ("phone") DO NOTHING;

INSERT INTO "Option" ("id", "pollId", "userId", "createdAt", "legacyLabel")
SELECT DISTINCT
    'legacy-option-' || md5(source."pollId" || '|' || source."label"),
    source."pollId",
    COALESCE(u."id", 'legacy-user-' || md5(source."pollId" || '|' || source."label")),
    CURRENT_TIMESTAMP,
    source."label"
FROM (
    SELECT
        p."id" AS "pollId",
        option_value AS "label"
    FROM "Poll" p
    CROSS JOIN LATERAL unnest(p."options") AS option_value
) AS source
LEFT JOIN "User" u ON u."name" = source."label"
WHERE source."label" IS NOT NULL
AND source."label" <> '';

UPDATE "Vote" v
SET "optionId" = o."id"
FROM "Option" o
WHERE o."pollId" = v."pollId"
AND o."legacyLabel" = v."optionId";

ALTER TABLE "Poll" ALTER COLUMN "questionId" SET NOT NULL;

ALTER TABLE "Poll" ADD CONSTRAINT "Poll_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Option" ADD CONSTRAINT "Option_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Option" ADD CONSTRAINT "Option_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Option_pollId_userId_key" ON "Option"("pollId", "userId");
CREATE INDEX "Poll_questionId_idx" ON "Poll"("questionId");
CREATE INDEX "Option_pollId_idx" ON "Option"("pollId");
CREATE INDEX "Vote_optionId_idx" ON "Vote"("optionId");

ALTER TABLE "Option" DROP COLUMN "legacyLabel";
ALTER TABLE "Poll" DROP COLUMN "question";
ALTER TABLE "Poll" DROP COLUMN "options";
