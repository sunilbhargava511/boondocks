-- CreateTable
CREATE TABLE "provider_weekly_availability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider_id" TEXT NOT NULL,
    "monday" TEXT,
    "tuesday" TEXT,
    "wednesday" TEXT,
    "thursday" TEXT,
    "friday" TEXT,
    "saturday" TEXT,
    "sunday" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "provider_weekly_availability_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_accounts" ("provider_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_provider_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "display_name" TEXT,
    "phone" TEXT,
    "bio" TEXT,
    "avatar_initials" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "role" TEXT NOT NULL DEFAULT 'provider',
    "is_selective" BOOLEAN NOT NULL DEFAULT false,
    "no_show_threshold" INTEGER NOT NULL DEFAULT 3,
    "enable_naughty_list" BOOLEAN NOT NULL DEFAULT true,
    "not_accepting_new_clients" BOOLEAN NOT NULL DEFAULT false,
    "cash_only" BOOLEAN NOT NULL DEFAULT false,
    "no_kids_under" INTEGER,
    "conversation_preference" BOOLEAN NOT NULL DEFAULT false,
    "special_notes" TEXT,
    "last_login" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_provider_accounts" ("created_at", "email", "enable_naughty_list", "first_name", "id", "is_active", "is_selective", "last_login", "last_name", "no_show_threshold", "password_hash", "phone", "provider_id", "role", "updated_at") SELECT "created_at", "email", "enable_naughty_list", "first_name", "id", "is_active", "is_selective", "last_login", "last_name", "no_show_threshold", "password_hash", "phone", "provider_id", "role", "updated_at" FROM "provider_accounts";
DROP TABLE "provider_accounts";
ALTER TABLE "new_provider_accounts" RENAME TO "provider_accounts";
CREATE UNIQUE INDEX "provider_accounts_provider_id_key" ON "provider_accounts"("provider_id");
CREATE UNIQUE INDEX "provider_accounts_email_key" ON "provider_accounts"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "provider_weekly_availability_provider_id_key" ON "provider_weekly_availability"("provider_id");
