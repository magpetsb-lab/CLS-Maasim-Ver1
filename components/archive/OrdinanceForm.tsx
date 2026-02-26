import React, { useState, useEffect, useMemo } from 'react';
import type { Ordinance, Legislator, CommitteeMembership, Term, Sector } from '../../types';

interface OrdinanceFormProps {
    initialData?: Ordinance | null;
    onSubmit: (data: Omit<Ordinance, 'id'> | Ordinance) => void;
    onCancel: () => void;
    legislators: Legislator[];
    committeeMemberships: CommitteeMembership[];
    terms: Term[];
    sectors: Sector[];
}

const getInitialFormData = (): Omit<Ordinance, 'id'> => ({
    ordinanceNumber: '',
    dateEnacted: '',
    dateApproved: '',
    ordinanceTitle: '',
    author: '',
    committee: '',
    term: '',
    sector: '',
    fullText: '',
    filePath: undefined,
    attachments: [],
});

const OrdinanceForm: React.FC<OrdinanceFormProps> = ({ initialData, onSubmit, onCancel, legislators, committeeMemberships, terms, sectors }) => {
    const [formData, setFormData] = useState(getInitialFormData());
    const [newAttachments, setNewAttachments] = useState<File[]>([]);

    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData, attachments: initialData.attachments || [] });
        } else {
             setFormData(getInitialFormData());
        }
        setNewAttachments([]);
    }, [initialData]);

    const availableAuthors = useMemo(() => {
        if (!formData.term) return legislators;
        return legislators.filter(l => l.positions.some(p => p.term === formData.term));
    }, [legislators, formData.term]);

    const availableCommittees = useMemo(() => {
        if (!formData.term) return committeeMemberships.map(c => c.committeeName);
        return Array.from(new Set(committeeMemberships.map(c => c.committeeName)));
    }, [committeeMemberships, formData.term]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            setNewAttachments(prev => [...prev, ...files]);
        }
    };

    const handleRemoveAttachment = (index: number, isNew: boolean) => {
        if (isNew) {
            setNewAttachments(prev => prev.filter((_, i) => i !== index));
        } else {
            setFormData(prev => ({
                ...prev,
                attachments: prev.attachments?.filter((_, i) => i !== index)
            }));
        }
    };
    
    // Legacy support
    const handleRemoveLegacyAttachment = () => {
        setFormData(prev => ({...prev, filePath: undefined}));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.ordinanceNumber.trim() || !formData.ordinanceTitle.trim()) {
            alert('Ordinance Number and Title are required.');
            return;
        }

        const finalData = { ...formData };
        
        // Process new attachments
        if (newAttachments.length > 0) {
            const processedAttachments = await Promise.all(newAttachments.map(async (file) => {
                return new Promise<{id: string, name: string, data: string, type: string}>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve({
                        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        name: file.name,
                        data: reader.result as string,
                        type: file.type
                    });
                    reader.onerror = error => reject(error);
                });
            }));
            
            finalData.attachments = [...(finalData.attachments || []), ...processedAttachments];
        }

        if(initialData) {
            onSubmit({ ...initialData, ...finalData });
        } else {
            onSubmit(finalData);
        }
    };

    const inputClasses = "block w-full px-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm";
    const labelClasses = "block text-sm font-medium text-slate-700 mb-1";

    return (
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg max-w-4xl mx-auto relative">
            <h2 className="text-2xl font-bold text-brand-primary mb-6">
                {initialData ? 'Edit Ordinance' : 'Add New Ordinance'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="ordinanceNumber" className={labelClasses}>Ordinance Number</label>
                        <input type="text" id="ordinanceNumber" name="ordinanceNumber" value={formData.ordinanceNumber} onChange={handleChange} className={inputClasses} required placeholder="e.g., 2023-001" />
                    </div>
                    <div>
                        <label htmlFor="term" className={labelClasses}>Term</label>
                        <select id="term" name="term" value={formData.term} onChange={handleChange} className={inputClasses} required>
                            <option value="" disabled>-- Select Term --</option>
                            {terms.map(term => (
                                <option key={term.id} value={`${term.yearFrom}-${term.yearTo}`}>
                                    {term.yearFrom} - {term.yearTo}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="dateEnacted" className={labelClasses}>Date Enacted</label>
                        <input type="date" id="dateEnacted" name="dateEnacted" value={formData.dateEnacted} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <div>
                        <label htmlFor="dateApproved" className={labelClasses}>Date Approved</label>
                        <input type="date" id="dateApproved" name="dateApproved" value={formData.dateApproved} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="ordinanceTitle" className={labelClasses}>Ordinance Title</label>
                        <textarea id="ordinanceTitle" name="ordinanceTitle" value={formData.ordinanceTitle} onChange={handleChange} rows={3} className={inputClasses} required />
                    </div>
                    <div>
                        <label htmlFor="author" className={labelClasses}>Author/Sponsor</label>
                        <select id="author" name="author" value={formData.author} onChange={handleChange} className={inputClasses} required>
                            <option value="" disabled>-- Select Author --</option>
                            {availableAuthors.map(legislator => (
                                <option key={legislator.id} value={legislator.name}>{legislator.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="committee" className={labelClasses}>Committee</label>
                        <select id="committee" name="committee" value={formData.committee} onChange={handleChange} className={inputClasses} required>
                            <option value="" disabled>-- Select Committee --</option>
                            {availableCommittees.map((committee, idx) => (
                                <option key={idx} value={committee}>{committee}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="sector" className={labelClasses}>Sector</label>
                        <select id="sector" name="sector" value={formData.sector} onChange={handleChange} className={inputClasses} required>
                            <option value="" disabled>-- Select Sector --</option>
                            {sectors.map(sector => (
                                <option key={sector.id} value={sector.name}>{sector.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="fullText" className={labelClasses}>Full Text / Summary</label>
                        <textarea id="fullText" name="fullText" value={formData.fullText} onChange={handleChange} rows={5} className={inputClasses} />
                    </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                     <div className="md:col-span-2">
                        <label className={labelClasses}>Attachments</label>
                        
                        {/* Legacy Attachment Display */}
                        {formData.filePath && (
                            <div className="flex items-center gap-2 mb-2 text-sm bg-slate-50 p-2 rounded border border-slate-200">
                                <span className="text-slate-500 font-medium">Legacy Attachment:</span>
                                <a href={formData.filePath} target="_blank" rel="noopener noreferrer" className="text-brand-secondary hover:underline truncate max-w-xs">
                                    View File
                                </a>
                                <button type="button" onClick={handleRemoveLegacyAttachment} className="ml-auto font-semibold text-red-600 hover:text-red-800 text-xs uppercase">Remove</button>
                            </div>
                        )}

                        {/* Existing Attachments List */}
                        {formData.attachments && formData.attachments.length > 0 && (
                            <div className="space-y-2 mb-3">
                                {formData.attachments.map((att, idx) => (
                                    <div key={att.id} className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded border border-slate-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                        <a href={att.data} download={att.name} className="text-brand-secondary hover:underline truncate flex-grow">
                                            {att.name}
                                        </a>
                                        <button type="button" onClick={() => handleRemoveAttachment(idx, false)} className="font-semibold text-red-600 hover:text-red-800 text-xs uppercase">Remove</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* New Attachments List */}
                        {newAttachments.length > 0 && (
                            <div className="space-y-2 mb-3">
                                {newAttachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded border border-blue-100">
                                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">New</span>
                                        <span className="text-slate-700 truncate flex-grow">{file.name}</span>
                                        <button type="button" onClick={() => handleRemoveAttachment(idx, true)} className="font-semibold text-red-600 hover:text-red-800 text-xs uppercase">Remove</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-2">
                            <label htmlFor="attachment" className="cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Files
                            </label>
                            <input
                                type="file"
                                id="attachment"
                                name="attachment"
                                onChange={handleFileChange}
                                className="hidden"
                                multiple
                                accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                            />
                            <p className="mt-1 text-xs text-slate-500">Supported formats: PDF, Word, Images. Multiple files allowed.</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors">
                        Save Ordinance
                    </button>
                </div>
            </form>
        </div>
    );
};

export default OrdinanceForm;
