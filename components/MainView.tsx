
import React, { useState, useMemo, useEffect } from 'react';
import type { Resolution, Ordinance, IncomingDocument, Legislator } from '../types';
import SearchBar from './SearchBar';
import SearchResultCard from './SearchResultCard';
import { dbService } from '../services/db';

interface MainViewProps {
    resolutions: Resolution[];
    ordinances: Ordinance[];
    incomingDocuments: IncomingDocument[];
    legislators: Legislator[];
    onNavigateToSettings: () => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className={`bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-5 transition-all hover:shadow-md hover:border-slate-300`}>
        <div className={`p-4 rounded-2xl ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-3xl font-black text-slate-800">{value}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        </div>
    </div>
);

const MainView: React.FC<MainViewProps> = ({ resolutions, ordinances, incomingDocuments, legislators, onNavigateToSettings }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFilters, setSearchFilters] = useState({ resolutions: true, ordinances: true });
    const [showScanner, setShowScanner] = useState(false);
    const [scanInput, setScanInput] = useState('');
    const [isLinked, setIsLinked] = useState(true);

    useEffect(() => {
        setIsLinked(!!dbService.getServerUrl());
    }, []);

    const incomingThisWeek = useMemo(() => {
        const today = new Date();
        const oneWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
        return (incomingDocuments || []).filter(doc => {
            if (!doc.dateReceived) return false;
            const receivedDate = new Date(doc.dateReceived);
            return receivedDate >= oneWeekAgo && receivedDate <= today;
        }).length;
    }, [incomingDocuments]);

    const handleFilterChange = (filter: 'resolutions' | 'ordinances') => {
        setSearchFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
    };

    const handleQrKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const text = scanInput.trim();
            if (!text) return;
            setSearchQuery(text.includes('|') ? text.split('|')[1].trim() : text);
            setShowScanner(false);
            setScanInput('');
        }
    };

    const allDocuments = useMemo(() => {
        const resList = resolutions.map(res => ({
            id: res.id, type: 'Resolution' as const, title: res.resolutionTitle, number: res.resolutionNumber, date: res.dateApproved,
            searchText: `${res.resolutionTitle} ${res.resolutionNumber} ${res.author}`.toLowerCase(),
            filePath: res.filePath,
        }));
        const ordList = ordinances.map(ord => ({
            id: ord.id, type: 'Ordinance' as const, title: ord.ordinanceTitle, number: ord.ordinanceNumber, date: ord.dateApproved,
            searchText: `${ord.ordinanceTitle} ${ord.ordinanceNumber} ${ord.author}`.toLowerCase(),
            filePath: ord.filePath,
        }));
        return [...resList, ...ordList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [resolutions, ordinances]);

    const filteredDocuments = useMemo(() => {
        return allDocuments.filter(doc => {
            const typeMatch = (searchFilters.resolutions && doc.type === 'Resolution') || (searchFilters.ordinances && doc.type === 'Ordinance');
            if (!typeMatch) return false;
            return !searchQuery || doc.searchText.includes(searchQuery.toLowerCase());
        });
    }, [searchQuery, allDocuments, searchFilters]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard 
                    title="Resolutions" 
                    value={resolutions.length} 
                    color="bg-blue-100 text-blue-600"
                    icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} 
                />
                <StatCard 
                    title="Ordinances" 
                    value={ordinances.length}
                    color="bg-green-100 text-green-600"
                    icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} 
                />
                <StatCard 
                    title="Incoming (Week)" 
                    value={incomingThisWeek}
                    color="bg-yellow-100 text-yellow-600"
                    icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" /></svg>} 
                />
                <StatCard 
                    title="Legislators" 
                    value={legislators.length}
                    color="bg-indigo-100 text-indigo-600"
                    icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                />
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-md relative overflow-hidden">
                {/* Decorative blob */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-light rounded-full blur-3xl opacity-50"></div>

                {showScanner && (
                    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <div className="bg-white rounded-[3rem] p-10 w-full max-w-lg shadow-2xl border-4 border-white">
                            <div className="text-center mb-8">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-secondary mb-2">Legislative Archive</p>
                                <h3 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Document Scan</h3>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 shadow-inner mb-6">
                                <input
                                    type="text" autoFocus value={scanInput}
                                    onChange={(e) => setScanInput(e.target.value)}
                                    onKeyDown={handleQrKeyDown}
                                    placeholder="Ready to receive code..."
                                    className="w-full bg-transparent outline-none text-center text-2xl font-black text-brand-primary placeholder-slate-300"
                                />
                            </div>
                            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-10">Waiting for Handheld QR Scanner Input...</p>
                            <button onClick={() => setShowScanner(false)} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl uppercase font-black text-xs tracking-widest hover:bg-slate-200 transition-all active:scale-95">Cancel Operation</button>
                        </div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Database</h2>
                        <div className="flex items-center gap-3 mt-2">
                            <p className="text-slate-500 text-sm font-medium">Search and manage approved legislative records.</p>
                            <span className="bg-slate-100 text-slate-400 text-[10px] px-2 py-0.5 rounded font-mono">v1.4.7</span>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="flex-grow md:w-96">
                            <SearchBar query={searchQuery} onQueryChange={setSearchQuery} placeholder="Quick search titles, authors or numbers..." />
                        </div>
                        <button onClick={() => setShowScanner(true)} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 group">
                            <svg className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                        </button>
                    </div>
                </div>
                
                <div className="flex items-center space-x-8 mb-10 pb-6 border-b border-slate-100">
                    <p className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">Filter View:</p>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={searchFilters.resolutions} onChange={() => handleFilterChange('resolutions')} className="w-5 h-5 rounded border-slate-300 text-brand-secondary focus:ring-brand-secondary" />
                        <span className="text-sm font-black uppercase text-slate-600 group-hover:text-brand-primary transition-colors">Resolutions</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={searchFilters.ordinances} onChange={() => handleFilterChange('ordinances')} className="w-5 h-5 rounded border-slate-300 text-brand-secondary focus:ring-brand-secondary" />
                        <span className="text-sm font-black uppercase text-slate-600 group-hover:text-brand-primary transition-colors">Ordinances</span>
                    </label>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {filteredDocuments.length > 0 ? filteredDocuments.map(doc => <SearchResultCard key={doc.id} result={doc} />) : (
                        <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100">
                            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <svg className="h-8 w-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <p className="text-slate-400 font-black italic uppercase text-xs tracking-widest">No matching records detected.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MainView;
