import React, { useState } from 'react';
import type { Legislator, Term, Position } from '../types';
import { POSITIONS, COUNCILOR_RANKS } from '../constants';

interface LegislationDetailProps {
    initialData?: Legislator | null;
    onSubmit: (data: Omit<Legislator, 'id'> | Legislator) => void;
    onCancel: () => void;
    terms: Term[];
}

const getInitialFormData = (): Omit<Legislator, 'id'> => ({
    name: '',
    dateOfBirth: '',
    positions: [],
    profileImageUrl: undefined,
    mobileNumber: '',
    email: '',
});

const getInitialPositionData = () => ({
    title: '',
    term: '',
    rank: '',
});


const LegislationDetail: React.FC<LegislationDetailProps> = ({ initialData, onSubmit, onCancel, terms }) => {
    const [formData, setFormData] = useState<Omit<Legislator, 'id'> | Legislator>(getInitialFormData());
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [newPosition, setNewPosition] = useState(getInitialPositionData());

    React.useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData });
        } else {
             setFormData(getInitialFormData());
        }
        setProfileImage(null);
        setNewPosition(getInitialPositionData());
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleNewPositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewPosition(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'title') {
                updated.rank = value === 'Councilor' ? '' : 'N/A';
            }
            return updated;
        });
    };

    const handleAddPosition = () => {
        const { title, term, rank } = newPosition;
        if (!title || !term || !rank) {
            alert('Please fill all fields for the new position.');
            return;
        }
        const positionToAdd: Position = {
            id: `pos-${Date.now()}`,
            ...newPosition,
        };
        setFormData(prev => ({
            ...prev,
            positions: [...(prev.positions || []), positionToAdd],
        }));
        setNewPosition(getInitialPositionData());
    };

    const handleRemovePosition = (positionId: string) => {
        setFormData(prev => ({
            ...prev,
            positions: (prev.positions || []).filter(p => p.id !== positionId),
        }));
    };


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProfileImage(e.target.files[0]);
            setFormData(prev => ({...prev, profileImageUrl: undefined}));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Name is required.');
            return;
        }

        if (!formData.positions || formData.positions.length === 0) {
            alert('At least one position must be added before saving.');
            return;
        }

        const finalData = { ...formData };
        if (profileImage) {
            if (initialData?.profileImageUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(initialData.profileImageUrl);
            }
            finalData.profileImageUrl = URL.createObjectURL(profileImage);
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
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-primary mb-6">
                {initialData ? 'Edit Legislator/Author Profile' : 'Add New Profile'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="name" className={labelClasses}>Full Name</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={inputClasses} required autoFocus />
                    </div>
                    <div>
                        <label htmlFor="dateOfBirth" className={labelClasses}>Date of Birth</label>
                        <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="mobileNumber" className={labelClasses}>Mobile Number</label>
                        <input type="tel" id="mobileNumber" name="mobileNumber" value={formData.mobileNumber || ''} onChange={handleChange} className={inputClasses} placeholder="09xxxxxxxxx" pattern="[0-9]{11}" />
                    </div>
                    <div>
                        <label htmlFor="email" className={labelClasses}>Email Address</label>
                        <input type="email" id="email" name="email" value={formData.email || ''} onChange={handleChange} className={inputClasses} placeholder="email@example.com" />
                    </div>
                </div>
                
                <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-lg font-semibold text-brand-dark mb-4">Positions</h3>
                    <div className="mb-6 space-y-3">
                        {formData.positions && formData.positions.length > 0 ? (
                            formData.positions.map(pos => (
                                <div key={pos.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <div>
                                        <p className="font-semibold text-brand-dark">{pos.title}</p>
                                        <p className="text-xs text-slate-500 font-mono">Term: {pos.term} | Rank: {pos.rank}</p>
                                    </div>
                                    <button type="button" onClick={() => handleRemovePosition(pos.id)} className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors">
                                        Remove
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500 italic text-center py-4">No positions have been added.</p>
                        )}
                    </div>

                    <div className="p-4 bg-slate-100 rounded-lg border border-slate-200">
                        <h4 className="font-semibold text-brand-dark mb-3">Add New Position</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="newTitle" className={labelClasses}>Title / Position</label>
                                <select id="newTitle" name="title" value={newPosition.title} onChange={handleNewPositionChange} className={inputClasses}>
                                    <option value="">-- Select a Title --</option>
                                    {POSITIONS.map((pos: string) => <option key={pos} value={pos}>{pos}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="newTerm" className={labelClasses}>Term</label>
                                <select id="newTerm" name="term" value={newPosition.term} onChange={handleNewPositionChange} className={inputClasses}>
                                    <option value="">-- Select a Term --</option>
                                    {terms.map(term => {
                                        const termValue = `${term.yearFrom}-${term.yearTo}`;
                                        const displayLabel = `${term.yearFrom.split('-')[0]}-${term.yearTo.split('-')[0]}`;
                                        return <option key={term.id} value={termValue}>{displayLabel}</option>;
                                    })}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="newRank" className={labelClasses}>Rank</label>
                                <select 
                                    id="newRank" 
                                    name="rank" 
                                    value={newPosition.rank} 
                                    onChange={handleNewPositionChange} 
                                    className={inputClasses}
                                    disabled={newPosition.title !== 'Councilor'}
                                >
                                    {newPosition.title === 'Councilor' ? (
                                        <>
                                            <option value="" disabled>-- Select Rank --</option>
                                            {COUNCILOR_RANKS.map((r: string) => <option key={r} value={r}>{r}</option>)}
                                        </>
                                    ) : (
                                        <option value="N/A">N/A</option>
                                    )}
                                </select>
                            </div>
                        </div>
                        <div className="text-right mt-4">
                             <button type="button" onClick={handleAddPosition} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
                                Add Position
                            </button>
                        </div>
                    </div>
                </div>


                <div className="border-t border-slate-200 pt-6">
                    <label htmlFor="profileImage" className={labelClasses}>Profile Image</label>
                    {formData.profileImageUrl && !profileImage && (
                        <div className="mb-2">
                            <img src={formData.profileImageUrl} alt="Current profile" className="w-24 h-24 rounded-full object-cover"/>
                        </div>
                    )}
                    <input
                        type="file"
                        id="profileImage"
                        name="profileImage"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-light file:text-brand-primary hover:file:bg-blue-200"
                        accept="image/png, image/jpeg"
                    />
                    {profileImage && <p className="text-sm text-slate-500 mt-1">New image selected: {profileImage.name}</p>}
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors">
                        Save Profile
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LegislationDetail;