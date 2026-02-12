import React from 'react';
import type { LegislativeMeasure, Sector } from '../../types';

interface LegislativeMeasureCardProps {
    measure: LegislativeMeasure;
    sectors: Sector[];
    onEdit: (measure: LegislativeMeasure) => void;
    onDelete: (id: string) => void;
    canDelete?: boolean;
}

const LegislativeMeasureCard: React.FC<LegislativeMeasureCardProps> = ({ measure, sectors, onEdit, onDelete, canDelete }) => {
    const sectorNames = measure.sectorIds
        ? measure.sectorIds.map(id => sectors.find(s => s.id === id)?.name).filter(Boolean)
        : [];

    return (
        <div className="bg-slate-50 rounded-lg shadow-sm p-6 border border-slate-200 text-center flex flex-col justify-between h-full">
            <div>
                <p className="text-sm text-slate-500 mb-1">Measure</p>
                <h3 className="text-xl font-bold text-brand-primary mb-3">
                    {measure.title}
                </h3>
                <div className="flex flex-wrap justify-center gap-1.5">
                    {sectorNames.length > 0 ? (
                        sectorNames.map((name, index) => (
                            <span key={index} className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                                {name}
                            </span>
                        ))
                    ) : (
                        <span className="text-xs text-slate-400 italic">No sectors assigned</span>
                    )}
                </div>
            </div>
            <div className="flex space-x-2 mt-6 justify-center">
                <button
                    onClick={() => onEdit(measure)}
                    className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                >
                    Edit
                </button>
                {canDelete && (
                    <button
                        onClick={() => onDelete(measure.id)}
                        className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                    >
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
};

export default LegislativeMeasureCard;