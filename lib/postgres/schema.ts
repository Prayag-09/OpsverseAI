import {
	pgTable,
	serial,
	timestamp,
	text,
	varchar,
	integer,
	pgEnum,
} from 'drizzle-orm/pg-core';

export const Chat = pgTable('chat', {
	id: serial('id').primaryKey(),
	userId: varchar('user_id', { length: 256 }).notNull(),
	pdfName: text('pdf_name').notNull(),
	pdfUrl: text('pdf_url').notNull(),
	fileKey: text('file_key').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
export type DrizzleChat = typeof Chat.$inferSelect;

export const userModel = pgEnum('user_model', ['user', 'assistant']);

export const Message = pgTable('message', {
	id: serial('id').primaryKey(),
	chatId: integer('chat_id')
		.references(() => Chat.id)
		.notNull(),
	role: userModel('role').notNull(),
	content: text('content').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const userSubscriptions = pgTable('user_subscriptions', {
	id: serial('id').primaryKey(),
	userId: varchar('user_id', { length: 256 }).notNull().unique(),
	stripeCustomerId: varchar('stripe_customer_id', { length: 256 })
		.notNull()
		.unique(),
	stripeSubscriptionId: varchar('stripe_subscription_id', {
		length: 256,
	}).unique(),
	stripePriceId: varchar('stripe_price_id', { length: 256 }),
	stripeCurrentPeriodEnd: timestamp('stripe_current_period_ended_at'),
});
