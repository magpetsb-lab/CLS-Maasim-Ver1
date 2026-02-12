
import React, { useMemo } from 'react';
import type { CommitteeMembership, Legislator } from '../../types';

interface CommitteeMembershipCardProps {
    committeeMembership: CommitteeMembership;
    legislators: Legislator[];
    onEdit: (mem: CommitteeMembership) => void;
    onDelete: (id: string) => void;
    canDelete?: boolean;
}

const formatTerm = (term: string) => {
    const matches = term.match(/^(\d{4}).*?(\d{4})/);
    return matches ? `${matches[1]}-${matches[2]}` : term;
};

const CommitteeMembershipCard: React.FC<CommitteeMembershipCardProps> = ({ committeeMembership, legislators, onEdit, onDelete, canDelete }) => {
    
    const legislatorMap = useMemo(() => {
        return new Map(legislators.map(leg => [leg.id, leg.name]));
    }, [legislators]);

    const chairmanName = committeeMembership.chairman ? legislatorMap.get(committeeMembership.chairman) : 'N/A';
    const viceChairmanName = committeeMembership.viceChairman ? legislatorMap.get(committeeMembership.viceChairman) : 'N/A';
    const memberNames = committeeMembership.members.map(id => legislatorMap.get(id) || 'Unknown').filter(Boolean);

    return (
        <div className="bg-slate-50 rounded-lg shadow-sm p-6 border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-grow">
                     <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-200 text-slate-800">
                        Term: {formatTerm(committeeMembership.termYear)}
                    </span>
                    <h3 className="text-lg font-bold text-brand-primary mt-2 mb-4">{committeeMembership.committeeName}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="font-semibold text-slate-700">Chairman:</p>
                            <p className="text-slate-600">{chairmanName}</p>
                        </div>
                        <div>
                             <p className="font-semibold text-slate-700">Vice-Chairman:</p>
                             <p className="text-slate-600">{viceChairmanName}</p>
                        </div>
                        <div>
                             <p className="font-semibold text-slate-700">Members:</p>
                             {memberNames.length > 0 ? (
                                <ul className="list-disc list-inside text-slate-600">
                                    {memberNames.map((name, index) => <li key={index}>{name}</li>)}
                                </ul>
                             ) : (
                                <p className="text-slate-500 italic">No members assigned</p>
                             )}
                        </div>
                    </div>
                </div>
                <div className="flex-shrink-0 flex items-center space-x-2 mt-4 sm:mt-0 self-start sm:self-center">
                    <button 
                        onClick={() => onEdit(committeeMembership)}
                        className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                    >
                        Edit
                    </button>
                    {canDelete && (
                        <button 
                            onClick={() => onDelete(committeeMembership.id)}
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

export default CommitteeMembershipCard;
