
import React from 'react';
import type { DocumentType } from '../../types';

interface DocumentTypeCardProps {
    documentType: DocumentType;
    onEdit: (type: DocumentType) => void;
    onDelete: (id: string) => void;
    canDelete?: boolean;
}

const DocumentTypeCard: React.FC<DocumentTypeCardProps> = ({ documentType, onEdit, onDelete, canDelete }) => {
    return (
        <div className="bg-slate-50 rounded-lg shadow-sm p-6 border border-slate-200 text-center flex flex-col justify-between h-full">
            <div>
                <p className="text-sm text-slate-500">Document Type</p>
                <h3 className="text-xl font-bold text-brand-primary mt-1">
                    {documentType.name}
                </h3>
                <span className="inline-block px-3 py-1 mt-2 text-sm font-mono font-semibold rounded-full bg-slate-200 text-slate-700">
                    {documentType.code}
                </span>
            </div>
            <div className="flex space-x-2 mt-6 justify-center">
                <button
                    onClick={() => onEdit(documentType)}
                    className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                >
                    Edit
                </button>
                {canDelete && (
                    <button
                        onClick={() => onDelete(documentType.id)}
                        className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                    >
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
};

export default DocumentTypeCard;