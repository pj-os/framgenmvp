import fs from 'fs';
import path from 'path';
import { Post, Platform, Category } from './types';
import { fetchPostsFromApify, fetchProfiles } from './apify';
import { fetchXPosts } from './apify-x'; // [NEW IMPORT]
import { enrichWithPerformanceAnalysis } from './analysis';
import { TARGET_PROFILES } from './profiles';

// Depending on where the file ends up distributed. 
// For server-side usage in Next.js App Router:
const DATA_FILE_PATH = path.join(process.cwd(), 'dataset_test.json');

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

export async function loadPosts(): Promise<Post[]> {
    let linkedinPosts: Post[] = [];
    let xPosts: Post[] = [];

    // 1. Load LinkedIn Posts (Mock or Real)
    if (process.env.USE_MOCK_DATA === 'true') {
        linkedinPosts = await loadLocalPosts();
    } else {
        linkedinPosts = await fetchPostsFromApify();
        if (linkedinPosts.length === 0) {
            console.log("Falling back to local dataset for LinkedIn");
            linkedinPosts = await loadLocalPosts();
        }
    }

    // 2. Fetch Profiles for all TARGET_PROFILES (LinkedIn Enrichment)
    const followersMap = await fetchProfiles(TARGET_PROFILES);

    // 3. Enrich LinkedIn Posts with Followers
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

    // 4. Fetch X Posts (Only if not using mock data, or if we want to mix them. Assuming mock data contains X posts if updated)
    if (process.env.USE_MOCK_DATA !== 'true') {
        console.log('[Data] Fetching X posts...');
        try {
            const xCategories: Category[] = ['AI', 'Startup', 'Business'];
            const xResults = await Promise.all(xCategories.map(cat => fetchXPosts(cat)));
            xPosts = xResults.flat();
        } catch (e) {
            console.error("Failed to fetch X posts", e);
        }
    } else {
        console.log('[Data] Using mock data, skipping X API fetch (X posts should be in dataset_test.json)');
    }

    // 5. Merge
    let allPosts = [...linkedinPosts, ...xPosts];

    // Deduplicate by ID and Content (fuzzy check)
    const uniquePostsMap = new Map();
    const seenContent = new Set<string>();

    for (const post of allPosts) {
        // Normalize content for comparison (remove whitespace, lowercase)
        const contentKey = post.content.trim().toLowerCase().slice(0, 100); // Check first 100 chars sufficient for identical posts

        if (!uniquePostsMap.has(post.id) && !seenContent.has(contentKey)) {
            uniquePostsMap.set(post.id, post);
            seenContent.add(contentKey);
        }
    }
    const uniquePosts = Array.from(uniquePostsMap.values());

    // 6. Enrich with Performance Analysis (works for both if they have metrics)
    const enrichedPosts = enrichWithPerformanceAnalysis(uniquePosts);

    // 7. Sort by Performance Score (Highest First)
    return enrichedPosts.sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0));
}


// Renamed original function
async function loadLocalPosts(): Promise<Post[]> {
    try {
        const fileContents = await fs.promises.readFile(DATA_FILE_PATH, 'utf8');
        const rawData = JSON.parse(fileContents);

        return rawData.map((item: any) => {
            const text = item.text || item.content || "";
            return {
                id: item.urn || item.id || btoa(text.slice(0, 20) + (item.authorName || "")).slice(0, 16),
                source: (item.source as Platform) || 'LinkedIn',
                author: item.author?.firstName ? `${item.author.firstName} ${item.author.lastName}` : (item.authorName || "Unknown User"),
                authorUrl: item.authorProfileUrl || item.author?.url || undefined,
                content: text,
                url: item.url || item.inputUrl || "#",
                image: item.mediaUrl || item.imageUrl || undefined,
                likes: item.numLikes || item.likes || 0,
                comments: item.numComments || item.comments || 0,
                shares: item.numShares || item.shares || 0,

                // Follower count parsing (fallback if in raw data)
                authorFollowers: item.authorFollowersCount ? parseInt(item.authorFollowersCount.replace(/,/g, ''), 10) : undefined,

                date: item.postedAtISO || new Date().toISOString(),
                category: inferCategory(text)
            };
        });
    } catch (error) {
        console.error("Failed to load dataset:", error);
        return [];
    }
}
