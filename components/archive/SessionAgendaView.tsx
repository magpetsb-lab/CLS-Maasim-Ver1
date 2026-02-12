import React, { useState } from 'react';
import type { SessionAgenda, Term } from '../../types';
import SessionAgendaCard from './SessionAgendaCard';
import SessionAgendaForm from './SessionAgendaForm';

interface SessionAgendaViewProps {
    sessionAgendas: SessionAgenda[];
    onAddSessionAgenda: (agenda: Omit<SessionAgenda, 'id'>) => void;
    onUpdateSessionAgenda: (agenda: SessionAgenda) => void;
    onDeleteSessionAgenda: (id: string) => void;
    terms: Term[];
    canDelete: boolean;
}

const SessionAgendaView: React.FC<SessionAgendaViewProps> = ({ sessionAgendas, onAddSessionAgenda, onUpdateSessionAgenda, onDeleteSessionAgenda, terms, canDelete }) => {
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
    const [selectedAgenda, setSelectedAgenda] = useState<SessionAgenda | null>(null);

    const handleAddNew = () => {
        setSelectedAgenda(null);
        setMode('add');
    };

    const handleEdit = (agenda: SessionAgenda) => {
        setSelectedAgenda(agenda);
        setMode('edit');
    };

    const handleCancel = () => {
        setSelectedAgenda(null);
        setMode('list');
    };
    
    const handleSave = (agendaData: Omit<SessionAgenda, 'id'> | SessionAgenda) => {
        if ('id' in agendaData) {
            onUpdateSessionAgenda(agendaData);
        } else {
            onAddSessionAgenda(agendaData);
        }
        setMode('list');
        setSelectedAgenda(null);
    }

    if (mode === 'add' || mode === 'edit') {
        return (
            <SessionAgendaForm
                initialData={selectedAgenda}
                onSubmit={handleSave}
                onCancel={handleCancel}
                terms={terms}
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
                    Add New Agenda
                </button>
            </div>
            {sessionAgendas.length > 0 ? (
                <div className="space-y-4">
                    {sessionAgendas.map(agenda => (
                        <SessionAgendaCard
                            key={agenda.id} 
                            sessionAgenda={agenda}
                            onEdit={handleEdit} 
                            onDelete={onDeleteSessionAgenda}
                            canDelete={canDelete}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 bg-white rounded-lg shadow-md">
                    <p className="text-slate-500">No session agendas found. Add one to get started!</p>
                </div>
            )}
        </div>
    );
};

export default SessionAgendaView;