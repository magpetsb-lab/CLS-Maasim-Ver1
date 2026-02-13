import React from 'react';
import type { SessionMinute, AttendanceStatus } from '../../types';

interface SessionMinuteCardProps {
    sessionMinute: SessionMinute;
    onEdit: (minute: SessionMinute) => void;
    onDelete: (id: string) => void;
    canDelete?: boolean;
}

const formatTerm = (term: string) => {
    const matches = term.match(/^(\d{4}).*?(\d{4})/);
    return matches ? `${matches[1]}-${matches[2]}` : term;
};

const SessionMinuteCard: React.FC<SessionMinuteCardProps> = ({ sessionMinute, onEdit, onDelete, canDelete }) => {
    const typeColor = sessionMinute.sessionType === 'Regular' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800';
    
    const attendanceSummary = (sessionMinute.sessionAttendance || []).reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {} as Record<AttendanceStatus, number>);


    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-grow">
                    <div className="flex items-center flex-wrap gap-4 mb-2">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">
                           File Record No: {sessionMinute.sessionNumber}
                        </span>
                         <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                           Term: {formatTerm(sessionMinute.term)}
                        </span>
                        <p className="text-sm text-slate-500">Date: {sessionMinute.sessionDate}</p>
                    </div>
                    <h3 className="text-lg font-bold text-brand-primary mb-3">
                        Minutes of the {sessionMinute.sessionType} Session
                    </h3>
                    
                     <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${typeColor}`}>
                            {sessionMinute.sessionType}
                        </span>
                        <div className="text-xs text-slate-500 font-mono flex flex-wrap gap-x-3 gap-y-1">
                            <span>Present: <span className="font-bold text-slate-700">{attendanceSummary.Present || 0}</span></span>
                            <span>Absent: <span className="font-bold text-slate-700">{attendanceSummary.Absent || 0}</span></span>
                            <span>OB: <span className="font-bold text-slate-700">{attendanceSummary.OB || 0}</span></span>
                            <span>Leave: <span className="font-bold text-slate-700">{attendanceSummary.Leave || 0}</span></span>
                        </div>
                     </div>
                </div>
                <div className="flex-shrink-0 flex items-center space-x-2 mt-4 sm:mt-0 self-start sm:self-center">
                    {sessionMinute.filePath && (
                        <a
                            href={sessionMinute.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors inline-flex items-center"
                            aria-label="View attached file"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 006 0V7a1 1 0 112 0v4a5 5 0 01-10 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                            </svg>
                            View Attachment
                        </a>
                    )}
                    <button 
                        onClick={() => onEdit(sessionMinute)}
                        className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                    >
                        Edit
                    </button>
                    {canDelete && (
                        <button 
                            onClick={() => onDelete(sessionMinute.id)}
                            className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SessionMinuteCard;