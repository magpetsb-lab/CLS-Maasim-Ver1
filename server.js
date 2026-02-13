const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const os = require('os');

// Force Node.js to prioritize IPv4 for DNS resolution.
// This is a robust fix for ENETUNREACH errors on IPv6-problematic networks.
require('dns').setDefaultResultOrder('ipv4first');

const app = express();
const PORT = process.env.PORT || 8080;

// 1. MIME TYPE CONFIGURATION
// Ensure .tsx files are served with the correct JavaScript MIME type.
try {
    express.static.mime.define({ 'application/javascript': ['tsx', 'ts'] });
} catch (e) {
    console.warn('[SYSTEM] MIME type definition warning:', e.message);
}

// 2. MIDDLEWARE
// Enable CORS for all origins, which is suitable for Vercel's preview/production deployments.
const corsOptions = {
    origin: true, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

// Pre-flight OPTIONS requests handler. This is critical for CORS to work reliably.
app.options('*', cors(corsOptions));

// Main CORS middleware for all other requests.
app.use(cors(corsOptions));

// Increase JSON payload limit for potential large data syncs.
app.use(express.json({ limit: '100mb' }));

// 3. STATIC FILE SERVING
// Serve the frontend application files from the root directory.
app.use(express.static(__dirname, {
    setHeaders: (res, path) => {
        if (path.endsWith('.tsx')) res.setHeader('Content-Type', 'application/javascript');
    }
}));

// 4. CLOUD DATABASE CONNECTION
// Use DATABASE_URL from environment variables with a fallback for local development.
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Gs_minad20261@db.glssiawyikytmmuaxtti.supabase.co:5432/postgres';

const pool = new Pool({
  connectionString: connectionString,
  family: 4, // Force IPv4 to prevent network issues.
  max: 10,   // Limit concurrent connections to avoid exhausting database resources.
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // Enable SSL for cloud databases (Supabase, Neon, etc.) and in production environments.
  ssl: (connectionString.includes('supabase') || connectionString.includes('neon.tech') || process.env.NODE_ENV === 'production') 
       ? { rejectUnauthorized: false } 
       : false
});

// Log unexpected database errors.
pool.on('error', (err) => {
    console.error('[DB_POOL] Unexpected error on idle client:', err.message);
});

// Initialize the database schema on startup if the table doesn't exist.
async function initDb() {
    let client;
    try {
        client = await pool.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS legislative_data (
                id TEXT PRIMARY KEY,
                store_name TEXT NOT NULL,
                content JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_store_name ON legislative_data(store_name);
        `);
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message };
    } finally {
        if (client) client.release();
    }
}

// 5. API ENDPOINTS
// Health check endpoint to verify server and database connectivity.
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ 
            status: 'ok', 
            database: 'connected', 
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (err) {
        console.error('[HEALTH] DB check failed:', err.message);
        res.status(503).json({ 
            status: 'error', 
            message: err.message,
            hint: 'Ensure DATABASE_URL environment variable is set in your hosting dashboard.'
        });
    }
});

// Endpoint to export all data from the cloud database as a JSON backup.
app.get('/api/system/export', async (req, res) => {
    try {
        const result = await pool.query('SELECT store_name, content FROM legislative_data');
        const exportData = {};
        result.rows.forEach(row => {
            if (!exportData[row.store_name]) {
                exportData[row.store_name] = [];
            }
            exportData[row.store_name].push(row.content);
        });
        res.json({
            version: "1.0-CLOUD",
            timestamp: new Date().toISOString(),
            data: exportData
        });
    } catch (err) {
        console.error('[EXPORT] Failed to create cloud backup:', err.message);
        res.status(500).json({ error: 'Export Error', reason: err.message });
    }
});

// Generic GET endpoint to retrieve all items from a specific data store.
app.get('/api/:store', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT content FROM legislative_data WHERE store_name = $1 ORDER BY updated_at DESC', 
            [req.params.store]
        );
        res.json(result.rows.map(row => row.content));
    } catch (err) {
        res.status(500).json({ error: 'Read Error', message: err.message });
    }
});

// Generic POST endpoint to create or update (upsert) an item in a data store.
app.post('/api/:store', async (req, res) => {
    try {
        const { store } = req.params;
        const content = req.body;
        if (!content.id) return res.status(400).json({ error: 'Missing ID for record.' });
        await pool.query(
            `INSERT INTO legislative_data (id, store_name, content, updated_at) 
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (id) DO UPDATE SET content = $3, updated_at = NOW()`,
            [content.id, store, content]
        );
        res.status(201).json({ success: true, id: content.id });
    } catch (err) {
        res.status(500).json({ error: 'Write Error', message: err.message });
    }
});

// Generic DELETE endpoint to remove an item from a data store by its ID.
app.delete('/api/:store/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM legislative_data WHERE id = $1', [req.params.id]);
        res.status(200).json({ success: true, id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: 'Delete Error', message: err.message });
    }
});

// 6. SPA ROUTING FALLBACK
// This catch-all route ensures that any non-API, non-file request is handled by the React app.
app.get('*', (req, res) => {
    if (path.extname(req.path)) {
        return res.status(404).send('Not Found');
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 7. EXPORT & SERVER STARTUP
// Export the Express app for Vercel's serverless environment.
module.exports = app;

// Start the server only when this file is run directly (for local development).
// This block is ignored by Vercel.
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', async () => {
        const dbStatus = await initDb();
        console.clear();
        console.log(`\x1b[34m╔══════════════════════════════════════════════════════════════╗\x1b[0m`);
        console.log(`\x1b[34m║          LEGISLATIVE DATA BRIDGE SERVER IS RUNNING           ║\x1b[0m`);
        console.log(`\x1b[34m╚══════════════════════════════════════════════════════════════╝\x1b[0m`);
        
        console.log(`\x1b[36m[SYSTEM]\x1b[0m Server listening on port: ${PORT}`);

        if (dbStatus.ok) {
            console.log(`\x1b[32m[SUCCESS]\x1b[0m Database Linked: ONLINE`);
        } else {
            console.log(`\x1b[31m[ERROR]\x1b[0m Database Error: ${dbStatus.error}`);
        }
        
        console.log(`\nLocal URL: http://localhost:${PORT}`);
        const networkInterfaces = os.networkInterfaces();
        Object.keys(networkInterfaces).forEach((ifName) => {
            (networkInterfaces[ifName] || []).forEach((iface) => {
                if (iface.family === 'IPv4' && !iface.internal) {
                    console.log(`Network URL: http://${iface.address}:${PORT}`);
                }
            });
        });
    });
}