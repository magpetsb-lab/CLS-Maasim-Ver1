
import React, { useState, useMemo, useEffect } from 'react';
import type { Ordinance, Resolution, SessionMinute, SessionAgenda, CommitteeReport, CommitteeMembership, Legislator, Term, Sector, UserRole } from '../../types';
import OrdinanceView from './OrdinanceView';
import ResolutionView from './ResolutionView';
import SearchBar from '../SearchBar';
import SessionMinuteView from './SessionMinuteView';
import SessionAgendaView from './SessionAgendaView';
import CommitteeReportView from './CommitteeReportView';
import TranscribedMinutesView from './TranscribedMinutesView';
import { DraftForCreation } from '../../App';

interface ArchiveViewProps {
    currentUserRole: UserRole;
    draftForCreation: DraftForCreation | null;
    onDraftConsumed: () => void;
    resolutions: Resolution[];
    onAddResolution: (res: Omit<Resolution, 'id'>) => void;
    onUpdateResolution: (res: Resolution) => void;
    onDeleteResolution: (id: string) => void;
    ordinances: Ordinance[];
    onAddOrdinance: (ord: Omit<Ordinance, 'id'>) => void;
    onUpdateOrdinance: (ord: Ordinance) => void;
    onDeleteOrdinance: (id: string) => void;
    sessionMinutes: SessionMinute[];
    onAddSessionMinute: (minute: Omit<SessionMinute, 'id'>) => void;
    onUpdateSessionMinute: (minute: SessionMinute) => void;
    onDeleteSessionMinute: (id: string) => void;
    sessionAgendas: SessionAgenda[];
    onAddSessionAgenda: (agenda: Omit<SessionAgenda, 'id'>) => void;
    onUpdateSessionAgenda: (agenda: SessionAgenda) => void;
    onDeleteSessionAgenda: (id: string) => void;
    committeeReports: CommitteeReport[];
    onAddCommitteeReport: (report: Omit<CommitteeReport, 'id'>) => void;
    onUpdateCommitteeReport: (report: CommitteeReport) => void;
    onDeleteCommitteeReport: (id: string) => void;
    committeeMemberships: CommitteeMembership[];
    legislators: Legislator[];
    terms: Term[];
    sectors: Sector[];
}

type ArchiveTab = 'resolutions' | 'ordinances' | 'minutes' | 'transcribed' | 'agendas' | 'reports';

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap
            ${isActive
                ? 'border-brand-secondary text-brand-primary'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
    >
        {label}
    </button>
);


