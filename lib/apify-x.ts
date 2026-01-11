import fs from 'fs';
import path from 'path';
import { ApifyClient } from 'apify-client';
import { Post, Category } from './types';

// Initialize the ApifyClient with API token
const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN || process.env.NEXT_PUBLIC_APIFY_API_TOKEN,
});

const CACHE_FILE = path.join(process.cwd(), 'apify_x_cache.json');
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

interface XCacheData {
    timestamp: number;
    posts: Post[];
}

/**
 * Adapt a raw X post from the Apify actor to our Post interface
 */
export function adaptXPost(raw: any, category: string): Post {
    const authorName = raw.author?.name || raw.author?.userName || 'Unknown User';
    const authorHandle = raw.author?.userName ? `@${raw.author.userName}` : '';

    // Construct a permanent URL if not provided
    const url = raw.url || raw.twitterUrl || `https://x.com/${raw.author?.userName}/status/${raw.id}`;

    // Extract images if any
    let image = undefined;
    if (raw.media && raw.media.length > 0) {
        // Find the first photo or video thumbnail
        const firstMedia = raw.media[0];
        image = firstMedia.media_url_https || firstMedia.url;
    }

    return {
        id: raw.id,
        source: 'X',
        author: `${authorName} ${authorHandle}`.trim(),
        content: raw.text || raw.full_text || '',
        url: url,
        authorUrl: raw.author?.url || raw.author?.twitterUrl || `https://x.com/${raw.author?.userName}`,
        image: image,
        authorImage: raw.author?.profilePicture || raw.author?.profile_image_url_https,

        // Metrics
        likes: raw.likeCount || raw.favorite_count || 0,
        comments: raw.replyCount || raw.reply_count || 0,
        shares: raw.retweetCount || raw.retweet_count || 0,
        date: raw.createdAt || raw.created_at || new Date().toISOString(),
        category: category,

        // Performance (calculated later or defaulted)
        authorFollowers: raw.author?.followers || raw.author?.followers_count || 0,
        performanceLabel: 'Medium', // Default, will be recalculated
    };
}

/**
 * Fetch X posts for a specific category using the Tweet Scraper V2 actor
 */
export async function fetchXPosts(category: Category): Promise<Post[]> {
    const now = Date.now();

    // 1. Check File Cache
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const raw = await fs.promises.readFile(CACHE_FILE, 'utf8');
            const cache: Record<string, XCacheData> = JSON.parse(raw);
            const categoryCache = cache[category];

            if (categoryCache && (now - categoryCache.timestamp < CACHE_TTL)) {
                console.log(`[X] Returning cached posts for ${category}`);
                return categoryCache.posts;
            }
        }
    } catch (e) {
        console.error("[X] Error reading cache:", e);
    }

    try {
        console.log(`[X] Fetching posts for ${category}...`);

        // Construct query based on category
        // We fetch 100 latest, filter for English, exclude replies
        let queryTerm = `"${category}"`;

        // Customize query terms for better results
        switch (category) {
            case 'Business': queryTerm = '"Business Strategy" OR "Entrepreneurship"'; break;
            case 'Startup': queryTerm = '"SaaS" OR "Startup" OR "Indie Hacker"'; break;
            case 'Finance': queryTerm = '"Investing" OR "Stock Market" OR "Finance"'; break;
            case 'AI': queryTerm = '"Artificial Intelligence" OR "LLM" OR "Generative AI"'; break;
            case 'Software Development': queryTerm = '"Web Development" OR "Coding" OR "Software Engineering"'; break;
            case 'Marketing': queryTerm = '"Digital Marketing" OR "Growth Hacking" OR "SEO"'; break;
            case 'Design': queryTerm = '"UI/UX" OR "Web Design" OR "Graphic Design"'; break;
            case 'Productivity': queryTerm = '"Productivity Hack" OR "Time Management"'; break;
        }

        const runInput = {
            "twitterContent": `${queryTerm} lang:en -filter:replies min_faves:5`,
            "maxItems": 250,
            "queryType": "Latest",
        };

        // Run the actor
        // Actor ID: kaitoeasyapi/twitter-x-data-tweet-scraper-pay-per-result-cheapest
        const actorId = 'kaitoeasyapi/twitter-x-data-tweet-scraper-pay-per-result-cheapest';
        const run = await client.actor(actorId).call(runInput);

        console.log(`[X] Run finished: ${run.id}`);

        // Fetch results from dataset
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        // Adapt and filter
        const adaptedPosts = items.map((item: any) => adaptXPost(item, category));

        // Sort by engagement (Likes + Shares)
        const sortedPosts = adaptedPosts.sort((a, b) => {
            const engagementA = (a.likes || 0) + (a.shares || 0);
            const engagementB = (b.likes || 0) + (b.shares || 0);
            return engagementB - engagementA;
        });

        // Take top 20 (we will filter down to 12 in the unified view, but keep more here for diversity)
        const topPosts = sortedPosts.slice(0, 20);

        // 2. Update File Cache using read-modify-write (simple approach)
        try {
            let cache: Record<string, XCacheData> = {};
            if (fs.existsSync(CACHE_FILE)) {
                const raw = await fs.promises.readFile(CACHE_FILE, 'utf8');
                cache = JSON.parse(raw);
            }

            cache[category] = {
                timestamp: now,
                posts: topPosts,
            };

            await fs.promises.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
            console.log(`[X] Updated cache for ${category}`);
        } catch (e) {
            console.error("[X] Failed to update cache:", e);
        }

        return topPosts;

    } catch (error) {
        console.error(`[X] Error fetching posts for ${category}:`, error);
        return [];
    }
}
