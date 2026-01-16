import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
    images: defineTable({
        originalUrl: v.string(),
        generatedUrl: v.optional(v.string()),
        prompt: v.optional(v.string()),
        template: v.optional(v.string()),
        createdAt: v.number(),
    })
})