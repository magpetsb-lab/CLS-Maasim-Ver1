import React, { useState, useEffect } from 'react';
import type { DocumentType } from '../../types';

interface DocumentTypeFormProps {
    initialData?: DocumentType | null;
    onSubmit: (data: Omit<DocumentType, 'id'> | DocumentType) => void;
    onCancel: () => void;
}

const getInitialFormData = (): Omit<DocumentType, 'id'> => ({
    name: '',
    code: '',
});

const DocumentTypeForm: React.FC<DocumentTypeFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(getInitialFormData());

    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData });
        } else {
             setFormData(getInitialFormData());
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'code') {
            // Limit to 3 uppercase characters
            setFormData(prev => ({ ...prev, [name]: value.toUpperCase().slice(0, 3) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.code.trim()) {
            alert('Document Type Name and Code are required.');
            return;
        }
        if (formData.code.length !== 3) {
            alert('Code must be exactly 3 letters.');
            return;
        }
        if(initialData) {
            onSubmit({ ...initialData, ...formData });
        } else {
            onSubmit(formData);
        }
    };

    const inputClasses = "block w-full px-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm";
    const labelClasses = "block text-sm font-medium text-slate-700 mb-1";

    return (
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg max-w-xl mx-auto border border-slate-200">
            <h2 className="text-2xl font-bold text-brand-primary mb-6">
                {initialData ? 'Edit Document Type' : 'Add New Document Type'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="name" className={labelClasses}>Document Type Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={inputClasses}
                        placeholder="e.g., Letter, Memorandum"
                        required
                        autoFocus
                    />
                </div>
                <div>
                    <label htmlFor="code" className={labelClasses}>Document Code (3 Letters)</label>
                    <input
                        type="text"
                        id="code"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        className={inputClasses}
                        placeholder="e.g., LTR, MEM"
                        required
                        maxLength={3}
                    />
                </div>
                
                <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors">
                        Save Document Type
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DocumentTypeForm;