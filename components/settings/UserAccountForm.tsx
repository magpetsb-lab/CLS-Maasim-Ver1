import React, { useState, useEffect } from 'react';
import type { UserAccount } from '../../types';

interface UserAccountFormProps {
    initialData?: UserAccount | null;
    onSubmit: (data: Omit<UserAccount, 'id'> | UserAccount) => void;
    onCancel: () => void;
}

const getInitialFormData = (): Omit<UserAccount, 'id'> => ({
    userId: '',
    name: '',
    position: '',
    email: '',
    role: 'user',
    status: 'Active',
});

const UserAccountForm: React.FC<UserAccountFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(getInitialFormData());
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData });
        } else {
            setFormData(getInitialFormData());
        }
        setPassword('');
        setConfirmPassword('');
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value as any }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.userId.trim() || !formData.name.trim() || !formData.email.trim() || !formData.position.trim()) {
            alert('User ID, Name, Position, and Email are required.');
            return;
        }

        if (!initialData) { // New user
            if (!password) {
                alert('Password is required for new users.');
                return;
            }
            if (password !== confirmPassword) {
                alert('Passwords do not match.');
                return;
            }
        } else { // Editing user
            if (password && password !== confirmPassword) {
                 alert('Passwords do not match.');
                return;
            }
        }
        
        const dataToSubmit = { ...formData };
        if (password) {
            (dataToSubmit as any).password = password;
        }

        if(initialData) {
            onSubmit({ ...initialData, ...dataToSubmit });
        } else {
            onSubmit(dataToSubmit);
        }
    };

    const inputClasses = "block w-full px-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm";
    const labelClasses = "block text-sm font-medium text-slate-700 mb-1";

    return (
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg max-w-xl mx-auto border border-slate-200">
            <h2 className="text-2xl font-bold text-brand-primary mb-6">
                {initialData ? 'Edit User Account' : 'Add New User Account'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2">
                        <label htmlFor="userId" className={labelClasses}>User ID (Login ID)</label>
                        <input type="text" id="userId" name="userId" value={formData.userId} onChange={handleChange} className={inputClasses} required autoFocus />
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="name" className={labelClasses}>Full Name</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="position" className={labelClasses}>Position</label>
                        <input type="text" id="position" name="position" value={formData.position} onChange={handleChange} className={inputClasses} placeholder="e.g., Legislative Staff" required />
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="email" className={labelClasses}>Email Address</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <div>
                        <label htmlFor="role" className={labelClasses}>Role</label>
                        <select id="role" name="role" value={formData.role} onChange={handleChange} className={inputClasses}>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="status" className={labelClasses}>Status</label>
                         <select id="status" name="status" value={formData.status} onChange={handleChange} className={inputClasses}>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="sm:col-span-2 border-t border-slate-200 pt-6">
                        <p className="text-sm text-slate-500 mb-2">{initialData ? 'Set a new password (optional):' : 'Set a password:'}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                             <div>
                                <label htmlFor="password" className={labelClasses}>Password</label>
                                <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} className={inputClasses} />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className={labelClasses}>Confirm Password</label>
                                <input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClasses} />
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors">
                        Save User
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserAccountForm;