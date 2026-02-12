import React, { useState, useEffect } from 'react';
import type { Term } from '../../types';

interface TermFormProps {
    initialData?: Term | null;
    onSubmit: (data: Omit<Term, 'id'> | Term) => void;
    onCancel: () => void;
}

const getInitialFormData = (): Omit<Term, 'id'> => ({
    yearFrom: '',
    yearTo: '',
});

const TermForm: React.FC<TermFormProps> = ({ initialData, onSubmit, onCancel }) => {
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
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.yearFrom || !formData.yearTo) {
            alert('Start Date and End Date are required.');
            return;
        }
        if (formData.yearFrom > formData.yearTo) {
            alert('Start Date must be before End Date.');
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
                {initialData ? 'Edit Term' : 'Add New Term'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="yearFrom" className={labelClasses}>Start Date</label>
                        <input
                            type="date"
                            id="yearFrom"
                            name="yearFrom"
                            value={formData.yearFrom}
                            onChange={handleChange}
                            className={inputClasses}
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label htmlFor="yearTo" className={labelClasses}>End Date</label>
                         <input
                            type="date"
                            id="yearTo"
                            name="yearTo"
                            value={formData.yearTo}
                            onChange={handleChange}
                            className={inputClasses}
                            required
                        />
                    </div>
                </div>
                
                <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors">
                        Save Term
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TermForm;