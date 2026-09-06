import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const demoWorkspaces = sqliteTable("demo_workspaces", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull().unique(),
  ownerEmail: text("owner_email").notNull(),
  data: text("data").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  revision: integer("revision").notNull().default(1),
});
