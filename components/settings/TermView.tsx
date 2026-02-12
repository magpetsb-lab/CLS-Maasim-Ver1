import React, { useState } from 'react';
import type { Term } from '../../types';
import TermCard from './TermCard';
import TermForm from './TermForm';

interface TermViewProps {
    terms: Term[];
    onAddTerm: (term: Omit<Term, 'id'>) => void;
    onUpdateTerm: (term: Term) => void;
    onDeleteTerm: (id: string) => void;
    canDelete: boolean;
}

const TermView: React.FC<TermViewProps> = (props) => {
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
    const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);

    const handleAddNew = () => {
        setSelectedTerm(null);
        setMode('add');
    };

    const handleEdit = (term: Term) => {
        setSelectedTerm(term);
        setMode('edit');
    };

    const handleCancel = () => {
        setSelectedTerm(null);
        setMode('list');
    };
    
    const handleSave = (termData: Omit<Term, 'id'> | Term) => {
        if ('id' in termData) {
            props.onUpdateTerm(termData);
        } else {
            props.onAddTerm(termData);
        }
        setMode('list');
        setSelectedTerm(null);
    }

    if (mode === 'add' || mode === 'edit') {
        return (
            <div>
                <TermForm
                    initialData={selectedTerm}
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
                    Define term years for legislative periods.
                </p>
                <button
                    onClick={handleAddNew}
                    className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors flex-shrink-0"
                >
                    Add New Term
                </button>
            </div>
            {props.terms.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {props.terms.map(term => (
                        <TermCard
                            key={term.id}
                            term={term}
                            onEdit={handleEdit}
                            onDelete={props.onDeleteTerm}
                            canDelete={props.canDelete}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 bg-slate-50 rounded-lg mt-6">
                    <p className="text-slate-500">No terms found. Add one to get started!</p>
                </div>
            )}
        </div>
    );
};

export default TermView;