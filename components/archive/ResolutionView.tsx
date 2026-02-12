
import React, { useState, useEffect } from 'react';
import type { Resolution, Legislator, CommitteeMembership, Term, Sector } from '../../types';
import ResolutionCard from './ResolutionCard';
import ResolutionForm from './ResolutionForm';

interface ResolutionViewProps {
    resolutions: Resolution[];
    draftData: Partial<Resolution> | null;
    onDraftConsumed: () => void;
    onAddResolution: (res: Omit<Resolution, 'id'>) => void;
    onUpdateResolution: (res: Resolution) => void;
    onDeleteResolution: (id: string) => void;
    legislators: Legislator[];
    committeeMemberships: CommitteeMembership[];
    terms: Term[];
    sectors: Sector[];
    canDelete: boolean;
}

const ResolutionView: React.FC<ResolutionViewProps> = ({ resolutions, draftData, onDraftConsumed, onAddResolution, onUpdateResolution, onDeleteResolution, legislators, committeeMemberships, terms, sectors, canDelete }) => {
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
    const [selectedRes, setSelectedRes] = useState<Resolution | Partial<Resolution> | null>(null);

    useEffect(() => {
        if (draftData) {
            setSelectedRes(draftData);
            setMode('add');
            onDraftConsumed();
        }
    }, [draftData, onDraftConsumed]);

    const handleAddNew = () => {
        setSelectedRes(null);
        setMode('add');
    };

    const handleEdit = (res: Resolution) => {
        setSelectedRes(res);
        setMode('edit');
    };

    const handleCancel = () => {
        setSelectedRes(null);
        setMode('list');
    };
    
    const handleSave = (resData: Omit<Resolution, 'id'> | Resolution) => {
        if ('id' in resData) {
            onUpdateResolution(resData);
        } else {
            onAddResolution(resData);
        }
        setMode('list');
        setSelectedRes(null);
    }

    if (mode === 'add' || mode === 'edit') {
        return (
            <ResolutionForm
                initialData={selectedRes as Resolution | null}
                onSubmit={handleSave}
                onCancel={handleCancel}
                legislators={legislators}
                committeeMemberships={committeeMemberships}
                terms={terms}
                sectors={sectors}
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
                    Add New Resolution
                </button>
            </div>
            {resolutions.length > 0 ? (
                <div className="space-y-4">
                    {resolutions.map(res => (
                        <ResolutionCard
                            key={res.id} 
                            resolution={res}
                            onEdit={handleEdit} 
                            onDelete={onDeleteResolution}
                            canDelete={canDelete}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 bg-white rounded-lg shadow-md">
                    <p className="text-slate-500">No approved resolutions found. Add one to get started!</p>
                </div>
            )}
        </div>
    );
};

export default ResolutionView;
