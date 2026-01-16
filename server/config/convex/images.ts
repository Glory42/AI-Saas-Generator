import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const saveImage = mutation({
    args: { originalUrl: v.string() },
    handler: async (ctx, args) => {
        const newImageId = await ctx.db.insert('images', {
            originalUrl: args.originalUrl,
            createdAt: Date.now(),
        });
        return newImageId;
    }
});

export const getHistory = query({
    handler: async (ctx) => {
        return await ctx.db.query('images').order('desc').take(20);
    }
});