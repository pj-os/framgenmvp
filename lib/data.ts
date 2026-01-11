import { Post, Platform, Category } from './types';
import { fetchPostsFromApify, fetchProfiles } from './apify';
import { fetchXPosts } from './apify-x';
import { enrichWithPerformanceAnalysis } from './analysis';
import { TARGET_PROFILES } from './profiles';
import { createAdminClient } from './supabase/admin';

// Cache configuration
const CACHE_TTL_HOURS = 3;
const CACHE_KEY = 'global_feed';

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

export async function loadPosts(): Promise<{ posts: Post[], lastUpdated: string | null }> {
    const supabaseAdmin = createAdminClient();
    let lastUpdated: string | null = null;

    // 1. Check Cache in Supabase
    try {
        const { data: cacheHit } = await supabaseAdmin
            .from('cached_posts')
            .select('*')
            .eq('id', CACHE_KEY)
            .single();

        if (cacheHit) {
            const updatedAt = new Date(cacheHit.updated_at).getTime();
            const now = Date.now();
            const hoursDiff = (now - updatedAt) / (1000 * 60 * 60);

            if (hoursDiff < CACHE_TTL_HOURS) {
                console.log(`[Data] Serving cached posts (Age: ${hoursDiff.toFixed(2)}h)`);
                return { posts: cacheHit.posts as Post[], lastUpdated };
            } else {
                console.log(`[Data] Cache stale (Age: ${hoursDiff.toFixed(2)}h). Refreshing...`);
            }
        } else {
            console.log('[Data] No cache found. Fetching fresh data...');
        }
    } catch (error) {
        console.error('[Data] Cache check failed:', error);
    }

    // 2. Fetch Fresh Data (Cache Miss or Stale) - NO MOCK DATA, STRICT ONLINE FETCH
    let linkedinPosts: Post[] = [];
    let xPosts: Post[] = [];

    // Fetch LinkedIn
    try {
        linkedinPosts = await fetchPostsFromApify();
        console.log(`[Data] Fetched ${linkedinPosts.length} LinkedIn posts.`);
    } catch (e) {
        console.error("Failed to fetch LinkedIn posts", e);
    }

    // Enrich LinkedIn with Followers
    const followersMap = await fetchProfiles(TARGET_PROFILES);
    linkedinPosts = linkedinPosts.map(post => {
        if (post.authorFollowers) return post;
        if (!post.authorUrl) return post;

        const postUrlObj = new URL(post.authorUrl);
        const cleanPostAuthorUrl = (postUrlObj.origin + postUrlObj.pathname).replace(/\/$/, "").toLowerCase();

        for (const inputUrl of TARGET_PROFILES) {
            const mapKey = inputUrl.replace(/\/recent-activity\/all\/?$/, "");
            const cleanInputUrl = mapKey.replace(/\/$/, "").toLowerCase();

            if (cleanPostAuthorUrl.includes(cleanInputUrl) || cleanInputUrl.includes(cleanPostAuthorUrl)) {
                const count = followersMap[mapKey];
                if (count) {
                    return { ...post, authorFollowers: count };
                }
            }
        }
        return post;
    });

    // Fetch X
    try {
        console.log('[Data] Fetching X posts...');
        const xCategories: Category[] = ['AI', 'Startup', 'Business'];
        const xResults = await Promise.all(xCategories.map(cat => fetchXPosts(cat)));
        xPosts = xResults.flat();
        console.log(`[Data] Fetched ${xPosts.length} X posts.`);
    } catch (e) {
        console.error("Failed to fetch X posts", e);
    }

    // Merge & Deduplicate
    let allPosts = [...linkedinPosts, ...xPosts];
    const uniquePostsMap = new Map();
    const seenContent = new Set<string>();

    for (const post of allPosts) {
        const contentKey = post.content.trim().toLowerCase().slice(0, 100);
        if (!uniquePostsMap.has(post.id) && !seenContent.has(contentKey)) {
            uniquePostsMap.set(post.id, post);
            seenContent.add(contentKey);
        }
    }
    const uniquePosts = Array.from(uniquePostsMap.values());

    // Enrich Analysis
    const enrichedPosts = enrichWithPerformanceAnalysis(uniquePosts);
    const sortedPosts = enrichedPosts.sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0));

    // 3. Save to Cache (if we got data)
    if (sortedPosts.length > 0) {
        try {
            const { error } = await supabaseAdmin
                .from('cached_posts')
                .upsert({
                    id: CACHE_KEY,
                    posts: sortedPosts,
                    updated_at: new Date().toISOString()
                });

            if (error) console.error('[Data] Failed to update cache:', error);
            else console.log('[Data] Cache updated successfully.');
        } catch (e) {
            console.error('[Data] Cache saving error:', e);
        }
    }

    return { posts: sortedPosts, lastUpdated };
}
