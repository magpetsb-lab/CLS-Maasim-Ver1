
import React, { useState, useEffect, useRef } from 'react';
import { dbService, SyncStatus } from '../../services/db';

interface DatabaseManagementViewProps {
    onDatabaseAction: () => void;
    onPermissionChange?: () => void;
}

interface PermissionStatus {
    camera: PermissionState | 'unknown';
    microphone: PermissionState | 'unknown';
    geolocation: PermissionState | 'unknown';
    notifications: PermissionState | 'unknown';
}

const DatabaseManagementView: React.FC<DatabaseManagementViewProps> = ({ onDatabaseAction, onPermissionChange }) => {
    const [serverUrl, setServerUrl] = useState(dbService.getServerUrl() || '');
    const [connectionStatus, setConnectionStatus] = useState<'IDLE' | 'TESTING' | 'CONNECTED' | 'FAILED'>('IDLE');
    const [diagnosticLog, setDiagnosticLog] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'config' | 'guide' | 'permissions'>('config');
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<PermissionStatus>({
        camera: 'unknown', microphone: 'unknown', geolocation: 'unknown', notifications: 'unknown'
    });
    const [isDownloading, setIsDownloading] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [queueSize, setQueueSize] = useState(0);

    const addLog = (msg: string) => {
        setDiagnosticLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
    };

    const updatePermissionStatuses = async () => {
        const status: PermissionStatus = { ...permissions };
        try {
            if ('permissions' in navigator) {
                const geo = await navigator.permissions.query({ name: 'geolocation' as any });
                status.geolocation = geo.state;
                const cam = await navigator.permissions.query({ name: 'camera' as any });
                status.camera = cam.state;
                const mic = await navigator.permissions.query({ name: 'microphone' as any });
                status.microphone = mic.state;
            }
            if ('Notification' in window) status.notifications = Notification.permission as any;
            setPermissions(status);
            if (onPermissionChange) onPermissionChange();
        } catch (e) { console.warn("Permission API not supported."); }
    };

    useEffect(() => {
        const handleStatusUpdate = (status: SyncStatus) => {
            setQueueSize(status.queueSize);
            setConnectionStatus(status.connection === 'connected' ? 'CONNECTED' : connectionStatus === 'TESTING' ? 'TESTING' : 'IDLE');
        };
        dbService.subscribe(handleStatusUpdate);
        
        const initialUrl = dbService.getServerUrl();
        if (initialUrl) {
            setServerUrl(initialUrl);
            checkConnection(initialUrl, true); // Initial quiet check
        }
        updatePermissionStatuses();
        
        return () => dbService.unsubscribe(handleStatusUpdate);
    }, []);

    const checkConnection = async (customUrl?: string, isInitialCheck = false) => {
        const urlToTest = typeof customUrl === 'string' ? customUrl.trim().replace(/\/$/, '') : serverUrl.trim().replace(/\/$/, '');
        
        // Input Validation
        if (urlToTest.startsWith('postgres://') || urlToTest.startsWith('postgresql://') || urlToTest.includes('supabase.co')) {
            setErrorDetails("DETECTED DATABASE STRING: You pasted a Database Connection String. This field requires the RAILWAY APP URL (e.g., https://myapp.up.railway.app). The database string must be set in your Railway Project Variables.");
            setConnectionStatus('FAILED');
            addLog("ERROR: Invalid URL format (DB String detected).");
            return;
        }

        setServerUrl(urlToTest);
        setConnectionStatus('TESTING');
        setErrorDetails(null);
        if (!isInitialCheck) addLog(`Initiating handshake with: ${urlToTest || 'internal API'}`);
        
        const result = await dbService.testAndSetConnection(urlToTest);

        if (result.success) {
            setConnectionStatus('CONNECTED');
            if (!isInitialCheck) addLog("SUCCESS: Cloud Synchronization Link Active.");
            onDatabaseAction();
        } else {
            setConnectionStatus('FAILED');
            setErrorDetails(result.error || "An unknown network error occurred.");
            if (!isInitialCheck) addLog(`ERROR: Connection could not be established.`);
        }
    };

    const handleDownloadCloudBackup = async () => {
        if (connectionStatus !== 'CONNECTED') {
            alert('A connection to the cloud server is required to download a backup.');
            return;
        }
        setIsDownloading(true);
        setErrorDetails(null);
        addLog('Requesting full cloud backup...');
        try {
            const backupJson = await dbService.fetchFullServerBackup();
            if (backupJson) {
                const blob = new Blob([backupJson], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cls_cloud_backup_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                addLog('SUCCESS: Cloud backup downloaded.');
            } else {
                throw new Error('Server returned an empty or invalid backup file.');
            }
        } catch (e: any) {
            setErrorDetails(`Failed to download backup: ${e.message}`);
            addLog(`ERROR: Backup download failed.`);
        } finally {
            setIsDownloading(false);
        }
    };
    
    const handleResetSystem = async () => {
        if (window.confirm('WARNING:\n\nThis action will ERASE ALL LOCAL DATA and restore the system to its initial state. This cannot be undone.\n\nAre you sure you want to proceed?')) {
            setIsResetting(true);
            setErrorDetails(null);
            addLog('Initiating local system reset...');
            try {
                await dbService.clearAndReset();
                addLog('SUCCESS: Local system has been reset to defaults.');
                onDatabaseAction();
                alert('System Reset Complete. The application will now use the initial dataset.');
            } catch (e: any) {
                setErrorDetails(`Failed to reset system: ${e.message}`);
                addLog(`ERROR: System reset failed.`);
            } finally {
                setIsResetting(false);
            }
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex bg-slate-200 p-1 rounded-2xl w-fit">
                {['config', 'guide', 'permissions'].map((t) => (
                    <button 
                        key={t}
                        onClick={() => setActiveTab(t as any)}
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {t.toUpperCase()}
                    </button>
                ))}
            </div>

            {activeTab === 'config' && (
                <>
                    {errorDetails && (
                        <div className="bg-rose-100 border-2 border-rose-300 p-6 rounded-[2rem] text-rose-800 animate-fade-in-down">
                            <div className="flex gap-4">
                                <div className="bg-rose-500 p-2 rounded-lg text-white h-fit"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
                                <div>
                                    <h4 className="font-black text-sm uppercase tracking-tight">Connectivity Alert</h4>
                                    <p className="text-xs mt-1 leading-relaxed">{errorDetails}</p>
                                    <button onClick={() => setActiveTab('guide')} className="mt-3 text-[10px] font-black uppercase text-rose-600 underline">How do I fix this?</button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={`p-8 rounded-[2rem] border-4 transition-all shadow-2xl flex flex-col gap-6 ${
                        connectionStatus === 'CONNECTED' ? 'bg-emerald-50 border-emerald-500' : 
                        connectionStatus === 'FAILED' ? 'bg-rose-50 border-rose-500' : 'bg-slate-50 border-slate-200'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className={`p-5 rounded-3xl shadow-lg ${connectionStatus === 'CONNECTED' ? 'bg-emerald-600' : connectionStatus === 'FAILED' ? 'bg-rose-600' : 'bg-brand-primary'}`}><svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></div>
                                <div className="flex-grow">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Cloud Gateway</h3>
                                    <p className="text-slate-500 font-bold text-[10px] tracking-widest uppercase">{connectionStatus === 'CONNECTED' ? 'SYNC ONLINE' : 'OFFLINE MODE'}</p>
                                </div>
                            </div>
                             <div className="text-right">
                                <p className="text-2xl font-black text-slate-800">{queueSize}</p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Pending Sync Operations</p>
                            </div>
                        </div>


                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-grow">
                                <input type="text" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl font-mono text-xs focus:border-brand-primary outline-none shadow-inner" placeholder="https://your-app-name.up.railway.app" />
                                <p className="text-[10px] text-slate-400 mt-2 px-1">
                                    <b>Note:</b> Paste your Railway Deployment URL here. Do <b>NOT</b> paste your Database connection string.
                                </p>
                            </div>
                            <button onClick={() => checkConnection()} disabled={connectionStatus === 'TESTING'} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition-all active:scale-95 shadow-lg flex-shrink-0 h-fit">{connectionStatus === 'TESTING' ? 'CONNECTING...' : 'Save & Connect'}</button>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                        <p className="text-slate-500 font-bold uppercase mb-3 tracking-widest text-[9px]">Handshake Diagnostics</p>
                        <div className="bg-slate-900 p-6 rounded-3xl text-emerald-400 font-mono text-[10px] shadow-inner border-4 border-slate-800 space-y-1.5 h-32 overflow-y-auto">{diagnosticLog.length === 0 ? <p className="text-slate-700 italic">No activity logs...</p> : diagnosticLog.map((l, i) => (<p key={i} className={l.includes('FAILED') || l.includes('ERROR') ? 'text-rose-400 font-black' : ''}>&gt;&gt; {l}</p>))}</div>
                    </div>

                    <div className="bg-white border-2 border-rose-200 rounded-[2.5rem] p-8 shadow-sm">
                        <h4 className="font-black text-rose-900 uppercase tracking-tight text-base mb-2">System Recovery & Backup</h4>
                        <p className="text-sm text-rose-800 mb-6">These are advanced operations. Use with caution.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button onClick={handleDownloadCloudBackup} disabled={isDownloading || connectionStatus !== 'CONNECTED'} className="bg-sky-600 text-white px-6 py-4 rounded-2xl font-black text-sm hover:bg-sky-700 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">{isDownloading ? 'Downloading...' : 'Download Cloud Backup'}</button>
                            <button onClick={handleResetSystem} disabled={isResetting} className="bg-rose-600 text-white px-6 py-4 rounded-2xl font-black text-sm hover:bg-rose-700 transition-all active:scale-95 shadow-lg disabled:opacity-50">{isResetting ? 'Resetting...' : 'Reset Local System'}</button>
                        </div>
                         {connectionStatus !== 'CONNECTED' && <p className="text-xs text-rose-600 font-medium text-center mt-4">Cloud backup is disabled. Please connect to the server first.</p>}
                    </div>
                </>
            )}

            {activeTab === 'guide' && (
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl space-y-10 animate-fade-in-down">
                    <div className="text-center border-b pb-8 border-slate-100">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Connection Guide</h2>
                        <p className="text-slate-500 font-medium mt-2">Connecting your Railway Backend.</p>
                    </div>
                    <div className="space-y-12">
                        <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                            <div className="flex items-center gap-4">
                                <span className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-black text-xl shadow-lg">1</span>
                                <h4 className="font-black text-slate-900 uppercase text-lg italic">Step 1: Configure Database</h4>
                            </div>
                            <div className="pl-16 space-y-3">
                                <p className="text-sm text-slate-600 leading-relaxed">Choose a database provider and link it to your Railway project.</p>
                                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-800">
                                    <li><b>Option A (Recommended): Railway Database</b><br/>In your Railway dashboard, add a new PostgreSQL service. It will automatically link variables.</li>
                                    <li><b>Option B: Neon.tech / Aiven</b><br/>Create a database on their platform, copy the Connection String, and add it to Railway Variables as <code>DATABASE_URL</code>.</li>
                                </ul>
                            </div>
                        </div>
                        <div className="space-y-4 p-6 bg-white rounded-2xl">
                            <div className="flex items-center gap-4">
                                <span className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-xl">2</span>
                                <h4 className="font-black text-slate-900 uppercase text-lg italic">Step 2: Connect Frontend to Backend</h4>
                            </div>
                            <div className="pl-16 space-y-3">
                                <p className="text-sm text-slate-600 leading-relaxed">Now tell this app where to find your Railway server.</p>
                                 <ul className="list-disc pl-5 space-y-2 text-sm text-slate-800">
                                    <li>Copy your <b>Railway App URL</b> (e.g. <code>https://cls-maasim-ver1.up.railway.app</code>).</li>
                                    <li>Paste it into the <b>Cloud Gateway</b> input field on this settings page.</li>
                                    <li>Click <b>Save & Connect</b>.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'permissions' && (
                <div className="bg-white p-8 rounded-[3rem] border border-slate-200 text-center py-20">
                     <h3 className="text-2xl font-black text-slate-900 uppercase italic">Device Permissions</h3>
                     <p className="text-slate-500 mt-2">Browser security settings for camera, microphone, etc., are handled by your operating system and browser prompts.</p>
                </div>
            )}
        </div>
    );
};

export default DatabaseManagementView;
