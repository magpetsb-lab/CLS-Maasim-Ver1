
import React, { useState, useEffect, useCallback } from 'react';
import type { UserAccount } from '../types';
import { dbService } from '../services/db';

type View = 'main' | 'settings' | 'archive' | 'reports' | 'incoming' | 'ai';

interface HeaderProps {
    currentView: View;
    onNavigate: (view: View) => void;
    currentUser: UserAccount | null;
    onLoginClick: () => void;
    onLogout: () => void;
}

const NavButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
}> = ({ label, isActive, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 uppercase tracking-tighter ${
            isActive
                ? 'bg-white text-brand-primary shadow-lg scale-105'
                : 'text-blue-100 hover:bg-white/10'
        } ${
            disabled ? 'opacity-30 cursor-not-allowed' : ''
        }`}
    >
        {label}
    </button>
);

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, currentUser, onLoginClick, onLogout }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dbStatus, setDbStatus] = useState<'connected' | 'offline'>('offline');

  const checkStatus = useCallback(async () => {
      const url = dbService.getServerUrl();
      if (url === null) {
          setDbStatus('offline');
          return;
      }
      try {
          const res = await fetch(`${url}/api/health`);
          setDbStatus(res.ok ? 'connected' : 'offline');
      } catch {
          setDbStatus('offline');
      }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    checkStatus();
    const statusTimer = setInterval(checkStatus, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(statusTimer);
    };
  }, [checkStatus]);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(currentTime);

  const formattedTime = currentTime.toLocaleTimeString('en-US');

  return (
    <header className="bg-brand-primary text-white shadow-2xl border-b-4 border-blue-400/20 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {/* Top Utility Bar */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
            <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-rose-50 animate-pulse'}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">
                        System Base: {dbStatus === 'connected' ? 'ONLINE SYNC' : 'LOCAL CACHE'}
                    </span>
                </div>
            </div>
            <div className="flex items-center space-x-6 text-xs font-medium text-white/90">
                <span className="hidden md:inline italic uppercase tracking-widest">{formattedDate}</span>
                <span className="font-mono bg-blue-950/50 px-3 py-1 rounded-md">{formattedTime}</span>
            </div>
        </div>

        {/* Main Brand Section - Official Stationary Style */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-13">
            <div className="flex items-center space-x-13">
                {/* 1.4 INCH LOGO WITHOUT WHITE CIRCLE CONTAINER */}
                <div className="flex-shrink-0">
                    <img 
                        src="https://raw.githubusercontent.com/GeloHub-ai/CLS-Maasim/main/maasim-logo.png" 
                        alt="Municipality of Maasim Seal" 
                        className="object-contain"
                        style={{ width: '1.4in', height: '1.4in' }}
                    />
                </div>

                {/* Header Text Section */}
                <div className="flex flex-col">
                    <h2 className="text-sm font-black text-blue-300 uppercase tracking-[0.3em] mb-1">
                        Municipality of Maasim
                    </h2>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter italic uppercase leading-none text-white drop-shadow-lg">
                        Computerized Legislative System
                    </h1>
                    <div className="flex items-center mt-3">
                        <div className="h-0.5 w-12 bg-blue-400 mr-3"></div>
                        <span className="text-xs font-bold text-white uppercase tracking-widest">
                            Office of the Sangguniang Bayan of Maasim
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation & Auth */}
            <div className="flex flex-col items-center lg:items-end gap-4">
                <nav className="flex items-center space-x-1 bg-blue-950/60 p-1.5 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl">
                    <NavButton label="Main" isActive={currentView === 'main'} onClick={() => onNavigate('main')} />
                    <NavButton label="Incoming" isActive={currentView === 'incoming'} onClick={() => onNavigate('incoming')} disabled={!currentUser} />
                    <NavButton label="Archive" isActive={currentView === 'archive'} onClick={() => onNavigate('archive')} disabled={!currentUser} />
                    <NavButton label="AI Assistant" isActive={currentView === 'ai'} onClick={() => onNavigate('ai')} disabled={!currentUser} />
                    <NavButton label="Reports" isActive={currentView === 'reports'} onClick={() => onNavigate('reports')} disabled={!currentUser} />
                    <NavButton label="Settings" isActive={currentView === 'settings'} onClick={() => onNavigate('settings')} disabled={!currentUser} />
                </nav>
                
                <div className="flex items-center space-x-3">
                    {currentUser ? (
                        <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl border border-white/10">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-white uppercase leading-none">{currentUser.name}</p>
                                <p className="text-[8px] font-bold text-blue-300 uppercase mt-0.5">{currentUser.role}</p>
                            </div>
                            <button onClick={onLogout} className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-lg transition-all active:scale-95 shadow-md" title="Logout">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </button>
                        </div>
                    ) : (
                        <button onClick={onLoginClick} className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95">
                            Secure Login
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;