-- CreateTable
CREATE TABLE "customers" (
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_visit" DATETIME,
    "marketing_consent" BOOLEAN NOT NULL DEFAULT false,
    "sms_consent" BOOLEAN NOT NULL DEFAULT false,
    "email_consent" BOOLEAN NOT NULL DEFAULT true,
    "sync_status" TEXT NOT NULL DEFAULT 'synced'
);

-- CreateTable
CREATE TABLE "customer_preferences" (
    "customer_id" TEXT NOT NULL PRIMARY KEY,
    "preferred_days" JSONB,
    "preferred_times" JSONB,
    "preferred_services" JSONB,
    "allergies_notes" TEXT,
    "special_instructions" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_preferences_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customer_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "tag_name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_tags_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "simplybook_id" INTEGER,
    "service_id" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "provider_name" TEXT NOT NULL,
    "appointment_date" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "booking_code" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "appointments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "file_name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "total_rows" INTEGER NOT NULL,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    "created_by" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_simplybook_id_key" ON "customers"("simplybook_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");
