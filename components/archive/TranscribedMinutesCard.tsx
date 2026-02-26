
import React from 'react';
import type { SessionMinute } from '../../types';

interface TranscribedMinutesCardProps {
    sessionMinute: SessionMinute;
    onEdit: (minute: SessionMinute) => void;
    onDelete: (id: string) => void;
    canDelete?: boolean;
}

const formatTerm = (term: string) => {
    const matches = term.match(/^(\d{4}).*?(\d{4})/);
    return matches ? `${matches[1]}-${matches[2]}` : term;
};

const TranscribedMinutesCard: React.FC<TranscribedMinutesCardProps> = ({ sessionMinute, onEdit, onDelete, canDelete }) => {
    const typeColor = sessionMinute.sessionType === 'Regular' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800';
    
    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <div className="flex-grow">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-800">
                           Session No: {sessionMinute.sessionNumber}
                        </span>
                         <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-yellow-100 text-yellow-800">
                           Term: {formatTerm(sessionMinute.term)}
                        </span>
                        <p className="text-[10px] text-slate-500">Date: {sessionMinute.sessionDate}</p>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-bold text-brand-primary leading-tight">
                            Transcribed Minutes / Journal
                        </h3>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${typeColor}`}>
                            {sessionMinute.sessionType}
                        </span>
                    </div>
                    
                    {sessionMinute.audioFilePath && (
                        <div className="mb-2 p-2 bg-indigo-50 border border-indigo-100 rounded-md">
                            <p className="text-[10px] font-bold text-indigo-700 uppercase mb-1">Session Audio Recording</p>
                            <audio controls src={sessionMinute.audioFilePath} className="w-full h-6" />
                        </div>
                    )}

                    {sessionMinute.minutesContent ? (
                        <div className="mb-1 p-3 bg-slate-50 border border-slate-200 rounded-md shadow-inner">
                            <p className="text-xs text-slate-800 whitespace-pre-wrap line-clamp-3 font-serif leading-relaxed">
                                {sessionMinute.minutesContent}
                            </p>
                        </div>
                    ) : (
                        <div className="mb-1 p-3 bg-slate-50 border border-slate-200 rounded-md border-dashed flex items-center justify-center">
                            <p className="text-[10px] text-slate-400 italic">No transcribed content available.</p>
                        </div>
                    )}
                </div>
                <div className="flex-shrink-0 flex items-center space-x-2 mt-2 sm:mt-0 self-start sm:self-center">
                    <button 
                        onClick={() => onEdit(sessionMinute)}
                        className="px-2 py-0.5 text-[10px] font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                    >
                        Edit Transcription
                    </button>
                    {canDelete && (
                        <button 
                            onClick={() => onDelete(sessionMinute.id)}
                            className="px-2 py-0.5 text-[10px] font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TranscribedMinutesCard;
