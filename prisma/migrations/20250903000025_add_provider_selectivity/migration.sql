-- CreateTable
CREATE TABLE "provider_customer_approvals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "notes" TEXT,
    "approved_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "provider_customer_approvals_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_accounts" ("provider_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "provider_customer_approvals_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "last_login" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_provider_accounts" ("created_at", "email", "first_name", "id", "is_active", "last_login", "last_name", "password_hash", "phone", "provider_id", "role", "updated_at") SELECT "created_at", "email", "first_name", "id", "is_active", "last_login", "last_name", "password_hash", "phone", "provider_id", "role", "updated_at" FROM "provider_accounts";
DROP TABLE "provider_accounts";
ALTER TABLE "new_provider_accounts" RENAME TO "provider_accounts";
CREATE UNIQUE INDEX "provider_accounts_provider_id_key" ON "provider_accounts"("provider_id");
CREATE UNIQUE INDEX "provider_accounts_email_key" ON "provider_accounts"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "provider_customer_approvals_provider_id_status_idx" ON "provider_customer_approvals"("provider_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "provider_customer_approvals_provider_id_customer_id_key" ON "provider_customer_approvals"("provider_id", "customer_id");
