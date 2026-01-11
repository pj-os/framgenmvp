import 'dotenv/config';
import { fetchXPosts } from '../lib/apify-x';

async function main() {
    console.log("Testing X Data Fetching from Apify...");
    if (!process.env.APIFY_API_TOKEN && !process.env.NEXT_PUBLIC_APIFY_API_TOKEN) {
        console.error("Error: APIFY_API_TOKEN is not set in environment.");
        return;
    }

    try {
        // Fetch for 'AI' category as a test
        const posts = await fetchXPosts('AI');
        console.log(`\nSuccessfully fetched ${posts.length} posts from X.`);

        if (posts.length > 0) {
            console.log("\nSample Post:");
            console.log(JSON.stringify(posts[0], null, 2));
        } else {
            console.log("No posts returned. Check actor run details in Apify Console.");
        }
    } catch (error) {
        console.error("\nError fetching X data:", error);
    }
}

main();
