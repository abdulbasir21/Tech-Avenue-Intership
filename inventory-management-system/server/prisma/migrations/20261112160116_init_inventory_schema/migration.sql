-- CreateEnum
CREATE TYPE "po_status" AS ENUM ('draft', 'ordered', 'partially_received', 'received', 'cancelled');

-- CreateEnum
CREATE TYPE "request_status" AS ENUM ('pending', 'approved', 'rejected', 'partially_issued', 'issued', 'cancelled');

-- CreateEnum
CREATE TYPE "adjustment_type" AS ENUM ('increase', 'decrease');

-- CreateEnum
CREATE TYPE "adjustment_reason" AS ENUM ('damaged', 'lost', 'count_difference', 'other');

-- CreateEnum
CREATE TYPE "movement_type" AS ENUM ('goods_receipt', 'stock_issue', 'adjustment_increase', 'adjustment_decrease');

-- CreateEnum
CREATE TYPE "stock_alert_level" AS ENUM ('normal', 'low', 'critical', 'out_of_stock');

-- CreateEnum
CREATE TYPE "audit_action" AS ENUM ('create', 'update', 'deactivate', 'reactivate', 'status_change', 'stock_adjustment');

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" SERIAL NOT NULL,
    "employee_code" VARCHAR(30) NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(30),
    "department_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "allows_decimal" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "contact_person" VARCHAR(100),
    "email" VARCHAR(255),
    "phone" VARCHAR(30),
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "category_id" INTEGER NOT NULL,
    "unit_id" INTEGER NOT NULL,
    "min_stock_level" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "critical_stock_level" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" SERIAL NOT NULL,
    "po_number" VARCHAR(30) NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "order_date" DATE NOT NULL,
    "expected_delivery_date" DATE,
    "status" "po_status" NOT NULL DEFAULT 'draft',
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_by_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" SERIAL NOT NULL,
    "purchase_order_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity_ordered" DECIMAL(12,3) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "line_total" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipts" (
    "id" SERIAL NOT NULL,
    "receipt_number" VARCHAR(30) NOT NULL,
    "purchase_order_id" INTEGER NOT NULL,
    "received_date" DATE NOT NULL,
    "delivery_reference" VARCHAR(100),
    "notes" TEXT,
    "confirmed_by_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goods_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipt_items" (
    "id" SERIAL NOT NULL,
    "goods_receipt_id" INTEGER NOT NULL,
    "purchase_order_item_id" INTEGER NOT NULL,
    "quantity_received" DECIMAL(12,3) NOT NULL,

    CONSTRAINT "goods_receipt_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_requests" (
    "id" SERIAL NOT NULL,
    "request_number" VARCHAR(30) NOT NULL,
    "requested_by_user_id" INTEGER NOT NULL,
    "status" "request_status" NOT NULL DEFAULT 'pending',
    "purpose" TEXT,
    "reviewed_by_user_id" INTEGER,
    "reviewed_at" TIMESTAMPTZ,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_request_items" (
    "id" SERIAL NOT NULL,
    "stock_request_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity_requested" DECIMAL(12,3) NOT NULL,
    "quantity_approved" DECIMAL(12,3),

    CONSTRAINT "stock_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_issues" (
    "id" SERIAL NOT NULL,
    "issue_number" VARCHAR(30) NOT NULL,
    "issued_to_employee_id" INTEGER NOT NULL,
    "issued_by_user_id" INTEGER NOT NULL,
    "issue_date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_issue_items" (
    "id" SERIAL NOT NULL,
    "stock_issue_id" INTEGER NOT NULL,
    "stock_request_item_id" INTEGER NOT NULL,
    "quantity_issued" DECIMAL(12,3) NOT NULL,

    CONSTRAINT "stock_issue_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "adjustment_type" "adjustment_type" NOT NULL,
    "reason_category" "adjustment_reason" NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "reason" TEXT NOT NULL,
    "adjustment_date" DATE NOT NULL,
    "adjusted_by_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_balances" (
    "product_id" INTEGER NOT NULL,
    "quantity_on_hand" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "alert_level" "stock_alert_level" NOT NULL DEFAULT 'out_of_stock',
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_balances_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" BIGSERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "movement_type" "movement_type" NOT NULL,
    "quantity_change" DECIMAL(12,3) NOT NULL,
    "balance_after" DECIMAL(12,3) NOT NULL,
    "goods_receipt_item_id" INTEGER,
    "stock_issue_item_id" INTEGER,
    "stock_adjustment_id" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "alert_level" "stock_alert_level" NOT NULL,
    "quantity_at_trigger" DECIMAL(12,3) NOT NULL,
    "message" VARCHAR(255) NOT NULL,
    "stock_movement_id" BIGINT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_recipients" (
    "id" BIGSERIAL NOT NULL,
    "notification_id" BIGINT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,

    CONSTRAINT "notification_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER,
    "action" "audit_action" NOT NULL,
    "entity_type" VARCHAR(60) NOT NULL,
    "entity_id" BIGINT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" INET,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_employee_id_key" ON "users"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role_id");

-- CreateIndex
CREATE INDEX "idx_users_active" ON "users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_code_key" ON "employees"("employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "idx_employees_department" ON "employees"("department_id");

-- CreateIndex
CREATE INDEX "idx_employees_active" ON "employees"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "units_code_key" ON "units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_name_key" ON "suppliers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "idx_products_category" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "idx_products_unit" ON "products"("unit_id");

-- CreateIndex
CREATE INDEX "idx_products_active" ON "products"("is_active");

-- CreateIndex
CREATE INDEX "idx_products_name" ON "products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "purchase_orders"("po_number");

-- CreateIndex
CREATE INDEX "idx_po_supplier" ON "purchase_orders"("supplier_id");

-- CreateIndex
CREATE INDEX "idx_po_status" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "idx_po_order_date" ON "purchase_orders"("order_date");

-- CreateIndex
CREATE INDEX "idx_po_created_by" ON "purchase_orders"("created_by_user_id");

-- CreateIndex
CREATE INDEX "idx_poi_product" ON "purchase_order_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_poi_po_product" ON "purchase_order_items"("purchase_order_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipts_receipt_number_key" ON "goods_receipts"("receipt_number");

-- CreateIndex
CREATE INDEX "idx_gr_po" ON "goods_receipts"("purchase_order_id");

-- CreateIndex
CREATE INDEX "idx_gr_received_date" ON "goods_receipts"("received_date");

-- CreateIndex
CREATE INDEX "idx_gr_confirmed_by" ON "goods_receipts"("confirmed_by_user_id");

-- CreateIndex
CREATE INDEX "idx_gri_po_item" ON "goods_receipt_items"("purchase_order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_gri_receipt_poitem" ON "goods_receipt_items"("goods_receipt_id", "purchase_order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_requests_request_number_key" ON "stock_requests"("request_number");

-- CreateIndex
CREATE INDEX "idx_sr_requester_date" ON "stock_requests"("requested_by_user_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_sr_status" ON "stock_requests"("status");

-- CreateIndex
CREATE INDEX "idx_sr_reviewer" ON "stock_requests"("reviewed_by_user_id");

-- CreateIndex
CREATE INDEX "idx_sri_product" ON "stock_request_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_sri_request_product" ON "stock_request_items"("stock_request_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_issues_issue_number_key" ON "stock_issues"("issue_number");

-- CreateIndex
CREATE INDEX "idx_si_employee" ON "stock_issues"("issued_to_employee_id");

-- CreateIndex
CREATE INDEX "idx_si_issue_date" ON "stock_issues"("issue_date");

-- CreateIndex
CREATE INDEX "idx_si_issued_by" ON "stock_issues"("issued_by_user_id");

-- CreateIndex
CREATE INDEX "idx_sii_request_item" ON "stock_issue_items"("stock_request_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_sii_issue_request_item" ON "stock_issue_items"("stock_issue_id", "stock_request_item_id");

-- CreateIndex
CREATE INDEX "idx_sa_product_date" ON "stock_adjustments"("product_id", "adjustment_date");

-- CreateIndex
CREATE INDEX "idx_sa_adjusted_by" ON "stock_adjustments"("adjusted_by_user_id");

-- CreateIndex
CREATE INDEX "idx_bal_alert_level" ON "inventory_balances"("alert_level");

-- CreateIndex
CREATE UNIQUE INDEX "stock_movements_goods_receipt_item_id_key" ON "stock_movements"("goods_receipt_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_movements_stock_issue_item_id_key" ON "stock_movements"("stock_issue_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_movements_stock_adjustment_id_key" ON "stock_movements"("stock_adjustment_id");

-- CreateIndex
CREATE INDEX "idx_mov_product_date" ON "stock_movements"("product_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_mov_type" ON "stock_movements"("movement_type");

-- CreateIndex
CREATE INDEX "idx_mov_created_at" ON "stock_movements"("created_at");

-- CreateIndex
CREATE INDEX "idx_notif_product_date" ON "notifications"("product_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_notif_created_at" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "idx_notif_movement" ON "notifications"("stock_movement_id");

-- CreateIndex
CREATE INDEX "idx_nr_user_unread" ON "notification_recipients"("user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "uq_nr_notification_user" ON "notification_recipients"("notification_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_audit_entity" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_audit_user" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_audit_created_at" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_confirmed_by_user_id_fkey" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_goods_receipt_id_fkey" FOREIGN KEY ("goods_receipt_id") REFERENCES "goods_receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_purchase_order_item_id_fkey" FOREIGN KEY ("purchase_order_item_id") REFERENCES "purchase_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_requests" ADD CONSTRAINT "stock_requests_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_requests" ADD CONSTRAINT "stock_requests_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_request_items" ADD CONSTRAINT "stock_request_items_stock_request_id_fkey" FOREIGN KEY ("stock_request_id") REFERENCES "stock_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_request_items" ADD CONSTRAINT "stock_request_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_issues" ADD CONSTRAINT "stock_issues_issued_to_employee_id_fkey" FOREIGN KEY ("issued_to_employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_issues" ADD CONSTRAINT "stock_issues_issued_by_user_id_fkey" FOREIGN KEY ("issued_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_issue_items" ADD CONSTRAINT "stock_issue_items_stock_issue_id_fkey" FOREIGN KEY ("stock_issue_id") REFERENCES "stock_issues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_issue_items" ADD CONSTRAINT "stock_issue_items_stock_request_item_id_fkey" FOREIGN KEY ("stock_request_item_id") REFERENCES "stock_request_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_adjusted_by_user_id_fkey" FOREIGN KEY ("adjusted_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_goods_receipt_item_id_fkey" FOREIGN KEY ("goods_receipt_item_id") REFERENCES "goods_receipt_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_stock_issue_item_id_fkey" FOREIGN KEY ("stock_issue_item_id") REFERENCES "stock_issue_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_stock_adjustment_id_fkey" FOREIGN KEY ("stock_adjustment_id") REFERENCES "stock_adjustments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_stock_movement_id_fkey" FOREIGN KEY ("stock_movement_id") REFERENCES "stock_movements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ─────────────────────────────────────────────────────────────────────────────
-- CHECK CONSTRAINTS (from DBML specification)
-- ─────────────────────────────────────────────────────────────────────────────

-- products
ALTER TABLE "products" ADD CONSTRAINT "chk_products_min_stock"
  CHECK (min_stock_level >= 0);

ALTER TABLE "products" ADD CONSTRAINT "chk_products_critical_stock"
  CHECK (critical_stock_level >= 0 AND critical_stock_level <= min_stock_level);

-- purchase_orders
ALTER TABLE "purchase_orders" ADD CONSTRAINT "chk_po_total_nonneg"
  CHECK (total_amount >= 0);

ALTER TABLE "purchase_orders" ADD CONSTRAINT "chk_po_dates"
  CHECK (expected_delivery_date IS NULL OR expected_delivery_date >= order_date);

-- purchase_order_items
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "chk_poi_qty_positive"
  CHECK (quantity_ordered > 0);

ALTER TABLE "purchase_order_items" ADD CONSTRAINT "chk_poi_price_nonneg"
  CHECK (unit_price >= 0);

ALTER TABLE "purchase_order_items" ADD CONSTRAINT "chk_poi_line_total"
  CHECK (line_total = round(quantity_ordered * unit_price, 2));

-- goods_receipt_items
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "chk_gri_qty_positive"
  CHECK (quantity_received > 0);

-- stock_requests
ALTER TABLE "stock_requests" ADD CONSTRAINT "chk_sr_rejection"
  CHECK (status <> 'rejected' OR (rejection_reason IS NOT NULL AND reviewed_by_user_id IS NOT NULL));

-- stock_request_items
ALTER TABLE "stock_request_items" ADD CONSTRAINT "chk_sri_requested_positive"
  CHECK (quantity_requested > 0);

ALTER TABLE "stock_request_items" ADD CONSTRAINT "chk_sri_approved_range"
  CHECK (quantity_approved IS NULL OR (quantity_approved >= 0 AND quantity_approved <= quantity_requested));

-- stock_issue_items
ALTER TABLE "stock_issue_items" ADD CONSTRAINT "chk_sii_qty_positive"
  CHECK (quantity_issued > 0);

-- stock_adjustments
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "chk_sa_qty_positive"
  CHECK (quantity > 0);

ALTER TABLE "stock_adjustments" ADD CONSTRAINT "chk_sa_reason_matches_type"
  CHECK (reason_category NOT IN ('damaged', 'lost') OR adjustment_type = 'decrease');

ALTER TABLE "stock_adjustments" ADD CONSTRAINT "chk_sa_reason_not_blank"
  CHECK (length(btrim(reason)) > 0);

-- inventory_balances
ALTER TABLE "inventory_balances" ADD CONSTRAINT "chk_bal_no_negative_stock"
  CHECK (quantity_on_hand >= 0);

-- stock_movements
ALTER TABLE "stock_movements" ADD CONSTRAINT "chk_mov_nonzero"
  CHECK (quantity_change <> 0);

ALTER TABLE "stock_movements" ADD CONSTRAINT "chk_mov_balance_nonneg"
  CHECK (balance_after >= 0);

ALTER TABLE "stock_movements" ADD CONSTRAINT "chk_mov_single_source"
  CHECK (num_nonnulls(goods_receipt_item_id, stock_issue_item_id, stock_adjustment_id) = 1);

ALTER TABLE "stock_movements" ADD CONSTRAINT "chk_mov_type_sign_source"
  CHECK (
    (movement_type = 'goods_receipt' AND quantity_change > 0 AND goods_receipt_item_id IS NOT NULL) OR
    (movement_type = 'stock_issue' AND quantity_change < 0 AND stock_issue_item_id IS NOT NULL) OR
    (movement_type = 'adjustment_increase' AND quantity_change > 0 AND stock_adjustment_id IS NOT NULL) OR
    (movement_type = 'adjustment_decrease' AND quantity_change < 0 AND stock_adjustment_id IS NOT NULL)
  );

-- notifications
ALTER TABLE "notifications" ADD CONSTRAINT "chk_notif_not_normal"
  CHECK (alert_level <> 'normal');

-- notification_recipients
ALTER TABLE "notification_recipients" ADD CONSTRAINT "chk_nr_read_consistency"
  CHECK ((is_read = false AND read_at IS NULL) OR (is_read = true AND read_at IS NOT NULL));

-- ─────────────────────────────────────────────────────────────────────────────
-- APPEND-ONLY LEDGER TRIGGER FOR stock_movements
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_prevent_stock_movements_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Table stock_movements is an append-only ledger: UPDATE and DELETE operations are prohibited.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_movements_no_update_delete
BEFORE UPDATE OR DELETE ON "stock_movements"
FOR EACH ROW
EXECUTE FUNCTION trg_prevent_stock_movements_mutation();
