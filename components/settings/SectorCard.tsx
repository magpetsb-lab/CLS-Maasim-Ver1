import React, { isValidElement } from 'react';
import type { Sector } from '../../types';

interface SectorCardProps {
    sector: Sector;
    onEdit: (sector: Sector) => void;
    onDelete: (id: string) => void;
    canDelete?: boolean;
}

const SectorCard: React.FC<SectorCardProps> = ({ sector, onEdit, onDelete, canDelete }) => {
    return (
        <div className="bg-slate-50 rounded-lg shadow-sm p-6 border border-slate-200 text-center flex flex-col justify-between h-full">
            <div>
                <p className="text-sm text-slate-500">Sector</p>
                <h3 className="text-xl font-bold text-brand-primary mt-1">
                    {sector.name}
                </h3>
            </div>
            <div className="flex space-x-2 mt-4 justify-center">
                <button
                    onClick={() => onEdit(sector)}
                    className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                >
                    Edit
                </button>
                {canDelete && (
                    <button
                        onClick={() => onDelete(sector.id)}
                        className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                    >
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
};

export default SectorCard;