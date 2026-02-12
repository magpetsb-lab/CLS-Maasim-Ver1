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

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <p className="text-slate-600">
                    Define committees and assign legislators to roles.
                </p>
                <button
                    onClick={handleAddNew}
                    className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors flex-shrink-0"
                >
                    Add New Committee
                </button>
            </div>
            {props.committeeMemberships.length > 0 ? (
                <div className="space-y-4">
                    {props.committeeMemberships.map(mem => (
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
                    <p className="text-slate-500">No committee memberships found. Add one to get started!</p>
                </div>
            )}
        </div>
    );
};

export default CommitteeMembershipView;