import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey(),
  username: text().notNull(),
  email: text().notNull().unique(),
  createdAt: timestamp().defaultNow().notNull(),
})
