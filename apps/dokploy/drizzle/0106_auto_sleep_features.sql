ALTER TABLE "application" ADD COLUMN "autoSleep" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "application" ADD COLUMN "sleepTimeoutMinutes" integer DEFAULT 30;--> statement-breakpoint
ALTER TABLE "application" ADD COLUMN "lastActivity" text;--> statement-breakpoint
ALTER TABLE "application" ADD COLUMN "isSleeping" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "compose" ADD COLUMN "autoSleep" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "compose" ADD COLUMN "sleepTimeoutMinutes" integer DEFAULT 30;--> statement-breakpoint
ALTER TABLE "compose" ADD COLUMN "lastActivity" text;--> statement-breakpoint
ALTER TABLE "compose" ADD COLUMN "isSleeping" boolean DEFAULT false NOT NULL;