import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  index,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const userSystemEnum = pgEnum("user_system_enum", [
  "system",
  "user",
]);

// ─── Chats Table ─────────────────────────────────────────────────────────────

export const chats = pgTable(
  "chats",
  {
    id: serial("id").primaryKey(),
    pdfName: text("pdf_name").notNull(),
    pdfUrl: text("pdf_url").notNull(),
    fileKey: text("file_key").notNull(),
    userId: varchar("user_id", { length: 256 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("chats_user_id_idx").on(table.userId),
    fileKeyIdx: index("chats_file_key_idx").on(table.fileKey),
  })
);

export type DrizzleChat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;

// ─── Messages Table ──────────────────────────────────────────────────────────

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    chatId: integer("chat_id")
      .references(() => chats.id, { onDelete: "cascade" })
      .notNull(),
    content: text("content").notNull(),
    role: userSystemEnum("role").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    chatIdx: index("messages_chat_id_idx").on(table.chatId),
  })
);

// ─── Subscriptions Table ─────────────────────────────────────────────────────

export const userSubscriptions = pgTable(
  "user_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 256 }).notNull().unique(),

    stripeCustomerId: varchar("stripe_customer_id", {
      length: 256,
    })
      .notNull()
      .unique(),

    stripeSubscriptionId: varchar("stripe_subscription_id", {
      length: 256,
    }).unique(),

    stripePriceId: varchar("stripe_price_id", { length: 256 }),

    stripeCurrentPeriodEnd: timestamp(
      "stripe_current_period_ended_at"
    ),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("subs_user_id_idx").on(table.userId),
  })
);