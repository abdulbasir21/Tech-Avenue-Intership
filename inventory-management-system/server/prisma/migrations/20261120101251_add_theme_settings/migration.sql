-- CreateTable
CREATE TABLE "theme_settings" (
    "id" SERIAL NOT NULL,
    "active_theme" VARCHAR(30) NOT NULL DEFAULT 'default',
    "custom_primary_color" VARCHAR(7),
    "updated_by_user_id" INTEGER,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "theme_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_theme_settings_updated_by" ON "theme_settings"("updated_by_user_id");

-- AddForeignKey
ALTER TABLE "theme_settings" ADD CONSTRAINT "theme_settings_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- CheckConstraints
ALTER TABLE "theme_settings" ADD CONSTRAINT "chk_theme_settings_hex"
  CHECK (custom_primary_color IS NULL OR custom_primary_color ~ '^#[0-9A-Fa-f]{6}$');

ALTER TABLE "theme_settings" ADD CONSTRAINT "chk_theme_settings_custom_required"
  CHECK (active_theme <> 'custom' OR custom_primary_color IS NOT NULL);
