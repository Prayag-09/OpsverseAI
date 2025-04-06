CREATE TYPE "public"."user_system" AS ENUM('user', 'system');--> statement-breakpoint
CREATE TABLE "chat" (
	"chat_id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"pdf_name" text NOT NULL,
	"pdf_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" serial PRIMARY KEY NOT NULL,
	"chat_id" integer NOT NULL,
	"role" "user_system" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_chat_id_chat_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("chat_id") ON DELETE no action ON UPDATE no action;