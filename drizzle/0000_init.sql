CREATE TYPE "public"."attachment_kind" AS ENUM('image', 'url', 'text', 'audio', 'file');--> statement-breakpoint
CREATE TYPE "public"."challenge_status" AS ENUM('backlog', 'active', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."log_entry_kind" AS ENUM('note', 'event');--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"kind" "attachment_kind" NOT NULL,
	"title" text,
	"url" text,
	"content" text,
	"file_name" text,
	"mime_type" text,
	"size" integer,
	"storage_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_log_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"content" text NOT NULL,
	"kind" "log_entry_kind" DEFAULT 'note' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"spark" text,
	"category" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" "challenge_status" DEFAULT 'backlog' NOT NULL,
	"favorite" boolean DEFAULT false NOT NULL,
	"estimated_duration" integer,
	"actual_duration" integer,
	"requires_leaving_home" boolean,
	"requires_money" boolean,
	"result" text,
	"enjoyment_score" integer,
	"abandon_reason" text,
	"tracked_seconds" integer DEFAULT 0 NOT NULL,
	"session_started_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"abandoned_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_log_entries" ADD CONSTRAINT "challenge_log_entries_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachments_challenge_idx" ON "attachments" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX "challenge_log_entries_challenge_idx" ON "challenge_log_entries" USING btree ("challenge_id","created_at");--> statement-breakpoint
CREATE INDEX "challenges_status_idx" ON "challenges" USING btree ("status");--> statement-breakpoint
CREATE INDEX "challenges_created_at_idx" ON "challenges" USING btree ("created_at");