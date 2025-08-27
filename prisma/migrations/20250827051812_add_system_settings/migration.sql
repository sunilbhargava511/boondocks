-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "simplybook_sync_enabled" BOOLEAN NOT NULL DEFAULT false,
    "auto_sync_new_customers" BOOLEAN NOT NULL DEFAULT false,
    "auto_sync_appointments" BOOLEAN NOT NULL DEFAULT false,
    "last_sync_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
