import React, { useState, useEffect, useMemo } from 'react';
import type { CommitteeMembership, Legislator, Term } from '../../types';

interface CommitteeMembershipFormProps {
    initialData?: CommitteeMembership | null;
    legislators: Legislator[];
    terms: Term[];
    onSubmit: (data: Omit<CommitteeMembership, 'id'> | CommitteeMembership) => void;
    onCancel: () => void;
}

const getInitialFormData = (): Omit<CommitteeMembership, 'id'> => ({
    committeeName: '',
    termYear: '',
    chairman: null,
    viceChairman: null,
    members: [],
});

const CommitteeMembershipForm: React.FC<CommitteeMembershipFormProps> = ({ initialData, legislators, terms, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(getInitialFormData());
    const [memberToAdd, setMemberToAdd] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData });
        } else {
             setFormData(getInitialFormData());
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value === 'null' ? null : value }));
    };

    const handleAddMember = () => {
        if (memberToAdd && !formData.members.includes(memberToAdd)) {
            setFormData(prev => ({
                ...prev,
                members: [...prev.members, memberToAdd],
            }));
            setMemberToAdd('');
        }
    };
    
    const handleRemoveMember = (memberId: string) => {
        setFormData(prev => ({
            ...prev,
            members: prev.members.filter(id => id !== memberId),
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.committeeName.trim() || !formData.termYear.trim()) {
            alert('Committee Name and Term Year are required.');
            return;
        }
        if(initialData) {
            onSubmit({ ...initialData, ...formData });
        } else {
            onSubmit(formData);
        }
    };

    const legislatorMap = useMemo(() => new Map(legislators.map(l => [l.id, l.name])), [legislators]);
    const availableMembers = useMemo(() => {
        return legislators.filter(l => !formData.members.includes(l.id));
    }, [legislators, formData.members]);

    const inputClasses = "block w-full px-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm";
    const labelClasses = "block text-sm font-medium text-slate-700 mb-1";

    return (
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg max-w-4xl mx-auto border border-slate-200">
            <h2 className="text-2xl font-bold text-brand-primary mb-6">
                {initialData ? 'Edit Committee Membership' : 'Add New Committee Membership'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="committeeName" className={labelClasses}>Name of Committee</label>
                        <input type="text" id="committeeName" name="committeeName" value={formData.committeeName} onChange={handleChange} className={inputClasses} required autoFocus />
                    </div>
                    <div>
                        <label htmlFor="termYear" className={labelClasses}>Term Year</label>
                        <select
                            id="termYear"
                            name="termYear"
                            value={formData.termYear}
                            onChange={handleChange}
                            className={inputClasses}
                            required
                        >
                            <option value="">-- Select a Term --</option>
                            {terms.map(term => (
                                <option key={term.id} value={`${term.yearFrom}-${term.yearTo}`}>
                                    {term.yearFrom.split('-')[0]}-{term.yearTo.split('-')[0]}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="chairman" className={labelClasses}>Chairman</label>
                        <select id="chairman" name="chairman" value={formData.chairman ?? 'null'} onChange={handleChange} className={inputClasses}>
                            <option value="null">-- Select Chairman --</option>
                            {legislators.map(leg => <option key={leg.id} value={leg.id}>{leg.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="viceChairman" className={labelClasses}>Vice-Chairman</label>
                        <select id="viceChairman" name="viceChairman" value={formData.viceChairman ?? 'null'} onChange={handleChange} className={inputClasses}>
                            <option value="null">-- Select Vice-Chairman --</option>
                            {legislators.map(leg => <option key={leg.id} value={leg.id}>{leg.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                     <label htmlFor="member" className={labelClasses}>Member/s</label>
                     <div className="flex gap-2">
                        <select id="member" value={memberToAdd} onChange={e => setMemberToAdd(e.target.value)} className={inputClasses}>
                           <option value="">-- Select a member to add --</option>
                           {availableMembers.map(leg => <option key={leg.id} value={leg.id}>{leg.name}</option>)}
                        </select>
                        <button type="button" onClick={handleAddMember} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors flex-shrink-0" disabled={!memberToAdd}>Add</button>
                     </div>
                     <ul className="mt-2 space-y-1">
                        {formData.members.map((id) => (
                            <li key={id} className="flex justify-between items-center bg-slate-50 p-2 rounded-md text-sm">
                                <span>{legislatorMap.get(id) || 'Unknown Legislator'}</span>
                                <button type="button" onClick={() => handleRemoveMember(id)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                            </li>
                        ))}
                         {formData.members.length === 0 && <p className="text-sm text-slate-400 italic mt-2">No members added yet.</p>}
                     </ul>
                </div>
                
                <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors">
                        Save Committee
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CommitteeMembershipForm;