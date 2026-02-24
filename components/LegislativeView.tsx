
import React, { useState } from 'react';
import type { Legislator, CommitteeMembership, Term, UserAccount, UserRole, Sector, LegislativeMeasure, DocumentType, DocumentStatus } from '../types';
import LegislationCard from './LegislationCard';
import LegislationDetail from './LegislationDetail';
import CommitteeMembershipView from './settings/CommitteeMembershipView';
import TermView from './settings/TermView';
import UserAccountView from './settings/UserAccountView';
import SectorView from './settings/SectorView';
import LegislativeMeasureView from './settings/LegislativeMeasureView';
import DocumentTypeView from './settings/DocumentTypeView';
import DocumentStatusView from './settings/DocumentStatusView';
import DatabaseManagementView from './settings/DatabaseManagementView';

interface LegislativeViewProps {
    currentUserRole: UserRole;
    legislators: Legislator[];
    onAddLegislator: (leg: Omit<Legislator, 'id'>) => void;
    onUpdateLegislator: (leg: Legislator) => void;
    onDeleteLegislator: (id: string) => void;
    committeeMemberships: CommitteeMembership[];
    onAddCommitteeMembership: (mem: Omit<CommitteeMembership, 'id'>) => void;
    onUpdateCommitteeMembership: (mem: CommitteeMembership) => void;
    onDeleteCommitteeMembership: (id: string) => void;
    terms: Term[];
    onAddTerm: (term: Omit<Term, 'id'>) => void;
    onUpdateTerm: (term: Term) => void;
    onDeleteTerm: (id: string) => void;
    sectors: Sector[];
    onAddSector: (sector: Omit<Sector, 'id'>) => void;
    onUpdateSector: (sector: Sector) => void;
    onDeleteSector: (id: string) => void;
    legislativeMeasures: LegislativeMeasure[];
    onAddLegislativeMeasure: (measure: Omit<LegislativeMeasure, 'id'>) => void;
    onUpdateLegislativeMeasure: (measure: LegislativeMeasure) => void;
    onDeleteLegislativeMeasure: (id: string) => void;
    documentTypes: DocumentType[];
    onAddDocumentType: (type: Omit<DocumentType, 'id'>) => void;
    onUpdateDocumentType: (type: DocumentType) => void;
    onDeleteDocumentType: (id: string) => void;
    documentStatuses: DocumentStatus[];
    onAddDocumentStatus: (status: Omit<DocumentStatus, 'id'>) => void;
    onUpdateDocumentStatus: (status: DocumentStatus) => void;
    onDeleteDocumentStatus: (id: string) => void;
    userAccounts: UserAccount[];
    onAddUserAccount: (user: Omit<UserAccount, 'id'>) => void;
    onUpdateUserAccount: (user: UserAccount) => void;
    onDeleteUserAccount: (id: string) => void;
    onDatabaseRefresh: () => void; // Triggered when database is imported/reset
    onPermissionChange?: () => void;
}

type SettingsTab = 'profiles' | 'committees' | 'terms' | 'accounts' | 'sectors' | 'measures' | 'doctypes' | 'statuses' | 'database';

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


