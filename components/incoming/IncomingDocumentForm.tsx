
import React, { useState, useEffect, useMemo } from 'react';
import type { IncomingDocument, DocumentType, DocumentStatus, CommitteeMembership, Legislator } from '../../types';

interface IncomingDocumentFormProps {
    initialData?: IncomingDocument | null;
    documentTypes: DocumentType[];
    documentStatuses: DocumentStatus[];
    existingDocuments: IncomingDocument[];
    committeeMemberships: CommitteeMembership[];
    legislators: Legislator[];
    onSubmit: (data: Omit<IncomingDocument, 'id'> | IncomingDocument) => void;
    onCancel: () => void;
}

const getInitialFormData = (): Omit<IncomingDocument, 'id'> => ({
    referenceNumber: '',
    dateReceived: '',
    timeReceived: '',
    sender: '',
    subject: '',
    type: '',
    category: undefined,
    status: 'Pending',
    
    // Calendar of Business
    urgentMattersDate: '',
    unfinishedBusinessDate: '',
    firstReadingDate: '',
    concernedCommittee: '',
    secondReadingDate: '',
    thirdReadingDate: '',
    unassignedBusinessDate: '',

    // Legislative Output
    outputType: undefined,
    outputNumber: '',
    sponsor: '',
    seconder: '',

    // Records Management
    datePosted: '',
    datePublished: '',
    dateFiled: '',

    // Action & Remarks
    recommendedActions: [],
    remarks: '', 
    secretarySignature: '',
    viceMayorRemarks: '',
    viceMayorSignature: '',

    filePath: undefined,
});

const RECOMMENDED_ACTIONS = [
    "For Information",
    "For Approval/Disapproval",
    "For Indorsement",
    "For Calendar/Inclusion in the Order of Business",
    "For Signature",
    "For Comment",
    "For Legislative Action",
    "Others"
];

const IncomingDocumentForm: React.FC<IncomingDocumentFormProps> = ({ initialData, documentTypes = [], documentStatuses = [], existingDocuments = [], committeeMemberships = [], legislators = [], onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(getInitialFormData());
    const [attachment, setAttachment] = useState<File | null>(null);
    
    const [showSenderSuggestions, setShowSenderSuggestions] = useState(false);
    const [filteredSenders, setFilteredSenders] = useState<string[]>([]);

    const [showSecretarySuggestions, setShowSecretarySuggestions] = useState(false);
    const [filteredSecretaries, setFilteredSecretaries] = useState<string[]>([]);

    useEffect(() => {
        if (initialData) {
            setFormData({ ...getInitialFormData(), ...initialData });
        } else {
             setFormData(getInitialFormData());
        }
        setAttachment(null);
    }, [initialData]);

    const uniqueSenders = useMemo(() => {
        const senders = (existingDocuments || []).map(doc => doc.sender).filter(Boolean);
        return Array.from(new Set(senders)).sort();
    }, [existingDocuments]);

    // Available Signatories (Legislators active in the document's term)
    const availableSignatories = useMemo(() => {
        const legis = legislators || [];
        if (!formData.dateReceived) return legis;
        
        const receivedDate = new Date(formData.dateReceived);
        receivedDate.setHours(0,0,0,0);
        
        return legis.filter(l => {
            return (l.positions || []).some(p => {
                if (!p.term) return false;
                
                // Parse Term: YYYY-MM-DD-YYYY-MM-DD
                const parts = p.term.split('-');
                if (parts.length >= 6) {
                    const startDate = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
                    const endDate = new Date(`${parts[3]}-${parts[4]}-${parts[5]}`);
                    startDate.setHours(0,0,0,0);
                    endDate.setHours(0,0,0,0);
                    return receivedDate >= startDate && receivedDate <= endDate;
                }
                
                // Fallback: Check years
                const years = p.term.match(/(\d{4})/g);
                if (years && years.length >= 2) {
                    const startYear = parseInt(years[0]);
                    const endYear = parseInt(years[1]);
                    const receivedYear = receivedDate.getFullYear();
                    return receivedYear >= startYear && receivedYear <= endYear;
                }
                return false;
            });
        });
    }, [legislators, formData.dateReceived]);

    // Suggestions for Secretary Signature: Mix of term legislators and previously used names
    const secretarySuggestions = useMemo(() => {
        const fromHistory = (existingDocuments || []).map(doc => doc.secretarySignature).filter(Boolean);
        const fromLegislators = availableSignatories.map(l => l.name);
        return Array.from(new Set([...fromHistory, ...fromLegislators])).sort();
    }, [existingDocuments, availableSignatories]);

    const availableCommittees = useMemo(() => {
        const memberships = committeeMemberships || [];
        if (formData.dateReceived) {
            const receivedDate = new Date(formData.dateReceived);
            receivedDate.setHours(0, 0, 0, 0);

            const validMemberships = memberships.filter(cm => {
                const years = cm.termYear ? cm.termYear.match(/(\d{4})/g) : null;
                if (years && years.length >= 2) {
                    const startYear = parseInt(years[0]);
                    const endYear = parseInt(years[years.length - 1]);
                    const receivedYear = receivedDate.getFullYear();
                    return receivedYear >= startYear && receivedYear <= endYear;
                }
                return false;
            });
            return Array.from(new Set(validMemberships.map(cm => cm.committeeName))).sort();
        }
        return Array.from(new Set(memberships.map(cm => cm.committeeName))).sort();
    }, [committeeMemberships, formData.dateReceived]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'status' && value !== 'Referred to Committee') {
                newData.concernedCommittee = '';
            }
            return newData;
        });
    };

    const handleActionCheckboxChange = (action: string, checked: boolean) => {
        setFormData(prev => {
            const currentActions = prev.recommendedActions || [];
            if (checked) {
                return { ...prev, recommendedActions: [...currentActions, action] };
            } else {
                return { ...prev, recommendedActions: currentActions.filter(a => a !== action) };
            }
        });
    };

    const handleOutputCheck = (type: 'Resolution' | 'Ordinance') => {
        setFormData(prev => {
            if (prev.outputType === type) return { ...prev, outputType: undefined, outputNumber: '' };
            const prefix = type === 'Resolution' ? 'RES' : 'ORD';
            let maxSeq = 0;
            (existingDocuments || []).forEach(doc => {
                if (doc.outputNumber && doc.outputNumber.startsWith(`${prefix}-`)) {
                    const parts = doc.outputNumber.split('-');
                    const seq = parts.length >= 2 ? parseInt(parts[1], 10) : 0;
                    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
                }
            });
            const nextSeq = String(maxSeq + 1).padStart(3, '0');
            return { ...prev, outputType: type, outputNumber: `${prefix}-${nextSeq}` };
        });
    };

    const handleSenderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, sender: value }));
        if (value.trim()) {
            const matches = uniqueSenders.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase());
            setFilteredSenders(matches);
            setShowSenderSuggestions(matches.length > 0);
        } else {
            setShowSenderSuggestions(false);
        }
    };

    const handleSenderSelect = (sender: string) => {
        setFormData(prev => ({ ...prev, sender }));
        setShowSenderSuggestions(false);
    };

    const handleSecretaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, secretarySignature: value }));
        if (value.trim()) {
            const matches = secretarySuggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase());
            setFilteredSecretaries(matches);
            setShowSecretarySuggestions(matches.length > 0);
        } else {
            setShowSecretarySuggestions(false);
        }
    };

    const handleSecretarySelect = (name: string) => {
        setFormData(prev => ({ ...prev, secretarySignature: name }));
        setShowSecretarySuggestions(false);
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const typeName = e.target.value;
        const selectedType = (documentTypes || []).find(dt => dt.name === typeName);
        let newReferenceNumber = formData.referenceNumber;

        if (!initialData && selectedType) {
            const code = selectedType.code;
            const today = new Date();
            const dateStr = `${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}${today.getFullYear()}`;
            let maxSeq = 0;
            (existingDocuments || []).forEach(doc => {
                if (doc.referenceNumber && doc.referenceNumber.startsWith(`${code}-`)) {
                    const parts = doc.referenceNumber.split('-');
                    const seq = parts.length >= 3 ? parseInt(parts[parts.length - 1], 10) : 0;
                    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
                }
            });
            newReferenceNumber = `${code}-${dateStr}-${String(maxSeq + 1).padStart(3, '0')}`;
        }

        setFormData(prev => ({ 
            ...prev, 
            type: typeName, 
            referenceNumber: newReferenceNumber,
            category: ['Proposed Ordinance', 'Barangay Ordinance'].includes(typeName) ? prev.category : undefined 
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
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.referenceNumber.trim() || !formData.dateReceived || !formData.timeReceived || !formData.sender.trim() || !formData.subject.trim()) {
            alert('Required fields are missing.');
            return;
        }

        const finalData = { ...formData };
        if (attachment) {
            if (initialData?.filePath?.startsWith('blob:')) URL.revokeObjectURL(initialData.filePath);
            finalData.filePath = URL.createObjectURL(attachment);
        }
        if(initialData) onSubmit({ ...initialData, ...finalData });
        else onSubmit(finalData);
    };

    const deadlineInfo = useMemo(() => {
        if (!formData.dateReceived || !formData.timeReceived || !formData.category || !['Barangay Ordinance', 'Proposed Ordinance'].includes(formData.type)) return null;
        let dayLimit = 0;
        if (formData.type === 'Barangay Ordinance') {
            if (formData.category === 'General') dayLimit = 30;
            else dayLimit = 60;
        } else if (formData.type === 'Proposed Ordinance') {
            if (formData.category === 'General') dayLimit = 30;
            else dayLimit = 90;
        }
        if (dayLimit === 0) return null;
        const received = new Date(`${formData.dateReceived}T${formData.timeReceived}`);
        const deadline = new Date(received);
        deadline.setDate(received.getDate() + dayLimit);
        const daysRemaining = Math.round((deadline.getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
        return { dayLimit, deadlineDate: deadline, daysRemaining };
    }, [formData.dateReceived, formData.timeReceived, formData.type, formData.category]);

    const inputClasses = "block w-full px-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm disabled:bg-slate-100 disabled:text-slate-400";
    const labelClasses = "block text-sm font-medium text-slate-700 mb-1";

    return (
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-primary mb-6">
                {initialData ? 'Edit Incoming Document' : 'Register Incoming Document'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="type" className={labelClasses}>Document Type</label>
                        <select id="type" name="type" value={formData.type} onChange={handleTypeChange} className={inputClasses} required autoFocus>
                            <option value="">-- Select Type --</option>
                            {(documentTypes || []).map(dt => <option key={dt.id} value={dt.name}>{dt.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="category" className={labelClasses}>Document Category</label>
                        <select id="category" name="category" value={formData.category || ''} onChange={handleChange} className={inputClasses} disabled={!['Proposed Ordinance', 'Barangay Ordinance'].includes(formData.type)}>
                            <option value="">-- Select Category --</option>
                            <option value="General">General</option>
                            <option value="Annual Budget">Annual Budget</option>
                            <option value="Supplemental Budget">Supplemental Budget</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="referenceNumber" className={labelClasses}>Document Tracking Code</label>
                        <input type="text" id="referenceNumber" name="referenceNumber" value={formData.referenceNumber} onChange={handleChange} className={inputClasses} placeholder="Auto-generated or manual" required />
                    </div>
                    <div>
                        <label className={labelClasses}>Date & Time Received</label>
                        <div className="flex gap-2">
                            <input type="date" id="dateReceived" name="dateReceived" value={formData.dateReceived} onChange={handleChange} className={inputClasses} required />
                            <input type="time" id="timeReceived" name="timeReceived" value={formData.timeReceived} onChange={handleChange} className={inputClasses} required />
                        </div>
                    </div>
                    <div className="md:col-span-2 relative">
                        <label htmlFor="sender" className={labelClasses}>Sender / Origin</label>
                        <input type="text" id="sender" name="sender" value={formData.sender} onChange={handleSenderChange} onFocus={() => formData.sender && setFilteredSenders(uniqueSenders.filter(s => s.toLowerCase().includes(formData.sender.toLowerCase())))} onBlur={() => setTimeout(() => setShowSenderSuggestions(false), 200)} className={inputClasses} placeholder="e.g. Office of the Mayor..." required autoComplete="off" />
                        {showSenderSuggestions && (
                            <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                {filteredSenders.map((sender, index) => <li key={index} className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm text-slate-700" onClick={() => handleSenderSelect(sender)}>{sender}</li>)}
                            </ul>
                        )}
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="subject" className={labelClasses}>Subject / Matter</label>
                        <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="status" className={labelClasses}>Current Status</label>
                        <select id="status" name="status" value={formData.status} onChange={handleChange} className={inputClasses}>
                            {(documentStatuses || []).map(status => <option key={status.id} value={status.name}>{status.name}</option>)}
                        </select>
                    </div>
                    
                    {/* CALENDAR OF BUSINESS */}
                    <div className="md:col-span-2 border rounded-md p-4 bg-slate-50 border-slate-200">
                        <p className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">CALENDAR OF BUSINESS</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="date" name="urgentMattersDate" value={formData.urgentMattersDate || ''} onChange={handleChange} className={inputClasses} placeholder="Urgent Matters Date" />
                            <input type="date" name="unfinishedBusinessDate" value={formData.unfinishedBusinessDate || ''} onChange={handleChange} className={inputClasses} placeholder="Unfinished Business Date" />
                            <div className="md:col-span-2 border-t border-slate-200 my-1"></div>
                            <input type="date" name="firstReadingDate" value={formData.firstReadingDate || ''} onChange={handleChange} className={inputClasses} placeholder="1st Reading Date" />
                            <select name="concernedCommittee" value={formData.concernedCommittee || ''} onChange={handleChange} className={inputClasses} disabled={formData.status !== 'Referred to Committee'}>
                                <option value="">-- Select Committee --</option>
                                {availableCommittees.map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                            <input type="date" name="secondReadingDate" value={formData.secondReadingDate || ''} onChange={handleChange} className={inputClasses} placeholder="2nd Reading Date" />
                            <input type="date" name="thirdReadingDate" value={formData.thirdReadingDate || ''} onChange={handleChange} className={inputClasses} placeholder="3rd Reading Date" />
                        </div>
                    </div>

                    {/* ACTION & REMARKS */}
                    <div className="md:col-span-2 border rounded-md p-4 bg-amber-50 border-amber-200">
                        <p className="font-semibold text-amber-800 mb-3 text-sm uppercase tracking-wide">ACTION & REMARKS</p>
                        
                        <div className="mb-4">
                            <label className={labelClasses}>Recommended Actions</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {RECOMMENDED_ACTIONS.map(action => (
                                    <label key={action} className="flex items-center space-x-2 cursor-pointer hover:bg-amber-100/50 p-1 rounded transition-colors">
                                        <input type="checkbox" checked={(formData.recommendedActions || []).includes(action)} onChange={(e) => handleActionCheckboxChange(action, e.target.checked)} className="rounded text-amber-600" />
                                        <span className="text-xs text-slate-700">{action}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="remarks" className={labelClasses}>Optional Notes</label>
                                <textarea id="remarks" name="remarks" value={formData.remarks} onChange={handleChange} className={inputClasses} rows={2} placeholder="Notes for Secretary..." />
                            </div>
                            <div className="relative">
                                <label htmlFor="secretarySignature" className={labelClasses}>Signature of Secretary</label>
                                <input 
                                    type="text" 
                                    id="secretarySignature" 
                                    name="secretarySignature" 
                                    value={formData.secretarySignature || ''} 
                                    onChange={handleSecretaryChange}
                                    onFocus={() => formData.secretarySignature && setShowSecretarySuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSecretarySuggestions(false), 200)}
                                    className={inputClasses} 
                                    placeholder="Type or select name..." 
                                    autoComplete="off"
                                />
                                {showSecretarySuggestions && (
                                    <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                        {filteredSecretaries.map((name, index) => <li key={index} className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm text-slate-700" onClick={() => handleSecretarySelect(name)}>{name}</li>)}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-amber-200 my-4"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="viceMayorRemarks" className={labelClasses}>Vice Mayor Remarks</label>
                                <textarea id="viceMayorRemarks" name="viceMayorRemarks" value={formData.viceMayorRemarks || ''} onChange={handleChange} className={inputClasses} rows={2} placeholder="Notes for Presiding Officer..." />
                            </div>
                            <div>
                                <label htmlFor="viceMayorSignature" className={labelClasses}>Signature of Vice Mayor / Presiding Officer</label>
                                <select id="viceMayorSignature" name="viceMayorSignature" value={formData.viceMayorSignature || ''} onChange={handleChange} className={inputClasses}>
                                    <option value="">-- Select Official --</option>
                                    {availableSignatories.map(leg => <option key={leg.id} value={leg.name}>{leg.name}</option>)}
                                </select>
                                <p className="text-[10px] text-amber-700 mt-1 italic font-medium">Filtered by term matching Date Received: {formData.dateReceived || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* LEGISLATIVE OUTPUT */}
                    <div className="md:col-span-2 border rounded-md p-4 bg-sky-50 border-sky-200">
                        <p className="font-semibold text-sky-800 mb-3 text-sm uppercase tracking-wide">LEGISLATIVE OUTPUT</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex gap-4 items-center">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.outputType === 'Resolution'} onChange={() => handleOutputCheck('Resolution')} className="rounded text-sky-600" />
                                    <span className="text-sm">Resolution</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.outputType === 'Ordinance'} onChange={() => handleOutputCheck('Ordinance')} className="rounded text-sky-600" />
                                    <span className="text-sm">Ordinance</span>
                                </label>
                            </div>
                            <input type="text" name="outputNumber" value={formData.outputNumber || ''} onChange={handleChange} className={inputClasses} placeholder="Output Number" disabled={!formData.outputType} />
                            <select name="sponsor" value={formData.sponsor || ''} onChange={handleChange} className={inputClasses}>
                                <option value="">-- Select Sponsor --</option>
                                {availableSignatories.map(leg => <option key={leg.id} value={leg.name}>{leg.name}</option>)}
                            </select>
                            <select name="seconder" value={formData.seconder || ''} onChange={handleChange} className={inputClasses}>
                                <option value="">-- Select Seconder --</option>
                                {availableSignatories.map(leg => <option key={leg.id} value={leg.name}>{leg.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className={labelClasses}>Scanned Attachment</label>
                        <input type="file" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-light file:text-brand-primary hover:file:bg-blue-200" accept=".pdf,.jpg,.jpeg,.png" />
                        {attachment && <p className="text-xs text-slate-500 mt-1">Selected: {attachment.name}</p>}
                        {formData.filePath && <button type="button" onClick={handleRemoveAttachment} className="text-xs text-red-600 mt-1 font-bold underline">Remove Current Attachment</button>}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary">Save Document</button>
                </div>
            </form>
            
            {deadlineInfo && (
                <div className={`mt-6 p-4 rounded-lg border-2 flex justify-between items-center ${deadlineInfo.daysRemaining < 0 ? 'bg-gray-100 border-gray-300' : deadlineInfo.daysRemaining <= 10 ? 'bg-amber-50 border-amber-300' : 'bg-green-50 border-green-300'}`}>
                    <div>
                        <p className="font-bold text-slate-700">Deadline Tracker ({deadlineInfo.dayLimit} days)</p>
                        <p className="text-xs text-slate-600">Deadline: {deadlineInfo.deadlineDate.toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                        <span className={`text-3xl font-extrabold ${deadlineInfo.daysRemaining < 0 ? 'text-red-500' : 'text-slate-700'}`}>{deadlineInfo.daysRemaining}</span>
                        <p className="text-[10px] uppercase font-bold text-slate-500">Days Left</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncomingDocumentForm;
