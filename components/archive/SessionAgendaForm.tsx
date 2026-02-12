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
});

const SessionAgendaForm: React.FC<SessionAgendaFormProps> = ({ initialData, onSubmit, onCancel, terms }) => {
    const [formData, setFormData] = useState(getInitialFormData());
    const [attachment, setAttachment] = useState<File | null>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData });
        } else {
             setFormData(getInitialFormData());
        }
        setAttachment(null);
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
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
            setFormData(prev => ({...prev, filePath: undefined}));
        }
    };

    const handleRemoveAttachment = () => {
        setFormData(prev => ({...prev, filePath: undefined}));
        setAttachment(null);
        const fileInput = document.getElementById('attachment') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.seriesNumber.trim() || !formData.sessionDate || !formData.timeStarted || !formData.timeFinished || !formData.term) {
            alert('Series Number, Session Date, Start Time, Finish Time, and Term are required.');
            return;
        }

        const finalData = { ...formData };
        if (attachment) {
            if (initialData?.filePath?.startsWith('blob:')) {
                URL.revokeObjectURL(initialData.filePath);
            }
            finalData.filePath = URL.createObjectURL(attachment);
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
                        <label htmlFor="attachment" className={labelClasses}>Attach File</label>
                        {formData.filePath && (
                            <div className="flex items-center gap-2 mb-2 text-sm">
                                <a href={formData.filePath} target="_blank" rel="noopener noreferrer" className="text-brand-secondary hover:underline">
                                    View current attachment
                                </a>
                                <button type="button" onClick={handleRemoveAttachment} className="font-semibold text-red-600 hover:text-red-800">(Remove)</button>
                            </div>
                        )}
                        <input
                            type="file"
                            id="attachment"
                            name="attachment"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-light file:text-brand-primary hover:file:bg-blue-200"
                            accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        />
                         {attachment && <p className="text-sm text-slate-500 mt-1">New file selected: {attachment.name}</p>}
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