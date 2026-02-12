
import React, { useState, useMemo } from 'react';
import type { IncomingDocument, DocumentType, DocumentStatus, CommitteeMembership, Legislator } from '../../types';
import IncomingDocumentCard from './IncomingDocumentCard';
import IncomingDocumentForm from './IncomingDocumentForm';
import SearchBar from '../SearchBar';

interface IncomingDocumentViewProps {
    documents: IncomingDocument[];
    documentTypes: DocumentType[];
    documentStatuses: DocumentStatus[];
    onAddDocument: (doc: Omit<IncomingDocument, 'id'>) => void;
    onUpdateDocument: (doc: IncomingDocument) => void;
    onDeleteDocument: (id: string) => void;
    committeeMemberships: CommitteeMembership[];
    legislators: Legislator[];
    canDelete: boolean;
}

const IncomingDocumentView: React.FC<IncomingDocumentViewProps> = ({ documents = [], documentTypes = [], documentStatuses = [], onAddDocument, onUpdateDocument, onDeleteDocument, committeeMemberships = [], legislators = [], canDelete }) => {
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
    const [selectedDoc, setSelectedDoc] = useState<IncomingDocument | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleAddNew = () => {
        setSelectedDoc(null);
        setMode('add');
    };

    const handleEdit = (doc: IncomingDocument) => {
        setSelectedDoc(doc);
        setMode('edit');
    };

    const handleCancel = () => {
        setSelectedDoc(null);
        setMode('list');
    };
    
    const handleSave = (docData: Omit<IncomingDocument, 'id'> | IncomingDocument) => {
        if ('id' in docData) {
            onUpdateDocument(docData);
        } else {
            onAddDocument(docData);
        }
        setMode('list');
        setSelectedDoc(null);
    }

    const searchSuggestions = useMemo(() => {
        const items = (documents || []).flatMap(doc => [
            doc.subject,
            doc.referenceNumber,
            doc.sender,
            doc.remarks
        ]);
        return Array.from(new Set(items.filter(Boolean) as string[])).sort();
    }, [documents]);

    const filteredDocuments = useMemo(() => {
        if (!searchQuery) return documents || [];
        const lowerQuery = searchQuery.toLowerCase();
        return (documents || []).filter(doc => 
            doc.subject.toLowerCase().includes(lowerQuery) ||
            doc.referenceNumber.toLowerCase().includes(lowerQuery) ||
            doc.sender.toLowerCase().includes(lowerQuery) ||
            doc.remarks?.toLowerCase().includes(lowerQuery)
        ).sort((a, b) => new Date(b.dateReceived).getTime() - new Date(a.dateReceived).getTime());
    }, [documents, searchQuery]);

    if (mode === 'add' || mode === 'edit') {
        return (
            <IncomingDocumentForm
                initialData={selectedDoc}
                documentTypes={documentTypes || []}
                documentStatuses={documentStatuses || []}
                existingDocuments={documents || []}
                committeeMemberships={committeeMemberships || []}
                legislators={legislators || []}
                onSubmit={handleSave}
                onCancel={handleCancel}
            />
        );
    }

    return (
        <div>
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-primary mb-1">Incoming Documents</h2>
                        <p className="text-slate-600">
                            Track and manage letters, indorsements, and communications received.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="w-full sm:w-64">
                            <SearchBar 
                                query={searchQuery}
                                onQueryChange={setSearchQuery}
                                placeholder="Search incoming docs..."
                                suggestions={searchSuggestions}
                            />
                        </div>
                        <button
                            onClick={handleAddNew}
                            className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors whitespace-nowrap"
                        >
                            Register New
                        </button>
                    </div>
                </div>

                {filteredDocuments.length > 0 ? (
                    <div className="space-y-4">
                        {filteredDocuments.map(doc => (
                            <IncomingDocumentCard
                                key={doc.id} 
                                document={doc}
                                onEdit={handleEdit} 
                                onDelete={onDeleteDocument}
                                canDelete={canDelete}
                                committeeMemberships={committeeMemberships || []}
                                legislators={legislators || []}
                            />
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-16 bg-slate-50 rounded-lg">
                        <p className="text-slate-500">No incoming documents found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IncomingDocumentView;