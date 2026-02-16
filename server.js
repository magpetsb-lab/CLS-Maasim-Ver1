import express from 'express';
import pg from 'pg';
import cors from 'cors';
import path from 'path';
import os from 'os';
import dns from 'dns';
import { fileURLToPath, URL } from 'url';
import { createRequire } from 'module';

// Polyfills for ESM
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = require('./package.json');

// Force Node.js to prioritize IPv4 for DNS resolution.
dns.setDefaultResultOrder('ipv4first');

const app = express();
const PORT = process.env.PORT || 8080;

// 2. MIDDLEWARE
const corsOptions = {
    origin: true, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json({ limit: '100mb' }));

// 3. STATIC FILE SERVING
// Serve the built frontend files from the 'dist' directory.
app.use(express.static(path.join(__dirname, 'dist')));

// 4. CLOUD DATABASE CONNECTION
// SECURITY UPDATE: Removed hardcoded connection string. 
// You MUST set DATABASE_URL in your Vercel/Railway Environment Variables.
let connectionString = process.env.DATABASE_URL;
let poolConfig = {};

if (!connectionString) {
    console.warn('[SYSTEM] No DATABASE_URL provided. API endpoints will fail, but static frontend will serve.');
} else if (connectionString.includes('[YOUR-PASSWORD]')) {
    console.error('[SYSTEM] CRITICAL CONFIG ERROR: DATABASE_URL contains placeholder [YOUR-PASSWORD]. Please replace it with your actual password in Railway Variables.');
}

// 4.1 DNS Resolution & Provider Detection
const prepareDatabaseConfig = async () => {
    if (!connectionString) return;

    try {
        const dbUrl = new URL(connectionString);
        const originalHostname = dbUrl.hostname;
        
        // Detect Provider for logging
        let provider = 'Generic Postgres';
        if (originalHostname.includes('supabase')) provider = 'Supabase';
        else if (originalHostname.includes('railway')) provider = 'Railway (Internal/Public)';
        else if (originalHostname.includes('neon.tech')) provider = 'Neon.tech';
        else if (originalHostname.includes('aivencloud')) provider = 'Aiven';
        else if (originalHostname.includes('render')) provider = 'Render';

        console.log(`[SYSTEM] Detected Database Provider: ${provider}`);

        // IPv6/IPv4 Fix: Explicitly resolve to IPv4 if it's not a local or internal address
        const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(originalHostname);
        const isInternal = originalHostname.endsWith('.internal') || originalHostname === 'localhost';

        if (!isIp && !isInternal) {
            console.log(`[SYSTEM] Resolving DB Host: ${originalHostname} to IPv4...`);
            try {
                const addresses = await dns.promises.resolve4(originalHostname);
                if (addresses && addresses.length > 0) {
                    console.log(`[SYSTEM] DNS Success: Mapped ${originalHostname} -> ${addresses[0]}`);
                    dbUrl.hostname = addresses[0];
                    connectionString = dbUrl.toString();
                    
                    // Essential for SSL to work when connecting via IP
                    poolConfig.ssl = {
                        rejectUnauthorized: false,
                        servername: originalHostname
                    };
                }
            } catch (dnsErr) {
                console.warn('[SYSTEM] DNS Resolution failed, falling back to system default:', dnsErr.message);
                poolConfig.ssl = { rejectUnauthorized: false };
            }
        } else {
             // For internal addresses (Railway private networking) or direct IPs
             // Production usually requires SSL with rejectUnauthorized: false for self-signed certs in managed DBs
             poolConfig.ssl = (process.env.NODE_ENV === 'production' || connectionString.includes('sslmode=require')) 
                ? { rejectUnauthorized: false } 
                : false;
        }
    } catch (e) {
        console.error('[SYSTEM] URL Parsing Error:', e.message);
        poolConfig.ssl = { rejectUnauthorized: false };
    }
};

const { Pool } = pg;
let pool = null;

