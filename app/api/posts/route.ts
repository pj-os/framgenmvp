import { NextResponse } from 'next/server';
import { loadPosts } from '@/lib/data';

export async function GET() {
    const result = await loadPosts();
    return NextResponse.json(result);
}
