
import React, { useState, useEffect } from 'react';
import type { Document } from '../../types';

interface DocumentFormProps {
    initialData?: Document | null;
    onSubmit: (data: Omit<Document, 'id' | 'dateAdded'> | Document) => void;
    onCancel: () => void;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [fullText, setFullText] = useState('');

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setSummary(initialData.summary);
            setFullText(initialData.fullText);
        } else {
            setTitle('');
            setSummary('');
            setFullText('');
        }
    }, [initialData]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !summary.trim()) {
            alert('Title and Summary are required.');
            return;
        }
        
        const data = { title, summary, fullText };

        if(initialData) {
            onSubmit({ ...initialData, ...data });
        } else {
            onSubmit(data);
        }
    };

    const inputClasses = "block w-full px-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm";
    const labelClasses = "block text-sm font-medium text-slate-700 mb-1";


    return (
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-primary mb-6">
                {initialData ? 'Edit Document' : 'Add New Document'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="title" className={labelClasses}>Title</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={inputClasses}
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="summary" className={labelClasses}>Summary</label>
                    <textarea
                        id="summary"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className={inputClasses}
                        rows={3}
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="fullText" className={labelClasses}>Full Text</label>
                    <textarea
                        id="fullText"
                        value={fullText}
                        onChange={(e) => setFullText(e.target.value)}
                        className={inputClasses}
                        rows={10}
                    />
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors"
                    >
                        Save Document
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DocumentForm;
