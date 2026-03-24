import React, { useState } from 'react';
import type { CommitteeMembership, Legislator, Term } from '../../types';
import CommitteeMembershipCard from './CommitteeMembershipCard';
import CommitteeMembershipForm from './CommitteeMembershipForm';

interface CommitteeMembershipViewProps {
    committeeMemberships: CommitteeMembership[];
    legislators: Legislator[];
    terms: Term[];
    onAddCommitteeMembership: (mem: Omit<CommitteeMembership, 'id'>) => void;
    onUpdateCommitteeMembership: (mem: CommitteeMembership) => void;
    onDeleteCommitteeMembership: (id: string) => void;
    canDelete: boolean;
}

const CommitteeMembershipView: React.FC<CommitteeMembershipViewProps> = (props) => {
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
    const [selectedMembership, setSelectedMembership] = useState<CommitteeMembership | null>(null);
    const [committeeTermFilter, setCommitteeTermFilter] = useState<string>('all');

    const handleAddNew = () => {
        setSelectedMembership(null);
        setMode('add');
    };

    const handleEdit = (mem: CommitteeMembership) => {
        setSelectedMembership(mem);
        setMode('edit');
    };

    const handleCancel = () => {
        setSelectedMembership(null);
        setMode('list');
    };
    
    const handleSave = (memData: Omit<CommitteeMembership, 'id'> | CommitteeMembership) => {
        if ('id' in memData) {
            props.onUpdateCommitteeMembership(memData);
        } else {
            props.onAddCommitteeMembership(memData);
        }
        setMode('list');
        setSelectedMembership(null);
    }

    if (mode === 'add' || mode === 'edit') {
        return (
            <div>
                <CommitteeMembershipForm
                    initialData={selectedMembership}
                    legislators={props.legislators}
                    terms={props.terms}
                    onSubmit={handleSave}
                    onCancel={handleCancel}
                />
            </div>
        );
    }

    const sortedTerms = [...props.terms].sort((a, b) => {
        const aYear = parseInt(a.yearFrom.split('-')[0]) || 0;
        const bYear = parseInt(b.yearFrom.split('-')[0]) || 0;
        return bYear - aYear;
    });

    const filteredMemberships = props.committeeMemberships.filter(mem => {
        if (committeeTermFilter === 'all') return true;
        return mem.termYear === committeeTermFilter;
    });

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <p className="text-slate-600">
                    Define committees and assign legislators to roles.
                </p>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <select
                        value={committeeTermFilter}
                        onChange={(e) => setCommitteeTermFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white"
                    >
                        <option value="all">All Terms</option>
                        {sortedTerms.map(term => (
                            <option key={term.id} value={`${term.yearFrom}-${term.yearTo}`}>
                                {term.yearFrom.split('-')[0]}-{term.yearTo.split('-')[0]}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleAddNew}
                        className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors flex-shrink-0"
                    >
                        Add New Committee
                    </button>
                </div>
            </div>
            {filteredMemberships.length > 0 ? (
                <div className="space-y-4">
                    {filteredMemberships.map(mem => (
                        <CommitteeMembershipCard
                            key={mem.id} 
                            committeeMembership={mem}
                            legislators={props.legislators}
                            onEdit={handleEdit} 
                            onDelete={props.onDeleteCommitteeMembership}
                            canDelete={props.canDelete}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 bg-slate-50 rounded-lg mt-6">
                    <p className="text-slate-500">No committee memberships found for the selected term.</p>
                </div>
            )}
        </div>
    );
};

export default CommitteeMembershipView;