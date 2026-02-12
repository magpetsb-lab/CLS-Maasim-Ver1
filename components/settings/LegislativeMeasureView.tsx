import React, { useState } from 'react';
import type { LegislativeMeasure, Sector } from '../../types';
import LegislativeMeasureCard from './LegislativeMeasureCard';
import LegislativeMeasureForm from './LegislativeMeasureForm';

interface LegislativeMeasureViewProps {
    legislativeMeasures: LegislativeMeasure[];
    sectors: Sector[];
    onAddLegislativeMeasure: (measure: Omit<LegislativeMeasure, 'id'>) => void;
    onUpdateLegislativeMeasure: (measure: LegislativeMeasure) => void;
    onDeleteLegislativeMeasure: (id: string) => void;
    canDelete: boolean;
}

const LegislativeMeasureView: React.FC<LegislativeMeasureViewProps> = (props) => {
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
    const [selectedMeasure, setSelectedMeasure] = useState<LegislativeMeasure | null>(null);

    const handleAddNew = () => {
        setSelectedMeasure(null);
        setMode('add');
    };

    const handleEdit = (measure: LegislativeMeasure) => {
        setSelectedMeasure(measure);
        setMode('edit');
    };

    const handleCancel = () => {
        setSelectedMeasure(null);
        setMode('list');
    };
    
    const handleSave = (measureData: Omit<LegislativeMeasure, 'id'> | LegislativeMeasure) => {
        if ('id' in measureData) {
            props.onUpdateLegislativeMeasure(measureData);
        } else {
            props.onAddLegislativeMeasure(measureData);
        }
        setMode('list');
        setSelectedMeasure(null);
    }

    if (mode === 'add' || mode === 'edit') {
        return (
            <div>
                <LegislativeMeasureForm
                    initialData={selectedMeasure}
                    sectors={props.sectors}
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
                    Define legislative measures and group them by sector for reporting.
                </p>
                <button
                    onClick={handleAddNew}
                    className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors flex-shrink-0"
                >
                    Add New Measure
                </button>
            </div>
            {props.legislativeMeasures.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {props.legislativeMeasures.map(measure => (
                        <LegislativeMeasureCard
                            key={measure.id}
                            measure={measure}
                            sectors={props.sectors}
                            onEdit={handleEdit}
                            onDelete={props.onDeleteLegislativeMeasure}
                            canDelete={props.canDelete}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 bg-slate-50 rounded-lg mt-6">
                    <p className="text-slate-500">No legislative measures found. Add one to get started!</p>
                </div>
            )}
        </div>
    );
};

export default LegislativeMeasureView;