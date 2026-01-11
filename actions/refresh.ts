'use server';

import { loadPosts } from '@/lib/data';
import { revalidatePath } from 'next/cache';

export async function refreshTrendingPosts() {
    // loadPosts now handles the "check cache vs fetch fresh" logic internally
    // calling it ensures that if cache is stale, fresh data is fetched and cached.
    const { posts, lastUpdated } = await loadPosts();

    // We can assume success if we got posts or if lastUpdated exists
    const success = posts.length > 0;

    if (success) {
        revalidatePath('/dashboard');
    }

    return { success, message: success ? "Data refresh checked/completed" : "Failed to load data" };
}
