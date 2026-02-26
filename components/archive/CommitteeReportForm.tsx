import React, { useState, useEffect, useMemo } from 'react';
import type { CommitteeReport, Attendance, CommitteeMembership, Term, Legislator } from '../../types';

interface CommitteeReportFormProps {
    initialData?: CommitteeReport | null;
    onSubmit: (data: Omit<CommitteeReport, 'id'> | CommitteeReport) => void;
    onCancel: () => void;
    committeeMemberships: CommitteeMembership[];
    terms: Term[];
    legislators: Legislator[];
    committeeReports: CommitteeReport[];
}

const getInitialFormData = (): Omit<CommitteeReport, 'id'> => ({
    reportNumber: 'CM-',
    date: '',
    term: '',
    committee: '',
    committeeType: 'Meeting',
    attendance: { chairman: [], viceChairman: [], members: [], others: [] },
    filePath: undefined,
    attachments: [],
});


const CommitteeReportForm: React.FC<CommitteeReportFormProps> = ({ initialData, onSubmit, onCancel, committeeMemberships, terms, legislators, committeeReports }) => {
    const [formData, setFormData] = useState(getInitialFormData());
    const [newAttachments, setNewAttachments] = useState<File[]>([]);
    const [otherAttendee, setOtherAttendee] = useState('');


    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData, attachments: initialData.attachments || [] });
        } else {
             setFormData(getInitialFormData());
        }
        setNewAttachments([]);
        setOtherAttendee('');
    }, [initialData]);

    const uniqueCommitteeNames = useMemo(() => {
        if (!formData.term) {
            return [];
        }
        const filtered = committeeMemberships.filter(cm => cm.termYear === formData.term);
        return Array.from(new Set(filtered.map(cm => cm.committeeName))).sort();
    }, [formData.term, committeeMemberships]);
    
    const selectedCommitteeDetails = useMemo(() => {
        if (!formData.term || !formData.committee) {
            return null;
        }
        const membership = committeeMemberships.find(
            cm => cm.termYear === formData.term && cm.committeeName === formData.committee
        );
        if (!membership) {
            return null;
        }

        const legislatorMap = new Map(legislators.map(l => [l.id, l.name]));

        return {
            chairman: membership.chairman ? { id: membership.chairman, name: legislatorMap.get(membership.chairman) || 'Unknown' } : null,
            viceChairman: membership.viceChairman ? { id: membership.viceChairman, name: legislatorMap.get(membership.viceChairman) || 'Unknown' } : null,
            members: membership.members.map(id => ({ id, name: legislatorMap.get(id) || 'Unknown' })),
        };
    }, [formData.term, formData.committee, committeeMemberships, legislators]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'term' || name === 'committee') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                ...(name === 'term' && { committee: '' }),
                attendance: { chairman: [], viceChairman: [], members: [], others: prev.attendance.others }, // Keep others, reset the rest
            }));
        } else if (name === 'committeeType') {
            setFormData(prev => {
                let newReportNumber = prev.reportNumber;
                // Only auto-update prefix for new entries to preserve existing data integrity
                if (!initialData) {
                    const prefix = value === 'Meeting' ? 'CM-' : 'CH-';
                    // Replace existing known prefixes with the new one
                    newReportNumber = newReportNumber.replace(/^(CR-|CM-|CH-)/, prefix);
                    // If for some reason it didn't match (e.g. user cleared it), force prefix
                    if (!newReportNumber.startsWith(prefix)) {
                        newReportNumber = prefix;
                    }
                }
                return {
                    ...prev,
                    committeeType: value as 'Meeting' | 'Hearing',
                    reportNumber: newReportNumber
                };
            });
        } else if (name === 'reportNumber') {
            const expectedPrefix = formData.committeeType === 'Meeting' ? 'CM-' : 'CH-';
            // Ensure the prefix is maintained for new reports
            if (!initialData && !value.startsWith(expectedPrefix)) {
                return;
            }
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        else {
            setFormData(prev => ({ ...prev, [name]: value }));
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
    
    const handleAttendanceChange = (role: 'chairman' | 'viceChairman' | 'members', name: string, isChecked: boolean) => {
        setFormData(prev => {
            const currentAttendees = prev.attendance[role];
            const newAttendees = isChecked
                ? [...currentAttendees, name]
                : currentAttendees.filter(attendeeName => attendeeName !== name);
            
            return {
                ...prev,
                attendance: {
                    ...prev.attendance,
                    [role]: newAttendees,
                },
            };
        });
    };

    const handleAddOtherAttendee = () => {
        const name = otherAttendee.trim();
        if (name) {
            setFormData(prev => ({
                ...prev,
                attendance: {
                    ...prev.attendance,
                    others: [...prev.attendance.others, name],
                },
            }));
            setOtherAttendee('');
        }
    };
    
    const handleRemoveOtherAttendee = (index: number) => {
        setFormData(prev => ({
            ...prev,
            attendance: {
                ...prev.attendance,
                others: prev.attendance.others.filter((_, i) => i !== index),
            },
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.reportNumber.trim() || !formData.committee.trim() || !formData.term.trim()) {
            alert('Report Number, Term, and Committee are required.');
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

    const inputClasses = "block w-full px-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm disabled:bg-slate-100";
    const labelClasses = "block text-sm font-medium text-slate-700 mb-1";
    
    const renderOthersList = () => (
        <div>
            <label className={labelClasses}>Others</label>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={otherAttendee}
                    onChange={(e) => setOtherAttendee(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOtherAttendee())}
                    className={inputClasses}
                    placeholder="Add other attendees..."
                />
                <button type="button" onClick={handleAddOtherAttendee} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors flex-shrink-0">Add</button>
            </div>
            <ul className="mt-2 space-y-1">
                {formData.attendance.others.map((name, index) => (
                    <li key={`other-${index}`} className="flex justify-between items-center bg-slate-50 p-2 rounded-md text-sm">
                        <span>{name}</span>
                        <button type="button" onClick={() => handleRemoveOtherAttendee(index)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-primary mb-6">
                {initialData ? 'Edit Committee Report' : 'Add New Committee Report'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="term" className={labelClasses}>Term</label>
                        <select id="term" name="term" value={formData.term} onChange={handleChange} className={inputClasses} required autoFocus>
                            <option value="" disabled>-- Select a Term --</option>
                            {terms.map(term => {
                                const termValue = `${term.yearFrom}-${term.yearTo}`;
                                const displayLabel = `${term.yearFrom.split('-')[0]}-${term.yearTo.split('-')[0]}`;
                                return <option key={term.id} value={termValue}>{displayLabel}</option>;
                            })}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="date" className={labelClasses}>Date of Committee Report</label>
                        <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <div>
                        <label htmlFor="committeeType" className={labelClasses}>Committee Type</label>
                        <select id="committeeType" name="committeeType" value={formData.committeeType} onChange={handleChange} className={inputClasses}>
                            <option value="Meeting">Meeting</option>
                            <option value="Hearing">Hearing</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="reportNumber" className={labelClasses}>Committee Report Number</label>
                        <input
                            type="text"
                            id="reportNumber"
                            name="reportNumber"
                            value={formData.reportNumber}
                            onChange={handleChange}
                            className={inputClasses}
                            required
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="committee" className={labelClasses}>Committee</label>
                        <select id="committee" name="committee" value={formData.committee} onChange={handleChange} className={inputClasses} required disabled={!formData.term}>
                            <option value="" disabled>{formData.term ? '-- Select a Committee --' : 'Select a Term first'}</option>
                            {uniqueCommitteeNames.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-lg font-semibold text-brand-dark mb-4">Committee {formData.committeeType} Attendance</h3>
                    {selectedCommitteeDetails ? (
                        <div className="space-y-4">
                            {selectedCommitteeDetails.chairman && (
                                <div>
                                    <label className={labelClasses}>Chairman</label>
                                    <div className="bg-slate-50 p-3 rounded-md">
                                        <label className="flex items-center space-x-3 cursor-pointer text-slate-800">
                                            <input
                                                type="checkbox"
                                                className="h-5 w-5 rounded border-slate-300 text-brand-secondary focus:ring-brand-secondary"
                                                checked={formData.attendance.chairman.includes(selectedCommitteeDetails.chairman.name)}
                                                onChange={(e) => handleAttendanceChange('chairman', selectedCommitteeDetails.chairman!.name, e.target.checked)}
                                            />
                                            <span>{selectedCommitteeDetails.chairman.name}</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                            {selectedCommitteeDetails.viceChairman && (
                                <div>
                                    <label className={labelClasses}>Vice-Chairman</label>
                                    <div className="bg-slate-50 p-3 rounded-md">
                                        <label className="flex items-center space-x-3 cursor-pointer text-slate-800">
                                            <input
                                                type="checkbox"
                                                className="h-5 w-5 rounded border-slate-300 text-brand-secondary focus:ring-brand-secondary"
                                                checked={formData.attendance.viceChairman.includes(selectedCommitteeDetails.viceChairman.name)}
                                                onChange={(e) => handleAttendanceChange('viceChairman', selectedCommitteeDetails.viceChairman!.name, e.target.checked)}
                                            />
                                            <span>{selectedCommitteeDetails.viceChairman.name}</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                            {selectedCommitteeDetails.members.length > 0 && (
                                <div>
                                    <label className={labelClasses}>Members</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-md">
                                        {selectedCommitteeDetails.members.map(member => (
                                            <label key={member.id} className="flex items-center space-x-3 cursor-pointer text-slate-800">
                                                <input
                                                    type="checkbox"
                                                    className="h-5 w-5 rounded border-slate-300 text-brand-secondary focus:ring-brand-secondary"
                                                    checked={formData.attendance.members.includes(member.name)}
                                                    onChange={(e) => handleAttendanceChange('members', member.name, e.target.checked)}
                                                />
                                                <span>{member.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                             <div className="mt-4">
                                {renderOthersList()}
                             </div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 italic text-center py-4 bg-slate-50 rounded-md">
                            Select a term and committee to see the member list for attendance.
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

                <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors">
                        Save Report
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CommitteeReportForm;