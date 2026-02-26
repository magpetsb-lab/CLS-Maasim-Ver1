
import React from 'react';
import type { UserAccount } from '../../types';

interface UserAccountCardProps {
    userAccount: UserAccount;
    canEdit: boolean;
    onEdit: (user: UserAccount) => void;
    onDelete: (id: string) => void;
}

const UserAccountCard: React.FC<UserAccountCardProps> = ({ userAccount, canEdit, onEdit, onDelete }) => {
    
    const roleColor = userAccount.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
    const statusColor = userAccount.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-800';
    
    return (
        <div className="bg-slate-50 rounded-lg shadow-sm p-4 border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${roleColor} capitalize`}>
                           {userAccount.role}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusColor}`}>
                            {userAccount.status}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-brand-primary leading-tight">{userAccount.name}</h3>
                    <p className="text-sm text-brand-secondary font-medium mb-0.5">{userAccount.position}</p>
                    <p className="text-xs text-slate-600">ID: <span className="font-mono font-semibold">{userAccount.userId}</span></p>
                    <p className="text-xs text-slate-600">{userAccount.email}</p>
                </div>
                {canEdit && (
                    <div className="flex-shrink-0 flex items-center space-x-2 mt-2 sm:mt-0 self-start sm:self-center">
                        <button 
                            onClick={() => onEdit(userAccount)}
                            className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                        >
                            Edit
                        </button>
                        <button 
                            onClick={() => onDelete(userAccount.id)}
                            className="px-2 py-0.5 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserAccountCard;
