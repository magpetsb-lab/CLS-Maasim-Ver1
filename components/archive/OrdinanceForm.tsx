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
});

const OrdinanceForm: React.FC<OrdinanceFormProps> = ({ initialData, onSubmit, onCancel, legislators, committeeMemberships, terms, sectors }) => {
    const [formData, setFormData] = useState(getInitialFormData());
    const [attachment, setAttachment] = useState<File | null>(null);
    const [showScanner, setShowScanner] = useState(false);
    const [scanInput, setScanInput] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData });
        } else {
             setFormData(getInitialFormData());
        }
        setAttachment(null);
    }, [initialData]);

    // Handle input changes (just update state)
    const handleQrInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setScanInput(e.target.value);
    };

    // Handle validation and parsing on Enter key
    const handleQrKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const text = scanInput.trim();
            if (!text) return;

            let success = false;
            let newData = { ...formData };
            let termChanged = false;

            // Try parsing pipe-separated format: Title|Number|Term
            if (text.includes('|')) {
                const parts = text.split('|');
                if (parts.length >= 3) {
                    const [title, number, term] = parts.map(p => p.trim());
                    
                    if (newData.term !== term) termChanged = true;
                    
                    newData.ordinanceTitle = title;
                    newData.ordinanceNumber = number;
                    newData.term = term;
                    success = true;
                }
            }

            // Fallback: Try parsing JSON
            if (!success) {
                try {
                    if (text.startsWith('{') && text.endsWith('}')) {
                        const data = JSON.parse(text);
                        if (data.ordinanceNumber || data.ordinanceTitle || data.term) {
                            if (data.term && newData.term !== data.term) termChanged = true;

                            newData.ordinanceNumber = data.ordinanceNumber || newData.ordinanceNumber;
                            newData.ordinanceTitle = data.ordinanceTitle || newData.ordinanceTitle;
                            newData.term = data.term || newData.term;
                            success = true;
                        }
                    }
                } catch (e) {
                    // Not valid JSON
                }
            }

            if (success) {
                // Reset author/committee if term changed to maintain consistency
                if (termChanged) {
                    newData.author = '';
                    newData.committee = '';
                }
                setFormData(newData);
                
                alert('QR Code scanned successfully!');
                setShowScanner(false);
                setScanInput('');
            } else {
                alert('QR code format does not match the system requirements.');
                setScanInput(''); // Clear input for retry
            }
        }
    };
    
    const availableAuthors = useMemo(() => {
        if (!formData.term) {
            return [];
        }
        return legislators.filter(legislator => 
            legislator.positions.some(position => position.term === formData.term)
        );
    }, [formData.term, legislators]);

    const availableCommittees = useMemo(() => {
        if (!formData.term || !formData.author) {
            return [];
        }
        const selectedAuthor = legislators.find(leg => leg.name === formData.author);
        if (!selectedAuthor) {
            return [];
        }
        const authorId = selectedAuthor.id;

        const relevantCommittees = committeeMemberships.filter(cm => {
            const termMatch = cm.termYear === formData.term;
            if (!termMatch) return false;

            const isChairman = cm.chairman === authorId;
            
            return isChairman;
        });
        
        return Array.from(new Set(relevantCommittees.map(cm => cm.committeeName))).sort();

    }, [formData.term, formData.author, legislators, committeeMemberships]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'term') {
            setFormData(prev => ({
                ...prev,
                term: value,
                author: '',
                committee: '',
            }));
        } else if (name === 'author') {
            setFormData(prev => ({
                ...prev,
                author: value,
                committee: '',
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
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
        if (!formData.ordinanceNumber.trim() || !formData.ordinanceTitle.trim()) {
            alert('Ordinance Number and Title are required.');
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

    const inputClasses = "block w-full px-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm disabled:bg-slate-100";
    const labelClasses = "block text-sm font-medium text-slate-700 mb-1";


    return (
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg max-w-4xl mx-auto relative">
            {showScanner && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
                         <h3 className="text-xl font-bold mb-4 text-center text-brand-primary">Use QR Code Reader</h3>
                        <div className="mb-4">
                             <p className="text-sm text-slate-600 mb-2">Click the box below and scan the QR code with your handheld scanner.</p>
                            <input
                                type="text"
                                autoFocus
                                value={scanInput}
                                onChange={handleQrInputChange}
                                onKeyDown={handleQrKeyDown}
                                placeholder="Scan here..."
                                className="w-full p-3 border-2 border-brand-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary text-center text-lg"
                                onBlur={(e) => e.target.focus()} // Keep focus
                            />
                        </div>
                        <p className="text-xs text-slate-500 mb-4 text-center">Format expected: Title | Number | Term</p>
                        <button 
                            type="button" 
                            onClick={() => {
                                setShowScanner(false);
                                setScanInput('');
                            }}
                            className="w-full bg-slate-200 text-slate-700 py-2 rounded hover:bg-slate-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-brand-primary">
                    {initialData ? 'Edit Ordinance' : 'Add New Ordinance'}
                </h2>
                <button
                    type="button"
                    onClick={() => {
                        setShowScanner(true);
                        setScanInput('');
                    }}
                    className="flex items-center px-3 py-2 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-700 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    Scan QR Code
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="ordinanceTitle" className={labelClasses}>Ordinance Title</label>
                    <input type="text" id="ordinanceTitle" name="ordinanceTitle" value={formData.ordinanceTitle} onChange={handleChange} className={inputClasses} required autoFocus />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="ordinanceNumber" className={labelClasses}>Ordinance Number</label>
                        <input type="text" id="ordinanceNumber" name="ordinanceNumber" value={formData.ordinanceNumber} onChange={handleChange} className={inputClasses} required />
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
                    <div>
                        <label htmlFor="author" className={labelClasses}>Author</label>
                        <select 
                            id="author" 
                            name="author" 
                            value={formData.author} 
                            onChange={handleChange} 
                            className={inputClasses} 
                            required
                            disabled={!formData.term}
                        >
                            <option value="" disabled>
                                {formData.term ? '-- Select an Author --' : 'Select a Term first'}
                            </option>
                            {availableAuthors.map(leg => (
                                <option key={leg.id} value={leg.name}>{leg.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="committee" className={labelClasses}>Committee</label>
                         <select 
                            id="committee" 
                            name="committee" 
                            value={formData.committee} 
                            onChange={handleChange} 
                            className={inputClasses} 
                            required
                            disabled={!formData.author}
                         >
                            <option value="" disabled>
                                {formData.author ? (availableCommittees.length > 0 ? '-- Select a Committee --' : 'Author is not a committee chair') : 'Select an Author first'}
                            </option>
                            {availableCommittees.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="dateEnacted" className={labelClasses}>Date Enacted</label>
                        <input type="date" id="dateEnacted" name="dateEnacted" value={formData.dateEnacted} onChange={handleChange} className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="dateApproved" className={labelClasses}>Date Approved</label>
                        <input type="date" id="dateApproved" name="dateApproved" value={formData.dateApproved} onChange={handleChange} className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="sector" className={labelClasses}>Sector</label>
                        <select id="sector" name="sector" value={formData.sector} onChange={handleChange} className={inputClasses} required>
                            <option value="" disabled>-- Select a Sector --</option>
                            {sectors.map(sector => (
                                <option key={sector.id} value={sector.name}>{sector.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                 <div>
                    <label htmlFor="fullText" className={labelClasses}>Full Text</label>
                    <textarea
                        id="fullText"
                        name="fullText"
                        value={formData.fullText}
                        onChange={handleChange}
                        className={inputClasses}
                        rows={10}
                    />
                </div>
                 <div className="col-span-1 md:col-span-2">
                    <label htmlFor="attachment" className={labelClasses}>Attachment</label>
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
                        Save Ordinance
                    </button>
                </div>
            </form>
        </div>
    );
};

export default OrdinanceForm;