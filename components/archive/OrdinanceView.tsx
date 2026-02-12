
import React, { useState, useEffect } from 'react';
import type { Ordinance, Legislator, CommitteeMembership, Term, Sector } from '../../types';
import OrdinanceCard from './OrdinanceCard';
import OrdinanceForm from './OrdinanceForm';

interface OrdinanceViewProps {
    ordinances: Ordinance[];
    draftData: Partial<Ordinance> | null;
    onDraftConsumed: () => void;
    onAddOrdinance: (ord: Omit<Ordinance, 'id'>) => void;
    onUpdateOrdinance: (ord: Ordinance) => void;
    onDeleteOrdinance: (id: string) => void;
    legislators: Legislator[];
    committeeMemberships: CommitteeMembership[];
    terms: Term[];
    sectors: Sector[];
    canDelete: boolean;
}

const OrdinanceView: React.FC<OrdinanceViewProps> = ({ ordinances, draftData, onDraftConsumed, onAddOrdinance, onUpdateOrdinance, onDeleteOrdinance, legislators, committeeMemberships, terms, sectors, canDelete }) => {
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
    const [selectedOrd, setSelectedOrd] = useState<Ordinance | Partial<Ordinance> | null>(null);

    useEffect(() => {
        if (draftData) {
            setSelectedOrd(draftData);
            setMode('add');
            onDraftConsumed();
        }
    }, [draftData, onDraftConsumed]);

    const handleAddNew = () => {
        setSelectedOrd(null);
        setMode('add');
    };

    const handleEdit = (ord: Ordinance) => {
        setSelectedOrd(ord);
        setMode('edit');
    };

    const handleCancel = () => {
        setSelectedOrd(null);
        setMode('list');
    };
    
    const handleSave = (ordData: Omit<Ordinance, 'id'> | Ordinance) => {
        if ('id' in ordData) {
            onUpdateOrdinance(ordData);
        } else {
            onAddOrdinance(ordData);
        }
        setMode('list');
        setSelectedOrd(null);
    }


    if (mode === 'add' || mode === 'edit') {
        return (
            <OrdinanceForm
                initialData={selectedOrd as Ordinance | null}
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
                    Add New Ordinance
                </button>
            </div>
            {ordinances.length > 0 ? (
                <div className="space-y-4">
                    {ordinances.map(ord => (
                        <OrdinanceCard
                            key={ord.id} 
                            ordinance={ord}
                            onEdit={handleEdit} 
                            onDelete={onDeleteOrdinance}
                            canDelete={canDelete}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 bg-white rounded-lg shadow-md">
                    <p className="text-slate-500">No approved ordinances found. Add one to get started!</p>
                </div>
            )}
        </div>
    );
};

export default OrdinanceView;
