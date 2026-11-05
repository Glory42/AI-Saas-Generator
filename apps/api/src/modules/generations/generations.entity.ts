import { boolean, index, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { images } from "../images/images.entity";
import { users } from "../users/users.entity";

export const modelTierEnum = pgEnum("model_tier", ["flash", "pro"]);
export const generationStatusEnum = pgEnum("generation_status", ["pending", "completed", "failed"]);

export const generations = pgTable(
  "generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    imageId: uuid("image_id")
      .notNull()
      .references(() => images.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    templateId: text("template_id").notNull(),
    modelTier: modelTierEnum("model_tier").notNull(),
    strategy: text("strategy"),
    status: generationStatusEnum("status").notNull().default("pending"),
    resultUrl: text("result_url"),
    resultStorageKey: text("result_storage_key"),
    costUsd: numeric("cost_usd", { precision: 10, scale: 4, mode: "number" }).notNull().default(0),
    cached: boolean("cached").notNull().default(false),
    cacheKey: text("cache_key").notNull(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("generations_user_id_created_at_idx").on(table.userId, table.createdAt),
    index("generations_image_id_idx").on(table.imageId),
    index("generations_user_id_cache_key_idx").on(table.userId, table.cacheKey),
    index("generations_result_storage_key_idx").on(table.resultStorageKey),
  ],
);

export type GenerationRow = typeof generations.$inferSelect;
export type GenerationInsert = typeof generations.$inferInsert;
