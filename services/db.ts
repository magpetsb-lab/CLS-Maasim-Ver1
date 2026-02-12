
import { 
    MOCK_RESOLUTIONS, MOCK_ORDINANCES, MOCK_SESSION_MINUTES, 
    MOCK_SESSION_AGENDAS, MOCK_COMMITTEE_REPORTS, MOCK_LEGISLATORS, 
    MOCK_COMMITTEE_MEMBERSHIPS, MOCK_TERMS, MOCK_USER_ACCOUNTS, 
    MOCK_SECTORS, MOCK_LEGISLATIVE_MEASURES, MOCK_INCOMING_DOCUMENTS, 
    MOCK_DOCUMENT_TYPES, MOCK_DOCUMENT_STATUSES 
} from '../constants';

const DB_NAME = 'LegislativeSystemDB';
const DB_VERSION = 1;
const INIT_FLAG = 'leg_sys_initialized';

export const STORES = [
    'resolutions', 'ordinances', 'sessionMinutes', 
    'sessionAgendas', 'committeeReports', 'legislators', 
    'committeeMemberships', 'terms', 'sectors', 
    'legislativeMeasures', 'documentTypes', 'documentStatuses', 
    'userAccounts', 'incomingDocuments'
];

export class LegislativeDB {
    private db: IDBDatabase | null = null;
    private serverUrl: string | null = null;

