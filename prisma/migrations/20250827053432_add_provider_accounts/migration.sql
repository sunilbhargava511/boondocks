-- CreateTable
CREATE TABLE "provider_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "role" TEXT NOT NULL DEFAULT 'provider',
    "last_login" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "provider_unavailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider_id" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "all_day" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "provider_unavailability_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_accounts" ("provider_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "provider_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "appointment_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "provider_notifications_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_accounts" ("provider_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "provider_accounts_provider_id_key" ON "provider_accounts"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "provider_accounts_email_key" ON "provider_accounts"("email");

-- CreateIndex
CREATE INDEX "provider_unavailability_provider_id_start_date_idx" ON "provider_unavailability"("provider_id", "start_date");

-- CreateIndex
CREATE INDEX "provider_notifications_provider_id_is_read_idx" ON "provider_notifications"("provider_id", "is_read");
