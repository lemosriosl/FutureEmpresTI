CREATE SCHEMA IF NOT EXISTS "public";

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE "public"."MembershipRole" AS ENUM ('COLLABORATOR', 'ADMIN');
CREATE TYPE "public"."EquipmentStatus" AS ENUM ('AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE');

CREATE TABLE "public"."tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."memberships" (
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "role" "public"."MembershipRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "memberships_pkey" PRIMARY KEY ("user_id", "tenant_id")
);

CREATE TABLE "public"."equipment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "patrimonio" VARCHAR(80) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "serial_number" VARCHAR(160),
    "location" VARCHAR(160),
    "notes" TEXT,
    "status" "public"."EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."loans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "borrower_id" UUID NOT NULL,
    "borrowed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMP(3) NOT NULL,
    "returned_at" TIMESTAMP(3),
    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "actor_id" UUID,
    "action" VARCHAR(80) NOT NULL,
    "resource_type" VARCHAR(80) NOT NULL,
    "resource_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenants_slug_key" ON "public"."tenants"("slug");
CREATE INDEX "memberships_tenant_id_idx" ON "public"."memberships"("tenant_id");
CREATE INDEX "equipment_tenant_id_status_idx" ON "public"."equipment"("tenant_id", "status");
CREATE UNIQUE INDEX "equipment_tenant_id_patrimonio_key" ON "public"."equipment"("tenant_id", "patrimonio");
CREATE INDEX "loans_tenant_id_borrower_id_returned_at_idx" ON "public"."loans"("tenant_id", "borrower_id", "returned_at");
CREATE INDEX "loans_tenant_id_equipment_id_returned_at_idx" ON "public"."loans"("tenant_id", "equipment_id", "returned_at");
CREATE UNIQUE INDEX "loans_one_open_per_equipment_idx" ON "public"."loans"("equipment_id") WHERE "returned_at" IS NULL;
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "public"."audit_logs"("tenant_id", "created_at");

ALTER TABLE "public"."memberships" ADD CONSTRAINT "memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."equipment" ADD CONSTRAINT "equipment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."loans" ADD CONSTRAINT "loans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."loans" ADD CONSTRAINT "loans_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."loans" ADD CONSTRAINT "loans_borrower_id_tenant_id_fkey" FOREIGN KEY ("borrower_id", "tenant_id") REFERENCES "public"."memberships"("user_id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_actor_id_tenant_id_fkey" FOREIGN KEY ("actor_id", "tenant_id") REFERENCES "public"."memberships"("user_id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."equipment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."loans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_members_can_read_tenant" ON "public"."tenants"
  FOR SELECT TO authenticated
  USING ("id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "tenant_members_can_read_memberships" ON "public"."memberships"
  FOR SELECT TO authenticated
  USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "tenant_members_can_read_equipment" ON "public"."equipment"
  FOR SELECT TO authenticated
  USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "tenant_members_can_insert_equipment" ON "public"."equipment"
  FOR INSERT TO authenticated
  WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "tenant_members_can_update_equipment" ON "public"."equipment"
  FOR UPDATE TO authenticated
  USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "tenant_members_can_read_loans" ON "public"."loans"
  FOR SELECT TO authenticated
  USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "tenant_members_can_insert_loans" ON "public"."loans"
  FOR INSERT TO authenticated
  WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "tenant_members_can_update_loans" ON "public"."loans"
  FOR UPDATE TO authenticated
  USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "tenant_members_can_read_audit_logs" ON "public"."audit_logs"
  FOR SELECT TO authenticated
  USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY "tenant_members_can_insert_audit_logs" ON "public"."audit_logs"
  FOR INSERT TO authenticated
  WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE OR REPLACE FUNCTION "public"."prevent_audit_log_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$;

CREATE TRIGGER "audit_logs_append_only"
  BEFORE UPDATE OR DELETE ON "public"."audit_logs"
  FOR EACH ROW EXECUTE FUNCTION "public"."prevent_audit_log_mutation"();
