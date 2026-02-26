
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
});

const ATTENDANCE_STATUSES: AttendanceStatus[] = ['Present', 'Absent', 'OB', 'Leave'];

const SessionMinuteForm: React.FC<SessionMinuteFormProps> = ({ initialData, onSubmit, onCancel, terms, legislators }) => {
    const [formData, setFormData] = useState(getInitialFormData());
    const [attachment, setAttachment] = useState<File | null>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData, minutesContent: initialData.minutesContent || '' });
        } else {
             setFormData(getInitialFormData());
        }
        setAttachment(null);
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
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.sessionNumber.trim() || !formData.sessionDate || !formData.term) {
            alert('Session Number, Session Date, and Term are required.');
            return;
        }

        const finalData = { ...formData };
        if (attachment) {
            try {
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(attachment);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = error => reject(error);
                });
                finalData.filePath = base64;
            } catch (error) {
                console.error("Error converting file:", error);
                alert("Failed to process attachment.");
                return;
            }
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
                    <label htmlFor="attachment" className={labelClasses}>Attached file</label>
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
