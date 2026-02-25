
import express from 'express';
import pg from 'pg';
import cors from 'cors';
import path from 'path';
import os from 'os';
import dns from 'dns';
import fs from 'fs';
import { fileURLToPath, URL } from 'url';
import { createRequire } from 'module';

import { createServer as createViteServer } from 'vite';

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

// 3. STATIC FILE SERVING (Handled in startServer based on env)

// ==========================================
// DATABASE ADAPTER SYSTEM
// ==========================================

class DbAdapter {
    async connect() { throw new Error("Method 'connect()' must be implemented."); }
    async healthCheck() { throw new Error("Method 'healthCheck()' must be implemented."); }
    async getAll(storeName) { throw new Error("Method 'getAll()' must be implemented."); }
    async put(storeName, item) { throw new Error("Method 'put()' must be implemented."); }
    async delete(storeName, id) { throw new Error("Method 'delete()' must be implemented."); }
    async export() { throw new Error("Method 'export()' must be implemented."); }
}

// --- POSTGRES ADAPTER ---
class PostgresAdapter extends DbAdapter {
    constructor(connectionString) {
        super();
        this.connectionString = connectionString;
        this.pool = null;
        this.poolConfig = {};
    }

    async prepareConfig() {
        try {
            const dbUrl = new URL(this.connectionString);
            const originalHostname = dbUrl.hostname;
            
            // IPv6/IPv4 Fix
            const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(originalHostname);
            const isInternal = originalHostname.endsWith('.internal') || originalHostname === 'localhost';

            if (!isIp && !isInternal) {
                try {
                    const { address } = await dns.promises.lookup(originalHostname, { family: 4 });
                    if (address) {
                        dbUrl.hostname = address;
                        this.connectionString = dbUrl.toString();
                        this.poolConfig.ssl = { rejectUnauthorized: false, servername: originalHostname };
                    }
                } catch (dnsErr) {
                    console.warn('[DB] DNS Resolution failed, using original hostname:', dnsErr.message);
                    this.poolConfig.ssl = { rejectUnauthorized: false };
                }
            } else {
                 this.poolConfig.ssl = (process.env.NODE_ENV === 'production' || this.connectionString.includes('sslmode=require')) 
                    ? { rejectUnauthorized: false } 
                    : false;
            }
        } catch (e) {
            console.error('[DB] Config Error:', e.message);
            this.poolConfig.ssl = { rejectUnauthorized: false };
        }
    }

