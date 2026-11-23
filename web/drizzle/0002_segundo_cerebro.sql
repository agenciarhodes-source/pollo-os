CREATE TABLE "activity_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"actor_user_id" text,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"summary" text NOT NULL,
	"visibility" text DEFAULT 'empresa' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"kind" text DEFAULT 'nota' NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"url" text,
	"source_meeting_id" uuid,
	"visibility" text DEFAULT 'empresa' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_links" (
	"organization_id" text NOT NULL,
	"from_id" uuid NOT NULL,
	"to_id" uuid NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memory_links_from_id_to_id_pk" PRIMARY KEY("from_id","to_id")
);
--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_items" ADD CONSTRAINT "memory_items_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_items" ADD CONSTRAINT "memory_items_source_meeting_id_executive_meetings_id_fk" FOREIGN KEY ("source_meeting_id") REFERENCES "public"."executive_meetings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_items" ADD CONSTRAINT "memory_items_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_links" ADD CONSTRAINT "memory_links_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_links" ADD CONSTRAINT "memory_links_from_id_memory_items_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."memory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_links" ADD CONSTRAINT "memory_links_to_id_memory_items_id_fk" FOREIGN KEY ("to_id") REFERENCES "public"."memory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_links" ADD CONSTRAINT "memory_links_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_events_org_idx" ON "activity_events" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "memory_items_org_idx" ON "memory_items" USING btree ("organization_id","updated_at");