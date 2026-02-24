
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import LegislativeView from './components/LegislativeView';
import ArchiveView from './components/archive/ArchiveView';
import MainView from './components/MainView';
import ReportsView from './components/reports/ReportsView';
import IncomingDocumentView from './components/incoming/IncomingDocumentView';
import AIAssistantView from './components/ai/AIAssistantView';
import Notification from './components/Notification';
import LoginModal from './components/LoginModal';
import Spinner from './components/Spinner';
import { dbService } from './services/db';
import type { Resolution, Ordinance, SessionMinute, SessionAgenda, CommitteeReport, Legislator, CommitteeMembership, Term, UserAccount, Sector, LegislativeMeasure, IncomingDocument, DocumentType, DocumentStatus } from './types';

type View = 'main' | 'settings' | 'archive' | 'reports' | 'incoming' | 'ai';

interface NotificationState {
  message: string;
  type: 'success' | 'error';
}

export interface DraftForCreation {
  type: 'resolution' | 'ordinance';
  data: Partial<Resolution> | Partial<Ordinance>;
}

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [view, setView] = useState<View>('main');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [draftForCreation, setDraftForCreation] = useState<DraftForCreation | null>(null);
  
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [ordinances, setOrdinances] = useState<Ordinance[]>([]);
  const [sessionMinutes, setSessionMinutes] = useState<SessionMinute[]>([]);
  const [sessionAgendas, setSessionAgendas] = useState<SessionAgenda[]>([]);
  const [committeeReports, setCommitteeReports] = useState<CommitteeReport[]>([]);
  const [legislators, setLegislators] = useState<Legislator[]>([]);
  const [committeeMemberships, setCommitteeMemberships] = useState<CommitteeMembership[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [legislativeMeasures, setLegislativeMeasures] = useState<LegislativeMeasure[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [documentStatuses, setDocumentStatuses] = useState<DocumentStatus[]>([]);
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [incomingDocuments, setIncomingDocuments] = useState<IncomingDocument[]>([]);
  
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [systemState, setSystemState] = useState<'active' | 'minimized' | 'closed'>('active');

  const loadAllData = useCallback(async () => {
      try {
          const [
              res, ord, min, age, rep, leg, mem, trm, sec, msr, typ, sts, acc, inc
          ] = await Promise.all([
              dbService.getAll<Resolution>('resolutions'),
              dbService.getAll<Ordinance>('ordinances'),
              dbService.getAll<SessionMinute>('sessionMinutes'),
              dbService.getAll<SessionAgenda>('sessionAgendas'),
              dbService.getAll<CommitteeReport>('committeeReports'),
              dbService.getAll<Legislator>('legislators'),
              dbService.getAll<CommitteeMembership>('committeeMemberships'),
              dbService.getAll<Term>('terms'),
              dbService.getAll<Sector>('sectors'),
              dbService.getAll<LegislativeMeasure>('legislativeMeasures'),
              dbService.getAll<DocumentType>('documentTypes'),
              dbService.getAll<DocumentStatus>('documentStatuses'),
              dbService.getAll<UserAccount>('userAccounts'),
              dbService.getAll<IncomingDocument>('incomingDocuments'),
          ]);

          setResolutions(res);
          setOrdinances(ord);
          setSessionMinutes(min);
          setSessionAgendas(age);
          setCommitteeReports(rep);
          setLegislators(leg);
          setCommitteeMemberships(mem);
          setTerms(trm);
          setSectors(sec);
          setLegislativeMeasures(msr);
          setDocumentTypes(typ);
          setDocumentStatuses(sts);
          setUserAccounts(acc);
          setIncomingDocuments(inc);
      } catch (error) {
          console.error('Failed to load data:', error);
      }
  }, []);

  // Initialize Database and Load Data
  useEffect(() => {
    const initApp = async () => {
        try {
            await dbService.init();
            await loadAllData();
        } catch (error) {
            console.error('Failed to initialize database:', error);
            alert('CRITICAL ERROR: Failed to load system database.');
        } finally {
            setIsInitializing(false);
        }
    };
    initApp();
  }, [loadAllData]);

  const handleLogin = (userId: string, password: string) => {
    const user = userAccounts.find(
      (u) => u.userId.toLowerCase() === userId.toLowerCase() && u.password === password
    );

    if (user && user.status === 'Active') {
      setCurrentUser(user);
      setLoginModalOpen(false);
      setLoginError(null);
      setView('main');
    } else if (user && user.status === 'Inactive') {
      setLoginError('This user account is inactive.');
    } else {
      setLoginError('Invalid User ID or password.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('main');
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  const handleNavigate = (newView: View) => {
    // Clear any pending drafts if navigating away from the AI view without using them
    if (view === 'ai' && newView !== 'archive') {
      setDraftForCreation(null);
    }
    setView(newView);
  };

  const handleCreateDraft = (draft: DraftForCreation) => {
    setDraftForCreation(draft);
    setView('archive');
    showNotification('Draft loaded. Please review and save.', 'success');
  };


  const canDelete = currentUser?.role === 'admin' || currentUser?.role === 'developer';

  const handleAddResolution = async (res: Omit<Resolution, 'id'>) => {
    const newRes: Resolution = { ...res, id: `res-${Date.now()}` };
    await dbService.put('resolutions', newRes);
    setResolutions(prev => [newRes, ...prev]);
    showNotification('Successfully saved!');
  };

  const handleUpdateResolution = async (updatedRes: Resolution) => {
    await dbService.put('resolutions', updatedRes);
    setResolutions(prev => prev.map(res => res.id === updatedRes.id ? updatedRes : res));
    showNotification('Successfully updated!');
  };

  const handleDeleteResolution = async (resId: string) => {
    if (!canDelete) return showNotification('Admin permission required.', 'error');
    if (window.confirm('Delete this record?')) {
        await dbService.delete('resolutions', resId);
        setResolutions(prev => prev.filter(res => res.id !== resId));
        showNotification('Deleted.');
    }
  };

  const handleAddOrdinance = async (ord: Omit<Ordinance, 'id'>) => {
    const newOrd: Ordinance = { ...ord, id: `ord-${Date.now()}` };
    await dbService.put('ordinances', newOrd);
    setOrdinances(prev => [newOrd, ...prev]);
    showNotification('Successfully saved!');
  };

  const handleUpdateOrdinance = async (updatedOrd: Ordinance) => {
    await dbService.put('ordinances', updatedOrd);
    setOrdinances(prev => prev.map(ord => ord.id === updatedOrd.id ? updatedOrd : ord));
    showNotification('Successfully updated!');
  };

  const handleDeleteOrdinance = async (ordId: string) => {
    if (!canDelete) return showNotification('Admin permission required.', 'error');
    if (window.confirm('Delete this record?')) {
        await dbService.delete('ordinances', ordId);
        setOrdinances(prev => prev.filter(ord => ord.id !== ordId));
        showNotification('Deleted.');
    }
  };

  const handleAddSessionMinute = async (minute: Omit<SessionMinute, 'id'>) => {
    const newMinute: SessionMinute = { ...minute, id: `sm-${Date.now()}` };
    await dbService.put('sessionMinutes', newMinute);
    setSessionMinutes(prev => [newMinute, ...prev]);
    showNotification('Successfully saved!');
  };

  const handleUpdateSessionMinute = async (updatedMinute: SessionMinute) => {
    await dbService.put('sessionMinutes', updatedMinute);
    setSessionMinutes(prev => prev.map(minute => minute.id === updatedMinute.id ? updatedMinute : minute));
    showNotification('Successfully updated!');
  };

  const handleDeleteSessionMinute = async (minuteId: string) => {
    if (!canDelete) return showNotification('Admin permission required.', 'error');
    if (window.confirm('Delete this record?')) {
        await dbService.delete('sessionMinutes', minuteId);
        setSessionMinutes(prev => prev.filter(m => m.id !== minuteId));
        showNotification('Deleted.');
    }
  };

  const handleAddSessionAgenda = async (agenda: Omit<SessionAgenda, 'id'>) => {
    const newAgenda: SessionAgenda = { ...agenda, id: `sa-${Date.now()}` };
    await dbService.put('sessionAgendas', newAgenda);
    setSessionAgendas(prev => [newAgenda, ...prev]);
    showNotification('Successfully saved!');
  };

  const handleUpdateSessionAgenda = async (updatedAgenda: SessionAgenda) => {
    await dbService.put('sessionAgendas', updatedAgenda);
    setSessionAgendas(prev => prev.map(agenda => agenda.id === updatedAgenda.id ? updatedAgenda : agenda));
    showNotification('Successfully updated!');
  };

  const handleDeleteSessionAgenda = async (agendaId: string) => {
    if (!canDelete) return showNotification('Admin permission required.', 'error');
    if (window.confirm('Delete this record?')) {
        await dbService.delete('sessionAgendas', agendaId);
        setSessionAgendas(prev => prev.filter(a => a.id !== agendaId));
        showNotification('Deleted.');
    }
  };
  
  const handleAddCommitteeReport = async (report: Omit<CommitteeReport, 'id'>) => {
    const newReport: CommitteeReport = { ...report, id: `cr-${Date.now()}` };
    await dbService.put('committeeReports', newReport);
    setCommitteeReports(prev => [newReport, ...prev]);
    showNotification('Successfully saved!');
  };

  const handleUpdateCommitteeReport = async (updatedReport: CommitteeReport) => {
    await dbService.put('committeeReports', updatedReport);
    setCommitteeReports(prev => prev.map(report => report.id === updatedReport.id ? updatedReport : report));
    showNotification('Successfully updated!');
  };

  const handleDeleteCommitteeReport = async (reportId: string) => {
    if (!canDelete) return showNotification('Admin permission required.', 'error');
    if (window.confirm('Delete this record?')) {
        await dbService.delete('committeeReports', reportId);
        setCommitteeReports(prev => prev.filter(r => r.id !== reportId));
        showNotification('Deleted.');
    }
  };
  
  const handleAddLegislator = async (legislator: Omit<Legislator, 'id'>) => {
    const newLegislator: Legislator = { ...legislator, id: `leg-${Date.now()}` };
    await dbService.put('legislators', newLegislator);
    setLegislators(prev => [newLegislator, ...prev]);
    showNotification('Successfully saved!');
  };

  const handleUpdateLegislator = async (updatedLegislator: Legislator) => {
    await dbService.put('legislators', updatedLegislator);
    setLegislators(prev => prev.map(leg => leg.id === updatedLegislator.id ? updatedLegislator : leg));
    showNotification('Successfully updated!');
  };

  const handleDeleteLegislator = async (legislatorId: string) => {
    if (!canDelete) return showNotification('Admin permission required.', 'error');
    if (window.confirm('Delete this record?')) {
        await dbService.delete('legislators', legislatorId);
        setLegislators(prev => prev.filter(leg => leg.id !== legislatorId));
        showNotification('Deleted.');
    }
  };

  const handleAddCommitteeMembership = async (membership: Omit<CommitteeMembership, 'id'>) => {
    const newMembership: CommitteeMembership = { ...membership, id: `cm-${Date.now()}` };
    await dbService.put('committeeMemberships', newMembership);
    setCommitteeMemberships(prev => [newMembership, ...prev]);
    showNotification('Successfully saved!');
  };

  const handleUpdateCommitteeMembership = async (updatedMembership: CommitteeMembership) => {
    await dbService.put('committeeMemberships', updatedMembership);
    setCommitteeMemberships(prev => prev.map(mem => mem.id === updatedMembership.id ? updatedMembership : mem));
    showNotification('Successfully updated!');
  };

  const handleDeleteCommitteeMembership = async (membershipId: string) => {
    if (!canDelete) return showNotification('Admin permission required.', 'error');
    if (window.confirm('Delete this record?')) {
        await dbService.delete('committeeMemberships', membershipId);
        setCommitteeMemberships(prev => prev.filter(mem => mem.id !== membershipId));
        showNotification('Deleted.');
    }
  };

  const handleAddTerm = async (term: Omit<Term, 'id'>) => {
    const newTerm: Term = { ...term, id: `term-${Date.now()}` };
    await dbService.put('terms', newTerm);
    setTerms(prev => [newTerm, ...prev]);
    showNotification('Successfully saved!');
  };

  const handleUpdateTerm = async (updatedTerm: Term) => {
    await dbService.put('terms', updatedTerm);
    setTerms(prev => prev.map(term => term.id === updatedTerm.id ? updatedTerm : term));
    showNotification('Successfully updated!');
  };

  const handleDeleteTerm = async (termId: string) => {
    if (!canDelete) return showNotification('Admin permission required.', 'error');
    if (window.confirm('Delete this record?')) {
        await dbService.delete('terms', termId);
        setTerms(prev => prev.filter(term => term.id !== termId));
        showNotification('Deleted.');
    }
  };

  const handleAddSector = async (sector: Omit<Sector, 'id'>) => {
    const newSector: Sector = { ...sector, id: `sec-${Date.now()}` };
    await dbService.put('sectors', newSector);
    setSectors(prev => [newSector, ...prev]);
    showNotification('Successfully saved!');
  };

  const handleUpdateSector = async (updatedSector: Sector) => {
    await dbService.put('sectors', updatedSector);
    setSectors(prev => prev.map(sec => sec.id === updatedSector.id ? updatedSector : sec));
    showNotification('Successfully updated!');
  };

  const handleDeleteSector = async (sectorId: string) => {
    if (!canDelete) return showNotification('Admin permission required.', 'error');
    if (window.confirm('Delete this record?')) {
        await dbService.delete('sectors', sectorId);
        setSectors(prev => prev.filter(sec => sec.id !== sectorId));
        showNotification('Deleted.');
    }
  };

  const handleAddLegislativeMeasure = async (measure: Omit<LegislativeMeasure, 'id'>) => {
    const newMeasure: LegislativeMeasure = { ...measure, id: `lm-${Date.now()}` };
    await dbService.put('legislativeMeasures', newMeasure);
    setLegislativeMeasures(prev => [newMeasure, ...prev]);
    showNotification('Successfully saved!');
  };

  const handleUpdateLegislativeMeasure = async (updatedMeasure: LegislativeMeasure) => {
    await dbService.put('legislativeMeasures', updatedMeasure);
    setLegislativeMeasures(prev => prev.map(m => m.id === updatedMeasure.id ? updatedMeasure : m));
    showNotification('Successfully updated!');
  };

  const handleDeleteLegislativeMeasure = async (measureId: string) => {
    if (!canDelete) return showNotification('Admin permission required.', 'error');
    if (window.confirm('Delete this record?')) {
        await dbService.delete('legislativeMeasures', measureId);
        setLegislativeMeasures(prev => prev.filter(m => m.id !== measureId));
        showNotification('Deleted.');
    }
  };

  const handleAddDocumentType = async (type: Omit<DocumentType, 'id'>) => {
    const newType: DocumentType = { ...type, id: `dt-${Date.now()}` };
    await dbService.put('documentTypes', newType);
    setDocumentTypes(prev => [newType, ...prev]);
    showNotification('Successfully saved!');
  };

  const handleUpdateDocumentType = async (updatedType: DocumentType) => {
    await dbService.put('documentTypes', updatedType);
    setDocumentTypes(prev => prev.map(type => type.id === updatedType.id ? updatedType : type));
    showNotification('Successfully updated!');
  };

  const handleDeleteDocumentType = async (typeId: string) => {
    if (!canDelete) return showNotification('Admin permission required.', 'error');
    if (window.confirm('Delete this record?')) {
        await dbService.delete('documentTypes', typeId);
        setDocumentTypes(prev => prev.filter(type => type.id !== typeId));
        showNotification('Deleted.');
    }
  };

  const handleAddDocumentStatus = async (status: Omit<DocumentStatus, 'id'>) => {
    const newStatus: DocumentStatus = { ...status, id: `ds-${Date.now()}` };
    await dbService.put('documentStatuses', newStatus);
    setDocumentStatuses(prev => [newStatus, ...prev]);
    showNotification('Successfully saved!');
  };

  const handleUpdateDocumentStatus = async (updatedStatus: DocumentStatus) => {
    await dbService.put('documentStatuses', updatedStatus);
    setDocumentStatuses(prev => prev.map(status => status.id === updatedStatus.id ? updatedStatus : status));
    showNotification('Successfully updated!');
  };

  const handleDeleteDocumentStatus = async (statusId: string) => {
    if (!canDelete) return showNotification('Admin permission required.', 'error');
    if (window.confirm('Delete this record?')) {
        await dbService.delete('documentStatuses', statusId);
        setDocumentStatuses(prev => prev.filter(status => status.id !== statusId));
        showNotification('Deleted.');
    }
  };

  const handleAddUserAccount = async (user: Omit<UserAccount, 'id'>) => {
    const newUser: UserAccount = { ...user, id: `user-${Date.now()}` };
    await dbService.put('userAccounts', newUser);
    setUserAccounts(prev => [newUser, ...prev]);
    showNotification('Successfully saved!');
  };

  const handleUpdateUserAccount = async (updatedUser: UserAccount) => {
    await dbService.put('userAccounts', updatedUser);
    setUserAccounts(prev => prev.map(user => user.id === updatedUser.id ? updatedUser : user));
    showNotification('Successfully updated!');
  };

  const handleDeleteUserAccount = async (userId: string) => {
    if (!canDelete) return showNotification('Admin permission required.', 'error');
    if (window.confirm('Delete this record?')) {
        await dbService.delete('userAccounts', userId);
        setUserAccounts(prev => prev.filter(user => user.id !== userId));
        showNotification('Deleted.');
    }
  };

  const handleAddIncomingDocument = async (doc: Omit<IncomingDocument, 'id'>) => {
    const newDoc: IncomingDocument = { ...doc, id: `inc-${Date.now()}` };
    await dbService.put('incomingDocuments', newDoc);
    setIncomingDocuments(prev => [newDoc, ...prev]);
    showNotification('Successfully saved!');
  };

  const handleUpdateIncomingDocument = async (updatedDoc: IncomingDocument) => {
    await dbService.put('incomingDocuments', updatedDoc);
    setIncomingDocuments(prev => prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc));
    showNotification('Successfully updated!');
  };

  const handleDeleteIncomingDocument = async (docId: string) => {
    if (!canDelete) return showNotification('Admin permission required.', 'error');
    if (window.confirm('Delete this record?')) {
        await dbService.delete('incomingDocuments', docId);
        setIncomingDocuments(prev => prev.filter(doc => doc.id !== docId));
        showNotification('Deleted.');
    }
  };

  if (isInitializing) {
      return (
          <div className="min-h-screen bg-brand-light flex flex-col items-center justify-center">
              <Spinner />
              <p className="mt-4 text-brand-primary font-bold animate-pulse uppercase tracking-widest text-sm">
                  Loading Legislative System Data...
              </p>
          </div>
      );
  }

  if (systemState === 'closed') {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-8 text-gray-500">System Shutdown</h1>
                <button 
                    onClick={() => setSystemState('active')}
                    className="px-8 py-4 bg-gray-800 rounded-full border-2 border-gray-600 hover:bg-gray-700 hover:border-gray-400 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 group-hover:text-green-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
                <p className="mt-4 text-sm text-gray-500 uppercase tracking-widest">Power On</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-brand-dark flex flex-col">
        <div className="bg-slate-900 text-slate-300 h-8 flex items-center justify-between px-3 text-xs select-none print:hidden shadow-md z-50">
            <div className="flex items-center space-x-2">
                <span className="font-semibold tracking-wide">Computerized Legislative Tracking System</span>
            </div>
            <div className="flex items-center space-x-1">
                <button 
                    onClick={() => setSystemState(systemState === 'minimized' ? 'active' : 'minimized')}
                    className="w-6 h-6 flex items-center justify-center hover:bg-slate-700 rounded transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                </button>
                <button 
                    onClick={() => setSystemState('closed')}
                    className="w-6 h-6 flex items-center justify-center hover:bg-red-600 hover:text-white rounded transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      {isLoginModalOpen && (
        <LoginModal
          onLogin={handleLogin}
          onCancel={() => {
            setLoginModalOpen(false);
            setLoginError(null);
          }}
          error={loginError}
          userCount={userAccounts.length}
        />
      )}
      
      <div className={`flex flex-col flex-grow transition-opacity duration-300 ${systemState === 'active' ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
          <div className="print:hidden">
              <Header
                currentView={view}
                onNavigate={handleNavigate}
                currentUser={currentUser}
                onLoginClick={() => setLoginModalOpen(true)}
                onLogout={handleLogout}
              />
          </div>
          <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
            {view === 'main' && (
              <MainView
                resolutions={resolutions}
                ordinances={ordinances}
                incomingDocuments={incomingDocuments}
                legislators={legislators}
                onNavigateToSettings={() => setView('settings')}
              />
            )}
            {view === 'incoming' && currentUser && (
                <IncomingDocumentView
                    documents={incomingDocuments}
                    documentTypes={documentTypes}
                    documentStatuses={documentStatuses}
                    onAddDocument={handleAddIncomingDocument}
                    onUpdateDocument={handleUpdateIncomingDocument}
                    onDeleteDocument={handleDeleteIncomingDocument}
                    committeeMemberships={committeeMemberships}
                    legislators={legislators}
                    canDelete={canDelete}
                />
            )}
            {view === 'ai' && currentUser && (
              <AIAssistantView onStartDraft={handleCreateDraft} />
            )}
            {view === 'settings' && currentUser && (
              <LegislativeView
                currentUserRole={currentUser.role}
                legislators={legislators}
                onAddLegislator={handleAddLegislator}
                onUpdateLegislator={handleUpdateLegislator}
                onDeleteLegislator={handleDeleteLegislator}
                committeeMemberships={committeeMemberships}
                onAddCommitteeMembership={handleAddCommitteeMembership}
                onUpdateCommitteeMembership={handleUpdateCommitteeMembership}
                onDeleteCommitteeMembership={handleDeleteCommitteeMembership}
                terms={terms}
                onAddTerm={handleAddTerm}
                onUpdateTerm={handleUpdateTerm}
                onDeleteTerm={handleDeleteTerm}
                sectors={sectors}
                onAddSector={handleAddSector}
                onUpdateSector={handleUpdateSector}
                onDeleteSector={handleDeleteSector}
                legislativeMeasures={legislativeMeasures}
                onAddLegislativeMeasure={handleAddLegislativeMeasure}
                onUpdateLegislativeMeasure={handleUpdateLegislativeMeasure}
                onDeleteLegislativeMeasure={handleDeleteLegislativeMeasure}
                documentTypes={documentTypes}
                onAddDocumentType={handleAddDocumentType}
                onUpdateDocumentType={handleUpdateDocumentType}
                onDeleteDocumentType={handleDeleteDocumentType}
                documentStatuses={documentStatuses}
                onAddDocumentStatus={handleAddDocumentStatus}
                onUpdateDocumentStatus={handleUpdateDocumentStatus}
                onDeleteDocumentStatus={handleDeleteDocumentStatus}
                userAccounts={userAccounts}
                onAddUserAccount={handleAddUserAccount}
                onUpdateUserAccount={handleUpdateUserAccount}
                onDeleteUserAccount={handleDeleteUserAccount}
                onDatabaseRefresh={loadAllData}
              />
            )}
            {view === 'archive' && currentUser && (
              <ArchiveView 
                currentUserRole={currentUser.role}
                draftForCreation={draftForCreation}
                onDraftConsumed={() => setDraftForCreation(null)}
                resolutions={resolutions}
                onAddResolution={handleAddResolution}
                onUpdateResolution={handleUpdateResolution}
                onDeleteResolution={handleDeleteResolution}
                ordinances={ordinances}
                onAddOrdinance={handleAddOrdinance}
                onUpdateOrdinance={handleUpdateOrdinance}
                onDeleteOrdinance={handleDeleteOrdinance}
                sessionMinutes={sessionMinutes}
                onAddSessionMinute={handleAddSessionMinute}
                onUpdateSessionMinute={handleUpdateSessionMinute}
                onDeleteSessionMinute={handleDeleteSessionMinute}
                sessionAgendas={sessionAgendas}
                onAddSessionAgenda={handleAddSessionAgenda}
                onUpdateSessionAgenda={handleUpdateSessionAgenda}
                onDeleteSessionAgenda={handleDeleteSessionAgenda}
                committeeReports={committeeReports}
                onAddCommitteeReport={handleAddCommitteeReport}
                onUpdateCommitteeReport={handleUpdateCommitteeReport}
                onDeleteCommitteeReport={handleDeleteCommitteeReport}
                committeeMemberships={committeeMemberships}
                legislators={legislators}
                terms={terms}
                sectors={sectors}
              />
            )}
            {view === 'reports' && currentUser && (
              <ReportsView
                resolutions={resolutions}
                ordinances={ordinances}
                sessionMinutes={sessionMinutes}
                sessionAgendas={sessionAgendas}
                committeeReports={committeeReports}
                committeeMemberships={committeeMemberships}
                terms={terms}
                sectors={sectors}
                legislativeMeasures={legislativeMeasures}
                legislators={legislators}
              />
            )}
          </main>
          <footer className="text-center p-4 text-slate-500 text-sm print:hidden mt-auto">
            <p>&copy; {new Date().getFullYear()} Computerized Legislative Tracking System. All rights reserved.</p>
            <div className="mt-2">
                <p className="font-semibold text-xs">Powered by AXSOFT IT SOLUTIONS</p>
                <p className="text-xs">Alson's Ave., Poblacion, Magpet, Cotabato</p>
            </div>
          </footer>
      </div>
    </div>
  );
};

export default App;