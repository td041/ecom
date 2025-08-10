CREATE UNIQUE INDEX "CategoryTranslation_categoryId_languageId_unique"
ON "CategoryTranslation" ("categoryId", "languageId")
WHERE "deletedAt" IS NULL;