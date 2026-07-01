import { pgTable, text, integer, boolean } from "drizzle-orm/pg-core";

export const levels = pgTable("levels", {
    userId: text("user_id").primaryKey(),
    level: integer("level").notNull().default(0),
    totalXp: integer("total_xp").notNull().default(0),
});

export const money = pgTable("money", {
    userId: text("user_id").primaryKey(),
    money: integer("money").notNull().default(0),
    record: integer("record").notNull().default(0),
});

export const tickets = pgTable("tickets", {
    userId: text("user_id").notNull(),
    ticketId: integer("ticket_id").primaryKey(),
    closed: boolean("closed").notNull().default(false),
});

export const modmail = pgTable("modmail", {
    userId: text("user_id").notNull(),
    modmailId: integer("modmail_id").primaryKey(),
    closed: boolean("closed").notNull().default(false),
});
