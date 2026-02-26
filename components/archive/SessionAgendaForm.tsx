import React, { useState, useEffect } from 'react';
import type { SessionAgenda, Term } from '../../types';

interface SessionAgendaFormProps {
    initialData?: SessionAgenda | null;
    onSubmit: (data: Omit<SessionAgenda, 'id'> | SessionAgenda) => void;
    onCancel: () => void;
    terms: Term[];
}

const getInitialFormData = (): Omit<SessionAgenda, 'id'> => ({
    seriesNumber: 'SA-',
    sessionDate: '',
    timeStarted: '',
    timeFinished: '',
    sessionType: 'Regular',
    term: '',
    filePath: undefined,
    attachments: [],
});

const SessionAgendaForm: React.FC<SessionAgendaFormProps> = ({ initialData, onSubmit, onCancel, terms }) => {
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'sessionType') {
            setFormData(prev => {
                let newSeriesNumber = prev.seriesNumber;
                // Only auto-update prefix for new entries to preserve existing data integrity
                if (!initialData) {
                    if (value === 'Special') {
                        newSeriesNumber = newSeriesNumber.replace(/^SA-/, 'NOS-');
                    } else {
                        newSeriesNumber = newSeriesNumber.replace(/^NOS-/, 'SA-');
                    }
                }
                return {
                    ...prev,
                    sessionType: value as 'Regular' | 'Special',
                    seriesNumber: newSeriesNumber
                };
            });
        } else if (name === 'seriesNumber') {
            // Dynamically determine expected prefix based on current type
            const expectedPrefix = formData.sessionType === 'Special' ? 'NOS-' : 'SA-';
            
            if (!initialData && !value.startsWith(expectedPrefix)) {
                return;
            }
            setFormData(prev => ({ ...prev, [name]: value as any }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value as any }));
        }
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

    const handleRemoveLegacyAttachment = () => {
        setFormData(prev => ({...prev, filePath: undefined}));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.seriesNumber.trim() || !formData.sessionDate || !formData.timeStarted || !formData.timeFinished || !formData.term) {
            alert('Series Number, Session Date, Start Time, Finish Time, and Term are required.');
            return;
        }

        const finalData = { ...formData };
        
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
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-primary mb-6">
                {initialData ? 'Edit Session Agenda' : 'Add New Session Agenda'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="sessionType" className={labelClasses}>Session Type</label>
                        <select
                            id="sessionType"
                            name="sessionType"
                            value={formData.sessionType}
                            onChange={handleChange}
                            className={inputClasses}
                            autoFocus
                        >
                            <option value="Regular">Regular</option>
                            <option value="Special">Special</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="seriesNumber" className={labelClasses}>Series No. of Agenda</label>
                        <input type="text" id="seriesNumber" name="seriesNumber" value={formData.seriesNumber} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <div>
                        <label htmlFor="sessionDate" className={labelClasses}>Date of Session</label>
                        <input type="date" id="sessionDate" name="sessionDate" value={formData.sessionDate} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="term" className={labelClasses}>Term</label>
                        <select id="term" name="term" value={formData.term} onChange={handleChange} className={inputClasses} required>
                            <option value="" disabled>-- Select a Term --</option>
                            {terms.map(term => {
                                const termValue = `${term.yearFrom}-${term.yearTo}`;
                                const displayLabel = `${term.yearFrom.split('-')[0]}-${term.yearTo.split('-')[0]}`;
                                return <option key={term.id} value={termValue}>{displayLabel}</option>;
                            })}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="timeStarted" className={labelClasses}>Time Started</label>
                        <input type="time" id="timeStarted" name="timeStarted" value={formData.timeStarted} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <div>
                        <label htmlFor="timeFinished" className={labelClasses}>Time Finished</label>
                        <input type="time" id="timeFinished" name="timeFinished" value={formData.timeFinished} onChange={handleChange} className={inputClasses} required />
                    </div>
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
                                accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            />
                            <p className="mt-1 text-xs text-slate-500">Supported formats: PDF, Word. Multiple files allowed.</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors">
                        Save Agenda
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SessionAgendaForm;