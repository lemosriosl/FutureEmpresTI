-- CreateTable
CREATE TABLE "public"."login_rate_limits" (
    "scope" VARCHAR(8) NOT NULL,
    "key_hash" CHAR(64) NOT NULL,
    "window_start" TIMESTAMPTZ(3) NOT NULL,
    "attempts" INTEGER NOT NULL,

    CONSTRAINT "login_rate_limits_pkey" PRIMARY KEY ("scope","key_hash")
);

-- CreateIndex
CREATE INDEX "login_rate_limits_window_start_idx" ON "public"."login_rate_limits"("window_start");

ALTER TABLE "public"."login_rate_limits"
    ADD CONSTRAINT "login_rate_limits_valid_counter"
    CHECK ("scope" IN ('ip', 'account') AND "attempts" > 0);

ALTER TABLE "public"."login_rate_limits" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."login_rate_limits" FROM PUBLIC, anon, authenticated, service_role;
