
import React from 'react';
import type { Term } from '../../types';

interface TermCardProps {
    term: Term;
    onEdit: (term: Term) => void;
    onDelete: (id: string) => void;
    canDelete?: boolean;
}

const TermCard: React.FC<TermCardProps> = ({ term, onEdit, onDelete, canDelete }) => {
    // Helper to format date string nicely if it's a valid date
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr; // Return as is if not a valid date
        return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const getYear = (dateStr: string) => {
        if (!dateStr) return '????';
        return dateStr.split('-')[0];
    };

    return (
        <div className="bg-slate-50 rounded-lg shadow-sm p-6 border border-slate-200 text-center flex flex-col justify-between h-full">
            <div>
                <h3 className="text-xl font-bold text-brand-primary mt-2">
                    Term: {getYear(term.yearFrom)}-{getYear(term.yearTo)}
                </h3>
                <p className="text-sm text-slate-500 mt-2">
                    {formatDate(term.yearFrom)} - {formatDate(term.yearTo)}
                </p>
            </div>
            <div className="flex space-x-2 mt-4 justify-center">
                <button
                    onClick={() => onEdit(term)}
                    className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                >
                    Edit
                </button>
                {canDelete && (
                    <button
                        onClick={() => onDelete(term.id)}
                        className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                    >
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
};

export default TermCard;
