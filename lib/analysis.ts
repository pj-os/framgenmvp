import { Post } from './types';

/**
 * Calculates the engagement rate of a post relative to the author's follower count.
 * Formula: ((likes + comments + shares) / followers) * 100
 */
export function calculateEngagementRate(post: Post): number {
    const totalEngagement = post.likes + post.comments + post.shares;

    if (!post.authorFollowers || post.authorFollowers === 0) {
        // Fallback for missing follower count: heuristic based on raw numbers
        // This is a rough approximation to allow ranking vs posts with high follower counts
        if (totalEngagement > 100) return 3.0; // High
        if (totalEngagement > 20) return 1.0;  // Medium
        return 0.1; // Low
    }

    const rate = (totalEngagement / post.authorFollowers) * 100;

    // Round to 2 decimal places for cleaner display
    return Math.round(rate * 100) / 100;
}

interface AnalysisResult {
    score: number;
    label: 'High' | 'Medium' | 'Low';
}

/**
 * Analyzes post performance by comparing it to the author's average engagement rate.
 * If no history is provided or insufficient data, returns a standalone assessment based on arbitrary benchmarks.
 */
export function analyzePerformance(post: Post, authorHistory: Post[] = []): AnalysisResult {
    const currentRate = calculateEngagementRate(post);

    // Filter valid posts for history average
    const validHistory = authorHistory.filter(p => p.authorFollowers && p.authorFollowers > 0 && p.id !== post.id);

    if (validHistory.length === 0) {
        // Fallback: Standalone benchmarks (very rough estimates for LinkedIn)
        // < 0.5% Low, 0.5-2% Medium, > 2% High
        let label: 'High' | 'Medium' | 'Low' = 'Medium';
        if (currentRate < 0.5) label = 'Low';
        else if (currentRate > 2.0) label = 'High';

        return { score: currentRate, label };
    }

    // Compare with author's average
    const totalHistoryRate = validHistory.reduce((sum, p) => sum + calculateEngagementRate(p), 0);
    const avgRate = totalHistoryRate / validHistory.length;

    let label: 'High' | 'Medium' | 'Low' = 'Medium';

    // Logic: 
    // < 0.8x avg = Low
    // > 1.2x avg = High
    // Else Medium

    if (currentRate < avgRate * 0.8) label = 'Low';
    else if (currentRate > avgRate * 1.2) label = 'High';

    return { score: currentRate, label };
}

/**
 * Batch processes posts to add performance metrics.
 * Groups by author to calculate averages correctly.
 */
export function enrichWithPerformanceAnalysis(posts: Post[]): Post[] {
    // Group posts by author unique identifier (e.g., authorUrn or name as fallback)
    const postsByAuthor: Record<string, Post[]> = {};

    for (const post of posts) {
        // Use author name as grouping key since IDs might be inconsistent in mock data
        const authorKey = post.author;
        if (!postsByAuthor[authorKey]) postsByAuthor[authorKey] = [];
        postsByAuthor[authorKey].push(post);
    }

    const enrichedPosts: Post[] = [];

    for (const authorKey in postsByAuthor) {
        const authorPosts = postsByAuthor[authorKey];

        for (const post of authorPosts) {
            const { score, label } = analyzePerformance(post, authorPosts);
            enrichedPosts.push({
                ...post,
                performanceScore: score,
                performanceLabel: label
            });
        }
    }

    return enrichedPosts;
}
