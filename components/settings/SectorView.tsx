import React, { useState } from 'react';
import type { Sector } from '../../types';
import SectorCard from './SectorCard';
import SectorForm from './SectorForm';

interface SectorViewProps {
    sectors: Sector[];
    onAddSector: (sector: Omit<Sector, 'id'>) => void;
    onUpdateSector: (sector: Sector) => void;
    onDeleteSector: (id: string) => void;
    canDelete: boolean;
}

const SectorView: React.FC<SectorViewProps> = (props) => {
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
    const [selectedSector, setSelectedSector] = useState<Sector | null>(null);

    const handleAddNew = () => {
        setSelectedSector(null);
        setMode('add');
    };

    const handleEdit = (sector: Sector) => {
        setSelectedSector(sector);
        setMode('edit');
    };

    const handleCancel = () => {
        setSelectedSector(null);
        setMode('list');
    };
    
    const handleSave = (sectorData: Omit<Sector, 'id'> | Sector) => {
        if ('id' in sectorData) {
            props.onUpdateSector(sectorData);
        } else {
            props.onAddSector(sectorData);
        }
        setMode('list');
        setSelectedSector(null);
    }

    if (mode === 'add' || mode === 'edit') {
        return (
            <div>
                <SectorForm
                    initialData={selectedSector}
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
                    Define sectors for categorizing resolutions.
                </p>
                <button
                    onClick={handleAddNew}
                    className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors flex-shrink-0"
                >
                    Add New Sector
                </button>
            </div>
            {props.sectors.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {props.sectors.map(sector => (
                        <SectorCard
                            key={sector.id}
                            sector={sector}
                            onEdit={handleEdit}
                            onDelete={props.onDeleteSector}
                            canDelete={props.canDelete}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 bg-slate-50 rounded-lg mt-6">
                    <p className="text-slate-500">No sectors found. Add one to get started!</p>
                </div>
            )}
        </div>
    );
};

export default SectorView;