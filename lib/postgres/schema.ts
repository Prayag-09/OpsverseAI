import { pgTable, serial, timestamp, text, varchar, integer, pgEnum } from 'drizzle-orm/pg-core';

export const Chat = pgTable('chat', {
	chatId: serial('chat_id').primaryKey(),
	userId: varchar('user_id', { length: 255 }).notNull(),
	pdfName: text('pdf_name').notNull(),
	pdfUrl: text('pdf_url').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const userSystem = pgEnum('user_system', ['user', 'system']);

export const Message = pgTable('message', {
    id : serial('id').primaryKey(),
    chatId : integer('chat_id').references(() => Chat.chatId).notNull(),
    role : userSystem('role').notNull(),
    content : text('content').notNull(),
    createdAt : timestamp('created_at').notNull().defaultNow(),
    updatedAt : timestamp('updated_at').notNull().defaultNow(),
})