const LegislativeView: React.FC<LegislativeViewProps> = (props) => {
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
    const [selectedLegislator, setSelectedLegislator] = useState<Legislator | null>(null);
    const [activeTab, setActiveTab] = useState<SettingsTab>('profiles');

    const canDelete = props.currentUserRole === 'admin' || props.currentUserRole === 'developer';

    const handleAddNew = () => {
        setSelectedLegislator(null);
        setMode('add');
    };

    const handleEdit = (legislator: Legislator) => {
        setSelectedLegislator(legislator);
        setMode('edit');
    };

    const handleCancel = () => {
        setSelectedLegislator(null);
        setMode('list');
    };
    
    const handleSave = (legislatorData: Omit<Legislator, 'id'> | Legislator) => {
        if ('id' in legislatorData) {
            props.onUpdateLegislator(legislatorData);
        } else {
            props.onAddLegislator(legislatorData);
        }
        setMode('list');
        setSelectedLegislator(null);
    }

    const renderProfilesView = () => {
        if (mode === 'add' || mode === 'edit') {
            return (
                <LegislationDetail
                    initialData={selectedLegislator}
                    onSubmit={handleSave}
                    onCancel={handleCancel}
                    terms={props.terms}
                />
            );
        }

        return (
            <div>
                 <div className="flex justify-between items-center mb-4">
                     <p className="text-slate-600">
                        Manage individual legislator and author profiles.
                     </p>
                    <button
                        onClick={handleAddNew}
                        className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors flex-shrink-0"
                    >
                        Add New Profile
                    </button>
                </div>
                {props.legislators.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {props.legislators.map(leg => (
                            <LegislationCard
                                key={leg.id} 
                                legislator={leg}
                                onEdit={handleEdit} 
                                onDelete={props.onDeleteLegislator}
                                canDelete={canDelete}
                            />
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-16 bg-white rounded-lg shadow-md mt-6">
                        <p className="text-slate-500">No legislator profiles found. Add one to get started!</p>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div>
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                 <h2 className="text-2xl font-bold text-brand-primary mb-2">Settings Section</h2>
                 <p className="text-slate-600 mb-6">
                    Manage system configurations, profiles, and database operations.
                 </p>
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-4 overflow-x-auto">
                        <TabButton label="Profiles" isActive={activeTab === 'profiles'} onClick={() => setActiveTab('profiles')} />
                        <TabButton label="Committee Membership" isActive={activeTab === 'committees'} onClick={() => setActiveTab('committees')} />
                        <TabButton label="Term Management" isActive={activeTab === 'terms'} onClick={() => setActiveTab('terms')} />
                        <TabButton label="Sectors" isActive={activeTab === 'sectors'} onClick={() => setActiveTab('sectors')} />
                        <TabButton label="Measures" isActive={activeTab === 'measures'} onClick={() => setActiveTab('measures')} />
                        <TabButton label="Document Types" isActive={activeTab === 'doctypes'} onClick={() => setActiveTab('doctypes')} />
                        <TabButton label="Statuses" isActive={activeTab === 'statuses'} onClick={() => setActiveTab('statuses')} />
                        <TabButton label="User Accounts" isActive={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} />
                        <TabButton label="Database & Security" isActive={activeTab === 'database'} onClick={() => setActiveTab('database')} />
                    </nav>
                </div>
                
                <div className="mt-6">
                    {activeTab === 'profiles' && renderProfilesView()}
                    {activeTab === 'committees' && (
                        <CommitteeMembershipView
                            legislators={props.legislators}
                            committeeMemberships={props.committeeMemberships}
                            onAddCommitteeMembership={props.onAddCommitteeMembership}
                            onUpdateCommitteeMembership={props.onUpdateCommitteeMembership}
                            onDeleteCommitteeMembership={props.onDeleteCommitteeMembership}
                            terms={props.terms}
                            canDelete={canDelete}
                        />
                    )}
                    {activeTab === 'terms' && (
                        <TermView
                            terms={props.terms}
                            onAddTerm={props.onAddTerm}
                            onUpdateTerm={props.onUpdateTerm}
                            onDeleteTerm={props.onDeleteTerm}
                            canDelete={canDelete}
                        />
                    )}
                    {activeTab === 'sectors' && (
                        <SectorView
                            sectors={props.sectors}
                            onAddSector={props.onAddSector}
                            onUpdateSector={props.onUpdateSector}
                            onDeleteSector={props.onDeleteSector}
                            canDelete={canDelete}
                        />
                    )}
                    {activeTab === 'measures' && (
                        <LegislativeMeasureView
                            legislativeMeasures={props.legislativeMeasures}
                            sectors={props.sectors}
                            onAddLegislativeMeasure={props.onAddLegislativeMeasure}
                            onUpdateLegislativeMeasure={props.onUpdateLegislativeMeasure}
                            onDeleteLegislativeMeasure={props.onDeleteLegislativeMeasure}
                            canDelete={canDelete}
                        />
                    )}
                    {activeTab === 'doctypes' && (
                        <DocumentTypeView
                            documentTypes={props.documentTypes}
                            onAddDocumentType={props.onAddDocumentType}
                            onUpdateDocumentType={props.onUpdateDocumentType}
                            onDeleteDocumentType={props.onDeleteDocumentType}
                            canDelete={canDelete}
                        />
                    )}
                    {activeTab === 'statuses' && (
                        <DocumentStatusView
                            documentStatuses={props.documentStatuses}
                            onAddDocumentStatus={props.onAddDocumentStatus}
                            onUpdateDocumentStatus={props.onUpdateDocumentStatus}
                            onDeleteDocumentStatus={props.onDeleteDocumentStatus}
                            canDelete={canDelete}
                        />
                    )}
                    {activeTab === 'accounts' && (
                        <UserAccountView
                            currentUserRole={props.currentUserRole}
                            userAccounts={props.userAccounts}
                            onAddUserAccount={props.onAddUserAccount}
                            onUpdateUserAccount={props.onUpdateUserAccount}
                            onDeleteUserAccount={props.onDeleteUserAccount}
                        />
                    )}
                    {activeTab === 'database' && (
                        <DatabaseManagementView 
                            onDatabaseAction={props.onDatabaseRefresh} 
                            onPermissionChange={props.onPermissionChange}
                            currentUserRole={props.currentUserRole}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default LegislativeView;
