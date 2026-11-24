CREATE TABLE "external_connections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" text NOT NULL,
  "provider" text NOT NULL,
  "remote_tenant_id" text NOT NULL,
  "remote_integration_id" text NOT NULL,
  "encrypted_credential" text NOT NULL,
  "scope" text NOT NULL,
  "verified_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "external_connections" ADD CONSTRAINT "external_connections_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "external_connections_org_provider_idx" ON "external_connections" USING btree ("organization_id", "provider");
--> statement-breakpoint
CREATE UNIQUE INDEX "external_connections_provider_tenant_idx" ON "external_connections" USING btree ("provider", "remote_tenant_id");
