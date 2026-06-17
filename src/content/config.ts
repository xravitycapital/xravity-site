import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.date(),
    excerpt: z.string(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    lang: z.enum(['en', 'zh']).default('en'),
    draft: z.boolean().default(false),
    updatedDate: z.date().optional(),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    featured: z.boolean().default(false),
    relatedResources: z.array(z.string()).default([]),
  }),
});

const resources = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string(),
    url: z.string().url(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    lang: z.enum(['en', 'zh']).default('en'),
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog, resources };
