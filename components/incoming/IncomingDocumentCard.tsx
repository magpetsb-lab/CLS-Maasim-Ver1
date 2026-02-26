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
        if (!(window as any).jspdf) return alert("PDF library not loaded.");
        
        try {
            const { jsPDF } = (window as any).jspdf;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const logoData = await getBase64Logo();
            const pageWidth = 210;
            const margin = 15;
            
            // Header
            if (logoData) {
                doc.addImage(logoData, 'PNG', margin, 10, 20, 20);
            }
            doc.setFontSize(10).setFont('helvetica', 'bold').text("Republic of the Philippines", pageWidth/2, 15, { align: 'center' });
            doc.setFontSize(10).text("Province of Sarangani", pageWidth/2, 20, { align: 'center' });
            doc.setFontSize(12).text("MUNICIPALITY OF MAASIM", pageWidth/2, 25, { align: 'center' });
            doc.setFontSize(11).text("OFFICE OF THE SANGGUNIANG BAYAN", pageWidth/2, 30, { align: 'center' });
            
            doc.setLineWidth(0.5).line(margin, 35, pageWidth - margin, 35);
            
            doc.setFontSize(14).text("LEGISLATIVE DOCUMENT TRACKING SLIP", pageWidth/2, 45, { align: 'center' });
            
            // Document Info
            let y = 55;
            doc.setFontSize(10).setFont('helvetica', 'bold');
            doc.text(`Reference No.: ${document.referenceNumber || 'N/A'}`, margin, y);
            doc.text(`Date Received: ${document.dateReceived || 'N/A'} ${document.timeReceived || ''}`, pageWidth - margin, y, { align: 'right' });
            
            y += 6;
            doc.text(`Sender:`, margin, y);
            doc.setFont('helvetica', 'normal').text(document.sender || 'N/A', margin + 25, y);
            
            y += 6;
            doc.setFont('helvetica', 'bold').text(`Type:`, margin, y);
            doc.setFont('helvetica', 'normal').text(document.type || 'N/A', margin + 25, y);
            
            if (document.category) {
                doc.setFont('helvetica', 'bold').text(`Category:`, pageWidth/2, y);
                doc.setFont('helvetica', 'normal').text(document.category, pageWidth/2 + 25, y);
            }

            y += 6;
            doc.setFont('helvetica', 'bold').text(`Subject:`, margin, y);
            const subjectLines = doc.splitTextToSize(document.subject || 'N/A', pageWidth - margin - 30);
            doc.setFont('helvetica', 'normal').text(subjectLines, margin + 25, y);
            y += (subjectLines.length * 5) + 5;

            // Tracking Table
            const columns = ["Stage / Activity", "Date / Details", "Remarks / Status"];
            const rows = [
                ["Receipt", `${document.dateReceived} ${document.timeReceived}`, "Received by Office"],
                ["Calendar of Business", 
                 `Urgent: ${document.urgentMattersDate || '-'}\nUnfinished: ${document.unfinishedBusinessDate || '-'}\nUnassigned: ${document.unassignedBusinessDate || '-'}`, 
                 `Agenda Item No.: ${document.agendaItemNumber || '-'}`],
                ["First Reading", `${document.firstReadingDate || '-'}`, `Ref to: ${document.concernedCommittee || '-'}\nChair: ${document.committeeReferralChairman || '-'}\nRemarks: ${document.firstReadingRemarks || '-'}`],
                ["Committee Report", `Date: ${document.committeeReportDate || '-'}`, `Report No.: ${document.committeeReportNumber || '-'}`],
                ["Second Reading", `${document.secondReadingDate || '-'}`, `${document.secondReadingRemarks || '-'}`],
                ["Third Reading", `${document.thirdReadingDate || '-'}`, `${document.thirdReadingRemarks || '-'}`],
                ["Legislative Output", 
                 `${document.outputType || '-'}\nNo.: ${document.outputNumber || '-'}`, 
                 `Sponsor: ${document.sponsor || '-'}\nSeconder: ${document.seconder || '-'}`],
                ["Executive Action", 
                 `Transmitted: ${document.dateTransmittedToMayor || '-'}\nApproved: ${document.dateApprovedByMayor || '-'}\nVetoed: ${document.dateVetoedByMayor || '-'}`, 
                 "-"],
                ["Provincial Review", 
                 `Transmitted: ${document.dateTransmittedToSP || '-'}\nReceived: ${document.dateReceivedFromSP || '-'}`, 
                 `SP Res No.: ${document.spResolutionNumber || '-'}`],
                ["Records", 
                 `Posted: ${document.datePosted || '-'}\nPublished: ${document.datePublished || '-'}\nFiled: ${document.dateFiled || '-'}`, 
                 "-"]
            ];

            (doc as any).autoTable({
                startY: y,
                head: [columns],
                body: rows,
                theme: 'grid',
                headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 9, cellPadding: 3 },
                columnStyles: {
                    0: { cellWidth: 40, fontStyle: 'bold' },
                    1: { cellWidth: 60 },
                    2: { cellWidth: 'auto' }
                }
            });

            // Signatories
            let finalY = (doc as any).lastAutoTable.finalY + 20;
            
            if (finalY > 250) {
                doc.addPage();
                finalY = 30;
            }

            doc.setFontSize(10).setFont('helvetica', 'normal');
            
            doc.text("Certified Correct:", margin, finalY);
            doc.text("Attested:", pageWidth/2 + 10, finalY);
            
            finalY += 15;
            
            doc.setFont('helvetica', 'bold');
            doc.text((document.secretarySignature || "_______________________").toUpperCase(), margin, finalY);
            doc.text((document.viceMayorSignature || "_______________________").toUpperCase(), pageWidth/2 + 10, finalY);
            
            finalY += 5;
            doc.setFont('helvetica', 'normal').setFontSize(8);
            doc.text("Secretary to the Sanggunian", margin, finalY);
            doc.text("Municipal Vice Mayor / Presiding Officer", pageWidth/2 + 10, finalY);

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for(let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8).setFont('helvetica', 'italic').text(`Generated via Maasim CLS - ${new Date().toLocaleString()}`, pageWidth - margin, 285, { align: 'right' });
            }

            window.open(doc.output('bloburl'), '_blank');
        } catch (e) {
            console.error(e);
            alert("Error generating tracking slip.");
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <div className="flex-grow">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-700">Ref No: {document.referenceNumber}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${statusColor}`}>{document.status}</span>
                        <span className="text-[10px] text-slate-500">Received: {document.dateReceived}</span>
                    </div>
                    <h3 className="text-sm font-bold text-brand-primary mb-0.5 leading-tight">{document.subject}</h3>
                    <p className="text-[10px] font-medium text-slate-700">From: {document.sender}</p>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end space-y-1 mt-2 sm:mt-0">
                    {/* Legacy File Path */}
                    {document.filePath && !document.attachments?.length && (
                        <a
                            href={document.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 text-[10px] font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors inline-flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 006 0V7a1 1 0 112 0v4a5 5 0 01-10 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                            </svg>
                            View File
                        </a>
                    )}

                    {/* Multiple Attachments */}
                    {document.attachments && document.attachments.length > 0 && (
                        <div className="flex flex-col gap-1 items-end">
                            {document.attachments.map((att, idx) => (
                                <a
                                    key={att.id || idx}
                                    href={att.data}
                                    download={att.name}
                                    className="px-2 py-0.5 text-[10px] font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors inline-flex items-center max-w-[150px] truncate"
                                    title={att.name}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 006 0V7a1 1 0 112 0v4a5 5 0 01-10 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                                    </svg>
                                    <span className="truncate">{att.name}</span>
                                </a>
                            ))}
                        </div>
                    )}

                    <div className="flex space-x-2">
                        <button onClick={handlePrintTracking} className="px-2 py-0.5 text-[10px] font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 flex items-center"><svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>Tracking</button>
                        <button onClick={() => onEdit(document)} className="px-2 py-0.5 text-[10px] font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">Edit</button>
                        {canDelete && <button onClick={() => onDelete(document.id)} className="px-2 py-0.5 text-[10px] font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200">Delete</button>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncomingDocumentCard;