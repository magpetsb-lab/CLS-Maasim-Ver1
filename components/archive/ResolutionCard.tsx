import React from 'react';
import type { Resolution } from '../../types';

interface ResolutionCardProps {
    resolution: Resolution;
    onEdit: (res: Resolution) => void;
    onDelete: (id: string) => void;
    canDelete: boolean;
}

const formatTerm = (term: string) => {
    const matches = term.match(/^(\d{4}).*?(\d{4})/);
    return matches ? `${matches[1]}-${matches[2]}` : term;
};

const ResolutionCard: React.FC<ResolutionCardProps> = ({ resolution, onEdit, onDelete, canDelete }) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-grow">
                    <div className="flex items-center flex-wrap gap-4 mb-2">
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-800">
                           Res. No: {resolution.resolutionNumber}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-yellow-100 text-yellow-800">
                           Term: {formatTerm(resolution.term)}
                        </span>
                        <p className="text-xs text-slate-500">Approved: {resolution.dateApproved}</p>
                    </div>
                    <h3 className="text-base font-bold text-brand-primary mb-2">{resolution.resolutionTitle}</h3>
                    <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1 mt-3">
                        <span><strong>Author:</strong> {resolution.author}</span>
                        <span><strong>Committee:</strong> {resolution.committee}</span>
                        <span><strong>Sector:</strong> {resolution.sector}</span>
                    </div>
                </div>
                <div className="flex-shrink-0 flex items-center space-x-2 mt-4 sm:mt-0 self-start sm:self-center">
                    {resolution.filePath && (
                        <a
                            href={resolution.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors inline-flex items-center"
                            aria-label="View attached file"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 006 0V7a1 1 0 112 0v4a5 5 0 01-10 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                            </svg>
                            View Attachment
                        </a>
                    )}
                    <button 
                        onClick={() => onEdit(resolution)}
                        className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                    >
                        Edit
                    </button>
                    {canDelete && (
                        <button 
                            onClick={() => onDelete(resolution.id)}
                            className="px-2 py-0.5 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResolutionCard;