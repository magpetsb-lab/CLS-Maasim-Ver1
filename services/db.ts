
import { 
    MOCK_RESOLUTIONS, MOCK_ORDINANCES, MOCK_SESSION_MINUTES, 
    MOCK_SESSION_AGENDAS, MOCK_COMMITTEE_REPORTS, MOCK_LEGISLATORS, 
    MOCK_COMMITTEE_MEMBERSHIPS, MOCK_TERMS, MOCK_USER_ACCOUNTS, 
    MOCK_SECTORS, MOCK_LEGISLATIVE_MEASURES, MOCK_INCOMING_DOCUMENTS, 
    MOCK_DOCUMENT_TYPES, MOCK_DOCUMENT_STATUSES 
} from '../constants';

const DB_NAME = 'LegislativeSystemDB';
const DB_VERSION = 2;
const INIT_FLAG = 'leg_sys_initialized_v2';

const ALL_STORES = [
    'resolutions', 'ordinances', 'sessionMinutes', 
    'sessionAgendas', 'committeeReports', 'legislators', 
    'committeeMemberships', 'terms', 'sectors', 
    'legislativeMeasures', 'documentTypes', 'documentStatuses', 
    'userAccounts', 'incomingDocuments', 'syncQueue'
];

const SEEDABLE_STORES = ALL_STORES.filter(s => s !== 'syncQueue');

interface SyncQueueItem {
    id: number;
    operation: 'put' | 'delete';
    storeName: string;
    payload: any;
}

export type SyncStatus = {
    connection: 'offline' | 'connected';
    queueSize: number;
};

export class LegislativeDB {
    private db: IDBDatabase | null = null;
    private serverUrl: string | null = null;
    private syncInterval: number | null = null;

    private status: SyncStatus = { connection: 'offline', queueSize: 0 };
    private listeners: ((status: SyncStatus) => void)[] = [];

    constructor() {
        const storedUrl = localStorage.getItem('remote_server_url');
        if (storedUrl) {
            this.serverUrl = storedUrl;
            this.status.connection = 'connected';
        } else {
            // Default to relative path (empty string) for both Dev (Proxy) and Prod (Vercel)
            // This ensures auto-connection without relying on build-time env variables that might fail at runtime.
            // fetch('/api/...') works relatively to the current domain.
            console.log('[DB] Defaulting to relative API paths.');
            this.serverUrl = ''; 
            this.status.connection = 'connected';
        }
    }

    public subscribe(listener: (status: SyncStatus) => void) {
        this.listeners.push(listener);
        listener(this.status);
    }

    public unsubscribe(listener: (status: SyncStatus) => void) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener(this.status));
    }

    private setStatus(newStatus: Partial<SyncStatus>) {
        this.status = { ...this.status, ...newStatus };
        this.notifyListeners();
    }

    public getStatus(): SyncStatus {
        return this.status;
    }

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const req = event.target as IDBOpenDBRequest;
                const db = req.result;
                ALL_STORES.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const keyPath = storeName === 'syncQueue' ? { autoIncrement: true, keyPath: 'id' } : { keyPath: 'id' };
                        db.createObjectStore(storeName, keyPath);
                    }
                });
            };

            request.onsuccess = async (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                const queueTx = this.db.transaction('syncQueue', 'readonly');
                const queueCountReq = queueTx.objectStore('syncQueue').count();
                queueCountReq.onsuccess = () => this.setStatus({ queueSize: queueCountReq.result });

                const isInitialized = localStorage.getItem(INIT_FLAG);
                if (!isInitialized) {
                    console.log('[DB] First time setup (v2): Seeding mock data...');
                    await this.seedFullSystem();
                    localStorage.setItem(INIT_FLAG, 'true');
                }
                
                this.startSyncProcessor();
                resolve();
            };

            request.onerror = () => {
                console.error('[DB] Initialization error:', request.error);
                reject(request.error);
            };
        });
    }
    
    async testAndSetConnection(url: string): Promise<{ success: boolean; error?: string }> {
        const cleanUrl = url.trim().replace(/\/$/, '');
        try {
            await this.apiRequest('/api/health', 'GET', undefined, cleanUrl);
            this.setServerUrl(cleanUrl);
            this.processSyncQueue();
            return { success: true };
        } catch (e: any) {
            // Do not reset URL if we are using relative path default, unless explicit failure
            if (url !== '') this.setServerUrl(null); 
            return { success: false, error: e.message };
        }
    }

    setServerUrl(url: string | null) {
        if (url !== null) {
            localStorage.setItem('remote_server_url', url);
            this.serverUrl = url;
            this.setStatus({ connection: 'connected' });
        } else {
            localStorage.removeItem('remote_server_url');
            this.serverUrl = null;
            this.setStatus({ connection: 'offline' });
        }
    }

    getServerUrl() {
        return this.serverUrl;
    }

    private async seedFullSystem() {
        await Promise.all(SEEDABLE_STORES.map(name => {
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

    private async apiRequest(path: string, method: string = 'GET', body?: any, testUrl?: string) {
        const url = testUrl !== undefined ? testUrl : this.serverUrl;
        
        // Allow empty string for relative paths
        if (url === null) {
            this.setStatus({ connection: 'offline' });
            throw new Error('OFFLINE: No server URL configured.');
        }
        
        const isAppSecure = window.location.protocol === 'https:';
        // Only check mixed content if url is absolute (starts with http)
        const isServerInsecure = url.startsWith('http:');
        
        if (isAppSecure && isServerInsecure && !url.includes('localhost') && !url.includes('127.0.0.1')) {
            throw new Error('MIXED_CONTENT_BLOCK: Browsers block HTTPS to HTTP connections. Use an HTTPS server URL.');
        }

        try {
            const controller = new AbortController();
            const timeout = path.includes('export') ? 300000 : 15000;
            const id = setTimeout(() => controller.abort(), timeout);
            
            // If url is empty string, fetch('/api/...') works relatively
            const response = await fetch(`${url}${path}`, {
                method,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
                mode: 'cors'
            });
            
            clearTimeout(id);
            
            if (!response.ok) {
                let errorDetails = response.statusText;
                try { errorDetails = (await response.json()).reason || errorDetails; } catch (e) {}
                throw new Error(`Server Error ${response.status}: ${errorDetails}`);
            }
            this.setStatus({ connection: 'connected' });
            return response.status === 204 ? {} : await response.json();
        } catch (e: any) {
            this.setStatus({ connection: 'offline' });
            if (e.name === 'AbortError') throw new Error('TIMEOUT: Server taking too long to respond.');
            throw e; 
        }
    }

    private async addToSyncQueue(item: Omit<SyncQueueItem, 'id'>) {
        return new Promise<void>((resolve, reject) => {
            if (!this.db) return reject('DB not initialized');
            const tx = this.db.transaction('syncQueue', 'readwrite');
            const store = tx.objectStore('syncQueue');
            const request = store.add(item);
            request.onsuccess = () => {
                this.setStatus({ queueSize: this.status.queueSize + 1 });
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    private startSyncProcessor() {
        if (this.syncInterval) clearInterval(this.syncInterval);
        this.processSyncQueue(); 
        this.syncInterval = window.setInterval(() => this.processSyncQueue(), 30000);
    }

    async processSyncQueue(): Promise<void> {
        if (this.serverUrl === null || !this.db) return;

        const tx = this.db.transaction('syncQueue', 'readwrite');
        const store = tx.objectStore('syncQueue');
        const items = await new Promise<SyncQueueItem[]>((resolve) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result as SyncQueueItem[]);
            req.onerror = () => resolve([]);
        });
        
        if (items.length !== this.status.queueSize) {
            this.setStatus({ queueSize: items.length });
        }
        if (items.length === 0) return;
        
        console.log(`[SYNC] Processing ${items.length} queued operations.`);

        for (const item of items) {
            try {
                if (item.operation === 'put') {
                    await this.apiRequest(`/api/${item.storeName}`, 'POST', item.payload);
                } else if (item.operation === 'delete') {
                    await this.apiRequest(`/api/${item.storeName}/${item.payload.id}`, 'DELETE');
                }
                store.delete(item.id);
                this.setStatus({ queueSize: this.status.queueSize - 1 });
            } catch (e) {
                console.warn(`[SYNC] Failed to process queue item ${item.id}. Will retry later.`, e);
                break;
            }
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
            if (!this.db) return reject('DB not initialized');
            const tx = this.db.transaction(storeName, 'readwrite');
            tx.objectStore(storeName).put(data);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });

        if (this.serverUrl !== null) {
            try {
                await this.apiRequest(`/api/${storeName}`, 'POST', data);
            } catch (e) {
                await this.addToSyncQueue({ operation: 'put', storeName, payload: data });
            }
        } else {
            await this.addToSyncQueue({ operation: 'put', storeName, payload: data });
        }
    }

    async delete(storeName: string, id: string): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            if (!this.db) return reject('DB not initialized');
            const tx = this.db.transaction(storeName, 'readwrite');
            tx.objectStore(storeName).delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });

        if (this.serverUrl !== null) {
            try {
                await this.apiRequest(`/api/${storeName}/${id}`, 'DELETE');
            } catch (e) {
                await this.addToSyncQueue({ operation: 'delete', storeName, payload: { id } });
            }
        } else {
            await this.addToSyncQueue({ operation: 'delete', storeName, payload: { id } });
        }
    }

    async fetchFullServerBackup(): Promise<string | null> {
        if (this.serverUrl === null) return null;
        const result = await this.apiRequest('/api/system/export');
        return result ? JSON.stringify(result, null, 2) : null;
    }

    async exportLocalDatabase(): Promise<string> {
        const exportData: Record<string, any[]> = {};
        for (const storeName of SEEDABLE_STORES) {
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
        for (const storeName of ALL_STORES) {
            const tx = this.db.transaction(storeName, 'readwrite');
            tx.objectStore(storeName).clear();
            await new Promise((resolve) => tx.oncomplete = resolve);
        }
        for (const storeName of SEEDABLE_STORES) {
            const items = data[storeName] || [];
            for (const item of items) {
                await this.put(storeName, item);
            }
        }
    }

    async clearAndReset(): Promise<void> {
        if (!this.db) return;
        for (const storeName of ALL_STORES) {
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
