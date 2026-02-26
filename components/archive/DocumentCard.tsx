
import React from 'react';
import type { Document } from '../../types';

interface DocumentCardProps {
    document: Document;
    onEdit: (doc: Document) => void;
    onDelete: (id: string) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onEdit, onDelete }) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-grow">
                <p className="text-xs text-slate-500 mb-1">Added: {document.dateAdded}</p>
                <h3 className="text-lg font-bold text-brand-primary mb-2">{document.title}</h3>
                <p className="text-sm text-slate-600 line-clamp-2">{document.summary}</p>
            </div>
            <div className="flex-shrink-0 flex space-x-2 mt-4 sm:mt-0">
                <button 
                    onClick={() => onEdit(document)}
                    className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                >
                    Edit
                </button>
                <button 
                    onClick={() => onDelete(document.id)}
                    className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default DocumentCard;
