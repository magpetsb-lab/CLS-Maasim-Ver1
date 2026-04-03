import React, { useState, useEffect } from 'react';
import { UserRole } from '../../types';

interface SystemSettingsViewProps {
    currentUserRole: UserRole;
}

const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({ currentUserRole }) => {
    const [kioskEnabled, setKioskEnabled] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('kiosk_enabled');
        if (stored !== null) {
            setKioskEnabled(stored === 'true');
        }
    }, []);

    const handleToggleKiosk = () => {
        const newValue = !kioskEnabled;
        setKioskEnabled(newValue);
        localStorage.setItem('kiosk_enabled', String(newValue));
        // Dispatch a custom event so the Header can update immediately
        window.dispatchEvent(new Event('kiosk_settings_changed'));
    };

    if (currentUserRole !== 'developer') {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 text-center">
                <svg className="w-16 h-16 text-rose-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-2">Access Denied</h3>
                <p className="text-slate-500">Only Developer accounts can access system settings.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
            <div className="mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-1">System Settings</h3>
                <p className="text-sm text-slate-500">Configure core system features and modules.</p>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                        <h4 className="text-lg font-bold text-slate-800">Legislative Inquiry Kiosk</h4>
                        <p className="text-sm text-slate-500 mt-1">Enable or disable the public-facing Kiosk mode in the main navigation.</p>
                    </div>
                    <button
                        onClick={handleToggleKiosk}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${kioskEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${kioskEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SystemSettingsView;
