export type Platform = 'LinkedIn' | 'X' | 'Substack';

export type Category =
    | 'Business'
    | 'Startup'
    | 'Finance'
    | 'AI'
    | 'Software Development'
    | 'Marketing'
    | 'Design'
    | 'Productivity';

export interface Post {
    id: string;
    source: Platform;
    author: string;
    content: string;
    url: string;
    authorUrl?: string; // Link to author profile for matching
    image?: string;
    authorImage?: string;

    // Metrics
    likes: number;
    comments: number;
    shares: number;
    date: string; // ISO string
    category: string; // Inferred or explicit

    // Analysis (Computed later)
    rankScore?: number;
    frameworkAnalysis?: string;

    // Performance Analysis
    authorFollowers?: number;
    performanceScore?: number; // Engagement rate (0-100+)
    performanceLabel?: 'High' | 'Medium' | 'Low';
}

export interface UserState {
    selectedCategories: Category[];
    bookmarkedPosts: string[];
}
