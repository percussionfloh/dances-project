import { defineCollection, defineContentConfig, z } from '@nuxt/content';

export default defineContentConfig({
    collections: {
        pieces: defineCollection({
            source: 'pieces/**/*.yaml',
            type: 'page',
            schema: z.object({
                slug: z.string(),
                composer: z.string(),
                filename: z.string(),
                key: z.string(),
                largerWorkTitle: z.string(),
                localRawFile: z.string(),
                majorMinor: z.string(),
                meter: z.string(),
                nr: z.number(),
                op: z.number(),
                genre: z.string(),
            }),
        }),
        data: defineCollection({
            source: 'data/**/*.yaml',
            type: 'page',
        }),
        rawData: defineCollection({
            source: 'raw-data/**/*.yaml',
            type: 'page',
        }),
    },
});
