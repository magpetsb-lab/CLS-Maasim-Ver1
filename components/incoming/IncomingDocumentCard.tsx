
import React from 'react';
import type { IncomingDocument, CommitteeMembership, Legislator } from '../../types';

interface IncomingDocumentCardProps {
    document: IncomingDocument;
    onEdit: (doc: IncomingDocument) => void;
    onDelete: (id: string) => void;
    canDelete: boolean;
    committeeMemberships: CommitteeMembership[];
    legislators: Legislator[];
}

const IncomingDocumentCard: React.FC<IncomingDocumentCardProps> = ({ document, onEdit, onDelete, canDelete, committeeMemberships = [], legislators = [] }) => {
    const statusColors: Record<string, string> = {
        'Pending': 'bg-yellow-100 text-yellow-800',
        'Referred to Committee': 'bg-blue-100 text-blue-800',
        'Acted Upon': 'bg-green-100 text-green-800',
        'Filed': 'bg-slate-200 text-slate-800',
    };

    const statusColor = statusColors[document.status] || 'bg-gray-100 text-gray-800';

    const getBase64Logo = async (): Promise<string | null> => {
        try {
            // Using relative path for robustness
            const response = await fetch('./maasim-logo.png');
            if (response.ok) {
                const blob = await response.blob();
                return await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            }
        } catch (error) {}
        return null;
    };

    const handlePrintTracking = async () => {
        try {
            if (!(window as any).jspdf) return alert("PDF library not loaded.");
            const { jsPDF } = (window as any).jspdf;
            const doc = new jsPDF();
            const logoData = await getBase64Logo();
            
            // Adjusted for better gap and horizontal layout consistency
            if (logoData) {
                doc.addImage(logoData, 'PNG', 35, 10, 20, 20);
            }
            
            doc.setFontSize(12).setFont(undefined, 'bold').text("OFFICE OF THE SANGGUNIANG BAYAN", 115, 18, { align: 'center' });
            doc.setFontSize(10).setFont(undefined, 'normal').text("Municipality of Maasim, Province of Sarangani", 115, 23, { align: 'center' });
            
            doc.setLineWidth(0.5).line(20, 32, 190, 32);
            doc.setFontSize(16).setFont(undefined, 'bold').text("DOCUMENT TRACKING SLIP", 105, 42, { align: 'center' });
            const infoData = [
                ["Subject", document.subject],
                ["Sender", document.sender],
                ["Tracking Code", document.referenceNumber],
                ["Date Received", document.dateReceived],
                ["Status", document.status]
            ];
            (doc as any).autoTable({ startY: 55, body: infoData, theme: 'plain', styles: { fontSize: 10 }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } } });
            window.open(doc.output('bloburl'), '_blank');
        } catch (e) { alert("PDF Error"); }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-grow">
                    <div className="flex items-center flex-wrap gap-3 mb-2">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">{document.referenceNumber}</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>{document.status}</span>
                        <span className="text-xs text-slate-500">Received: {document.dateReceived}</span>
                    </div>
                    <h3 className="text-lg font-bold text-brand-primary mb-1">{document.subject}</h3>
                    <p className="text-sm font-medium text-slate-700">From: {document.sender}</p>
                </div>
                <div className="flex-shrink-0 flex items-center space-x-2 mt-4 sm:mt-0">
                    <button onClick={handlePrintTracking} className="px-3 py-1 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 flex items-center"><svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>Tracking</button>
                    <button onClick={() => onEdit(document)} className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">Edit</button>
                    {canDelete && <button onClick={() => onDelete(document.id)} className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200">Delete</button>}
                </div>
            </div>
        </div>
    );
};

export default IncomingDocumentCard;
