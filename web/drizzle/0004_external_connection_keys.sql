CREATE TABLE "external_connection_keys" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "connection_id" uuid NOT NULL,
  "scope" text NOT NULL,
  "remote_integration_id" text NOT NULL,
  "encrypted_credential" text NOT NULL,
  "verified_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "external_connection_keys" ADD CONSTRAINT "external_connection_keys_connection_id_external_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."external_connections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "external_connection_keys_conn_scope_idx" ON "external_connection_keys" USING btree ("connection_id","scope");