    constructor() {
        const storedUrl = localStorage.getItem('remote_server_url');
        this.serverUrl = storedUrl; // Will be null if not set, forcing offline mode initially.
    }

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const req = event.target as IDBOpenDBRequest;
                const db = req.result;
                STORES.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName, { keyPath: 'id' });
                    }
                });
            };

            request.onsuccess = async (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                const isInitialized = localStorage.getItem(INIT_FLAG);
                if (!isInitialized) {
                    console.log('[DB] First time setup: Seeding mock data...');
                    await this.seedFullSystem();
                    localStorage.setItem(INIT_FLAG, 'true');
                }
                resolve();
            };

            request.onerror = () => {
                console.error('[DB] Initialization error:', request.error);
                reject(request.error);
            };
        });
    }

    setServerUrl(url: string | null) {
        if (url !== null) { // Allow setting empty string for same-origin
            const cleanUrl = url.trim().replace(/\/$/, '');
            localStorage.setItem('remote_server_url', cleanUrl);
            this.serverUrl = cleanUrl;
        } else {
            localStorage.removeItem('remote_server_url');
            this.serverUrl = null;
        }
    }

    getServerUrl() {
        return this.serverUrl;
    }

    private async seedFullSystem() {
        await Promise.all(STORES.map(name => {
            const mockData = {
                'resolutions': MOCK_RESOLUTIONS, 'ordinances': MOCK_ORDINANCES, 
                'sessionMinutes': MOCK_SESSION_MINUTES, 'sessionAgendas': MOCK_SESSION_AGENDAS, 
                'committeeReports': MOCK_COMMITTEE_REPORTS, 'legislators': MOCK_LEGISLATORS, 
                'committeeMemberships': MOCK_COMMITTEE_MEMBERSHIPS, 'terms': MOCK_TERMS, 
                'sectors': MOCK_SECTORS, 'legislativeMeasures': MOCK_LEGISLATIVE_MEASURES, 
                'documentTypes': MOCK_DOCUMENT_TYPES, 'documentStatuses': MOCK_DOCUMENT_STATUSES, 
                'userAccounts': MOCK_USER_ACCOUNTS, 'incomingDocuments': MOCK_INCOMING_DOCUMENTS
            }[name] || [];
            return this.seedStore(name, mockData);
        }));
    }

    private async seedStore(name: string, data: any[]) {
        if (!this.db) return;
        const tx = this.db.transaction(name, 'readwrite');
        const store = tx.objectStore(name);
        data.forEach(item => store.put(item));
        return new Promise((resolve) => tx.oncomplete = resolve);
    }

    private async apiRequest(path: string, method: string = 'GET', body?: any) {
        if (this.serverUrl === null) return null;
        
        const isAppSecure = window.location.protocol === 'https:';
        const isServerInsecure = this.serverUrl.startsWith('http:');
        
        if (isAppSecure && isServerInsecure && !this.serverUrl.includes('localhost') && !this.serverUrl.includes('127.0.0.1')) {
            throw new Error('MIXED_CONTENT_BLOCK: Browsers block HTTPS to HTTP connections. Use an HTTPS server URL.');
        }

        try {
            const controller = new AbortController();
            const timeout = path.includes('export') ? 300000 : 15000;
            const id = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(`${this.serverUrl}${path}`, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
                mode: 'cors'
            });
            
            clearTimeout(id);
            
            if (!response.ok) {
                let errorDetails = response.statusText;
                try {
                    const errorJson = await response.json();
                    errorDetails = errorJson.reason || errorJson.error || errorDetails;
                } catch (e) {}
                throw new Error(`Server Error ${response.status}: ${errorDetails}`);
            }
            return await response.json();
        } catch (e: any) {
            if (e.name === 'AbortError') throw new Error('TIMEOUT: Server taking too long to respond.');
            throw e; 
        }
    }

    async getAll<T>(storeName: string): Promise<T[]> {
        if (this.serverUrl !== null) {
            try {
                const serverData = await this.apiRequest(`/api/${storeName}`);
                if (serverData) {
                    await this.seedStore(storeName, serverData);
                    return serverData;
                }
            } catch (e) {
                console.warn(`[API] Could not sync ${storeName}, using local data.`, e);
            }
        }
        return this.getAllFromLocal(storeName);
    }

    private async getAllFromLocal<T>(storeName: string): Promise<T[]> {
        return new Promise((resolve, reject) => {
            if (!this.db) return resolve([]);
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName: string, data: any): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            if (!this.db) return resolve();
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        if (this.serverUrl !== null) {
            try {
                await this.apiRequest(`/api/${storeName}`, 'POST', data);
            } catch (e) {
                console.warn("[API] Sync put failed.", e);
            }
        }
    }

    async delete(storeName: string, id: string): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            if (!this.db) return resolve();
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        if (this.serverUrl !== null) {
            try {
                await this.apiRequest(`/api/${storeName}/${id}`, 'DELETE');
            } catch (e) {
                console.warn("[API] Sync delete failed.", e);
            }
        }
    }

    async fetchFullServerBackup(): Promise<string | null> {
        if (this.serverUrl === null) return null;
        const result = await this.apiRequest('/api/system/export');
        return result ? JSON.stringify(result, null, 2) : null;
    }

    async exportLocalDatabase(): Promise<string> {
        const exportData: Record<string, any[]> = {};
        for (const storeName of STORES) {
            exportData[storeName] = await this.getAllFromLocal(storeName);
        }
        return JSON.stringify({ 
            version: "1.0-LOCAL", 
            timestamp: new Date().toISOString(), 
            data: exportData 
        }, null, 2);
    }

    async restoreFullBackup(backupJson: string): Promise<void> {
        if (!this.db) return;
        const backup = JSON.parse(backupJson);
        const data = backup.data;
        for (const storeName of STORES) {
            const tx = this.db.transaction(storeName, 'readwrite');
            tx.objectStore(storeName).clear();
            await new Promise((resolve) => tx.oncomplete = resolve);
        }
        for (const storeName of STORES) {
            const items = data[storeName] || [];
            for (const item of items) {
                await this.put(storeName, item);
            }
        }
    }

    async clearAndReset(): Promise<void> {
        if (!this.db) return;
        for (const storeName of STORES) {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.clear();
            await new Promise((resolve) => tx.oncomplete = resolve);
        }
        await this.seedFullSystem();
        localStorage.setItem(INIT_FLAG, 'true');
    }
}

export const dbService = new LegislativeDB();
