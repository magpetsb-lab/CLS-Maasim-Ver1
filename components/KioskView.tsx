import React, { useState, useMemo, useRef } from 'react';
import type { Resolution, Ordinance } from '../types';
import SearchResultCard from './SearchResultCard';

interface KioskViewProps {
    resolutions: Resolution[];
    ordinances: Ordinance[];
    onExit: () => void;
}

const VirtualKeyboard: React.FC<{
    onKeyPress: (key: string) => void;
    onBackspace: () => void;
    onClear: () => void;
    onClose: () => void;
}> = ({ onKeyPress, onBackspace, onClear, onClose }) => {
    const rows = [
        ['1','2','3','4','5','6','7','8','9','0'],
        ['Q','W','E','R','T','Y','U','I','O','P'],
        ['A','S','D','F','G','H','J','K','L'],
        ['Z','X','C','V','B','N','M']
    ];
    return (
        <div className="bg-slate-200 p-4 sm:p-6 rounded-[2rem] shadow-2xl border-4 border-white mt-6 select-none">
            <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-sm font-black text-slate-500 uppercase tracking-widest">Touch Keyboard</span>
                <button onClick={onClose} className="bg-slate-300 text-slate-700 px-8 py-4 rounded-2xl font-black uppercase tracking-wider active:bg-slate-400 active:scale-95 transition-all">Close</button>
            </div>
            <div className="flex flex-col gap-3">
                {rows.map((row, i) => (
                    <div key={i} className="flex justify-center gap-2 sm:gap-3">
                        {row.map(key => (
                            <button 
                                key={key} 
                                onClick={() => onKeyPress(key)} 
                                onMouseDown={(e) => e.preventDefault()}
                                className="bg-white text-slate-800 text-2xl sm:text-4xl font-black py-5 px-6 sm:px-8 rounded-2xl shadow-sm active:bg-brand-primary active:text-white active:scale-95 transition-all"
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                ))}
                <div className="flex justify-center gap-3 mt-2">
                    <button onClick={onClear} onMouseDown={(e) => e.preventDefault()} className="bg-rose-100 text-rose-700 text-xl sm:text-2xl font-black py-5 px-8 sm:px-12 rounded-2xl shadow-sm active:bg-rose-500 active:text-white active:scale-95 transition-all">CLEAR</button>
                    <button onClick={() => onKeyPress(' ')} onMouseDown={(e) => e.preventDefault()} className="bg-white text-slate-800 text-xl sm:text-2xl font-black py-5 px-16 sm:px-32 rounded-2xl shadow-sm active:bg-brand-primary active:text-white active:scale-95 transition-all">SPACE</button>
                    <button onClick={onBackspace} onMouseDown={(e) => e.preventDefault()} className="bg-slate-300 text-slate-800 text-xl sm:text-2xl font-black py-5 px-8 sm:px-12 rounded-2xl shadow-sm active:bg-slate-500 active:text-white active:scale-95 transition-all">BACKSPACE</button>
                </div>
            </div>
        </div>
    );
};

const KioskView: React.FC<KioskViewProps> = ({ resolutions, ordinances, onExit }) => {
    const [recordType, setRecordType] = useState<'resolutions' | 'ordinances'>('resolutions');
    const [searchQuery, setSearchQuery] = useState('');
    const [showKeyboard, setShowKeyboard] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const filteredDocuments = useMemo(() => {
        const rawQuery = searchQuery.toLowerCase().trim();
        const searchTerms = rawQuery.split(/\s+/).filter(term => term.length > 0);
        
        let docs = [];
        if (recordType === 'resolutions') {
            docs = resolutions.map(res => ({
                id: res.id, type: 'Resolution' as const, title: res.resolutionTitle, number: res.resolutionNumber, date: res.dateApproved,
                searchText: `${res.resolutionTitle} ${res.resolutionNumber} ${res.author} ${res.committee || ''} ${res.sector || ''} ${res.term || ''} ${res.dateApproved || ''}`.toLowerCase(),
                filePath: res.filePath,
                attachments: res.attachments,
                term: res.term,
            }));
        } else {
            docs = ordinances.map(ord => ({
                id: ord.id, type: 'Ordinance' as const, title: ord.ordinanceTitle, number: ord.ordinanceNumber, date: ord.dateApproved,
                searchText: `${ord.ordinanceTitle} ${ord.ordinanceNumber} ${ord.author} ${ord.committee || ''} ${ord.sector || ''} ${ord.term || ''} ${ord.dateApproved || ''}`.toLowerCase(),
                filePath: ord.filePath,
                attachments: ord.attachments,
                term: ord.term,
            }));
        }

        if (searchTerms.length === 0) {
            return docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        // Calculate relevance score for each document
        const scoredDocs = docs.map(doc => {
            let score = 0;
            
            // Exact phrase match gets highest score
            if (doc.searchText.includes(rawQuery)) {
                score += 100;
            }

            // Add points for each individual term matched
            const matchedTerms = searchTerms.filter(term => doc.searchText.includes(term));
            score += matchedTerms.length * 10;

            // Bonus if ALL terms matched (AND logic)
            if (matchedTerms.length === searchTerms.length && searchTerms.length > 1) {
                score += 50;
            }

            return { ...doc, score };
        });

        // Filter out docs with 0 score, then sort by score (descending), then by date (descending)
        return scoredDocs
            .filter(doc => doc.score > 0)
            .sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
    }, [searchQuery, recordType, resolutions, ordinances]);

    const handleKeyPress = (key: string) => {
        setSearchQuery(prev => prev + key);
    };

    const handleBackspace = () => {
        setSearchQuery(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        setSearchQuery('');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Kiosk Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 shadow-2xl flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-6">
                    <img src="/maasim-logo.png" alt="Municipality of Maasim Seal" className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-lg" />
                    <div className="flex flex-col">
                        <p className="text-blue-300 text-xs sm:text-sm font-bold uppercase tracking-widest mb-1">Computerized Legislative Tracking System</p>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tighter italic uppercase leading-none text-white drop-shadow-lg mb-2">
                            Legislative Inquiry Kiosk
                        </h1>
                        <div className="flex items-center">
                            <div className="h-0.5 w-8 sm:w-12 bg-blue-500 mr-3"></div>
                            <span className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-widest">
                                Office of the Sangguniang Bayan, Maasim, Province of Saranggani
                            </span>
                        </div>
                    </div>
                </div>
                <button onClick={onExit} className="text-slate-500 hover:text-white transition-colors p-4" title="Exit Kiosk Mode">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
            </div>

            {/* Kiosk Content */}
            <div className="flex-grow p-6 sm:p-8 max-w-6xl mx-auto w-full flex flex-col">
                <div className="mb-6">
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                        <svg className="w-8 h-8 text-brand-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Legislative Records
                    </h3>
                </div>
                <div className="flex gap-4 sm:gap-6 mb-8">
                    <button 
                        onClick={() => { setRecordType('resolutions'); setSearchQuery(''); setShowKeyboard(false); }}
                        className={`flex-1 py-6 sm:py-8 rounded-[2rem] text-2xl sm:text-3xl font-black uppercase tracking-widest transition-all active:scale-95 ${recordType === 'resolutions' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-slate-100 text-slate-400'}`}
                    >
                        Resolutions
                    </button>
                    <button 
                        onClick={() => { setRecordType('ordinances'); setSearchQuery(''); setShowKeyboard(false); }}
                        className={`flex-1 py-6 sm:py-8 rounded-[2rem] text-2xl sm:text-3xl font-black uppercase tracking-widest transition-all active:scale-95 ${recordType === 'ordinances' ? 'bg-green-600 text-white shadow-xl shadow-green-600/20' : 'bg-slate-100 text-slate-400'}`}
                    >
                        Ordinances
                    </button>
                </div>

                <div className="relative mb-8">
                    <div 
                        className={`flex items-center w-full bg-slate-50 border-4 rounded-[2.5rem] py-6 px-8 cursor-text transition-colors ${showKeyboard ? 'border-brand-primary bg-white shadow-inner' : 'border-slate-200'}`}
                        onClick={() => {
                            setShowKeyboard(true);
                            searchInputRef.current?.focus();
                        }}
                    >
                        <svg className="w-10 h-10 text-slate-400 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input 
                            ref={searchInputRef}
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            inputMode="none"
                            placeholder={`Tap here to search ${recordType}...`} 
                            className="w-full bg-transparent text-3xl sm:text-4xl font-bold text-slate-800 placeholder-slate-300 focus:outline-none"
                        />
                        {searchQuery && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleClear(); }}
                                className="ml-4 bg-slate-200 text-slate-600 p-4 rounded-full active:bg-slate-300 active:scale-95 transition-all"
                            >
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>
                    
                    {showKeyboard && (
                        <div className="sticky top-32 z-50 mb-8">
                            <VirtualKeyboard 
                                onKeyPress={handleKeyPress}
                                onBackspace={handleBackspace}
                                onClear={handleClear}
                                onClose={() => setShowKeyboard(false)}
                            />
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <div className="grid grid-cols-1 gap-4 pb-10">
                        {filteredDocuments.length > 0 ? filteredDocuments.map(doc => (
                            <div key={doc.id} className="transform transition-all active:scale-[0.98]">
                                <SearchResultCard result={doc} />
                            </div>
                        )) : (
                            <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200">
                                <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p className="text-slate-400 font-black uppercase text-xl tracking-widest">No records found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KioskView;
