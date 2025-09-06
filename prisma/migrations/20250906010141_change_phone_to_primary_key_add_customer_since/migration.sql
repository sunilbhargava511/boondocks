-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "simplybook_id" INTEGER,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" DATETIME,
    "conversation_preference" INTEGER NOT NULL DEFAULT 2,
    "preferred_provider_id" TEXT,
    "notes" TEXT,
    "loyalty_points" INTEGER NOT NULL DEFAULT 0,
    "total_spent" REAL NOT NULL DEFAULT 0.00,
    "no_show_count" INTEGER NOT NULL DEFAULT 0,
    "cancellation_count" INTEGER NOT NULL DEFAULT 0,
    "account_status" TEXT NOT NULL DEFAULT 'active',
    "customer_since" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_visit" DATETIME,
    "marketing_consent" BOOLEAN NOT NULL DEFAULT false,
    "sms_consent" BOOLEAN NOT NULL DEFAULT false,
    "email_consent" BOOLEAN NOT NULL DEFAULT true,
    "sync_status" TEXT NOT NULL DEFAULT 'synced'
);
INSERT INTO "new_customers" ("account_status", "cancellation_count", "conversation_preference", "created_at", "date_of_birth", "email", "email_consent", "first_name", "id", "last_name", "last_visit", "loyalty_points", "marketing_consent", "no_show_count", "notes", "phone", "preferred_provider_id", "simplybook_id", "sms_consent", "sync_status", "total_spent", "updated_at") SELECT "account_status", "cancellation_count", "conversation_preference", "created_at", "date_of_birth", "email", "email_consent", "first_name", "id", "last_name", "last_visit", "loyalty_points", "marketing_consent", "no_show_count", "notes", "phone", "preferred_provider_id", "simplybook_id", "sms_consent", "sync_status", "total_spent", "updated_at" FROM "customers";
DROP TABLE "customers";
ALTER TABLE "new_customers" RENAME TO "customers";
CREATE UNIQUE INDEX "customers_simplybook_id_key" ON "customers"("simplybook_id");
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
