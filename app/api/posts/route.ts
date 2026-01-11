import { NextResponse } from 'next/server';
import { loadPosts } from '@/lib/data';

export async function GET() {
    const posts = await loadPosts();
    return NextResponse.json(posts);
}
