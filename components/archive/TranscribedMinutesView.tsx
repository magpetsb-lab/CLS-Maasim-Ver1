
import React, { useState } from 'react';
import type { SessionMinute, Term } from '../../types';
import TranscribedMinutesCard from './TranscribedMinutesCard';
import TranscribedMinutesForm from './TranscribedMinutesForm';

interface TranscribedMinutesViewProps {
    sessionMinutes: SessionMinute[];
    onAddSessionMinute: (minute: Omit<SessionMinute, 'id'>) => void;
    onUpdateSessionMinute: (minute: SessionMinute) => void;
    onDeleteSessionMinute: (id: string) => void;
    terms: Term[];
    canDelete: boolean;
}

const TranscribedMinutesView: React.FC<TranscribedMinutesViewProps> = ({ sessionMinutes, onAddSessionMinute, onUpdateSessionMinute, onDeleteSessionMinute, terms, canDelete }) => {
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
    const [selectedMinute, setSelectedMinute] = useState<SessionMinute | null>(null);

    const handleAddNew = () => {
        setSelectedMinute(null);
        setMode('add');
    };

    const handleEdit = (minute: SessionMinute) => {
        setSelectedMinute(minute);
        setMode('edit');
    };

    const handleCancel = () => {
        setSelectedMinute(null);
        setMode('list');
    };
    
    const handleSave = (minuteData: Omit<SessionMinute, 'id'> | SessionMinute) => {
        if ('id' in minuteData) {
            onUpdateSessionMinute(minuteData);
        } else {
            onAddSessionMinute(minuteData);
        }
        setMode('list');
        setSelectedMinute(null);
    }

    if (mode === 'add' || mode === 'edit') {
        return (
            <TranscribedMinutesForm
                initialData={selectedMinute}
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
                    Add Transcribed Minutes
                </button>
            </div>
            {sessionMinutes.length > 0 ? (
                <div className="space-y-4">
                    {sessionMinutes.map(minute => (
                        <TranscribedMinutesCard
                            key={minute.id} 
                            sessionMinute={minute}
                            onEdit={handleEdit} 
                            onDelete={onDeleteSessionMinute}
                            canDelete={canDelete}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 bg-white rounded-lg shadow-md">
                    <p className="text-slate-500">No minutes available for transcription.</p>
                </div>
            )}
        </div>
    );
};

export default TranscribedMinutesView;