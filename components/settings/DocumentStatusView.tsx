
import React, { useState } from 'react';
import type { DocumentStatus } from '../../types';
import DocumentStatusCard from './DocumentStatusCard';
import DocumentStatusForm from './DocumentStatusForm';

interface DocumentStatusViewProps {
    documentStatuses: DocumentStatus[];
    onAddDocumentStatus: (status: Omit<DocumentStatus, 'id'>) => void;
    onUpdateDocumentStatus: (status: DocumentStatus) => void;
    onDeleteDocumentStatus: (id: string) => void;
    canDelete: boolean;
}

const DocumentStatusView: React.FC<DocumentStatusViewProps> = (props) => {
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
    const [selectedStatus, setSelectedStatus] = useState<DocumentStatus | null>(null);

    const handleAddNew = () => {
        setSelectedStatus(null);
        setMode('add');
    };

    const handleEdit = (status: DocumentStatus) => {
        setSelectedStatus(status);
        setMode('edit');
    };

    const handleCancel = () => {
        setSelectedStatus(null);
        setMode('list');
    };
    
    const handleSave = (statusData: Omit<DocumentStatus, 'id'> | DocumentStatus) => {
        if ('id' in statusData) {
            props.onUpdateDocumentStatus(statusData);
        } else {
            props.onAddDocumentStatus(statusData);
        }
        setMode('list');
        setSelectedStatus(null);
    }

    if (mode === 'add' || mode === 'edit') {
        return (
            <div>
                <DocumentStatusForm
                    initialData={selectedStatus}
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
                    Define custom status options for incoming documents.
                </p>
                <button
                    onClick={handleAddNew}
                    className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg shadow-md hover:bg-brand-primary transition-colors flex-shrink-0"
                >
                    Add New Status
                </button>
            </div>
            {props.documentStatuses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {props.documentStatuses.map(status => (
                        <DocumentStatusCard
                            key={status.id}
                            documentStatus={status}
                            onEdit={handleEdit}
                            onDelete={props.onDeleteDocumentStatus}
                            canDelete={props.canDelete}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 bg-slate-50 rounded-lg mt-6">
                    <p className="text-slate-500">No document statuses found. Add one to get started!</p>
                </div>
            )}
        </div>
    );
};

export default DocumentStatusView;
