import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("SUPABASE_SECRET_KEY is missing. Please add it to your .env.local file and restart the server.");
    }

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        secretKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
