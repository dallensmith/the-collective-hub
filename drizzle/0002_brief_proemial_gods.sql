CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"event_type" text DEFAULT 'screening' NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"location" text,
	"external_link" text,
	"image_cdn_key" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_site_start_idx" ON "events" USING btree ("site_id","start_time");--> statement-breakpoint
CREATE INDEX "events_site_published_idx" ON "events" USING btree ("site_id","is_published");