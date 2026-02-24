
import React, { useState } from 'react';
import type { UserAccount, UserRole } from '../../types';
import UserAccountCard from './UserAccountCard';
import UserAccountForm from './UserAccountForm';

interface UserAccountViewProps {
    currentUserRole: UserRole;
    userAccounts: UserAccount[];
    onAddUserAccount: (user: Omit<UserAccount, 'id'>) => void;
    onUpdateUserAccount: (user: UserAccount) => void;
    onDeleteUserAccount: (id: string) => void;
}

const UserAccountView: React.FC<UserAccountViewProps> = (props) => {
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
    const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
    const isAdmin = props.currentUserRole === 'admin' || props.currentUserRole === 'developer';

    const handleAddNew = () => {
        if (!isAdmin) return;
        setSelectedUser(null);
        setMode('add');
    };

    const handleEdit = (user: UserAccount) => {
        if (!isAdmin) return;
        setSelectedUser(user);
        setMode('edit');
    };

    const handleCancel = () => {
        setSelectedUser(null);
        setMode('list');
    };
    
    const handleSave = (userData: Omit<UserAccount, 'id'> | UserAccount) => {
        if ('id' in userData) {
            props.onUpdateUserAccount(userData);
        } else {
            props.onAddUserAccount(userData);
        }
        setMode('list');
        setSelectedUser(null);
    }

    if ((mode === 'add' || mode === 'edit') && isAdmin) {
        return (
            <div>
                <UserAccountForm
                    initialData={selectedUser}
                    onSubmit={handleSave}
                    onCancel={handleCancel}
                />
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <p className="text-slate-600">
                    {isAdmin ? 'Manage user roles and access permissions.' : 'View all registered user accounts.'}
                </p>
                {isAdmin && (
                    <button
                        onClick={handleAddNew}
                        className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors flex-shrink-0"
                    >
                        Add New User
                    </button>
                )}
            </div>
            {props.userAccounts.length > 0 ? (
                <div className="space-y-4">
                    {props.userAccounts.map(user => (
                        <UserAccountCard
                            key={user.id} 
                            userAccount={user}
                            canEdit={isAdmin}
                            onEdit={handleEdit} 
                            onDelete={props.onDeleteUserAccount}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 bg-slate-50 rounded-lg mt-6">
                    <p className="text-slate-500">No user accounts found. {isAdmin && 'Add one to get started!'}</p>
                </div>
            )}
        </div>
    );
};

export default UserAccountView;