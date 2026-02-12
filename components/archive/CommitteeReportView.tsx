import React, { useState } from 'react';
import type { CommitteeReport, CommitteeMembership, Term, Legislator } from '../../types';
import CommitteeReportCard from './CommitteeReportCard';
import CommitteeReportForm from './CommitteeReportForm';

interface CommitteeReportViewProps {
    committeeReports: CommitteeReport[];
    onAddCommitteeReport: (report: Omit<CommitteeReport, 'id'>) => void;
    onUpdateCommitteeReport: (report: CommitteeReport) => void;
    onDeleteCommitteeReport: (id: string) => void;
    committeeMemberships: CommitteeMembership[];
    terms: Term[];
    legislators: Legislator[];
    canDelete: boolean;
}

const CommitteeReportView: React.FC<CommitteeReportViewProps> = ({ committeeReports, onAddCommitteeReport, onUpdateCommitteeReport, onDeleteCommitteeReport, committeeMemberships, terms, legislators, canDelete }) => {
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
    const [selectedReport, setSelectedReport] = useState<CommitteeReport | null>(null);

    const handleAddNew = () => {
        setSelectedReport(null);
        setMode('add');
    };

    const handleEdit = (report: CommitteeReport) => {
        setSelectedReport(report);
        setMode('edit');
    };

    const handleCancel = () => {
        setSelectedReport(null);
        setMode('list');
    };
    
    const handleSave = (reportData: Omit<CommitteeReport, 'id'> | CommitteeReport) => {
        if ('id' in reportData) {
            onUpdateCommitteeReport(reportData);
        } else {
            onAddCommitteeReport(reportData);
        }
        setMode('list');
        setSelectedReport(null);
    }

    if (mode === 'add' || mode === 'edit') {
        return (
            <CommitteeReportForm
                initialData={selectedReport}
                onSubmit={handleSave}
                onCancel={handleCancel}
                committeeMemberships={committeeMemberships}
                terms={terms}
                legislators={legislators}
                committeeReports={committeeReports}
            />
        );
    }

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button
                    onClick={handleAddNew}
                    className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors"
                >
                    Add New Committee Report
                </button>
            </div>
            {committeeReports.length > 0 ? (
                <div className="space-y-4">
                    {committeeReports.map(report => (
                        <CommitteeReportCard
                            key={report.id} 
                            committeeReport={report}
                            onEdit={handleEdit} 
                            onDelete={onDeleteCommitteeReport}
                            canDelete={canDelete}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 bg-white rounded-lg shadow-md">
                    <p className="text-slate-500">No committee reports found. Add one to get started!</p>
                </div>
            )}
        </div>
    );
};

export default CommitteeReportView;