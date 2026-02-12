import React, { useState, useEffect } from 'react';
import type { LegislativeMeasure, Sector } from '../../types';

interface LegislativeMeasureFormProps {
    initialData?: LegislativeMeasure | null;
    sectors: Sector[];
    onSubmit: (data: Omit<LegislativeMeasure, 'id'> | LegislativeMeasure) => void;
    onCancel: () => void;
}

const getInitialFormData = (): Omit<LegislativeMeasure, 'id'> => ({
    title: '',
    sectorIds: [],
});

const LegislativeMeasureForm: React.FC<LegislativeMeasureFormProps> = ({ initialData, sectors, onSubmit, onCancel }) => {
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

    const handleSectorChange = (sectorId: string, isChecked: boolean) => {
        setFormData(prev => {
            const currentIds = prev.sectorIds || [];
            if (isChecked) {
                return { ...prev, sectorIds: [...currentIds, sectorId] };
            } else {
                return { ...prev, sectorIds: currentIds.filter(id => id !== sectorId) };
            }
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || formData.sectorIds.length === 0) {
            alert('Title and at least one Sector are required.');
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
                {initialData ? 'Edit Legislative Measure' : 'Add New Legislative Measure'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="title" className={labelClasses}>Measure Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className={inputClasses}
                        placeholder="e.g., Budget Appropriation"
                        required
                        autoFocus
                    />
                </div>
                <div>
                    <label className={labelClasses}>Sector Group (Select all that apply)</label>
                    <div className="mt-2 max-h-60 overflow-y-auto border border-slate-300 rounded-md p-3 bg-white space-y-2">
                        {sectors.map(sector => (
                            <label key={sector.id} className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 p-1 rounded">
                                <input
                                    type="checkbox"
                                    value={sector.id}
                                    checked={formData.sectorIds.includes(sector.id)}
                                    onChange={(e) => handleSectorChange(sector.id, e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-brand-secondary focus:ring-brand-secondary"
                                />
                                <span className="text-slate-700 text-sm">{sector.name}</span>
                            </label>
                        ))}
                        {sectors.length === 0 && (
                            <p className="text-sm text-slate-500 italic">No sectors available. Add sectors in "Manage Sector" tab first.</p>
                        )}
                    </div>
                </div>
                
                <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors">
                        Save Measure
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LegislativeMeasureForm;