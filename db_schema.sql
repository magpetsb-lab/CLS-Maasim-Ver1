
/* 
 * SUPABASE / POSTGRESQL SCHEMA SCRIPT
 * 
 * Instructions:
 * 1. Log in to your Supabase Dashboard.
 * 2. Go to your project and click on the "SQL Editor" icon in the left sidebar.
 * 3. Click "+ New query".
 * 4. Paste the code below into the editor.
 * 5. Click "Run" (bottom right).
 */

-- 1. Create the main data table
-- This table stores all application data (resolutions, settings, profiles) as JSON objects.
CREATE TABLE IF NOT EXISTS legislative_data (
    id TEXT PRIMARY KEY,
    store_name TEXT NOT NULL,
    content JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create an index for performance
-- This speeds up loading specific collections (e.g., just loading 'resolutions').
CREATE INDEX IF NOT EXISTS idx_store_name ON legislative_data(store_name);

-- 3. Verify Creation
-- Run this line to check if the table exists (Result should be empty but no error).
SELECT * FROM legislative_data LIMIT 5;
