import { Post } from './types';

/**
 * Ranks posts based on:
 * - Recency (weight: 0.3)
 * - Likes (weight: 0.4)
 * - Shares (weight: 0.2)
 * - Comments (weight: 0.1)
 * 
 * Scores are normalized relative to the max values in the set.
 */
export function rankPosts(posts: Post[]): Post[] {
    if (posts.length === 0) return [];

    const maxLikes = Math.max(...posts.map(p => p.likes), 1);
    const maxShares = Math.max(...posts.map(p => p.shares), 1);
    const maxComments = Math.max(...posts.map(p => p.comments), 1);

    const now = new Date().getTime();
    // Normalize age: 0 for now, 1 for very old. We want inverse (freshness).
    // Let's take the oldest post interaction to Normalize.
    const timestamps = posts.map(p => new Date(p.date).getTime()).filter(t => !isNaN(t));
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const timeRange = maxTime - minTime || 1;

    const scoredPosts = posts.map(post => {
        const postTime = new Date(post.date).getTime();

        // Normalize metrics 0-1
        const normLikes = post.likes / maxLikes;
        const normShares = post.shares / maxShares;
        const normComments = post.comments / maxComments;

        // Normalize freshness: (postTime - minTime) / timeRange
        // If postTime is maxTime (newest), this is 1. If minTime (oldest), 0.
        const normFreshness = !isNaN(postTime) ? (postTime - minTime) / timeRange : 0;

        const score =
            (normFreshness * 0.3) +
            (normLikes * 0.4) +
            (normShares * 0.2) +
            (normComments * 0.1);

        return { ...post, rankScore: score };
    });

    // Sort descending by score
    return scoredPosts.sort((a, b) => (b.rankScore || 0) - (a.rankScore || 0));
}

export function getTopPosts(posts: Post[], topN: number = 5): Post[] {
    return rankPosts(posts).slice(0, topN);
}