    async connect() {
        await this.prepareConfig();
        const { Pool } = pg;
        this.pool = new Pool({
            connectionString: this.connectionString,
            family: 4,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
            ...this.poolConfig
        });
        
        this.pool.on('error', (err) => console.error('[DB] Pool Error:', err.message));
        
        // Init Schema
        try {
            const client = await this.pool.connect();
            try {
                await client.query('CREATE EXTENSION IF NOT EXISTS pg_stat_statements;');
            } catch (e) {} // Ignore
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS legislative_data (
                    id TEXT PRIMARY KEY,
                    store_name TEXT NOT NULL,
                    content JSONB NOT NULL,
                    updated_at TIMESTAMP DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_store_name ON legislative_data(store_name);
            `);
            client.release();
            console.log('[DB] Postgres Connected & Schema Verified');
            return true;
        } catch (err) {
            console.error('[DB] Connection Failed:', err.message);
            return false;
        }
    }

    async healthCheck() {
        if (!this.pool) throw new Error("Pool not initialized");
        await this.pool.query('SELECT 1');
        return { status: 'connected', type: 'postgres' };
    }

    async getAll(storeName) {
        const res = await this.pool.query(
            'SELECT content FROM legislative_data WHERE store_name = $1 ORDER BY updated_at DESC', 
            [storeName]
        );
        return res.rows.map(r => r.content);
    }

    async put(storeName, item) {
        if (!item.id) throw new Error("Item missing ID");
        await this.pool.query(
            `INSERT INTO legislative_data (id, store_name, content, updated_at) 
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (id) DO UPDATE SET content = $3, updated_at = NOW()`,
            [item.id, storeName, item]
        );
        return item.id;
    }

    async delete(storeName, id) {
        await this.pool.query('DELETE FROM legislative_data WHERE id = $1', [id]);
        return id;
    }

    async export() {
        const result = await this.pool.query('SELECT store_name, content FROM legislative_data');
        const exportData = {};
        result.rows.forEach(row => {
            if (!exportData[row.store_name]) exportData[row.store_name] = [];
            exportData[row.store_name].push(row.content);
        });
        return exportData;
    }
}

// --- LOCAL FILE ADAPTER ---
class LocalFileAdapter extends DbAdapter {
    constructor(filePath) {
        super();
        this.filePath = filePath;
        this.data = {};
        this.isDirty = false;
        this.saveInterval = null;
    }

    async connect() {
        try {
            if (fs.existsSync(this.filePath)) {
                const fileContent = fs.readFileSync(this.filePath, 'utf-8');
                try {
                    this.data = JSON.parse(fileContent);
                } catch (e) {
                    console.error('[DB] Corrupt DB file, resetting...');
                    this.data = {};
                }
            } else {
                this.data = {};
            }

            // Ensure structure exists
            if (!this.data.userAccounts) this.data.userAccounts = {};
            if (!this.data.resolutions) this.data.resolutions = {};
            if (!this.data.ordinances) this.data.ordinances = {};
            if (!this.data.sessionMinutes) this.data.sessionMinutes = {};
            if (!this.data.committeeReports) this.data.committeeReports = {};
            if (!this.data.legislators) this.data.legislators = {};
            if (!this.data.incomingDocuments) this.data.incomingDocuments = {};
            if (!this.data.sessionAgendas) this.data.sessionAgendas = {};
            if (!this.data.committeeMemberships) this.data.committeeMemberships = {};
            if (!this.data.terms) this.data.terms = {};
            if (!this.data.sectors) this.data.sectors = {};
            if (!this.data.legislativeMeasures) this.data.legislativeMeasures = {};
            if (!this.data.documentTypes) this.data.documentTypes = {};
            if (!this.data.documentStatuses) this.data.documentStatuses = {};

            // Seed Users if empty
            if (Object.keys(this.data.userAccounts).length === 0) {
                console.log('[DB] Seeding default users...');
                this.data.userAccounts = {
                    'user-001': {
                        id: 'user-001',
                        userId: 'admin',
                        name: 'Admin User',
                        position: 'System Administrator',
                        email: 'admin@example.com',
                        password: 'password123',
                        role: 'admin',
                        status: 'Active',
                    },
                    'user-angel': {
                        id: 'user-angel',
                        userId: 'angel',
                        name: 'Angel Jr. L. Pines',
                        position: 'Administrative Assistant III',
                        email: 'angeladmin@example.com',
                        password: 'ii88',
                        role: 'admin',
                        status: 'Active',
                    }
                };
                this._save();
            }

            console.log(`[DB] Local File DB initialized at: ${this.filePath}`);
            
            // Auto-save every 5 seconds if dirty
            this.saveInterval = setInterval(() => {
                if (this.isDirty) this._save();
            }, 5000);
            
            return true;
        } catch (err) {
            console.error('[DB] Local File Init Error:', err);
            return false;
        }
    }

    _save() {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
            this.isDirty = false;
        } catch (err) {
            console.error('[DB] Save Error:', err);
        }
    }

    async healthCheck() {
        return { status: 'connected', type: 'local-file', path: this.filePath };
    }

    async getAll(storeName) {
        const store = this.data[storeName] || {};
        // Convert map to array and sort by updated_at (simulated)
        // Since we don't strictly track updated_at in the map unless inside content, 
        // we'll assume content has what we need or just return values.
        // The frontend sorts anyway.
        return Object.values(store);
    }

    async put(storeName, item) {
        if (!item.id) throw new Error("Item missing ID");
        if (!this.data[storeName]) this.data[storeName] = {};
        
        this.data[storeName][item.id] = item;
        this.isDirty = true;
        this._save(); // Immediate save for safety in this version
        return item.id;
    }

    async delete(storeName, id) {
        if (this.data[storeName] && this.data[storeName][id]) {
            delete this.data[storeName][id];
            this.isDirty = true;
            this._save();
        }
        return id;
    }

    async export() {
        const exportData = {};
        for (const [storeName, storeMap] of Object.entries(this.data)) {
            exportData[storeName] = Object.values(storeMap);
        }
        return exportData;
    }
}

// ==========================================
// INITIALIZATION
// ==========================================

let db;
let dbPromise;

const initDatabase = async () => {
    if (process.env.DATABASE_URL) {
        console.log('[SYSTEM] DATABASE_URL detected. Using Postgres Adapter.');
        db = new PostgresAdapter(process.env.DATABASE_URL);
    } else {
        console.log('[SYSTEM] No DATABASE_URL. Using Local File Adapter.');
        db = new LocalFileAdapter(path.join(__dirname, 'local_database.json'));
    }
    await db.connect();
    return db;
};

// Initialize DB immediately but store promise
dbPromise = initDatabase().catch(err => {
    console.error('[SYSTEM] Failed to initialize database:', err);
    process.exit(1);
});

// Middleware to ensure DB is ready
const ensureDb = async (req, res, next) => {
    if (!db) {
        try {
            await dbPromise;
        } catch (err) {
            return res.status(500).json({ error: 'Database initialization failed' });
        }
    }
    next();
};

// ==========================================
// API ENDPOINTS
// ==========================================

app.post('/api/system/seed', async (req, res) => {
    try {
        console.log('[SYSTEM] Manual seed requested.');
        const defaultUsers = {
            'user-001': {
                id: 'user-001',
                userId: 'admin',
                name: 'Admin User',
                position: 'System Administrator',
                email: 'admin@example.com',
                password: 'password123',
                role: 'admin',
                status: 'Active',
            },
            'user-angel': {
                id: 'user-angel',
                userId: 'angel',
                name: 'Angel Jr. L. Pines',
                position: 'Administrative Assistant III',
                email: 'angeladmin@example.com',
                password: 'ii88',
                role: 'admin',
                status: 'Active',
            }
        };

        // Inject into DB
        for (const user of Object.values(defaultUsers)) {
            await db.put('userAccounts', user);
        }
        
        res.json({ success: true, message: 'Default users seeded.' });
    } catch (err) {
        res.status(500).json({ error: 'Seed Error', message: err.message });
    }
});

app.post('/api/system/backup', ensureDb, async (req, res) => {
    try {
        const { path: backupPath, data } = req.body;
        if (!backupPath) {
            return res.status(400).json({ error: 'Missing backup path' });
        }

        // Ensure directory exists
        if (!fs.existsSync(backupPath)) {
             try {
                fs.mkdirSync(backupPath, { recursive: true });
             } catch (e) {
                 return res.status(500).json({ error: 'Invalid Path', message: 'Could not create directory: ' + e.message });
             }
        }

        // OPTIMIZATION: If using LocalFileAdapter, copy the file directly
        if (db instanceof LocalFileAdapter) {
            const fileName = `local_database_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            const fullPath = path.join(backupPath, fileName);
            
            // Force save to ensure consistency
            if (db.isDirty) db._save();
            
            try {
                fs.copyFileSync(db.filePath, fullPath);
                console.log(`[BACKUP] Direct file copy to ${fullPath}`);
                return res.json({ success: true, path: fullPath });
            } catch (e) {
                console.error('[BACKUP] File copy failed, falling back to data write:', e);
                // Fallthrough to standard write if copy fails
            }
        }

        if (!data) {
             return res.status(400).json({ error: 'Missing data payload for non-local backup' });
        }

        const fileName = `cls_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const fullPath = path.join(backupPath, fileName);

        fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
        console.log(`[BACKUP] Saved to ${fullPath}`);

        res.json({ success: true, path: fullPath });
    } catch (err) {
        console.error('[BACKUP] Error:', err);
        res.status(500).json({ error: 'Backup Failed', message: err.message });
    }
});

app.get('/api/health', ensureDb, async (req, res) => {
    try {
        const status = await db.healthCheck();
        res.json({ 
            status: 'ok', 
            version: packageJson.version,
            database: status,
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (err) {
        res.status(503).json({ status: 'error', reason: err.message });
    }
});

app.get('/api/system/export', ensureDb, async (req, res) => {
    try {
        const data = await db.export();
        res.json({
            version: "1.0-EXPORT",
            timestamp: new Date().toISOString(),
            data: data
        });
    } catch (err) {
        res.status(500).json({ error: 'Export Error', reason: err.message });
    }
});

app.get('/api/:store', ensureDb, async (req, res) => {
    try {
        const data = await db.getAll(req.params.store);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Read Error', message: err.message });
    }
});

app.post('/api/:store', ensureDb, async (req, res) => {
    try {
        const { store } = req.params;
        const content = req.body;
        const id = await db.put(store, content);
        res.status(201).json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: 'Write Error', message: err.message });
    }
});

app.delete('/api/:store/:id', ensureDb, async (req, res) => {
    try {
        await db.delete(req.params.store, req.params.id);
        res.status(200).json({ success: true, id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: 'Delete Error', message: err.message });
    }
});

// STARTUP
if (process.argv[1] === __filename) {
    const startServer = async () => {
        // Vite Middleware Integration
        if (process.env.NODE_ENV !== 'production') {
            try {
                const vite = await createViteServer({
                    server: { middlewareMode: true },
                    appType: 'spa',
                });
                app.use(vite.middlewares);
                console.log('[SYSTEM] Vite middleware initialized');
            } catch (e) {
                console.error('[SYSTEM] Failed to start Vite middleware:', e);
                process.exit(1);
            }
        } else {
            // Production Static Serving
            app.use(express.static(path.join(__dirname, 'dist')));
            app.get('*', (req, res) => {
                res.sendFile(path.join(__dirname, 'dist', 'index.html'));
            });
        }

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n[SYSTEM] Server running on port ${PORT}`);
            console.log(`[SYSTEM] Mode: ${process.env.DATABASE_URL ? 'CLOUD (Postgres)' : 'LOCAL (File DB)'}`);
            console.log(`[SYSTEM] Local URL: http://localhost:${PORT}`);
        });
    };
    startServer();
}

export default app;
