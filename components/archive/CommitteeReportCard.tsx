import React from 'react';
import type { CommitteeReport } from '../../types';

interface CommitteeReportCardProps {
    committeeReport: CommitteeReport;
    onEdit: (report: CommitteeReport) => void;
    onDelete: (id: string) => void;
    canDelete?: boolean;
}

const formatTerm = (term: string) => {
    const matches = term.match(/^(\d{4}).*?(\d{4})/);
    return matches ? `${matches[1]}-${matches[2]}` : term;
};

const CommitteeReportCard: React.FC<CommitteeReportCardProps> = ({ committeeReport, onEdit, onDelete, canDelete }) => {
    const typeColor = committeeReport.committeeType === 'Meeting' ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800';
    
    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <div className="flex-grow">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">
                           Report No: {committeeReport.reportNumber}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Term: {formatTerm(committeeReport.term)}
                        </span>
                         <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${typeColor}`}>
                            {committeeReport.committeeType}
                        </span>
                        <p className="text-xs text-slate-500">Date: {committeeReport.date}</p>
                    </div>
                    <h3 className="text-lg font-bold text-brand-primary mb-1 leading-tight">
                        {committeeReport.committee}
                    </h3>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end space-y-1 mt-2 sm:mt-0 self-start sm:self-center">
                     {/* Legacy File Path */}
                     {committeeReport.filePath && !committeeReport.attachments?.length && (
                        <a
                            href={committeeReport.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors inline-flex items-center"
                            aria-label="View attached file"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 006 0V7a1 1 0 112 0v4a5 5 0 01-10 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                            </svg>
                            View
                        </a>
                    )}

                    {/* Multiple Attachments */}
                    {committeeReport.attachments && committeeReport.attachments.length > 0 && (
                        <div className="flex flex-col gap-1 items-end">
                            {committeeReport.attachments.map((att, idx) => (
                                <a
                                    key={att.id || idx}
                                    href={att.data}
                                    download={att.name}
                                    className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors inline-flex items-center max-w-[150px] truncate"
                                    title={att.name}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 006 0V7a1 1 0 112 0v4a5 5 0 01-10 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                                    </svg>
                                    <span className="truncate">{att.name}</span>
                                </a>
                            ))}
                        </div>
                    )}

                    <div className="flex space-x-2">
                        <button 
                            onClick={() => onEdit(committeeReport)}
                            className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                        >
                            Edit
                        </button>
                        {canDelete && (
                            <button 
                                onClick={() => onDelete(committeeReport.id)}
                                className="px-2 py-0.5 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommitteeReportCard;