
import React, { useState } from 'react';
import type { Document } from '../../types';
import DocumentCard from './DocumentCard';
import DocumentForm from './DocumentForm';

interface GeneralDocumentsViewProps {
    documents: Document[];
    onAddDocument: (doc: Omit<Document, 'id' | 'dateAdded'>) => void;
    onUpdateDocument: (doc: Document) => void;
    onDeleteDocument: (id: string) => void;
}

const GeneralDocumentsView: React.FC<GeneralDocumentsViewProps> = ({ documents, onAddDocument, onUpdateDocument, onDeleteDocument }) => {
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

    const handleAddNew = () => {
        setSelectedDoc(null);
        setMode('add');
    };

    const handleEdit = (doc: Document) => {
        setSelectedDoc(doc);
        setMode('edit');
    };

    const handleCancel = () => {
        setSelectedDoc(null);
        setMode('list');
    };
    
    const handleSave = (docData: Omit<Document, 'id' | 'dateAdded'> | Document) => {
        if ('id' in docData) {
            onUpdateDocument(docData);
        } else {
            onAddDocument(docData);
        }
        setMode('list');
        setSelectedDoc(null);
    }


    if (mode === 'add' || mode === 'edit') {
        return (
            <DocumentForm 
                initialData={selectedDoc}
                onSubmit={handleSave}
                onCancel={handleCancel}
            />
        );
    }

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button
                    onClick={handleAddNew}
                    className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors"
                >
                    Add New Document
                </button>
            </div>
            {documents.length > 0 ? (
                <div className="space-y-4">
                    {documents.map(doc => (
                        <DocumentCard 
                            key={doc.id} 
                            document={doc} 
                            onEdit={handleEdit} 
                            onDelete={onDeleteDocument} 
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 bg-white rounded-lg shadow-md">
                    <p className="text-slate-500">No archived documents found. Add one to get started!</p>
                </div>
            )}
        </div>
    );
};

export default GeneralDocumentsView;