const ArchiveView: React.FC<ArchiveViewProps> = (props) => {
    const [activeTab, setActiveTab] = useState<ArchiveTab>('resolutions');
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        if (props.draftForCreation) {
          if (props.draftForCreation.type === 'resolution') {
            setActiveTab('resolutions');
          } else if (props.draftForCreation.type === 'ordinance') {
            setActiveTab('ordinances');
          }
        }
      }, [props.draftForCreation]);

    const canDelete = props.currentUserRole === 'admin';

    const searchSuggestions = useMemo(() => {
        let items: string[] = [];
        switch(activeTab) {
            case 'resolutions':
                items = props.resolutions.flatMap(r => [r.resolutionTitle, r.resolutionNumber, r.author, r.committee]);
                break;
            case 'ordinances':
                items = props.ordinances.flatMap(o => [o.ordinanceTitle, o.ordinanceNumber, o.author, o.committee]);
                break;
            case 'minutes':
            case 'transcribed':
                items = props.sessionMinutes.map(m => m.sessionNumber);
                break;
            case 'agendas':
                items = props.sessionAgendas.map(a => a.seriesNumber);
                break;
            case 'reports':
                items = props.committeeReports.flatMap(c => [c.reportNumber, c.committee]);
                break;
        }
        return Array.from(new Set(items.filter(Boolean))).sort();
    }, [activeTab, props.resolutions, props.ordinances, props.sessionMinutes, props.sessionAgendas, props.committeeReports]);

    const filteredResolutions = useMemo(() => {
        if (!searchQuery) return props.resolutions;
        const lowercasedQuery = searchQuery.toLowerCase();
        return props.resolutions.filter(res =>
            res.resolutionTitle.toLowerCase().includes(lowercasedQuery) ||
            res.resolutionNumber.toLowerCase().includes(lowercasedQuery) ||
            res.author.toLowerCase().includes(lowercasedQuery) ||
            res.committee.toLowerCase().includes(lowercasedQuery) ||
            res.sector.toLowerCase().includes(lowercasedQuery)
        );
    }, [searchQuery, props.resolutions]);

    const filteredOrdinances = useMemo(() => {
        if (!searchQuery) return props.ordinances;
        const lowercasedQuery = searchQuery.toLowerCase();
        return props.ordinances.filter(ord =>
            ord.ordinanceTitle.toLowerCase().includes(lowercasedQuery) ||
            ord.ordinanceNumber.toLowerCase().includes(lowercasedQuery) ||
            ord.author.toLowerCase().includes(lowercasedQuery) ||
            ord.committee.toLowerCase().includes(lowercasedQuery)
        );
    }, [searchQuery, props.ordinances]);

    const filteredSessionMinutes = useMemo(() => {
        if (!searchQuery) return props.sessionMinutes;
        const lowercasedQuery = searchQuery.toLowerCase();
        return props.sessionMinutes.filter(minute =>
            minute.sessionNumber.toLowerCase().includes(lowercasedQuery) ||
            minute.sessionDate.toLowerCase().includes(lowercasedQuery) ||
            minute.sessionType.toLowerCase().includes(lowercasedQuery) ||
            (minute.minutesContent && minute.minutesContent.toLowerCase().includes(lowercasedQuery))
        );
    }, [searchQuery, props.sessionMinutes]);

    const filteredSessionAgendas = useMemo(() => {
        if (!searchQuery) return props.sessionAgendas;
        const lowercasedQuery = searchQuery.toLowerCase();
        return props.sessionAgendas.filter(agenda =>
            agenda.seriesNumber.toLowerCase().includes(lowercasedQuery) ||
            agenda.sessionDate.toLowerCase().includes(lowercasedQuery) ||
            agenda.sessionType.toLowerCase().includes(lowercasedQuery)
        );
    }, [searchQuery, props.sessionAgendas]);

    const filteredCommitteeReports = useMemo(() => {
        if (!searchQuery) return props.committeeReports;
        const lowercasedQuery = searchQuery.toLowerCase();
        return props.committeeReports.filter(report =>
            report.reportNumber.toLowerCase().includes(lowercasedQuery) ||
            report.committee.toLowerCase().includes(lowercasedQuery) ||
            report.committeeType.toLowerCase().includes(lowercasedQuery)
        );
    }, [searchQuery, props.committeeReports]);

    const getSearchPlaceholder = () => {
        switch(activeTab) {
            case 'resolutions':
                return 'Search resolutions...';
            case 'ordinances':
                return 'Search ordinances...';
            case 'minutes':
                return 'Search minutes...';
            case 'transcribed':
                return 'Search transcribed content...';
            case 'agendas':
                return 'Search agendas...';
            case 'reports':
                return 'Search reports...';
            default:
                return 'Search...';
        }
    };


    return (
        <div>
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-primary mb-1">Archive Section</h2>
                        <p className="text-slate-600">
                            Manage your approved resolutions, ordinances, session minutes, agenda, and committee reports.
                        </p>
                    </div>
                    <div className="w-full sm:w-72 flex-shrink-0">
                         <SearchBar 
                            query={searchQuery}
                            onQueryChange={setSearchQuery}
                            placeholder={getSearchPlaceholder()}
                            suggestions={searchSuggestions}
                        />
                    </div>
                </div>

                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-4 overflow-x-auto">
                        <TabButton label="Approved Resolutions" isActive={activeTab === 'resolutions'} onClick={() => setActiveTab('resolutions')} />
                        <TabButton label="Approved Ordinances" isActive={activeTab === 'ordinances'} onClick={() => setActiveTab('ordinances')} />
                        <TabButton label="Minutes of the Session" isActive={activeTab === 'minutes'} onClick={() => setActiveTab('minutes')} />
                        <TabButton label="Transcribed Minutes/Journal" isActive={activeTab === 'transcribed'} onClick={() => setActiveTab('transcribed')} />
                        <TabButton label="Session Agenda" isActive={activeTab === 'agendas'} onClick={() => setActiveTab('agendas')} />
                        <TabButton label="Committee Reports" isActive={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
                    </nav>
                </div>
                
                <div className="mt-6">
                    {activeTab === 'resolutions' && (
                         <ResolutionView
                            resolutions={filteredResolutions}
                            draftData={props.draftForCreation?.type === 'resolution' ? props.draftForCreation.data : null}
                            onDraftConsumed={props.onDraftConsumed}
                            onAddResolution={props.onAddResolution}
                            onUpdateResolution={props.onUpdateResolution}
                            onDeleteResolution={props.onDeleteResolution}
                            legislators={props.legislators}
                            committeeMemberships={props.committeeMemberships}
                            terms={props.terms}
                            sectors={props.sectors}
                            canDelete={canDelete}
                        />
                    )}
                    {activeTab === 'ordinances' && (
                         <OrdinanceView
                            ordinances={filteredOrdinances}
                            draftData={props.draftForCreation?.type === 'ordinance' ? props.draftForCreation.data : null}
                            onDraftConsumed={props.onDraftConsumed}
                            onAddOrdinance={props.onAddOrdinance}
                            onUpdateOrdinance={props.onUpdateOrdinance}
                            onDeleteOrdinance={props.onDeleteOrdinance}
                            legislators={props.legislators}
                            committeeMemberships={props.committeeMemberships}
                            terms={props.terms}
                            sectors={props.sectors}
                            canDelete={canDelete}
                        />
                    )}
                    {activeTab === 'minutes' && (
                         <SessionMinuteView
                            sessionMinutes={filteredSessionMinutes}
                            onAddSessionMinute={props.onAddSessionMinute}
                            onUpdateSessionMinute={props.onUpdateSessionMinute}
                            onDeleteSessionMinute={props.onDeleteSessionMinute}
                            terms={props.terms}
                            legislators={props.legislators}
                            canDelete={canDelete}
                        />
                    )}
                    {activeTab === 'transcribed' && (
                         <TranscribedMinutesView
                            sessionMinutes={filteredSessionMinutes}
                            onUpdateSessionMinute={props.onUpdateSessionMinute}
                            onAddSessionMinute={props.onAddSessionMinute}
                            onDeleteSessionMinute={props.onDeleteSessionMinute}
                            terms={props.terms}
                            canDelete={canDelete}
                        />
                    )}
                    {activeTab === 'agendas' && (
                         <SessionAgendaView
                            sessionAgendas={filteredSessionAgendas}
                            onAddSessionAgenda={props.onAddSessionAgenda}
                            onUpdateSessionAgenda={props.onUpdateSessionAgenda}
                            onDeleteSessionAgenda={props.onDeleteSessionAgenda}
                            terms={props.terms}
                            canDelete={canDelete}
                        />
                    )}
                    {activeTab === 'reports' && (
                         <CommitteeReportView
                            committeeReports={filteredCommitteeReports}
                            onAddCommitteeReport={props.onAddCommitteeReport}
                            onUpdateCommitteeReport={props.onUpdateCommitteeReport}
                            onDeleteCommitteeReport={props.onDeleteCommitteeReport}
                            committeeMemberships={props.committeeMemberships}
                            terms={props.terms}
                            legislators={props.legislators}
                            canDelete={canDelete}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ArchiveView;
