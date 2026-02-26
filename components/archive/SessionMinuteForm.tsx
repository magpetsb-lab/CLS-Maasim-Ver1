
import React, { useState, useEffect, useMemo } from 'react';
import type { SessionMinute, Term, Legislator, AttendanceStatus, SessionAttendance } from '../../types';

interface SessionMinuteFormProps {
    initialData?: SessionMinute | null;
    onSubmit: (data: Omit<SessionMinute, 'id'> | SessionMinute) => void;
    onCancel: () => void;
    terms: Term[];
    legislators: Legislator[];
}

const getInitialFormData = (): Omit<SessionMinute, 'id'> => ({
    sessionNumber: 'MS-',
    sessionDate: '',
    sessionType: 'Regular',
    term: '',
    sessionAttendance: [],
    minutesContent: '',
    filePath: undefined,
    attachments: [],
});

const ATTENDANCE_STATUSES: AttendanceStatus[] = ['Present', 'Absent', 'OB', 'Leave'];

const SessionMinuteForm: React.FC<SessionMinuteFormProps> = ({ initialData, onSubmit, onCancel, terms, legislators }) => {
    const [formData, setFormData] = useState(getInitialFormData());
    const [newAttachments, setNewAttachments] = useState<File[]>([]);

    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData, minutesContent: initialData.minutesContent || '', attachments: initialData.attachments || [] });
        } else {
             setFormData(getInitialFormData());
        }
        setNewAttachments([]);
    }, [initialData]);
    
    const legislatorsForTerm = useMemo(() => {
        if (!formData.term) return [];
        return legislators.filter(legislator =>
            legislator.positions.some(position => position.term === formData.term)
        );
    }, [formData.term, legislators]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'term') {
            const termLegislators = legislators.filter(l => l.positions.some(p => p.term === value));
            const newAttendance = termLegislators.map(l => ({ legislatorId: l.id, status: 'Present' as AttendanceStatus }));
            setFormData(prev => ({
                ...prev,
                term: value,
                sessionAttendance: newAttendance,
            }));
        } else if (name === 'sessionType') {
            setFormData(prev => {
                let newSessionNumber = prev.sessionNumber;
                // Only auto-update prefix for new entries to preserve existing data integrity
                if (!initialData) {
                    if (value === 'Special') {
                        newSessionNumber = newSessionNumber.replace(/^MS-/, 'SS-');
                    } else {
                        newSessionNumber = newSessionNumber.replace(/^SS-/, 'MS-');
                    }
                }
                return {
                    ...prev,
                    sessionType: value as 'Regular' | 'Special',
                    sessionNumber: newSessionNumber
                };
            });
        } else if (name === 'sessionNumber') {
            const expectedPrefix = formData.sessionType === 'Special' ? 'SS-' : 'MS-';
            if (!initialData && !value.startsWith(expectedPrefix)) {
                return;
            }
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        else {
            setFormData(prev => ({ ...prev, [name]: value as any }));
        }
    };

    const handleAttendanceChange = (legislatorId: string, status: AttendanceStatus) => {
        setFormData(prev => ({
            ...prev,
            sessionAttendance: prev.sessionAttendance.map(att => 
                att.legislatorId === legislatorId ? { ...att, status } : att
            ),
        }));
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
        if (!formData.sessionNumber.trim() || !formData.sessionDate || !formData.term) {
            alert('Session Number, Session Date, and Term are required.');
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
                {initialData ? 'Edit Session Minute' : 'Add New Session Minute'}
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
                        <label htmlFor="sessionNumber" className={labelClasses}>No. of Session (Title)</label>
                        <input type="text" id="sessionNumber" name="sessionNumber" value={formData.sessionNumber} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <div>
                        <label htmlFor="sessionDate" className={labelClasses}>Session Date</label>
                        <input type="date" id="sessionDate" name="sessionDate" value={formData.sessionDate} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <div>
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
                </div>
                
                <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-lg font-semibold text-brand-dark mb-4">Session Attendance</h3>
                     {legislatorsForTerm.length > 0 ? (
                        <div className="space-y-3">
                            {legislatorsForTerm.map(legislator => {
                                const currentStatus = formData.sessionAttendance.find(att => att.legislatorId === legislator.id)?.status;
                                return (
                                    <div key={legislator.id} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2 items-center bg-slate-50 p-3 rounded-lg">
                                        <p className="font-medium text-slate-800">{legislator.name}</p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                                            {ATTENDANCE_STATUSES.map(status => (
                                                <label key={status} className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`attendance-${legislator.id}`}
                                                        value={status}
                                                        checked={currentStatus === status}
                                                        onChange={() => handleAttendanceChange(legislator.id, status)}
                                                        className="h-4 w-4 border-slate-300 text-brand-secondary focus:ring-brand-secondary"
                                                    />
                                                    <span className="text-sm">{status}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                     ) : (
                        <p className="text-sm text-slate-500 italic text-center py-4 bg-slate-50 rounded-md">
                            Select a term to populate the attendance list.
                        </p>
                     )}
                </div>

                <div className="border-t border-slate-200 pt-6">
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

                <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors">
                        Save Minute
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SessionMinuteForm;
