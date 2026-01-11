import { ApifyClient } from 'apify-client';
import { Post, Platform, Category } from './types';
import { TARGET_PROFILES } from './profiles';

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});



// Helper to infer category (reused logic, ideally shared but keeping simple)
function inferCategory(text: string): Category {
    const content = text.toLowerCase();
    if (content.includes('startup') || content.includes('founder') || content.includes('yc') || content.includes('funding')) return 'Startup';
    if (content.includes('finance') || content.includes('money') || content.includes('invest')) return 'Finance';
    if (content.includes('ai ') || content.includes('artificial intelligence') || content.includes('gpt') || content.includes('llm')) return 'AI';
    if (content.includes('software') || content.includes('code') || content.includes('developer') || content.includes('engineer')) return 'Software Development';
    if (content.includes('marketing') || content.includes('brand') || content.includes('audience')) return 'Marketing';
    if (content.includes('design') || content.includes('ui') || content.includes('ux')) return 'Design';
    if (content.includes('productivity') || content.includes('habit') || content.includes('work')) return 'Productivity';
    return 'Business';
}

// refreshData removed as it relied on local FS cache. Use global refresh via API/Cache expiry.

export async function fetchPostsFromApify(): Promise<Post[]> {
    return fetchNetworkPosts();
}

async function fetchNetworkPosts(): Promise<Post[]> {
    if (!process.env.APIFY_API_TOKEN) {
        console.error("APIFY_API_TOKEN is missing");
        return [];
    }

    try {
        console.log("Fetching from Apify (supreme_coder/linkedin-post)...");

        // User confirmed usage of 'supreme_coder/linkedin-post' with 'No cookies' mode
        // This actor typically accepts 'urls' which can be Profile Activity URLs
        const run = await client.actor("supreme_coder/linkedin-post").call({
            urls: TARGET_PROFILES,
            deepScrape: true,
            limitPerSource: 5,
            rawData: false,
        });

        // Fetch results from dataset
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        const posts: Post[] = items.map((item: any) => {
            const text = item.text || item.content || item.description || "";
            return {
                id: item.id || item.urn || Math.random().toString(36).substr(2, 9),
                source: 'LinkedIn' as Platform,

                // Author mapping varies by actor output
                author: item.authorName || item.author?.name || "LinkedIn User",
                authorUrl: item.authorProfileUrl || item.author?.url || undefined,

                content: text,
                url: item.url || item.postUrl || "#",
                image: item.images?.[0] || item.imageUrl || undefined,
                authorImage: item.author?.picture || item.authorProfilePicture || undefined,

                // Metrics
                likes: item.numLikes || item.likesCount || 0,
                comments: item.numComments || item.commentsCount || 0,
                shares: item.numShares || item.sharesCount || 0,

                // Follower count (parsing "77,954" string format)
                authorFollowers: item.authorFollowersCount ? parseInt(item.authorFollowersCount.replace(/,/g, ''), 10) : undefined,

                date: item.postedAtISO || (item.postedAtTimestamp ? new Date(item.postedAtTimestamp).toISOString() : new Date().toISOString()),
                category: inferCategory(text)
            };
        });

        return posts;

    } catch (error) {
        console.error("Apify fetch failed:", error);
        return [];
    }
}

// ------------------------------------------------------------------
// Profile Fetching Logic (New)
// ------------------------------------------------------------------

export async function fetchProfiles(profileUrls: string[]): Promise<Record<string, number>> {
    const cleanedUrls = [...new Set(profileUrls.map(url => url.replace(/\/recent-activity\/all\/?$/, '')))];
    const followersMap: Record<string, number> = {};

    // We strictly fetch fresh data now as we rely on the parent's (loadPosts) 3-hour cache.
    // This avoids FS usage and ensures data simplicity.

    if (!process.env.APIFY_API_TOKEN) {
        console.error("APIFY_API_TOKEN missing, cannot fetch profiles.");
        return followersMap;
    }

    try {
        console.log(`Fetching ${cleanedUrls.length} profiles from Apify...`);

        // Actor: 2SyF0bVxmgGr8IVCZ input schema: { "profileUrls": [ "url1", "url2" ] }
        const run = await client.actor("2SyF0bVxmgGr8IVCZ").call({
            profileUrls: cleanedUrls
        });

        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        for (const itemObj of items) {
            // Some actors return a single item containing the list of results in an 'items' property
            const rawItem = itemObj as any;
            const profiles = Array.isArray(rawItem) ? rawItem : (rawItem.items && Array.isArray(rawItem.items) ? rawItem.items : [rawItem]);

            for (const item of profiles) {
                const itemUrl = (item.url || item.linkedinUrl || item.inputUrl || "").replace(/\/$/, "");
                const followers = item.followers || item.follower_count || item.followersCount || item.connections_count || item.connectionsCount || item.connections || item.followerCount || 0;

                // We need to map it back to our requested URLs
                // Simple matching attempts
                const publicId = item.publicIdentifier || item.public_identifier;
                const inputUrl = cleanedUrls.find(u => itemUrl.includes(u) || u.includes(itemUrl) || (publicId && u.includes(publicId)));

                if (inputUrl) {
                    let flw = followers;
                    if (typeof flw === 'string') flw = parseInt(flw.replace(/,/g, ''), 10);
                    followersMap[inputUrl] = flw;
                }
            }
        }

    } catch (error) {
        console.error("Profile batch fetch failed:", error);
    }

    return followersMap;
}