const initializePool = async () => {
    await prepareDatabaseConfig();
    
    pool = new Pool({
        connectionString: connectionString,
        family: 4, 
        max: 10,   
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ...poolConfig 
    });

    pool.on('error', (err) => {
        console.error('[DB_POOL] Unexpected error on idle client:', err.message);
    });
};

// 5. API ENDPOINTS
app.get('/api/health', async (req, res) => {
    try {
        if (!process.env.DATABASE_URL) throw new Error("Server missing DATABASE_URL configuration.");
        if (process.env.DATABASE_URL.includes('[YOUR-PASSWORD]')) throw new Error("DATABASE_URL has invalid password placeholder.");
        if (!pool) throw new Error("Database pool initializing...");
        
        await pool.query('SELECT 1');
        res.json({ 
            status: 'ok', 
            version: packageJson.version,
            database: 'connected', 
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (err) {
        console.error('[HEALTH] DB check failed:', err.message);
        const isNetworkError = err.message.includes('ENETUNREACH') || err.message.includes('EAI_AGAIN');
        res.status(503).json({ 
            status: 'error', 
            reason: `DB Connection Failed: ${err.message}`, 
            hint: isNetworkError ? 'Network unreachable. Check if Database is active and allows public connections.' : 'Check DATABASE_URL credentials in Railway Variables.'
        });
    }
});

app.get('/api/system/export', async (req, res) => {
    try {
        if (!pool) throw new Error("Database not connected");
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

app.get('/api/:store', async (req, res) => {
    try {
        if (!pool) throw new Error("Database not connected");
        const result = await pool.query(
            'SELECT content FROM legislative_data WHERE store_name = $1 ORDER BY updated_at DESC', 
            [req.params.store]
        );
        res.json(result.rows.map(row => row.content));
    } catch (err) {
        res.status(500).json({ error: 'Read Error', message: err.message });
    }
});

app.post('/api/:store', async (req, res) => {
    try {
        if (!pool) throw new Error("Database not connected");
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

app.delete('/api/:store/:id', async (req, res) => {
    try {
        if (!pool) throw new Error("Database not connected");
        await pool.query('DELETE FROM legislative_data WHERE id = $1', [req.params.id]);
        res.status(200).json({ success: true, id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: 'Delete Error', message: err.message });
    }
});

// 6. SPA ROUTING FALLBACK
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 7. EXPORT & SERVER STARTUP
export default app;

async function initDb() {
    if (!pool) return { ok: false, error: "Pool not ready" };
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

if (process.argv[1] === __filename) {
    const startServer = async () => {
        await initializePool();
        
        app.listen(PORT, '0.0.0.0', async () => {
            console.clear();
            console.log(`\x1b[34m╔══════════════════════════════════════════════════════════════╗\x1b[0m`);
            console.log(`\x1b[34m║          LEGISLATIVE DATA BRIDGE SERVER IS RUNNING           ║\x1b[0m`);
            console.log(`\x1b[34m╚══════════════════════════════════════════════════════════════╝\x1b[0m`);
            
            console.log(`\x1b[36m[SYSTEM]\x1b[0m Version: ${packageJson.version}`);
            console.log(`\x1b[36m[SYSTEM]\x1b[0m Server listening on port: ${PORT}`);

            if (pool) {
                const dbStatus = await initDb();
                if (dbStatus.ok) {
                    console.log(`\x1b[32m[SUCCESS]\x1b[0m Database Linked: ONLINE`);
                } else {
                    console.log(`\x1b[31m[ERROR]\x1b[0m Database Error: ${dbStatus.error}`);
                    console.log(`\x1b[33m[WARNING]\x1b[0m App running in OFFLINE mode (Serverless Static)`);
                }
            } else {
                 console.log(`\x1b[33m[WARNING]\x1b[0m Database pool failed to initialize (Missing Config).`);
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
    };

    startServer();
}