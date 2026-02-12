
import React from 'react';
import type { Legislator } from '../types';

interface LegislationCardProps {
  legislator: Legislator;
  onEdit: (legislator: Legislator) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const formatTerm = (term: string) => {
    const matches = term.match(/^(\d{4}).*?(\d{4})/);
    return matches ? `${matches[1]}-${matches[2]}` : term;
};

const LegislationCard: React.FC<LegislationCardProps> = ({ legislator, onEdit, onDelete, canDelete }) => {
  return (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col h-full items-center p-6"
    >
        <div className="w-24 h-24 rounded-full bg-slate-100 mb-4 overflow-hidden border-2 border-slate-200">
            {legislator.profileImageUrl ? (
                <img src={legislator.profileImageUrl} alt={legislator.name} className="w-full h-full object-cover" />
            ) : (
                <UserIcon />
            )}
        </div>
        <h3 className="text-lg font-bold text-brand-primary">{legislator.name}</h3>
        
        {legislator.positions.length > 0 ? (
            <div className="w-full mt-4 space-y-2 text-left">
                {legislator.positions.map((pos) => (
                    <div key={pos.id} className="bg-slate-50 p-2 rounded-md border border-slate-200">
                        <p className="text-sm font-semibold text-brand-dark">{pos.title}</p>
                        <div className="text-xs text-slate-500 mt-1 font-mono">
                            <span>Term: {formatTerm(pos.term)}</span> | <span>{pos.rank}</span>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-sm text-slate-500 mt-2 italic">No positions assigned.</p>
        )}

        <div className="flex space-x-2 mt-auto pt-4">
            <button
                onClick={() => onEdit(legislator)}
                className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
            >
                Edit
            </button>
            {canDelete && (
                <button
                    onClick={() => onDelete(legislator.id)}
                    className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                >
                    Delete
                </button>
            )}
        </div>
    </div>
  );
};

export default LegislationCard;
