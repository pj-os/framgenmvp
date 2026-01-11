'use server';

import { refreshData } from '@/lib/apify';
import { revalidatePath } from 'next/cache';

export async function refreshTrendingPosts() {
    const result = await refreshData();
    if (result.success) {
        revalidatePath('/dashboard');
    }
    return result;
}
