
import React, { useState } from 'react';
import type { DocumentType } from '../../types';
import DocumentTypeCard from './DocumentTypeCard';
import DocumentTypeForm from './DocumentTypeForm';

interface DocumentTypeViewProps {
    documentTypes: DocumentType[];
    onAddDocumentType: (type: Omit<DocumentType, 'id'>) => void;
    onUpdateDocumentType: (type: DocumentType) => void;
    onDeleteDocumentType: (id: string) => void;
    canDelete: boolean;
}

const DocumentTypeView: React.FC<DocumentTypeViewProps> = (props) => {
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
    const [selectedType, setSelectedType] = useState<DocumentType | null>(null);

    const handleAddNew = () => {
        setSelectedType(null);
        setMode('add');
    };

    const handleEdit = (type: DocumentType) => {
        setSelectedType(type);
        setMode('edit');
    };

    const handleCancel = () => {
        setSelectedType(null);
        setMode('list');
    };
    
    const handleSave = (typeData: Omit<DocumentType, 'id'> | DocumentType) => {
        if ('id' in typeData) {
            props.onUpdateDocumentType(typeData);
        } else {
            props.onAddDocumentType(typeData);
        }
        setMode('list');
        setSelectedType(null);
    }

    if (mode === 'add' || mode === 'edit') {
        return (
            <div>
                <DocumentTypeForm
                    initialData={selectedType}
                    onSubmit={handleSave}
                    onCancel={handleCancel}
                />
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <p className="text-slate-600">
                    Define document types and their 3-letter codes for incoming documents.
                </p>
                <button
                    onClick={handleAddNew}
                    className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors flex-shrink-0"
                >
                    Add New Type
                </button>
            </div>
            {props.documentTypes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {props.documentTypes.map(type => (
                        <DocumentTypeCard
                            key={type.id}
                            documentType={type}
                            onEdit={handleEdit}
                            onDelete={props.onDeleteDocumentType}
                            canDelete={props.canDelete}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 bg-slate-50 rounded-lg mt-6">
                    <p className="text-slate-500">No document types found. Add one to get started!</p>
                </div>
            )}
        </div>
    );
};

export default DocumentTypeView;