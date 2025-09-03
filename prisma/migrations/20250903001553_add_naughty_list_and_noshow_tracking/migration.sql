-- CreateTable
CREATE TABLE "no_show_incidents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointment_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "appointment_date" DATETIME NOT NULL,
    "service_name" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "notes" TEXT,
    "marked_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "no_show_incidents_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "no_show_incidents_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_accounts" ("provider_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "provider_naughty_list" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "blocked_email" TEXT NOT NULL,
    "blocked_phone" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'excessive_noshows',
    "no_show_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "blocked_by" TEXT NOT NULL,
    "is_automatic" BOOLEAN NOT NULL DEFAULT false,
    "can_appeal" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "provider_naughty_list_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_accounts" ("provider_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "provider_naughty_list_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "role" TEXT NOT NULL DEFAULT 'provider',
    "is_selective" BOOLEAN NOT NULL DEFAULT false,
    "no_show_threshold" INTEGER NOT NULL DEFAULT 3,
    "enable_naughty_list" BOOLEAN NOT NULL DEFAULT true,
    "last_login" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_provider_accounts" ("created_at", "email", "first_name", "id", "is_active", "is_selective", "last_login", "last_name", "password_hash", "phone", "provider_id", "role", "updated_at") SELECT "created_at", "email", "first_name", "id", "is_active", "is_selective", "last_login", "last_name", "password_hash", "phone", "provider_id", "role", "updated_at" FROM "provider_accounts";
DROP TABLE "provider_accounts";
ALTER TABLE "new_provider_accounts" RENAME TO "provider_accounts";
CREATE UNIQUE INDEX "provider_accounts_provider_id_key" ON "provider_accounts"("provider_id");
CREATE UNIQUE INDEX "provider_accounts_email_key" ON "provider_accounts"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "no_show_incidents_customer_id_provider_id_idx" ON "no_show_incidents"("customer_id", "provider_id");

-- CreateIndex
CREATE INDEX "no_show_incidents_customer_email_idx" ON "no_show_incidents"("customer_email");

-- CreateIndex
CREATE INDEX "no_show_incidents_customer_phone_idx" ON "no_show_incidents"("customer_phone");

-- CreateIndex
CREATE INDEX "provider_naughty_list_provider_id_reason_idx" ON "provider_naughty_list"("provider_id", "reason");

-- CreateIndex
CREATE INDEX "provider_naughty_list_blocked_email_idx" ON "provider_naughty_list"("blocked_email");

-- CreateIndex
CREATE INDEX "provider_naughty_list_blocked_phone_idx" ON "provider_naughty_list"("blocked_phone");

-- CreateIndex
CREATE UNIQUE INDEX "provider_naughty_list_provider_id_blocked_email_key" ON "provider_naughty_list"("provider_id", "blocked_email");

-- CreateIndex
CREATE UNIQUE INDEX "provider_naughty_list_provider_id_blocked_phone_key" ON "provider_naughty_list"("provider_id", "blocked_phone");
